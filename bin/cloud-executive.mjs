#!/usr/bin/env node
import fs from "node:fs";
import { productionStateStore } from "../lib/supabase-state-store.mjs";

const executives = JSON.parse(fs.readFileSync(new URL("../config/executives.json", import.meta.url), "utf8"));
const capabilities = JSON.parse(fs.readFileSync(new URL("../config/capabilities.json", import.meta.url), "utf8"));
const [command, slug, assignmentId, executionId, payloadJson] = process.argv.slice(2);
const store = productionStateStore();

if (command === "claim") {
  const executive = executives[slug];
  if (!executive || !assignmentId) throw new Error("Usage: cloud-executive claim <executive> <assignment-id>");
  const id = `EXEC-${slug.toUpperCase()}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const result = await store.mutateState((state) => {
    const assignment = state.assignments.find((item) => item.id === assignmentId);
    if (!assignment || assignment.owner !== slug || !["queued", "retry"].includes(assignment.status)) throw new Error("Assignment is not claimable by this executive");
    const capability = capabilities.find((item) => item.id === assignment.capabilityId);
    if (!capability) throw new Error(`Missing capability: ${assignment.capabilityId}`);
    const startedAt = new Date().toISOString();
    assignment.status = "in_progress";
    assignment.updatedAt = startedAt;
    assignment.activeExecutionId = id;
    assignment.deliveryStatus = "delivered";
    assignment.deliveredAt = startedAt;
    state.executions.push({ id, assignmentId, executive: slug, status: "running", startedAt, lastHeartbeatAt: startedAt, finishedAt: null, processId: null, runtime: "codex-cloud" });
    state.heartbeats[id] = { executive: slug, executionId: id, status: "running", assignmentId, updatedAt: startedAt, details: "Claimed by Codex Cloud task" };
    return { executionId: id, assignment, capability, governingFiles: ["AGENTS.md", "docs/PROJECT_CONSTITUTION.md", executive.charter, executive.runtime, executive.procedures] };
  }, { idempotencyKey: `claim:${assignmentId}` });
  console.log(JSON.stringify(result.value || result, null, 2));
} else if (command === "result") {
  if (!slug || !assignmentId || !executionId || !payloadJson) throw new Error("Usage: cloud-executive result <executive> <assignment-id> <execution-id> '<json>'");
  const payload = JSON.parse(payloadJson);
  if (!payload.status || !payload.summary) throw new Error("Result requires status and summary");
  const result = await store.mutateState((state) => {
    const assignment = state.assignments.find((item) => item.id === assignmentId && item.owner === slug);
    const execution = state.executions.find((item) => item.id === executionId && item.assignmentId === assignmentId);
    if (!assignment || !execution || execution.status !== "running") throw new Error("Unknown or inactive cloud execution");
    const requestedStatus = payload.status;
    const verifiedExternalAction = Boolean(payload.externalActionAt && Date.parse(payload.externalActionAt) >= Date.parse(execution.startedAt));
    const status = requestedStatus === "completed" && assignment.requiresExternalAction && !verifiedExternalAction ? "retry" : requestedStatus;
    const recordedAt = new Date().toISOString();
    const resultId = `RES-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    execution.status = status;
    execution.finishedAt = recordedAt;
    assignment.status = status;
    assignment.activeExecutionId = null;
    assignment.updatedAt = recordedAt;
    state.heartbeats[executionId] = { ...state.heartbeats[executionId], status, updatedAt: recordedAt };
    state.results.push({ id: resultId, assignmentId, executionId, executive: slug, status, requestedStatus, summary: payload.summary, evidence: payload.evidence || [], metrics: payload.metrics || {}, externalActionAt: verifiedExternalAction ? payload.externalActionAt : null, verifiedAt: payload.verifiedAt || recordedAt, createdAt: recordedAt });
    for (const [name, value] of Object.entries(payload.metrics || {})) state.metrics[name] = { value: String(value), updatedAt: recordedAt, sourceResultId: resultId };
    for (const handoff of state.handoffs.filter((item) => item.childAssignmentId === assignmentId && item.status === "open")) {
      handoff.status = "resolved"; handoff.resolvedAt = recordedAt; handoff.resultId = resultId;
    }
    return { resultId, assignmentId, executionId, status, requestedStatus };
  }, { idempotencyKey: `result:${executionId}` });
  console.log(JSON.stringify(result.value || result, null, 2));
} else {
  throw new Error("Usage: cloud-executive claim|result ...");
}
