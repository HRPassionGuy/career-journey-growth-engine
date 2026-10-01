import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const node = process.execPath;
const cli = path.join(root, "bin", "cjge.mjs");

function tempState() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cjge-resilience-"));
  return path.join(directory, "state.json");
}

function run(args, stateFile, expected = 0) {
  const result = spawnSync(node, [cli, ...args], {
    cwd: root,
    env: { ...process.env, CJGE_STATE_FILE: stateFile },
    encoding: "utf8"
  });
  assert.equal(result.status, expected, result.stderr || result.stdout);
  return result.stdout.trim();
}

test("blockers are classified precisely", async () => {
  const runtime = await import(`../lib/runtime-ops.mjs?blockers=${Date.now()}`);
  assert.equal(runtime.classifyBlocker({ message: "Please sign in again" }), "authentication_required");
  assert.equal(runtime.classifyBlocker({ message: "Session expired" }), "session_expired");
  assert.equal(runtime.classifyBlocker({ message: "CAPTCHA challenge" }), "captcha_required");
  assert.equal(runtime.classifyBlocker({ status: 429 }), "rate_limited");
  assert.equal(runtime.classifyBlocker({ status: 503 }), "platform_unavailable");
});

test("proactive work is idempotent and creates multiple bounded executive assignments", async () => {
  const stateFile = tempState();
  run(["init"], stateFile);
  const morning = JSON.parse(run(["proactive", "2026-07-24T10:00:00.000Z"], stateFile));
  const seven = JSON.parse(run(["proactive", "2026-07-24T11:00:00.000Z"], stateFile));
  const eight = JSON.parse(run(["proactive", "2026-07-24T12:00:00.000Z"], stateFile));
  const duplicate = JSON.parse(run(["proactive", "2026-07-24T12:00:00.000Z"], stateFile));
  assert.ok(morning.created.length + seven.created.length + eight.created.length >= 3);
  assert.equal(duplicate.created.length, 0);
  const state = JSON.parse(fs.readFileSync(stateFile));
  assert.ok(new Set(state.assignments.map((item) => item.owner)).size >= 3);
});

test("heartbeat prevents premature recovery and stale execution is retried", async () => {
  const stateFile = tempState();
  run(["init"], stateFile);
  const assignment = JSON.parse(run(["delegate", "COM-OPS-001", JSON.stringify({ objective: "test" })], stateFile));
  const executive = path.join(root, "bin", "executive.mjs");
  const invocation = spawnSync(node, [executive, "community", assignment.assignmentId], {
    cwd: root, env: { ...process.env, CJGE_STATE_FILE: stateFile }, encoding: "utf8"
  });
  assert.equal(invocation.status, 0, invocation.stderr);
  const executionId = JSON.parse(invocation.stdout).executionId;
  run(["heartbeat", "community", executionId, assignment.assignmentId, "running"], stateFile);
  assert.equal(JSON.parse(run(["recover"], stateFile)).recovered.length, 0);
  const state = JSON.parse(fs.readFileSync(stateFile));
  state.executions[0].lastHeartbeatAt = "2026-01-01T00:00:00.000Z";
  fs.writeFileSync(stateFile, JSON.stringify(state));
  const recovered = JSON.parse(run(["recover"], stateFile)).recovered;
  assert.equal(recovered.length, 1);
  const recoveredState = JSON.parse(fs.readFileSync(stateFile));
  assert.equal(recoveredState.assignments[0].status, "retry");
  assert.equal(recoveredState.executions[0].failureClassification, "heartbeat_timeout_under_investigation");
  assert.equal(recoveredState.executions[0].investigationStatus, "open");
  assert.equal(recoveredState.escalations[0].type, "stalled_execution_investigation");
});

