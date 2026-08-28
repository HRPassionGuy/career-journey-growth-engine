import fs from "node:fs";
import path from "node:path";
import { mutateState, mutateStateIdempotently, readState, root } from "./state-store.mjs";

const monitoring = JSON.parse(fs.readFileSync(path.join(root, "config/monitoring.json"), "utf8"));
const capabilities = JSON.parse(fs.readFileSync(path.join(root, "config/capabilities.json"), "utf8"));
const runtimeInstances = JSON.parse(fs.readFileSync(path.join(root, "config/runtime-instances.json"), "utf8"));
const runtimeTarget = (runtime) => runtime?.threadId || runtime?.executionMechanism || null;

export const humanRequiredBlockerTypes = [
  "authentication_required", "session_expired", "captcha_required", "permission_denied", "approval_required"
];

function safeNotificationText(value) {
  return String(value ?? "").replace(/\b(password|token|cookie|otp|secret)\s*[:=]\s*\S+/gi, "$1=[REDACTED]");
}

export function buildChiefOfStaffNotification(input = {}, at = new Date().toISOString()) {
  if (!input.assignmentId && !input.executionId && !input.integration) {
    throw new Error("Notification requires an assignment, execution, or integration identifier");
  }
  const shortBlocker = safeNotificationText(input.shortBlocker || input.classification || "human action required").slice(0, 120);
  const target = safeNotificationText(input.integration || input.workflow || input.assignmentId || "CJGE workflow").slice(0, 100);
  return {
    incidentKey: String(input.incidentKey || `${input.assignmentId || "none"}:${input.executionId || "none"}:${input.integration || "none"}:${input.classification || "unknown"}`),
    deliveryOwner: "chief-of-staff",
    channel: "authorized_gmail",
    recipient: "mgrmarcus@hrpassion.com",
    subject: `CJGE action needed — ${target} — ${shortBlocker}`,
    body: [
      `What stalled: ${safeNotificationText(input.whatStalled || target)}`,
      `First seen: ${String(input.firstSeenAt || at)}`,
      `Verified: ${String(input.verifiedAt || at)}`,
      `Recovery attempted: ${safeNotificationText(input.recoveryAttempted || "bounded automated recovery completed")}`,
      `Action needed: ${safeNotificationText(input.actionNeeded || "Review and restore the blocked connection or approval")}`,
      input.reopenUrl ? `Safe reopen URL: ${String(input.reopenUrl)}` : null,
      `Assignment: ${String(input.assignmentId || "n/a")}`,
      `Execution: ${String(input.executionId || "n/a")}`,
      `Integration: ${String(input.integration || "n/a")}`
    ].filter(Boolean).join("\n"),
    assignmentId: input.assignmentId || null,
    executionId: input.executionId || null,
    integration: input.integration || null,
    classification: input.classification || null,
    firstSeenAt: input.firstSeenAt || at,
    verifiedAt: input.verifiedAt || at,
    reopenUrl: input.reopenUrl || null
  };
}

