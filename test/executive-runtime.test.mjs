import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "bin/cjge.mjs");
const executive = path.join(root, "bin/executive.mjs");

function environment() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cjge-test-"));
  return { ...process.env, CJGE_STATE_FILE: path.join(directory, "state.json") };
}

function run(script, args, env, expected = 0) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, env, encoding: "utf8" });
  assert.equal(result.status, expected, result.stderr || result.stdout);
  return result.stdout.trim();
}

test("durable delegation, independent invocation, handoff, results, and consolidation", () => {
  const env = environment();
  run(cli, ["init"], env);

  const parent = JSON.parse(run(cli, [
    "delegate",
    "REV-OPS-001",
    JSON.stringify({ objective: "Qualify a current lead", requiresExternalAction: false })
  ], env));
  let state = JSON.parse(fs.readFileSync(env.CJGE_STATE_FILE));
  assert.equal(state.assignments[0].owner, "vp-revenue");
  assert.equal(state.assignments[0].status, "queued");

  const revenueInvocation = JSON.parse(run(executive, ["vp-revenue", parent.assignmentId], env));
  assert.match(revenueInvocation.executionId, /^EXEC-VP-REVENUE-/);

  const handoff = JSON.parse(run(cli, [
    "handoff",
    parent.assignmentId,
    "vp-revenue",
    "analytics",
    "ANA-OPS-001",
    "Define and record outcome measures"
  ], env));
  const analyticsInvocation = JSON.parse(run(executive, ["analytics", handoff.assignmentId], env));
  assert.notEqual(revenueInvocation.executionId, analyticsInvocation.executionId);

  run(cli, [
    "result",
    handoff.assignmentId,
    analyticsInvocation.executionId,
    JSON.stringify({
      status: "completed",
      summary: "Measurement baseline recorded",
      evidence: ["baseline"],
      metrics: { qualified_leads: 1 },
      verifiedAt: new Date().toISOString()
    })
  ], env);
  run(cli, [
    "result",
    parent.assignmentId,
    revenueInvocation.executionId,
    JSON.stringify({
      status: "completed",
      summary: "Lead qualified",
      evidence: ["qualification"],
      metrics: {},
      verifiedAt: new Date().toISOString()
    })
  ], env);

  state = JSON.parse(fs.readFileSync(env.CJGE_STATE_FILE));
  assert.equal(state.executions.length, 2);
  assert.equal(state.results.length, 2);
  assert.equal(state.handoffs[0].status, "resolved");
  assert.equal(state.metrics.qualified_leads.value, "1");

  const briefing = run(cli, ["consolidate", parent.assignmentId, handoff.assignmentId], env);
  assert.match(briefing, /vp-revenue\/EXEC-VP-REVENUE/);
  assert.match(briefing, /analytics\/EXEC-ANALYTICS/);
  assert.match(briefing, /handoff .*resolved/);
});

test("state mutations are concurrency safe", async () => {
  const env = environment();
  run(cli, ["init"], env);
  const children = Array.from({ length: 12 }, (_, index) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, "metric", `concurrent_${index}`, String(index)], { cwd: root, env });
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`child ${index} exited ${code}`)));
  }));
  await Promise.all(children);
  const state = JSON.parse(fs.readFileSync(env.CJGE_STATE_FILE));
  for (let index = 0; index < 12; index += 1) {
    assert.equal(state.metrics[`concurrent_${index}`].value, String(index));
  }
});

test("temporal evidence integrity is enforced", () => {
  const env = environment();
  run(cli, ["init"], env);
  const assignment = JSON.parse(run(cli, [
    "delegate",
    "COM-OPS-001",
    JSON.stringify({ objective: "Submit a new comment", requiresExternalAction: true })
  ], env));
  const invocation = JSON.parse(run(executive, ["community", assignment.assignmentId], env));

  run(cli, [
    "result",
    assignment.assignmentId,
    invocation.executionId,
    JSON.stringify({
      status: "completed",
      summary: "Unsupported completion",
      evidence: [],
      metrics: {},
      verifiedAt: new Date().toISOString()
    })
  ], env, 1);
});