test("stalled external engagement is released and its cause can be classified", () => {
  const stateFile = tempState();
  run(["init"], stateFile);
  const assignment = JSON.parse(run(["delegate", "COM-OPS-001", JSON.stringify({
    objective: "external engagement",
    requiresExternalAction: true
  })], stateFile));
  const executive = path.join(root, "bin", "executive.mjs");
  const invocation = spawnSync(node, [executive, "community", assignment.assignmentId], {
    cwd: root, env: { ...process.env, CJGE_STATE_FILE: stateFile }, encoding: "utf8"
  });
  const executionId = JSON.parse(invocation.stdout).executionId;
  const reservation = JSON.parse(run([
    "engagement", "reserve", "tiktok", "post-stalled", "creator-stalled", assignment.assignmentId
  ], stateFile));
  const state = JSON.parse(fs.readFileSync(stateFile));
  state.executions[0].lastHeartbeatAt = "2026-01-01T00:00:00.000Z";
  fs.writeFileSync(stateFile, JSON.stringify(state));
  const recovered = JSON.parse(run(["recover"], stateFile)).recovered[0];
  const after = JSON.parse(fs.readFileSync(stateFile));
  assert.deepEqual(recovered.releasedReservationIds, [reservation.reservation.id]);
  assert.equal(after.engagementLedger[0].status, "released");
  assert.equal(after.engagementLedger[0].releaseReason, "execution_stalled_before_external_action");
  const classified = JSON.parse(run([
    "incident", "classify", executionId, "authorization_policy_mismatch", "Action-time confirmation unavailable"
  ], stateFile));
  assert.equal(classified.classification, "authorization_policy_mismatch");
  assert.equal(JSON.parse(fs.readFileSync(stateFile)).executions[0].investigationStatus, "classified");
});

test("integration state exposes human-required stale session blockers", () => {
  const stateFile = tempState();
  run(["init"], stateFile);
  const output = JSON.parse(run(["integration", "set", "LinkedIn", "blocked", "Session expired; sign in required"], stateFile));
  assert.equal(output.blockerType, "session_expired");
  const report = JSON.parse(run(["integration", "list"], stateFile));
  const linkedIn = report.find((item) => item.name === "LinkedIn");
  assert.equal(linkedIn.status, "blocked");
  assert.equal(linkedIn.requiresHuman, true);
  const state = JSON.parse(fs.readFileSync(stateFile));
  assert.equal(state.notifications.length, 1);
  assert.equal(state.notifications[0].deliveryOwner, "chief-of-staff");
  assert.equal(state.notifications[0].recipient, "mgrmarcus@hrpassion.com");
  assert.doesNotMatch(state.notifications[0].body, /password|token|cookie/i);
  run(["integration", "set", "LinkedIn", "blocked", "Session expired; sign in required"], stateFile);
  assert.equal(JSON.parse(fs.readFileSync(stateFile)).notifications.length, 1);
});

test("notification dry-run creates no live incident or email delivery state", () => {
  const stateFile = tempState();
  run(["init"], stateFile);
  const draft = JSON.parse(run(["notification", "dry-run", JSON.stringify({
    assignmentId: "ASN-DRY-RUN",
    executionId: "EXEC-DRY-RUN",
    integration: "LinkedIn",
    classification: "session_expired",
    shortBlocker: "session expired",
    actionNeeded: "Sign in again; token=must-not-appear",
    reopenUrl: "https://www.linkedin.com/"
  })], stateFile));
  assert.equal(draft.deliveryOwner, "chief-of-staff");
  assert.equal(draft.channel, "authorized_gmail");
  assert.match(draft.subject, /^CJGE action needed/);
  assert.match(draft.body, /ASN-DRY-RUN/);
  assert.doesNotMatch(draft.body, /must-not-appear/);
  assert.equal(JSON.parse(fs.readFileSync(stateFile)).notifications.length, 0);
});

test("n8n workflow exports do not contain credentials", () => {
  const directory = path.join(root, "n8n");
  const files = fs.readdirSync(directory).filter((file) => file.endsWith(".json"));
  assert.equal(files.length, 3);
  for (const file of files) {
    const content = fs.readFileSync(path.join(directory, file), "utf8");
    JSON.parse(content);
    assert.doesNotMatch(content, /Bearer [A-Za-z0-9_-]{16,}/);
    assert.match(content, /\$vars\.CJGE_WEBHOOK_TOKEN/);
  }
});

