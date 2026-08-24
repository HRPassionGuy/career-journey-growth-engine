import fs from "node:fs";
import { productionStateStore } from "./supabase-state-store.mjs";
import { createCodexCloudDispatcher } from "./codex-cloud-dispatcher.mjs";

const monitoring = JSON.parse(fs.readFileSync(new URL("../config/monitoring.json", import.meta.url), "utf8"));
const capabilities = JSON.parse(fs.readFileSync(new URL("../config/capabilities.json", import.meta.url), "utf8"));
const instances = JSON.parse(fs.readFileSync(new URL("../config/runtime-instances.json", import.meta.url), "utf8"));
const executives = JSON.parse(fs.readFileSync(new URL("../config/executives.json", import.meta.url), "utf8"));

function operatingDate(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: monitoring.timeZone, year: "numeric", month: "2-digit", day: "2-digit"
  }).format(value);
}

function recordDelivery(state, request, status, detail) {
  const recordedAt = new Date().toISOString();
  const assignment = state.assignments.find(({ id }) => id === request.assignmentId);
  if (!assignment || assignment.lastDispatchAt !== request.dispatchedAt) return null;
  assignment.deliveryStatus = status;
  assignment.deliveredAt = status === "delivered" ? recordedAt : assignment.deliveredAt || null;
  assignment.deliveryError = status === "failed" ? detail.error : null;
  assignment.updatedAt = recordedAt;
  const record = {
    assignmentId: request.assignmentId,
    executive: request.executive,
    dispatchedAt: request.dispatchedAt,
    recordedAt,
    runtimeThreadId: request.runtimeThreadId,
    status: status === "delivered" ? "delivered_to_thread" : "delivery_failed",
    deliveryEvidence: status === "delivered" ? detail.deliveryId || "Codex Cloud accepted assignment" : null,
    error: status === "failed" ? detail.error : null,
    idempotencyKey: request.idempotencyKey
  };
  state.dispatchLog.push(record);
  return record;
}

