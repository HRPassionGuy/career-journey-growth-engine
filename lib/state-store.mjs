import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const stateFile = process.env.CJGE_STATE_FILE || path.join(root, "state", "operating-state.json");
const lockFile = `${stateFile}.lock`;
const waitArray = new Int32Array(new SharedArrayBuffer(4));

function defaults() {
  return {
    version: 3,
    initializedAt: new Date().toISOString(),
    lastDailyRun: null,
    work: [],
    assignments: [],
    executions: [],
    handoffs: [],
    results: [],
    decisions: [],
    risks: [],
    metrics: {},
    reports: []
    ,
    heartbeats: {},
    integrationStatus: {},
    dispatchLog: [],
    escalations: [],
    idempotencyKeys: {}
  };
}

function normalize(state) {
  const base = defaults();
  return {
    ...base,
    ...state,
    version: Math.max(Number(state.version || 1), 3),
    work: state.work || [],
    assignments: state.assignments || [],
    executions: state.executions || [],
    handoffs: state.handoffs || [],
    results: state.results || [],
    decisions: state.decisions || [],
    risks: state.risks || [],
    metrics: state.metrics || {},
    reports: state.reports || [],
    heartbeats: state.heartbeats || {},
    integrationStatus: state.integrationStatus || {},
    dispatchLog: state.dispatchLog || [],
    escalations: state.escalations || [],
    idempotencyKeys: state.idempotencyKeys || {}
  };
}

export function readState() {
  if (!fs.existsSync(stateFile)) return defaults();
  return normalize(JSON.parse(fs.readFileSync(stateFile, "utf8")));
}

function acquireLock(timeoutMs = 10000) {
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  const started = Date.now();
  while (true) {
    try {
      const descriptor = fs.openSync(lockFile, "wx");
      fs.writeFileSync(descriptor, JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }));
      return descriptor;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      if (Date.now() - started > timeoutMs) throw new Error(`Timed out waiting for state lock: ${lockFile}`);
      Atomics.wait(waitArray, 0, 0, 20);
    }
  }
}

function releaseLock(descriptor) {
  try {
    fs.closeSync(descriptor);
  } finally {
    fs.rmSync(lockFile, { force: true });
  }
}

function atomicWrite(state) {
  const temporary = `${stateFile}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(normalize(state), null, 2)}\n`);
  fs.renameSync(temporary, stateFile);
}

export function mutateState(mutator) {
  const descriptor = acquireLock();
  try {
    const state = readState();
    const result = mutator(state);
    atomicWrite(state);
    return result;
  } finally {
    releaseLock(descriptor);
  }
}

export function mutateStateIdempotently(key, mutator) {
  return mutateState((state) => {
    if (state.idempotencyKeys[key]) {
      return { duplicate: true, previous: state.idempotencyKeys[key] };
    }
    const value = mutator(state);
    state.idempotencyKeys[key] = {
      recordedAt: new Date().toISOString(),
      value
    };
    return { duplicate: false, value };
  });
}

export function initializeState() {
  return mutateState((state) => state);
}
