#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { initializeState, mutateState, readState, root, stateFile } from "../lib/state-store.mjs";
import { blockerTypes, buildChiefOfStaffNotification, classifyBlocker, classifyExecutionFailure, completeEngagement, detectAndRecoverStalledExecutions, enqueueProactiveWork, integrationReport, notificationReport, recordDispatchDelivery, recordHeartbeat, recordIntegrationStatus, releaseEngagement, reserveEngagement, updateNotification } from "../lib/runtime-ops.mjs";

const executives = readJson("config/executives.json");
const capabilities = readJson("config/capabilities.json");

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
}

function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Detroit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function dueToday(capability, date = new Date()) {
  const day = new Intl.DateTimeFormat("en-US", { timeZone: "America/Detroit", weekday: "long" }).format(date);
  const trigger = capability.trigger.toLowerCase();
  if (trigger.includes("daily")) return true;
  if (trigger.includes(day.toLowerCase())) return true;
  if (trigger.includes("monday and friday") && ["Monday", "Friday"].includes(day)) return true;
  if (trigger.includes("tuesday and thursday") && ["Tuesday", "Thursday"].includes(day)) return true;
  return false;
}

function enqueueDaily(state) {
  const date = today();
  for (const capability of capabilities.filter((item) => dueToday(item))) {
    const id = `${date}:${capability.id}`;
    if (state.work.some((item) => item.id === id)) continue;
    state.work.push({
      id,
      capabilityId: capability.id,
      name: capability.name,
      owner: capability.owner,
      support: capability.support,
      status: "ready",
      scheduledFor: date,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evidence: [],
      blocker: null
    });
  }
  state.lastDailyRun = new Date().toISOString();
}

function executivePacket(slug, state) {
  const executive = executives[slug];
  if (!executive) throw new Error(`Unknown executive: ${slug}`);
  const work = state.work.filter((item) => item.owner === slug && ["ready", "in_progress", "retry"].includes(item.status));
  const capabilityMap = new Map(capabilities.map((item) => [item.id, item]));
  return {
    executive,
    governingFiles: [
      "docs/PROJECT_CONSTITUTION.md",
      "AGENTS.md",
      executive.charter,
      executive.runtime,
      executive.procedures
    ],
    work: work.map((item) => ({ ...item, capability: capabilityMap.get(item.capabilityId) }))
  };
}

function printPacket(packet) {
  console.log(`# ${packet.executive.name} execution packet`);
  console.log(`Read and follow: ${packet.governingFiles.join(", ")}`);
  if (!packet.work.length) {
    console.log("No due work.");
    return;
  }
  for (const item of packet.work) {
    console.log(`\n## ${item.id} — ${item.name}`);
    console.log(`Status: ${item.status}`);
    console.log(`Trigger: ${item.capability.trigger}`);
    console.log(`Tools: ${item.capability.tools.join(", ")}`);
    console.log(`Deliverable: ${item.capability.deliverable}`);
    console.log(`Approval boundary: ${item.capability.approval}`);
    console.log(`Supporting executives: ${item.support.join(", ") || "none"}`);
    console.log("Execution rule: perform the work with available connected tools; record verified evidence; retry recoverable failures; never count an attempt as completion.");
  }
}

function briefing(state) {
  const date = today();
  const todays = state.work.filter((item) => item.scheduledFor === date);
  const groups = Object.fromEntries(["completed", "in_progress", "ready", "retry", "blocked"].map((status) => [status, todays.filter((item) => item.status === status)]));
  console.log(`# Chief of Staff Daily Briefing — ${date}`);
  for (const status of ["completed", "in_progress", "ready", "retry", "blocked"]) {
    console.log(`\n## ${status.replace("_", " ").toUpperCase()} (${groups[status].length})`);
    for (const item of groups[status]) {
      console.log(`- ${item.name} — ${executives[item.owner].name}${item.blocker ? ` — ${item.blocker}` : ""}`);
    }
  }
  console.log("\n## Revenue evidence");
  console.log(JSON.stringify(state.metrics, null, 2));
  console.log("\n## Workflow evidence");
  for (const report of state.reports.filter((item) => item.id?.startsWith(date))) {
    console.log(`- ${report.id}: ${report.status}; externalActionAt=${report.externalActionAt || "pre-existing/unknown"}; verifiedAt=${report.verifiedAt || "unverified"}`);
  }
}

