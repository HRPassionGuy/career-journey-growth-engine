import { productionStateStore } from "./supabase-state-store.mjs";
import { createGithubCodexDispatcher } from "./github-codex-dispatcher.mjs";

const EXECUTIVES = new Set(["vp-revenue","marketing","creative","community","analytics","research","automation"]);

function unique(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

export async function delegateChiefOfStaffWork(payload, options = {}) {
  const parentAssignmentId = String(payload?.parentAssignmentId || "").trim();
  const requests = Array.isArray(payload?.delegations) ? payload.delegations : [];
  if (!parentAssignmentId) throw new Error("Chief of Staff parentAssignmentId is required");
  if (!requests.length) throw new Error("Chief of Staff delegations are required");
  if (requests.length > 7) throw new Error("Chief of Staff delegation limit exceeded");

  const store = options.store || productionStateStore(options);
  const now = new Date();
  const createdAt = now.toISOString();
  const delegationId = String(payload?.delegationId || `COS-DELEGATE-${parentAssignmentId}-${now.getTime()}`);
  const idempotencyKey = `cos-delegation:${delegationId}`;

  const mutation = await store.mutateState((state) => {
    const parent = state.assignments.find(({ id }) => id === parentAssignmentId && id.startsWith("ASN-COS-"));
    if (!parent) throw new Error("Chief of Staff parent assignment was not found");
    if (!["in_progress","completed"].includes(parent.status)) throw new Error("Chief of Staff parent assignment is not ready to delegate");

    const dispatches = [];
    const childAssignmentIds = [];
    for (const request of requests) {
      const executive = String(request?.executive || "").trim();
      const objective = String(request?.objective || "").trim();
      if (!EXECUTIVES.has(executive)) throw new Error("Chief of Staff delegation executive is invalid");
      if (!objective) throw new Error("Chief of Staff delegation objective is required");
      if (objective.length > 6000) throw new Error("Chief of Staff delegation objective is too large");

      const assignmentId = `ASN-COS-CHILD-${now.getTime()}-${crypto.randomUUID().slice(0,8)}`;
      const dispatchKey = `dispatch:${assignmentId}:1`;
      const assignment = {
        id: assignmentId,
        capabilityId: String(request.capabilityId || "COS-OPS-001"),
        owner: executive,
        support: unique(request.support),
        objective,
        requiresExternalAction: false,
        requestedBy: "chief-of-staff",
        parentAssignmentId,
        status: "queued",
        priority: request.priority === "high" ? "high" : "normal",
        createdAt, updatedAt: createdAt, dueAt: null, activeExecutionId: null, attempt: 1,
        lastDispatchAt: createdAt, runtimeThreadId: null,
        runtimeExecutionMechanism: "openai/codex-action@v1",
        deliveryStatus: "pending",
        idempotencyKey: `cos-child:${delegationId}:${executive}`
      };
      const dispatch = {
        assignmentId, executive, dispatchedAt: createdAt,
        runtimeExecutionMechanism: "openai/codex-action@v1",
        entryPoint: "./bin/cloud-executive.mjs", status: "dispatch_requested",
        idempotencyKey: dispatchKey
      };
      state.assignments.push(assignment);
      state.dispatchLog.push(dispatch);
      state.handoffs.push({
        id: `HO-${now.getTime()}-${crypto.randomUUID().slice(0,8)}`,
        parentAssignmentId, childAssignmentId: assignmentId, from: "chief-of-staff", to: executive,
        objective, status: "open", createdAt
      });
      childAssignmentIds.push(assignmentId);
      dispatches.push(dispatch);
    }
    return { parentAssignmentId, delegationId, childAssignmentIds, dispatches };
  }, { idempotencyKey });

  if (mutation?.duplicate) return { ok: true, duplicate: true, previous: mutation.previous || mutation.value || mutation };
  const operation = mutation?.value || mutation;
  const deliver = options.deliver || createGithubCodexDispatcher(options);
  const deliveries = [];
  for (const dispatch of operation.dispatches) {
    try {
      const evidence = await deliver(dispatch);
      deliveries.push({ assignmentId: dispatch.assignmentId, status: evidence.status || "submitted_to_github" });
    } catch (error) {
      deliveries.push({ assignmentId: dispatch.assignmentId, status: "failed", error: error.message });
    }
  }
  await store.mutateState((state) => {
    for (const delivery of deliveries) {
      const assignment = state.assignments.find(({ id }) => id === delivery.assignmentId);
      if (!assignment) continue;
      assignment.deliveryStatus = delivery.status === "failed" ? "failed" : "submitted";
      assignment.deliveryError = delivery.error || null;
      assignment.updatedAt = new Date().toISOString();
    }
    return { recorded: true };
  });
  return { ok: deliveries.every(({status}) => status !== "failed"), duplicate: false, ...operation, deliveries };
}

export async function chiefOfStaffResponse(payload, options = {}) {
  const parentAssignmentId = String(payload?.parentAssignmentId || "").trim();
  if (!parentAssignmentId) throw new Error("Chief of Staff parentAssignmentId is required");
  const store = options.store || productionStateStore(options);
  const state = await store.readState();
  const parent = state.assignments.find(({ id }) => id === parentAssignmentId && id.startsWith("ASN-COS-"));
  if (!parent) throw new Error("Chief of Staff parent assignment was not found");

  const children = state.assignments.filter(({ parentAssignmentId: id }) => id === parentAssignmentId);
  const results = children.map((child) => ({
    assignmentId: child.id,
    executive: child.owner,
    status: child.status,
    result: state.results.find(({ assignmentId }) => assignmentId === child.id) || null
  }));
  const pending = results.filter(({ status }) => !["completed","blocked","failed"].includes(status));
  return {
    ok: true,
    parentAssignmentId,
    objective: parent.objective,
    ready: children.length > 0 && pending.length === 0,
    childCount: children.length,
    pending: pending.map(({ assignmentId, executive, status }) => ({ assignmentId, executive, status })),
    executiveResults: results
  };
}