test("dispatch requests are idempotently throttled without claiming executive work", async () => {
  const stateFile = tempState();
  run(["init"], stateFile);
  const delegated = JSON.parse(run(["delegate", "REV-OPS-001", JSON.stringify({ objective: "dispatch test" })], stateFile));
  const env = { ...process.env, CJGE_STATE_FILE: stateFile };
  const daemon = path.join(root, "bin", "daemon.mjs");
  const first = spawnSync(node, [daemon, "--once"], { cwd: root, env, encoding: "utf8" });
  assert.equal(first.status, 0, first.stderr);
  const second = spawnSync(node, [daemon, "--once"], { cwd: root, env, encoding: "utf8" });
  assert.equal(second.status, 0, second.stderr);
  const state = JSON.parse(fs.readFileSync(stateFile));
  const assignment = state.assignments.find((item) => item.id === delegated.assignmentId);
  const log = state.dispatchLog.filter((item) => item.assignmentId === delegated.assignmentId);
  assert.equal(assignment.status, "queued");
  assert.equal(state.executions.length, 0);
  assert.equal(log.length, 1);
  assert.equal(assignment.deliveryStatus, "pending");
  assert.equal(assignment.runtimeThreadId, "openai/codex-action@v1");
  assert.equal(log[0].status, "dispatch_requested");
  assert.equal(log[0].entryPoint, "./bin/cloud-executive.mjs");
});

test("dispatch delivery acknowledgements distinguish request from accepted thread delivery", () => {
  const stateFile = tempState();
  run(["init"], stateFile);
  const delegated = JSON.parse(run(["delegate", "MKT-OPS-001", JSON.stringify({ objective: "delivery test" })], stateFile));
  const env = { ...process.env, CJGE_STATE_FILE: stateFile };
  const daemon = path.join(root, "bin", "daemon.mjs");
  const tick = spawnSync(node, [daemon, "--once"], { cwd: root, env, encoding: "utf8" });
  assert.equal(tick.status, 0, tick.stderr);
  run(["dispatch", "delivered", delegated.assignmentId, "accepted by Codex task"], stateFile);
  const state = JSON.parse(fs.readFileSync(stateFile));
  const assignment = state.assignments.find((item) => item.id === delegated.assignmentId);
  const log = state.dispatchLog.filter((item) => item.assignmentId === delegated.assignmentId);
  assert.equal(assignment.deliveryStatus, "delivered");
  assert.ok(assignment.deliveredAt);
  assert.deepEqual(log.map((item) => item.status), ["dispatch_requested", "delivered_to_thread"]);
});

test("executive claim acknowledges delivery and starts a durable heartbeat", () => {
  const stateFile = tempState();
  run(["init"], stateFile);
  const delegated = JSON.parse(run(["delegate", "REV-OPS-001", JSON.stringify({ objective: "claim test" })], stateFile));
  const executive = path.join(root, "bin", "executive.mjs");
  const invocation = spawnSync(node, [executive, "vp-revenue", delegated.assignmentId], {
    cwd: root, env: { ...process.env, CJGE_STATE_FILE: stateFile }, encoding: "utf8"
  });
  assert.equal(invocation.status, 0, invocation.stderr);
  const executionId = JSON.parse(invocation.stdout).executionId;
  const state = JSON.parse(fs.readFileSync(stateFile));
  const assignment = state.assignments.find((item) => item.id === delegated.assignmentId);
  assert.equal(assignment.deliveryStatus, "delivered");
  assert.ok(assignment.deliveredAt);
  assert.equal(state.heartbeats[executionId].status, "running");
  assert.equal(state.heartbeats[executionId].assignmentId, delegated.assignmentId);
  assert.equal(state.dispatchLog.at(-1).status, "delivered_to_thread");
  assert.equal(state.dispatchLog.at(-1).executionId, executionId);
});

