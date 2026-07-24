#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { detectAndRecoverStalledExecutions, dueAssignments, enqueueProactiveWork } from "../lib/runtime-ops.mjs";
import { mutateState, root } from "../lib/state-store.mjs";

const monitoring = JSON.parse(fs.readFileSync(path.join(root, "config/monitoring.json"), "utf8"));
const node = process.execPath;
const executiveScript = path.join(root, "bin", "executive.mjs");
const once = process.argv.includes("--once");

function dispatch(assignment) {
  const child = spawn(node, [executiveScript, assignment.owner, assignment.id], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  let errorOutput = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { errorOutput += chunk; });
  child.on("close", (code) => {
    mutateState((state) => {
      state.dispatchLog.push({
        assignmentId: assignment.id,
        executive: assignment.owner,
        dispatchedAt: new Date().toISOString(),
        processId: child.pid,
        exitCode: code,
        executionPacket: output.trim() || null,
        error: errorOutput.trim() || null
      });
    });
  });
  return { assignmentId: assignment.id, executive: assignment.owner, processId: child.pid };
}

async function tick() {
  const recovered = detectAndRecoverStalledExecutions();
  const created = enqueueProactiveWork();
  const dispatched = dueAssignments().map(dispatch);
  const summary = { at: new Date().toISOString(), created, recovered, dispatched };
  console.log(JSON.stringify(summary));
  return summary;
}

await tick();
if (!once) setInterval(() => void tick(), monitoring.pollIntervalMs);
