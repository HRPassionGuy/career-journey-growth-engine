#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { mutateState, readState, root } from "../lib/state-store.mjs";

const [slug, requestedAssignmentId] = process.argv.slice(2);
const executives = JSON.parse(fs.readFileSync(path.join(root, "config/executives.json"), "utf8"));
const capabilities = JSON.parse(fs.readFileSync(path.join(root, "config/capabilities.json"), "utf8"));
const executive = executives[slug];

if (!executive) throw new Error(`Unknown executive: ${slug}`);

const state = readState();
const eligible = state.assignments.filter((assignment) =>
  assignment.owner === slug &&
  ["queued", "retry"].includes(assignment.status)
);
const assignment = requestedAssignmentId
  ? eligible.find((candidate) => candidate.id === requestedAssignmentId)
  : eligible[0];

if (!assignment) throw new Error(`No eligible assignment for ${slug}${requestedAssignmentId ? `: ${requestedAssignmentId}` : ""}`);

const capability = capabilities.find((candidate) => candidate.id === assignment.capabilityId);
if (!capability) throw new Error(`Missing capability: ${assignment.capabilityId}`);

const executionId = `EXEC-${slug.toUpperCase()}-${Date.now()}-${process.pid}`;
const loaded = {};
for (const [name, location] of Object.entries({
  constitution: "docs/PROJECT_CONSTITUTION.md",
  agents: "AGENTS.md",
  charter: executive.charter,
  runtime: executive.runtime
})) {
  loaded[name] = fs.readFileSync(path.join(root, location), "utf8");
}
loaded.procedures = fs.readdirSync(path.join(root, executive.procedures))
  .filter((file) => file.endsWith(".md"))
  .sort()
  .map((file) => ({
    file: path.join(executive.procedures, file),
    content: fs.readFileSync(path.join(root, executive.procedures, file), "utf8")
  }));

mutateState((draft) => {
  const durableAssignment = draft.assignments.find((candidate) => candidate.id === assignment.id);
  if (!durableAssignment || !["queued", "retry"].includes(durableAssignment.status)) {
    throw new Error(`Assignment is no longer claimable: ${assignment.id}`);
  }
  const startedAt = new Date().toISOString();
  durableAssignment.status = "in_progress";
  durableAssignment.updatedAt = startedAt;
  durableAssignment.activeExecutionId = executionId;
  durableAssignment.deliveryStatus = "delivered";
  durableAssignment.deliveredAt = startedAt;
  durableAssignment.deliveryError = null;
  draft.executions.push({
    id: executionId,
    assignmentId: assignment.id,
    executive: slug,
    status: "running",
    startedAt,
    lastHeartbeatAt: startedAt,
    finishedAt: null,
    processId: process.pid,
    loadedSources: {
      charter: executive.charter,
      runtime: executive.runtime,
      procedures: loaded.procedures.map((item) => item.file),
      capability: capability.id
    }
  });
  draft.heartbeats[executionId] = {
    executive: slug,
    executionId,
    status: "running",
    assignmentId: assignment.id,
    updatedAt: startedAt,
    details: "Assignment claimed through executive entry point"
  };
  draft.dispatchLog.push({
    assignmentId: assignment.id,
    executive: slug,
    dispatchedAt: durableAssignment.lastDispatchAt || null,
    recordedAt: startedAt,
    runtimeThreadId: durableAssignment.runtimeThreadId || null,
    status: "delivered_to_thread",
    deliveryEvidence: "Executive entry point claimed assignment",
    executionId
  });
});

console.log(JSON.stringify({
  executionId,
  assignment,
  executive,
  capability,
  authorityBoundary: capability.approval,
  relevantState: {
    metrics: state.metrics,
    openHandoffs: state.handoffs.filter((handoff) => handoff.to === slug && handoff.status === "open"),
    relatedResults: state.results.filter((result) => result.assignmentId === assignment.id)
  },
  loadedSourceSummary: {
    constitutionCharacters: loaded.constitution.length,
    agentsCharacters: loaded.agents.length,
    charterCharacters: loaded.charter.length,
    runtimeCharacters: loaded.runtime.length,
    procedureFiles: loaded.procedures.map((item) => item.file)
  },
  completionCommand: `./bin/cjge result ${assignment.id} ${executionId} '<json>'`
}, null, 2));