test("terminal result closes heartbeat and clears the active execution", () => {
  const stateFile = tempState();
  run(["init"], stateFile);
  const delegated = JSON.parse(run(["delegate", "ANA-OPS-001", JSON.stringify({ objective: "result test" })], stateFile));
  const executive = path.join(root, "bin", "executive.mjs");
  const invocation = spawnSync(node, [executive, "analytics", delegated.assignmentId], {
    cwd: root, env: { ...process.env, CJGE_STATE_FILE: stateFile }, encoding: "utf8"
  });
  const executionId = JSON.parse(invocation.stdout).executionId;
  run(["result", delegated.assignmentId, executionId, JSON.stringify({
    status: "completed", summary: "Verified", evidence: ["test"], metrics: {}
  })], stateFile);
  const state = JSON.parse(fs.readFileSync(stateFile));
  const assignment = state.assignments.find((item) => item.id === delegated.assignmentId);
  assert.equal(assignment.activeExecutionId, null);
  assert.equal(state.heartbeats[executionId].status, "completed");
  assert.equal(state.executions.find((item) => item.id === executionId).status, "completed");
});

test("stalled execution retries are bounded and every stall is classified", () => {
  const stateFile = tempState();
  run(["init"], stateFile);
  const delegated = JSON.parse(run(["delegate", "COM-OPS-001", JSON.stringify({ objective: "bounded retry" })], stateFile));
  const executive = path.join(root, "bin", "executive.mjs");
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const invocation = spawnSync(node, [executive, "community", delegated.assignmentId], {
      cwd: root, env: { ...process.env, CJGE_STATE_FILE: stateFile }, encoding: "utf8"
    });
    assert.equal(invocation.status, 0, invocation.stderr);
    const executionId = JSON.parse(invocation.stdout).executionId;
    const state = JSON.parse(fs.readFileSync(stateFile));
    state.executions.find((item) => item.id === executionId).lastHeartbeatAt = "2026-01-01T00:00:00.000Z";
    fs.writeFileSync(stateFile, JSON.stringify(state));
    const recovered = JSON.parse(run(["recover"], stateFile)).recovered;
    assert.equal(recovered.length, 1);
    assert.equal(recovered[0].failureClassification, "heartbeat_timeout_under_investigation");
  }
  const state = JSON.parse(fs.readFileSync(stateFile));
  const assignment = state.assignments.find((item) => item.id === delegated.assignmentId);
  assert.equal(assignment.status, "blocked");
  assert.equal(assignment.attempt, 2);
  assert.equal(state.executions.filter((item) => item.status === "stalled").length, 2);
  assert.ok(state.executions.every((item) => item.failureClassification));
  assert.ok(state.executions.every((item) => state.heartbeats[item.id].status === "stalled"));
});

test("stalled external-action reservations release for every external-action executive", () => {
  const stateFile = tempState();
  run(["init"], stateFile);
  const cases = [
    ["vp-revenue", "REV-OPS-001"],
    ["creative", "CRE-OPS-002"],
    ["marketing", "MKT-OPS-001"],
    ["community", "COM-OPS-001"]
  ];
  const executive = path.join(root, "bin", "executive.mjs");
  for (const [owner, capabilityId] of cases) {
    const delegated = JSON.parse(run(["delegate", capabilityId, JSON.stringify({
      objective: `${owner} external action`, requiresExternalAction: true
    })], stateFile));
    const invocation = spawnSync(node, [executive, owner, delegated.assignmentId], {
      cwd: root, env: { ...process.env, CJGE_STATE_FILE: stateFile }, encoding: "utf8"
    });
    assert.equal(invocation.status, 0, invocation.stderr);
    const executionId = JSON.parse(invocation.stdout).executionId;
    const reservation = JSON.parse(run([
      "engagement", "reserve", "reddit", `post-${owner}`, `creator-${owner}`, delegated.assignmentId
    ], stateFile)).reservation;
    const state = JSON.parse(fs.readFileSync(stateFile));
    state.executions.find((item) => item.id === executionId).lastHeartbeatAt = "2026-01-01T00:00:00.000Z";
    fs.writeFileSync(stateFile, JSON.stringify(state));
    const recovered = JSON.parse(run(["recover"], stateFile)).recovered;
    assert.equal(recovered.length, 1);
    assert.deepEqual(recovered[0].releasedReservationIds, [reservation.id]);
  }
  const state = JSON.parse(fs.readFileSync(stateFile));
  assert.equal(state.engagementLedger.length, cases.length);
  assert.ok(state.engagementLedger.every((item) =>
    item.status === "released" &&
    item.releaseReason === "execution_stalled_before_external_action" &&
    !item.externalActionAt
  ));
});