export function createCloudWorker(options = {}) {
  const store = options.store || productionStateStore(options);
  const configuredDeliver = options.deliver;

  async function integrations() {
    const state = await store.readState();
    return monitoring.integrations.map((name) => ({ name, ...(state.integrationStatus[name] || {
      status: "unknown", checkedAt: null, blockerType: null, message: "No preflight has been recorded",
      evidence: [], requiresHuman: false
    }) }));
  }

  async function tick(now = new Date()) {
    const isoDate = operatingDate(now);
    const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: monitoring.timeZone, hour: "2-digit", hourCycle: "h23" }).format(now));
    const mutation = await store.mutateState((state) => {
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
        execution.investigationStatus = "open";
        state.heartbeats[execution.id] = {
          executive: execution.executive, executionId: execution.id, status: "stalled",
          assignmentId: execution.assignmentId, updatedAt: now.toISOString(), details: execution.failureDetail
        };
        const releasedReservationIds = [];
        for (const reservation of state.engagementLedger.filter((item) =>
          item.assignmentId === execution.assignmentId && item.status === "reserved" && !item.externalActionAt
        )) {
          reservation.status = "released";
          reservation.releasedAt = now.toISOString();
          reservation.releaseReason = "execution_stalled_before_external_action";
          releasedReservationIds.push(reservation.id);
        }
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
          assignment.lastFailureClassification = execution.failureClassification;
          assignment.lastFailureAt = now.toISOString();
          state.escalations.push({
            id: `ESC-${now.getTime()}-${execution.id}`, assignmentId: assignment.id, executionId: execution.id,
            type: "stalled_execution_investigation", classification: execution.failureClassification,
            severity: assignment.status === "blocked" ? "high" : "normal", status: "open",
            createdAt: now.toISOString(), requiresHuman: false
          });
          recovered.push({ executionId: execution.id, assignmentId: assignment.id, assignmentStatus: assignment.status, failureClassification: execution.failureClassification, releasedReservationIds });
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
      const latestCommunityProactive = state.assignments
        .filter((assignment) => assignment.capabilityId === "COM-OPS-001" && assignment.requestedBy === "proactive-monitor")
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0]?.id;
      for (const assignment of state.assignments) {
        if (circuitOpen || Number(accounting.value) >= monitoring.costControls.dailyExecutionMaximum) break;
        if (!["queued", "retry"].includes(assignment.status)) continue;
        if (assignment.capabilityId === "COM-OPS-001" && assignment.requestedBy === "proactive-monitor" && assignment.id !== latestCommunityProactive) continue;
        if (assignment.nextAttemptAt && Date.parse(assignment.nextAttemptAt) > now.getTime()) continue;
        if (assignment.lastDispatchAt && now.getTime() - Date.parse(assignment.lastDispatchAt) < monitoring.dispatch.redispatchAfterMs) continue;
        const runtime = instances[assignment.owner];
        if (!runtime?.threadId || runtime.hostId === "local") continue;
        assignment.lastDispatchAt = now.toISOString();
        assignment.runtimeThreadId = runtime.threadId;
        assignment.deliveryStatus = "pending";
        const record = { assignmentId: assignment.id, executive: assignment.owner, dispatchedAt: now.toISOString(), runtimeThreadId: runtime.threadId, entryPoint: runtime.entryPoint, status: "dispatch_requested", idempotencyKey: `dispatch:${assignment.id}:${assignment.attempt || 1}` };
        state.dispatchLog.push(record);
        dispatched.push(record);
        accounting.value = Number(accounting.value) + 1;
        accounting.recordedAt = now.toISOString();
      }
      return { at: now.toISOString(), economyMode: monitoring.costControls.economyMode, circuitOpen, dailyDispatches: accounting.value, created, recovered, dispatched };
    }, { idempotencyKey: `tick:${now.toISOString().slice(0, 16)}` });
    if (mutation?.duplicate) return mutation;
    const operation = mutation?.value || mutation;
    const deliveries = [];
    for (const record of operation.dispatched) {
      try {
        const deliver = configuredDeliver || createCodexCloudDispatcher(options);
        const evidence = await deliver(record);
        await store.mutateState((state) => recordDelivery(state, record, "delivered", evidence));
        deliveries.push({ assignmentId: record.assignmentId, status: "delivered", ...evidence });
      } catch (error) {
        await store.mutateState((state) => recordDelivery(state, record, "failed", { error: error.message }));
        deliveries.push({ assignmentId: record.assignmentId, status: "failed", error: error.message });
      }
    }
    return { ...operation, deliveries };
  }

  async function monitor() {
    const state = await store.readState();
    const now = Date.now();
    return {
      queued: state.assignments.filter(({ status }) => status === "queued"),
      inProgress: state.assignments.filter(({ status }) => status === "in_progress"),
      blocked: state.assignments.filter(({ status }) => status === "blocked"),
      failed: state.assignments.filter(({ status }) => status === "failed"),
      stalled: state.executions.filter((execution) => execution.status === "running" && now - Date.parse(execution.lastHeartbeatAt || execution.startedAt) > monitoring.heartbeat.staleAfterMs),
      openHandoffs: state.handoffs.filter(({ status }) => status === "open")
    };
  }

  async function briefing() {
    const state = await store.readState();
    const date = operatingDate();
    const todays = state.work.filter((item) => item.scheduledFor === date);
    const lines = [`# Chief of Staff Daily Briefing — ${date}`];
    for (const status of ["completed", "in_progress", "ready", "retry", "blocked"]) {
      const items = todays.filter((item) => item.status === status);
      lines.push("", `## ${status.replace("_", " ").toUpperCase()} (${items.length})`);
      for (const item of items) lines.push(`- ${item.name} — ${executives[item.owner]?.name || item.owner}${item.blocker ? ` — ${item.blocker}` : ""}`);
    }
    lines.push("", "## Revenue evidence", JSON.stringify(state.metrics, null, 2), "", "## Workflow evidence");
    for (const report of state.reports.filter((item) => item.id?.startsWith(date))) lines.push(`- ${report.id}: ${report.status}; externalActionAt=${report.externalActionAt || "pre-existing/unknown"}; verifiedAt=${report.verifiedAt || "unverified"}`);
    return lines.join("\n");
  }

  async function recordIntegrationStatus(payload) {
    if (!payload?.name || !["healthy", "degraded", "blocked", "unknown"].includes(payload.status)) throw new Error("Valid integration name and status are required");
    if (!monitoring.integrations.includes(payload.name)) throw new Error("Unknown integration");
    return store.mutateState((state) => {
      state.integrationStatus[payload.name] = { status: payload.status, checkedAt: new Date().toISOString(), blockerType: payload.blockerType || null, message: payload.message || null, evidence: payload.evidence || [], requiresHuman: Boolean(payload.requiresHuman) };
      return { recorded: true };
    }, { idempotencyKey: payload.idempotencyKey || null });
  }

  return { store, integrations, tick, monitor, briefing, recordIntegrationStatus };
}