function enqueueChiefOfStaffNotification(state, input, at = new Date().toISOString()) {
  const draft = buildChiefOfStaffNotification(input, at);
  const duplicate = state.notifications.find((item) =>
    item.incidentKey === draft.incidentKey && ["pending_chief_of_staff", "sent"].includes(item.status)
  );
  if (duplicate) return { created: false, notification: duplicate };
  const notification = {
    id: `NTF-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    ...draft,
    status: "pending_chief_of_staff",
    createdAt: at,
    sentAt: null,
    deliveryEvidence: null,
    resolvedAt: null,
    resolution: null
  };
  state.notifications.push(notification);
  return { created: true, notification };
}

export function notificationReport() {
  return readState().notifications;
}

export function updateNotification(notificationId, status, detail = "") {
  if (!["sent", "resolved"].includes(status)) throw new Error(`Invalid notification status: ${status}`);
  const at = new Date().toISOString();
  return mutateState((state) => {
    const notification = state.notifications.find((item) => item.id === notificationId);
    if (!notification) throw new Error(`Unknown notification: ${notificationId}`);
    notification.status = status;
    if (status === "sent") {
      notification.sentAt = at;
      notification.deliveryEvidence = detail || null;
    } else {
      notification.resolvedAt = at;
      notification.resolution = detail || null;
    }
    return notification;
  });
}

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
    if (evidence.requiresHuman && humanRequiredBlockerTypes.includes(evidence.blockerType)) {
      enqueueChiefOfStaffNotification(state, {
        incidentKey: `integration:${name}:${evidence.blockerType}`,
        integration: name,
        classification: evidence.blockerType,
        shortBlocker: evidence.blockerType.replaceAll("_", " "),
        whatStalled: evidence.message || `${name} integration`,
        recoveryAttempted: "integration preflight classified the blocker as human-required",
        actionNeeded: `Restore authorized access for ${name}, then rerun integration preflight`
      });
    }
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
      execution.failureClassification = "heartbeat_timeout_under_investigation";
      execution.failureDetail = "Execution stopped heartbeating without persisting a terminal result.";
      execution.investigationStatus = "open";
      state.heartbeats[execution.id] = {
        executive: execution.executive,
        executionId: execution.id,
        status: "stalled",
        assignmentId: execution.assignmentId,
        updatedAt: execution.finishedAt,
        details: execution.failureDetail
      };
      const releasedReservationIds = [];
      for (const reservation of state.engagementLedger.filter((item) =>
        item.assignmentId === execution.assignmentId &&
        item.status === "reserved" &&
        !item.externalActionAt
      )) {
        reservation.status = "released";
        reservation.releasedAt = new Date(now).toISOString();
        reservation.releaseReason = "execution_stalled_before_external_action";
        releasedReservationIds.push(reservation.id);
      }
      if (!assignment) continue;
      assignment.lastFailureClassification = execution.failureClassification;
      assignment.lastFailureAt = execution.finishedAt;
      assignment.attempt = Number(assignment.attempt || 1);
      if (assignment.attempt < monitoring.retry.maxAttempts) {
        assignment.attempt += 1;
        assignment.status = "retry";
        assignment.nextAttemptAt = new Date(now + retryDelayMs(assignment.attempt)).toISOString();
        assignment.activeExecutionId = null;
      } else {
        assignment.status = "blocked";
        assignment.blocker = "Execution stalled after maximum retry attempts";
        enqueueChiefOfStaffNotification(state, {
          incidentKey: `assignment:${assignment.id}:bounded_stall`,
          assignmentId: assignment.id,
          executionId: execution.id,
          workflow: assignment.capabilityId,
          classification: "bounded_retries_exhausted",
          shortBlocker: "execution stalled after bounded retries",
          whatStalled: assignment.objective,
          firstSeenAt: assignment.lastFailureAt,
          verifiedAt: execution.finishedAt,
          recoveryAttempted: `${assignment.attempt} bounded execution attempts exhausted`,
          actionNeeded: "Review the execution evidence and clear or re-scope the blocked assignment"
        }, execution.finishedAt);
      }
      state.escalations.push({
        id: `ESC-${Date.now()}-${execution.id}`,
        assignmentId: assignment.id,
        executionId: execution.id,
        type: "stalled_execution_investigation",
        classification: execution.failureClassification,
        severity: assignment.status === "blocked" ? "high" : "normal",
        status: "open",
        createdAt: new Date(now).toISOString(),
        requiresHuman: false
      });
      recovered.push({
        executionId: execution.id,
        assignmentId: assignment.id,
        assignmentStatus: assignment.status,
        failureClassification: execution.failureClassification,
        releasedReservationIds
      });
    }
  });
  return recovered;
}

export function classifyExecutionFailure(executionId, classification, detail) {
  if (![executionId, classification, detail].every(Boolean)) {
    throw new Error("Failure classification requires executionId, classification, and detail");
  }
  const at = new Date().toISOString();
  return mutateState((state) => {
    const execution = state.executions.find((item) => item.id === executionId);
    if (!execution) throw new Error(`Unknown execution: ${executionId}`);
    execution.failureClassification = classification;
    execution.failureDetail = detail;
    execution.investigationStatus = "classified";
    execution.investigatedAt = at;
    const assignment = state.assignments.find((item) => item.id === execution.assignmentId);
    if (assignment) {
      assignment.lastFailureClassification = classification;
      assignment.lastFailureAt = at;
    }
    for (const escalation of state.escalations.filter((item) =>
      item.executionId === executionId && item.status === "open"
    )) {
      escalation.classification = classification;
      escalation.status = "resolved";
      escalation.resolvedAt = at;
      escalation.resolution = detail;
    }
    return { executionId, assignmentId: execution.assignmentId, classification, detail, investigatedAt: at };
  });
}

export function dueAssignments(now = Date.now()) {
  const assignments = readState().assignments;
  const latestCommunityProactive = assignments
    .filter((assignment) => assignment.capabilityId === "COM-OPS-001" && assignment.requestedBy === "proactive-monitor")
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0]?.id;
  return assignments.filter((assignment) =>
    ["queued", "retry"].includes(assignment.status) &&
    (assignment.capabilityId !== "COM-OPS-001" ||
      assignment.requestedBy !== "proactive-monitor" ||
      assignment.id === latestCommunityProactive) &&
    (!assignment.nextAttemptAt || Date.parse(assignment.nextAttemptAt) <= now) &&
    (!assignment.lastDispatchAt || now - Date.parse(assignment.lastDispatchAt) >= monitoring.dispatch.redispatchAfterMs)
  );
}

export function markDispatchRequested(assignment) {
  const at = new Date().toISOString();
  const delivery = mutateState((state) => {
    const durable = state.assignments.find((item) => item.id === assignment.id);
    if (!durable || !["queued", "retry"].includes(durable.status)) return null;
    const runtime = runtimeInstances[durable.owner];
    if (!runtimeTarget(runtime)) {
      durable.deliveryStatus = "failed";
      durable.deliveryError = `No runtime task registered for ${durable.owner}`;
      durable.updatedAt = at;
      state.dispatchLog.push({
        assignmentId: durable.id,
        executive: durable.owner,
        dispatchedAt: at,
        runtimeThreadId: null,
        status: "delivery_failed",
        error: durable.deliveryError
      });
      return null;
    }
    durable.runtimeThreadId = runtimeTarget(runtime);
    durable.lastDispatchAt = at;
    durable.deliveryStatus = "pending";
    durable.deliveryError = null;
    durable.updatedAt = at;
    const record = {
      assignmentId: durable.id,
      executive: durable.owner,
      dispatchedAt: at,
      runtimeThreadId: runtimeTarget(runtime),
      entryPoint: runtime.entryPoint,
      status: "dispatch_requested"
    };
    state.dispatchLog.push(record);
    return record;
  });
  return delivery;
}

export function recordDispatchDelivery(assignmentId, status, details = {}) {
  if (!["delivered", "failed"].includes(status)) throw new Error(`Invalid delivery status: ${status}`);
  const at = new Date().toISOString();
  return mutateState((state) => {
    const assignment = state.assignments.find((item) => item.id === assignmentId);
    if (!assignment) throw new Error(`Unknown assignment: ${assignmentId}`);
    const runtime = runtimeInstances[assignment.owner];
    const record = {
      assignmentId,
      executive: assignment.owner,
      dispatchedAt: assignment.lastDispatchAt || null,
      recordedAt: at,
      runtimeThreadId: assignment.runtimeThreadId || runtimeTarget(runtime),
      status: status === "delivered" ? "delivered_to_thread" : "delivery_failed",
      deliveryEvidence: details.evidence || null,
      error: details.error || null
    };
    assignment.deliveryStatus = status;
    assignment.deliveredAt = status === "delivered" ? at : assignment.deliveredAt || null;
    assignment.deliveryError = status === "failed" ? (details.error || "Unspecified delivery failure") : null;
    assignment.updatedAt = at;
    state.dispatchLog.push(record);
    if (status === "failed") {
      const failures = state.dispatchLog.filter((item) =>
        item.assignmentId === assignmentId && item.status === "delivery_failed"
      ).length;
      const threshold = Number(monitoring.dispatch.terminalFailureThreshold || 2);
      if (failures >= threshold) {
        enqueueChiefOfStaffNotification(state, {
          incidentKey: `assignment:${assignmentId}:terminal_delivery_failure`,
          assignmentId,
          workflow: assignment.capabilityId,
          classification: "persistent_task_delivery_failure",
          shortBlocker: "persistent executive task delivery failure",
          whatStalled: assignment.objective,
          firstSeenAt: assignment.lastDispatchAt || at,
          verifiedAt: at,
          recoveryAttempted: `${failures} durable delivery attempts failed`,
          actionNeeded: `Open the registered ${assignment.owner} Codex task and restore task-message delivery`
        }, at);
      }
    }
    return record;
  });
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
        lastDispatchAt: null,
        runtimeThreadId: runtimeTarget(runtimeInstances[capability.owner]),
        deliveryStatus: "not_dispatched",
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

function localDate(at = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: monitoring.engagementPolicy?.timeZone || monitoring.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(at);
}

export function reserveEngagement({ platform, postId, creatorAccount, assignmentId }) {
  if (![platform, postId, creatorAccount, assignmentId].every(Boolean)) {
    throw new Error("Engagement reservation requires platform, postId, creatorAccount, and assignmentId");
  }
  const normalizedPlatform = String(platform).toLowerCase();
  const targetKey = `${normalizedPlatform}:${String(postId).toLowerCase()}:${String(creatorAccount).toLowerCase()}`;
  const date = localDate();
  return mutateState((state) => {
    const duplicate = state.engagementLedger.find((item) =>
      item.targetKey === targetKey && ["reserved", "completed"].includes(item.status)
    );
    if (duplicate) {
      return { allowed: false, reason: "duplicate_target", existingReservationId: duplicate.id };
    }
    if (normalizedPlatform === "tiktok") {
      const used = state.engagementLedger.filter((item) =>
        item.platform === "tiktok" && item.localDate === date && ["reserved", "completed"].includes(item.status)
      ).length;
      const maximum = Number(monitoring.engagementPolicy?.tiktokDailyMaximum || 10);
      if (used >= maximum) return { allowed: false, reason: "daily_cap_reached", used, maximum, localDate: date };
    }
    const reservation = {
      id: `ENG-${Date.now()}-${process.pid}`,
      platform: normalizedPlatform,
      postId: String(postId),
      creatorAccount: String(creatorAccount),
      targetKey,
      assignmentId: String(assignmentId),
      localDate: date,
      status: "reserved",
      reservedAt: new Date().toISOString(),
      externalActionAt: null,
      verifiedAt: null,
      releaseReason: null
    };
    state.engagementLedger.push(reservation);
    return { allowed: true, reservation };
  });
}

export function completeEngagement(reservationId, externalActionAt, verifiedAt) {
  if (!reservationId || !externalActionAt || !verifiedAt) {
    throw new Error("Engagement completion requires reservationId, externalActionAt, and verifiedAt");
  }
  return mutateState((state) => {
    const reservation = state.engagementLedger.find((item) => item.id === reservationId);
    if (!reservation) throw new Error(`Unknown engagement reservation: ${reservationId}`);
    if (reservation.status !== "reserved") throw new Error(`Reservation is ${reservation.status}, not reserved`);
    reservation.status = "completed";
    reservation.externalActionAt = externalActionAt;
    reservation.verifiedAt = verifiedAt;
    return reservation;
  });
}

export function releaseEngagement(reservationId, reason = "action_not_performed") {
  return mutateState((state) => {
    const reservation = state.engagementLedger.find((item) => item.id === reservationId);
    if (!reservation) throw new Error(`Unknown engagement reservation: ${reservationId}`);
    if (reservation.status !== "reserved") throw new Error(`Reservation is ${reservation.status}, not reserved`);
    reservation.status = "released";
    reservation.releaseReason = reason;
    reservation.releasedAt = new Date().toISOString();
    return reservation;
  });
}