test("proactive and handoff assignments carry the registered destination task", () => {
  const stateFile = tempState();
  run(["init"], stateFile);
  run(["proactive", "2026-07-27T11:00:00.000Z"], stateFile);
  let state = JSON.parse(fs.readFileSync(stateFile));
  const community = state.assignments.find((item) => item.owner === "community");
  assert.equal(community.runtimeThreadId, "openai/codex-action@v1");
  assert.equal(community.deliveryStatus, "not_dispatched");

  const parent = JSON.parse(run(["delegate", "REV-OPS-001", JSON.stringify({ objective: "parent" })], stateFile));
  const child = JSON.parse(run(["handoff", parent.assignmentId, "vp-revenue", "creative", "CRE-OPS-001", "Create bounded asset"], stateFile));
  state = JSON.parse(fs.readFileSync(stateFile));
  const creative = state.assignments.find((item) => item.id === child.assignmentId);
  assert.equal(creative.runtimeThreadId, "openai/codex-action@v1");
  assert.equal(creative.deliveryStatus, "not_dispatched");
});

test("engagement reservations enforce target uniqueness and TikTok daily cap", () => {
  const stateFile = tempState();
  run(["init"], stateFile);
  const first = JSON.parse(run(["engagement", "reserve", "tiktok", "post-1", "creator-1", "ASN-1"], stateFile));
  assert.equal(first.allowed, true);
  const duplicate = JSON.parse(run(["engagement", "reserve", "tiktok", "post-1", "creator-1", "ASN-2"], stateFile));
  assert.equal(duplicate.allowed, false);
  assert.equal(duplicate.reason, "duplicate_target");
  for (let index = 2; index <= 10; index += 1) {
    const reservation = JSON.parse(run(["engagement", "reserve", "tiktok", `post-${index}`, `creator-${index}`, "ASN-1"], stateFile));
    assert.equal(reservation.allowed, true);
  }
  const overCap = JSON.parse(run(["engagement", "reserve", "tiktok", "post-11", "creator-11", "ASN-1"], stateFile));
  assert.equal(overCap.allowed, false);
  assert.equal(overCap.reason, "daily_cap_reached");
});

test("only the newest proactive Community assignment is dispatchable", () => {
  const stateFile = tempState();
  run(["init"], stateFile);
  const older = JSON.parse(run(["delegate", "COM-OPS-001", JSON.stringify({
    objective: "older", requestedBy: "proactive-monitor"
  })], stateFile));
  const newer = JSON.parse(run(["delegate", "COM-OPS-001", JSON.stringify({
    objective: "newer", requestedBy: "proactive-monitor"
  })], stateFile));
  const env = { ...process.env, CJGE_STATE_FILE: stateFile };
  const daemon = path.join(root, "bin", "daemon.mjs");
  const tick = spawnSync(node, [daemon, "--once"], { cwd: root, env, encoding: "utf8" });
  assert.equal(tick.status, 0, tick.stderr);
  const state = JSON.parse(fs.readFileSync(stateFile));
  assert.equal(state.assignments.find((item) => item.id === older.assignmentId).lastDispatchAt, null);
  assert.ok(state.assignments.find((item) => item.id === newer.assignmentId).lastDispatchAt);
});