const [command = "status", ...args] = process.argv.slice(2);
const state = readState();

if (command === "init") {
  initializeState();
  console.log(`Initialized ${stateFile}`);
} else if (command === "daily") {
  mutateState((draft) => enqueueDaily(draft));
  console.log(`Daily work queued for ${today()}.`);
  const updated = readState();
  for (const slug of Object.keys(executives)) {
    const count = updated.work.filter((item) => item.scheduledFor === today() && item.owner === slug).length;
    if (count) console.log(`${executives[slug].name}: ${count}`);
  }
} else if (command === "packet") {
  printPacket(executivePacket(args[0], state));
} else if (command === "update") {
  const [id, status, ...detail] = args;
  if (!["ready", "in_progress", "retry", "blocked", "completed"].includes(status)) throw new Error(`Invalid status: ${status}`);
  mutateState((draft) => {
    const item = draft.work.find((candidate) => candidate.id === id);
    if (!item) throw new Error(`Unknown work item: ${id}`);
    item.status = status;
    item.updatedAt = new Date().toISOString();
    if (status === "blocked") item.blocker = detail.join(" ") || "Unspecified blocker";
    if (status === "completed" && detail.length) item.evidence.push(detail.join(" "));
  });
  console.log(`Updated ${id} to ${status}.`);
} else if (command === "metric") {
  const [name, value] = args;
  if (!name || value === undefined) throw new Error("Usage: metric <name> <value>");
  mutateState((draft) => {
    draft.metrics[name] = { value, updatedAt: new Date().toISOString() };
  });
  console.log(`Recorded ${name}=${value}.`);
} else if (command === "record") {
  const payload = JSON.parse(args.join(" "));
  for (const required of ["id", "type", "status", "startedAt", "verifiedAt", "participatingExecutives", "evidence"]) {
    if (payload[required] === undefined) throw new Error(`Workflow record is missing ${required}`);
  }
  if (!["completed", "verified_prior_work", "blocked", "failed"].includes(payload.status)) {
    throw new Error(`Invalid workflow status: ${payload.status}`);
  }
  if (payload.status === "completed" && !payload.externalActionAt) {
    throw new Error("A completed workflow requires externalActionAt. Use verified_prior_work for a pre-existing action.");
  }
  if (payload.status === "verified_prior_work" && payload.externalActionAt) {
    throw new Error("verified_prior_work must not claim an externalActionAt from the current run.");
  }
  mutateState((draft) => {
    const existing = draft.reports.findIndex((item) => item.id === payload.id);
    if (existing >= 0) draft.reports[existing] = payload;
    else draft.reports.push(payload);
  });
  console.log(`Recorded workflow ${payload.id} as ${payload.status}.`);
} else if (command === "delegate") {
  const [capabilityId, ...payloadParts] = args;
  const capability = capabilities.find((candidate) => candidate.id === capabilityId);
  if (!capability) throw new Error(`Unknown capability: ${capabilityId}`);
  const payload = payloadParts.length ? JSON.parse(payloadParts.join(" ")) : {};
  const assignmentId = `ASN-${capabilityId}-${Date.now()}`;
  mutateState((draft) => {
    draft.assignments.push({
      id: assignmentId,
      capabilityId,
      owner: capability.owner,
      support: capability.support,
      objective: payload.objective || capability.deliverable,
      requiresExternalAction: Boolean(payload.requiresExternalAction),
      requestedBy: payload.requestedBy || "chief-of-staff",
      parentAssignmentId: payload.parentAssignmentId || null,
      status: "queued",
      priority: payload.priority || "normal",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueAt: payload.dueAt || null,
      activeExecutionId: null
      ,
      attempt: 1,
      lastDispatchAt: null,
      runtimeThreadId: JSON.parse(fs.readFileSync(path.join(root, "config/runtime-instances.json"), "utf8"))[capability.owner]?.environmentVariable || null,
      deliveryStatus: "not_dispatched"
    });
  });
  console.log(JSON.stringify({ assignmentId, owner: capability.owner, capabilityId }));
} else if (command === "handoff") {
  const [parentAssignmentId, from, to, capabilityId, ...requestParts] = args;
  if (!executives[from] || !executives[to]) throw new Error("Invalid handoff executive");
  const capability = capabilities.find((candidate) => candidate.id === capabilityId);
  if (!capability || capability.owner !== to) throw new Error(`Capability ${capabilityId} is not owned by ${to}`);
  const handoffId = `HOF-${Date.now()}-${process.pid}`;
  const assignmentId = `ASN-${capabilityId}-${Date.now()}-${process.pid}`;
  const request = requestParts.join(" ");
  mutateState((draft) => {
    const parent = draft.assignments.find((candidate) => candidate.id === parentAssignmentId);
    if (!parent) throw new Error(`Unknown parent assignment: ${parentAssignmentId}`);
    draft.handoffs.push({
      id: handoffId,
      parentAssignmentId,
      childAssignmentId: assignmentId,
      from,
      to,
      request,
      status: "open",
      createdAt: new Date().toISOString(),
      resolvedAt: null
    });
    draft.assignments.push({
      id: assignmentId,
      capabilityId,
      owner: to,
      support: capability.support,
      objective: request || capability.deliverable,
      requiresExternalAction: false,
      requestedBy: from,
      parentAssignmentId,
      status: "queued",
      priority: parent.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueAt: parent.dueAt,
      activeExecutionId: null,
      attempt: 1,
      lastDispatchAt: null,
      runtimeThreadId: JSON.parse(fs.readFileSync(path.join(root, "config/runtime-instances.json"), "utf8"))[to]?.environmentVariable || null,
      deliveryStatus: "not_dispatched"
    });
  });
  console.log(JSON.stringify({ handoffId, assignmentId, from, to }));
} else if (command === "dispatch") {
  const [subcommand, assignmentId, ...detailParts] = args;
  if (subcommand === "delivered") {
    console.log(JSON.stringify(recordDispatchDelivery(assignmentId, "delivered", {
      evidence: detailParts.join(" ") || "Codex task accepted follow-up message"
    })));
  } else if (subcommand === "failed") {
    console.log(JSON.stringify(recordDispatchDelivery(assignmentId, "failed", {
      error: detailParts.join(" ") || "Codex task delivery failed"
    })));
  } else if (subcommand === "pending") {
    const snapshot = readState();
    console.log(JSON.stringify(snapshot.assignments.filter((item) =>
      ["queued", "retry"].includes(item.status) && item.deliveryStatus === "pending"
    ), null, 2));
  } else {
    throw new Error("Usage: dispatch pending | dispatch delivered <assignment-id> [evidence] | dispatch failed <assignment-id> <error>");
  }
} else if (command === "result") {
  const [assignmentId, executionId, ...payloadParts] = args;
  const payload = JSON.parse(payloadParts.join(" "));
  if (!["completed", "verified_prior_work", "blocked", "failed", "retry"].includes(payload.status)) {
    throw new Error(`Invalid result status: ${payload.status}`);
  }
  if (payload.status === "verified_prior_work" && payload.externalActionAt) {
    throw new Error("verified_prior_work cannot claim externalActionAt");
  }
  const resultId = `RES-${Date.now()}-${process.pid}`;
  let recordedStatus = payload.status;
  mutateState((draft) => {
    const assignment = draft.assignments.find((candidate) => candidate.id === assignmentId);
    const execution = draft.executions.find((candidate) => candidate.id === executionId);
    if (!assignment || !execution || execution.assignmentId !== assignmentId) {
      throw new Error("Assignment/execution mismatch");
    }
    const requiredExternal = assignment.requiresExternalAction || payload.externalActionRequired;
    if (payload.status === "completed" && requiredExternal && !payload.externalActionAt) {
      recordedStatus = payload.blocker ? "blocked" : "retry";
    }
    const actionAt = payload.externalActionAt ? Date.parse(payload.externalActionAt) : null;
    const verifiedAt = payload.verifiedAt ? Date.parse(payload.verifiedAt) : Date.now();
    const startedAt = Date.parse(execution.startedAt);
    const now = Date.now();
    if (payload.externalActionAt && !Number.isFinite(actionAt)) {
      throw new Error("externalActionAt must be a valid timestamp");
    }
    if (payload.verifiedAt && !Number.isFinite(verifiedAt)) {
      throw new Error("verifiedAt must be a valid timestamp");
    }
    if (actionAt !== null && actionAt < startedAt) {
      throw new Error("externalActionAt must occur during the current execution");
    }
    if (actionAt !== null && actionAt > now) {
      throw new Error("externalActionAt cannot be in the future");
    }
    if (actionAt !== null && verifiedAt < actionAt) {
      throw new Error("verifiedAt cannot precede externalActionAt");
    }
    execution.status = recordedStatus;
    execution.finishedAt = new Date().toISOString();
    assignment.status = recordedStatus === "completed" || recordedStatus === "verified_prior_work" ? "completed" : recordedStatus;
    assignment.updatedAt = execution.finishedAt;
    assignment.activeExecutionId = null;
    draft.heartbeats[executionId] = {
      executive: execution.executive,
      executionId,
      status: recordedStatus,
      assignmentId,
      updatedAt: execution.finishedAt,
      details: payload.summary || null
    };
    draft.results.push({
      id: resultId,
      assignmentId,
      executionId,
      executive: execution.executive,
      status: recordedStatus,
      requestedStatus: payload.status,
      completionIntegrity: recordedStatus !== payload.status ? {
        normalized: true,
        reason: "required_external_action_not_verified",
        originalStatus: payload.status,
        recordedStatus
      } : null,
      summary: payload.summary || "",
      evidence: payload.evidence || [],
      blocker: payload.blocker || null,
      metrics: payload.metrics || {},
      externalActionAt: payload.externalActionAt || null,
      verifiedAt: payload.verifiedAt || new Date().toISOString(),
      requestedHandoffs: payload.requestedHandoffs || [],
      createdAt: new Date().toISOString()
    });
    for (const [name, value] of Object.entries(payload.metrics || {})) {
      draft.metrics[name] = { value: String(value), updatedAt: new Date().toISOString(), sourceResultId: resultId };
    }
    for (const handoff of draft.handoffs.filter((candidate) => candidate.childAssignmentId === assignmentId && candidate.status === "open")) {
      handoff.status = "resolved";
      handoff.resolvedAt = new Date().toISOString();
      handoff.resultId = resultId;
    }
  });
  console.log(JSON.stringify({ resultId, assignmentId, executionId, status: recordedStatus, requestedStatus: payload.status }));
} else if (command === "monitor") {
  const snapshot = readState();
  const now = Date.now();
  const stalled = snapshot.executions.filter((execution) =>
    execution.status === "running" && now - Date.parse(execution.lastHeartbeatAt || execution.startedAt) > 15 * 60 * 1000
  );
  console.log(JSON.stringify({
    queued: snapshot.assignments.filter((item) => item.status === "queued"),
    inProgress: snapshot.assignments.filter((item) => item.status === "in_progress"),
    blocked: snapshot.assignments.filter((item) => item.status === "blocked"),
    failed: snapshot.assignments.filter((item) => item.status === "failed"),
    stalled,
    openHandoffs: snapshot.handoffs.filter((item) => item.status === "open")
  }, null, 2));
} else if (command === "heartbeat") {
  const [executive, executionId, assignmentId, status = "running"] = args;
  if (!executives[executive]) throw new Error(`Unknown executive: ${executive}`);
  console.log(JSON.stringify({ updatedAt: recordHeartbeat(executive, executionId, { assignmentId, status }) }));
} else if (command === "recover") {
  console.log(JSON.stringify({ recovered: detectAndRecoverStalledExecutions() }));
} else if (command === "incident") {
  const [subcommand, executionId, classification, ...detail] = args;
  if (subcommand !== "classify") {
    throw new Error("Usage: incident classify <execution-id> <classification> <detail>");
  }
  console.log(JSON.stringify(classifyExecutionFailure(executionId, classification, detail.join(" ")), null, 2));
} else if (command === "notification") {
  const [subcommand, ...notificationArgs] = args;
  if (subcommand === "list") {
    console.log(JSON.stringify(notificationReport(), null, 2));
  } else if (subcommand === "dry-run") {
    console.log(JSON.stringify(buildChiefOfStaffNotification(JSON.parse(notificationArgs.join(" "))), null, 2));
  } else if (["sent", "resolved"].includes(subcommand)) {
    const [notificationId, ...detail] = notificationArgs;
    console.log(JSON.stringify(updateNotification(notificationId, subcommand, detail.join(" ")), null, 2));
  } else {
    throw new Error("Usage: notification list | dry-run '<json>' | sent <notification-id> <delivery-evidence> | resolved <notification-id> <resolution>");
  }
} else if (command === "proactive") {
  console.log(JSON.stringify({ created: enqueueProactiveWork(args[0] ? new Date(args[0]) : new Date()) }));
} else if (command === "integration") {
  const [subcommand, name, status, ...detail] = args;
  if (subcommand === "list") {
    console.log(JSON.stringify(integrationReport(), null, 2));
  } else if (subcommand === "set") {
    const message = detail.join(" ");
    const blockerType = status === "blocked" || status === "degraded" ? classifyBlocker({ message }) : null;
    recordIntegrationStatus(name, status, {
      message,
      blockerType,
      requiresHuman: ["authentication_required", "session_expired", "captcha_required", "permission_denied", "approval_required"].includes(blockerType)
    });
    console.log(JSON.stringify({ name, status, blockerType }));
  } else {
    throw new Error(`Usage: integration list | integration set <name> <healthy|degraded|blocked|unknown> <message>. Types: ${blockerTypes.join(", ")}`);
  }
} else if (command === "engagement") {
  const [subcommand, ...engagementArgs] = args;
  if (subcommand === "reserve") {
    const [platform, postId, creatorAccount, assignmentId] = engagementArgs;
    console.log(JSON.stringify(reserveEngagement({ platform, postId, creatorAccount, assignmentId })));
  } else if (subcommand === "complete") {
    const [reservationId, externalActionAt, verifiedAt] = engagementArgs;
    console.log(JSON.stringify(completeEngagement(reservationId, externalActionAt, verifiedAt)));
  } else if (subcommand === "release") {
    const [reservationId, ...reason] = engagementArgs;
    console.log(JSON.stringify(releaseEngagement(reservationId, reason.join(" ") || "action_not_performed")));
  } else if (subcommand === "list") {
    console.log(JSON.stringify(readState().engagementLedger, null, 2));
  } else {
    throw new Error("Usage: engagement reserve <platform> <post-id> <creator-account> <assignment-id> | complete <reservation-id> <external-action-at> <verified-at> | release <reservation-id> <reason> | list");
  }
} else if (command === "consolidate") {
  const snapshot = readState();
  const assignmentIds = args.length ? args : snapshot.assignments.map((item) => item.id);
  console.log(`# Chief of Staff Consolidated Briefing`);
  for (const assignmentId of assignmentIds) {
    const assignment = snapshot.assignments.find((item) => item.id === assignmentId);
    if (!assignment) continue;
    const results = snapshot.results.filter((item) => item.assignmentId === assignmentId);
    console.log(`\n## ${assignment.id} — ${assignment.objective}`);
    console.log(`Owner: ${executives[assignment.owner].name}; status: ${assignment.status}`);
    for (const result of results) {
      console.log(`- ${result.executive}/${result.executionId}: ${result.status}; ${result.summary}`);
      console.log(`  externalActionAt=${result.externalActionAt || "none"}; verifiedAt=${result.verifiedAt}`);
    }
    const children = snapshot.handoffs.filter((item) => item.parentAssignmentId === assignmentId);
    for (const handoff of children) console.log(`- handoff ${handoff.id}: ${handoff.from} -> ${handoff.to}; ${handoff.status}`);
  }
} else if (command === "briefing") {
  briefing(state);
} else if (command === "status") {
  console.log(JSON.stringify({
    initialized: fs.existsSync(stateFile),
    lastDailyRun: state.lastDailyRun,
    executives: Object.keys(executives).length,
    capabilities: capabilities.length,
    workItems: state.work.length,
    byStatus: state.work.reduce((acc, item) => ({ ...acc, [item.status]: (acc[item.status] || 0) + 1 }), {})
  }, null, 2));
} else {
  throw new Error(`Unknown command: ${command}`);
}
