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
  const stateFile = tempState();
  process.env.CJGE_STATE_FILE = stateFile;
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
  const midday = JSON.parse(run(["proactive", "2026-07-24T16:00:00.000Z"], stateFile));
  const duplicate = JSON.parse(run(["proactive", "2026-07-24T16:00:00.000Z"], stateFile));
  assert.ok(morning.created.length + midday.created.length >= 3);
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
  assert.equal(JSON.parse(fs.readFileSync(stateFile)).assignments[0].status, "retry");
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
});

test("n8n workflow exports do not contain credentials", () => {
  const directory = path.join(root, "n8n");
  const files = fs.readdirSync(directory).filter((file) => file.endsWith(".json"));
  assert.equal(files.length, 3);
  for (const file of files) {
    const content = fs.readFileSync(path.join(directory, file), "utf8");
    JSON.parse(content);
    assert.doesNotMatch(content, /Bearer [A-Za-z0-9_-]{16,}/);
    assert.match(content, /CJGE_WEBHOOK_TOKEN/);
  }
});
