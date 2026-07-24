import fs from "node:fs";
import path from "node:path";
import { mutateState, mutateStateIdempotently, readState, root } from "./state-store.mjs";

const monitoring = JSON.parse(fs.readFileSync(path.join(root, "config/monitoring.json"), "utf8"));
const capabilities = JSON.parse(fs.readFileSync(path.join(root, "config/capabilities.json"), "utf8"));

export const blockerTypes = [
  "authentication_required",
  "session_expired",
  "captcha_required",
  "permission_denied",
  "platform_unavailable",
  "rate_limited",
  "network_error",
  "content_not_found",
  "approval_required",
  "unknown"
];

export function classifyBlocker(input = {}) {
  const code = String(input.code || "").toLowerCase();
  const message = String(input.message || "").toLowerCase();
  const status = Number(input.status || 0);
  const text = `${code} ${message}`;
  if (/captcha|challenge/.test(text)) return "captcha_required";
  if (/session.*expir|cookie.*expir|signed out/.test(text)) return "session_expired";
  if (/login|sign in|authentication|unauthorized/.test(text) || status === 401) return "authentication_required";
  if (/permission|forbidden|access denied/.test(text) || status === 403) return "permission_denied";
  if (/rate limit|too many/.test(text) || status === 429) return "rate_limited";
  if (/not found|page not found/.test(text) || status === 404) return "content_not_found";
  if (/approval/.test(text)) return "approval_required";
  if (/timeout|network|econn|dns/.test(text)) return "network_error";
  if (/unavailable|maintenance|outage/.test(text) || status >= 500) return "platform_unavailable";
  return "unknown";
}

export function retryDelayMs(attempt) {
  const base = monitoring.retry.baseDelayMs;
  const capped = Math.min(monitoring.retry.maxDelayMs, base * (2 ** Math.max(0, attempt - 1)));
  return capped;
}

export function recordHeartbeat(executive, executionId, details = {}) {
  const now = new Date().toISOString();
  mutateState((state) => {
    state.heartbeats[executionId] = {
      executive,
      executionId,
      status: details.status || "running",
      assignmentId: details.assignmentId || null,
      updatedAt: now,
      details: details.details || null
    };
    const execution = state.executions.find((item) => item.id === executionId);
    if (execution) execution.lastHeartbeatAt = now;
  });
  return now;
}

export function recordIntegrationStatus(name, status, evidence = {}) {
  if (!["healthy", "degraded", "blocked", "unknown"].includes(status)) throw new Error(`Invalid integration status: ${status}`);
  mutateState((state) => {
    state.integrationStatus[name] = {
      status,
      checkedAt: new Date().toISOString(),
      blockerType: evidence.blockerType || null,
      message: evidence.message || null,
      evidence: evidence.evidence || [],
      requiresHuman: Boolean(evidence.requiresHuman)
    };
  });
}

export function detectAndRecoverStalledExecutions(now = Date.now()) {
  const recovered = [];
  mutateState((state) => {
    for (const execution of state.executions) {
      if (execution.status !== "running") continue;
      const heartbeatAt = Date.parse(execution.lastHeartbeatAt || execution.startedAt);
      if (now - heartbeatAt <= monitoring.heartbeat.staleAfterMs) continue;
      const assignment = state.assignments.find((item) => item.id === execution.assignmentId);
      execution.status = "stalled";
      execution.finishedAt = new Date(now).toISOString();
      if (!assignment) continue;
      assignment.attempt = Number(assignment.attempt || 1);
      if (assignment.attempt < monitoring.retry.maxAttempts) {
        assignment.attempt += 1;
        assignment.status = "retry";
        assignment.nextAttemptAt = new Date(now + retryDelayMs(assignment.attempt)).toISOString();
        assignment.activeExecutionId = null;
      } else {
        assignment.status = "blocked";
        assignment.blocker = "Execution stalled after maximum retry attempts";
        state.escalations.push({
          id: `ESC-${Date.now()}-${execution.id}`,
          assignmentId: assignment.id,
          type: "stalled_execution",
          severity: "high",
          status: "open",
          createdAt: new Date(now).toISOString(),
          requiresHuman: false
        });
      }
      recovered.push({ executionId: execution.id, assignmentId: assignment.id, assignmentStatus: assignment.status });
    }
  });
  return recovered;
}

export function dueAssignments(now = Date.now()) {
  return readState().assignments.filter((assignment) =>
    ["queued", "retry"].includes(assignment.status) &&
    (!assignment.nextAttemptAt || Date.parse(assignment.nextAttemptAt) <= now)
  );
}

export function enqueueProactiveWork(now = new Date()) {
  const isoDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: monitoring.timeZone, year: "numeric", month: "2-digit", day: "2-digit"
  }).format(now);
  const hour = Number(new Intl.DateTimeFormat("en-US", {
    timeZone: monitoring.timeZone, hour: "2-digit", hourCycle: "h23"
  }).format(now));
  const created = [];
  for (const monitor of monitoring.executiveMonitors) {
    if (!monitor.hours.includes(hour)) continue;
    const key = `proactive:${isoDate}:${hour}:${monitor.capabilityId}`;
    const capability = capabilities.find((item) => item.id === monitor.capabilityId);
    if (!capability) continue;
    const result = mutateStateIdempotently(key, (state) => {
      const assignment = {
        id: `ASN-${monitor.capabilityId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        capabilityId: monitor.capabilityId,
        owner: capability.owner,
        support: capability.support,
        objective: monitor.objective || capability.deliverable,
        requiresExternalAction: Boolean(monitor.requiresExternalAction),
        requestedBy: "proactive-monitor",
        parentAssignmentId: null,
        status: "queued",
        priority: monitor.priority || "normal",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueAt: null,
        activeExecutionId: null,
        attempt: 1,
        idempotencyKey: key
      };
      state.assignments.push(assignment);
      return { assignmentId: assignment.id };
    });
    if (!result.duplicate) created.push(result.value);
  }
  return created;
}

export function integrationReport() {
  const state = readState();
  return monitoring.integrations.map((name) => ({
    name,
    ...(state.integrationStatus[name] || {
      status: "unknown",
      checkedAt: null,
      blockerType: null,
      message: "No preflight has been recorded",
      evidence: [],
      requiresHuman: false
    })
  }));
}
