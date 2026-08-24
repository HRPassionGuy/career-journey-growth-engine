import fs from "node:fs";
import { createSupabaseStateStore } from "./supabase-state-store.mjs";

const monitoring = JSON.parse(fs.readFileSync(new URL("../config/monitoring.json", import.meta.url), "utf8"));
const capabilities = JSON.parse(fs.readFileSync(new URL("../config/capabilities.json", import.meta.url), "utf8"));
const instances = JSON.parse(fs.readFileSync(new URL("../config/runtime-instances.json", import.meta.url), "utf8"));

export function createCloudWorker(options = {}) {
  const store = options.store || createSupabaseStateStore(options);

  async function integrations() {
    const state = await store.readState();
    return monitoring.integrations.map((name) => ({ name, ...(state.integrationStatus[name] || {
      status: "unknown", checkedAt: null, blockerType: null, message: "No preflight has been recorded",
      evidence: [], requiresHuman: false
    }) }));
  }

  async function tick(now = new Date()) {
    const isoDate = new Intl.DateTimeFormat("en-CA", { timeZone: monitoring.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: monitoring.timeZone, hour: "2-digit", hourCycle: "h23" }).format(now));
    return store.mutateState((state) => {
      const created = [];
      const recovered = [];
      for (const execution of state.executions) {
        if (execution.status !== "running") continue;
        const heartbeatAt = Date.parse(execution.lastHeartbeatAt || execution.startedAt);
        if (now.getTime() - heartbeatAt <= monitoring.heartbeat.staleAfterMs) continue;
        execution.status = "stalled";
        execution.finishedAt = now.toISOString();
        execution.failureClassification = "heartbeat_timeout_under_investigation";
        execution.failureDetail = "Execution stopped heartbeating without persisting a terminal result.";
        const assignment = state.assignments.find(({ id }) => id === execution.assignmentId);
        if (assignment) {
          assignment.attempt = Number(assignment.attempt || 1);
          assignment.activeExecutionId = null;
          if (assignment.attempt < monitoring.retry.maxAttempts) {
            assignment.attempt += 1;
            assignment.status = "retry";
            const delay = Math.min(monitoring.retry.maxDelayMs, monitoring.retry.baseDelayMs * (2 ** Math.max(0, assignment.attempt - 1)));
            assignment.nextAttemptAt = new Date(now.getTime() + delay).toISOString();
          } else {
            assignment.status = "blocked";
            assignment.blocker = "Execution stalled after maximum retry attempts";
          }
          recovered.push({ executionId: execution.id, assignmentId: assignment.id, assignmentStatus: assignment.status });
        }
      }
      for (const monitor of monitoring.executiveMonitors) {
        if (!monitor.hours.includes(hour)) continue;
        const idempotencyKey = `proactive:${isoDate}:${hour}:${monitor.capabilityId}`;
        if (state.idempotencyKeys[idempotencyKey]) continue;
        const capability = capabilities.find(({ id }) => id === monitor.capabilityId);
        if (!capability) continue;
        const assignment = {
          id: `ASN-${monitor.capabilityId}-${now.getTime()}-${crypto.randomUUID().slice(0, 8)}`,
          capabilityId: capability.id, owner: capability.owner, support: capability.support,
          objective: monitor.objective || capability.deliverable, requiresExternalAction: Boolean(monitor.requiresExternalAction),
          requestedBy: "proactive-monitor", parentAssignmentId: null, status: "queued", priority: monitor.priority || "normal",
          createdAt: now.toISOString(), updatedAt: now.toISOString(), dueAt: null, activeExecutionId: null, attempt: 1,
          lastDispatchAt: null, runtimeThreadId: instances[capability.owner]?.threadId || null,
          deliveryStatus: "not_dispatched", idempotencyKey
        };
        state.assignments.push(assignment);
        state.idempotencyKeys[idempotencyKey] = { recordedAt: now.toISOString(), value: { assignmentId: assignment.id } };
        created.push({ assignmentId: assignment.id });
      }
      const dispatched = [];
      const accountingKey = `cloud_executions_${isoDate}`;
      const accounting = state.metrics[accountingKey] || { value: 0, unit: "dispatches", recordedAt: now.toISOString() };
      state.metrics[accountingKey] = accounting;
      const circuitOpen = Object.values(state.integrationStatus).some((item) =>
        item.status === "blocked" && item.blockerType === "platform_unavailable"
      );
      for (const assignment of state.assignments) {
        if (circuitOpen || Number(accounting.value) >= monitoring.costControls.dailyExecutionMaximum) break;
        if (!["queued", "retry"].includes(assignment.status)) continue;
        if (assignment.nextAttemptAt && Date.parse(assignment.nextAttemptAt) > now.getTime()) continue;
        if (assignment.lastDispatchAt && now.getTime() - Date.parse(assignment.lastDispatchAt) < monitoring.dispatch.redispatchAfterMs) continue;
        const runtime = instances[assignment.owner];
        if (!runtime?.threadId || runtime.hostId === "local") continue;
        assignment.lastDispatchAt = now.toISOString();
        assignment.runtimeThreadId = runtime.threadId;
        assignment.deliveryStatus = "pending";
        const record = { assignmentId: assignment.id, executive: assignment.owner, dispatchedAt: now.toISOString(), runtimeThreadId: runtime.threadId, entryPoint: runtime.entryPoint, status: "dispatch_requested" };
        state.dispatchLog.push(record);
        dispatched.push(record);
        accounting.value = Number(accounting.value) + 1;
        accounting.recordedAt = now.toISOString();
      }
      return { at: now.toISOString(), economyMode: monitoring.costControls.economyMode, circuitOpen, dailyDispatches: accounting.value, created, recovered, dispatched };
    }, { idempotencyKey: `tick:${now.toISOString().slice(0, 16)}` });
  }

  async function monitor() {
    const state = await store.readState();
    return { assignments: state.assignments.length, queued: state.assignments.filter(({ status }) => ["queued", "retry"].includes(status)).length, running: state.executions.filter(({ status }) => status === "running").length, escalations: state.escalations.filter(({ status }) => status === "open").length };
  }

  async function briefing() {
    const state = await store.readState();
    const due = state.assignments.filter(({ status }) => ["queued", "retry", "blocked"].includes(status));
    return due.length ? due.map((item) => `${item.id} | ${item.owner} | ${item.status} | ${item.objective}`).join("\n") : "No due assignments.";
  }

  async function recordIntegrationStatus(payload) {
    if (!payload?.name || !["healthy", "degraded", "blocked", "unknown"].includes(payload.status)) throw new Error("Valid integration name and status are required");
    return store.mutateState((state) => {
      state.integrationStatus[payload.name] = { status: payload.status, checkedAt: new Date().toISOString(), blockerType: payload.blockerType || null, message: payload.message || null, evidence: payload.evidence || [], requiresHuman: Boolean(payload.requiresHuman) };
      return { recorded: true };
    }, { idempotencyKey: payload.idempotencyKey || null });
  }

  return { store, integrations, tick, monitor, briefing, recordIntegrationStatus };
}
