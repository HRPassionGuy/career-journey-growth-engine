#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { detectAndRecoverStalledExecutions, dueAssignments, enqueueProactiveWork, markDispatchRequested } from "../lib/runtime-ops.mjs";
import { root } from "../lib/state-store.mjs";

const monitoring = JSON.parse(fs.readFileSync(path.join(root, "config/monitoring.json"), "utf8"));
const once = process.argv.includes("--once");

function dispatch(assignment) {
  return markDispatchRequested(assignment);
}

async function tick() {
  const recovered = detectAndRecoverStalledExecutions();
  const created = enqueueProactiveWork();
  const dispatched = dueAssignments().map(dispatch).filter(Boolean);
  const summary = { at: new Date().toISOString(), created, recovered, dispatched };
  console.log(JSON.stringify(summary));
  return summary;
}

await tick();
if (!once) setInterval(() => void tick(), monitoring.pollIntervalMs);
