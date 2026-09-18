import { productionStateStore } from "./supabase-state-store.mjs";
import { createGithubCodexDispatcher } from "./github-codex-dispatcher.mjs";

export async function submitChiefOfStaffRequest(payload, options = {}) {
  const request = String(payload?.request || "").trim();
  if (!request) throw new Error("Chief of Staff request is required");
  if (request.length > 12000) throw new Error("Chief of Staff request is too large");

  const store = options.store || productionStateStore(options);
  const now = new Date();
  const createdAt = now.toISOString();
  const requestId = String(payload?.requestId || `COS-${now.getTime()}-${crypto.randomUUID().slice(0, 8)}`);
  const idempotencyKey = `cos-intake:${requestId}`;

  const mutation = await store.mutateState((state) => {
    const assignmentId = `ASN-COS-${now.getTime()}-${crypto.randomUUID().slice(0, 8)}`;
    const assignment = {
      id: assignmentId,
      capabilityId: "COS-OPS-001",
      owner: "chief-of-staff",
      support: ["vp-revenue", "marketing", "creative", "community", "analytics", "research", "automation"],
      objective: request,
      requiresExternalAction: false,
      requestedBy: "ceo-chief-of-staff-front-door",
      parentAssignmentId: null,
      status: "queued",
      priority: payload?.priority === "high" ? "high" : "normal",
      createdAt,
      updatedAt: createdAt,
      dueAt: null,
      activeExecutionId: null,
      attempt: 1,
      lastDispatchAt: createdAt,
      runtimeThreadId: null,
      runtimeExecutionMechanism: "openai/codex-action@v1",
      deliveryStatus: "pending",
      idempotencyKey
    };
    const dispatch = {
      assignmentId,
      executive: "chief-of-staff",
      dispatchedAt: createdAt,
      runtimeExecutionMechanism: "openai/codex-action@v1",
      entryPoint: "./bin/cloud-executive.mjs",
      status: "dispatch_requested",
      idempotencyKey: `dispatch:${assignmentId}:1`
    };
    state.assignments.push(assignment);
    state.dispatchLog.push(dispatch);
    return { requestId, assignmentId, dispatch };
  }, { idempotencyKey });

  if (mutation?.duplicate) return { ok: true, duplicate: true, requestId, previous: mutation.value || mutation };
  const operation = mutation?.value || mutation;
  const dispatch = options.deliver || createGithubCodexDispatcher(options);
  try {
    const delivery = await dispatch(operation.dispatch);
    await store.mutateState((state) => {
      const assignment = state.assignments.find(({ id }) => id === operation.assignmentId);
      if (assignment) {
        assignment.deliveryStatus = "submitted";
        assignment.submittedAt = new Date().toISOString();
        assignment.updatedAt = assignment.submittedAt;
      }
      state.dispatchLog.push({ ...operation.dispatch, recordedAt: new Date().toISOString(), status: "submitted_to_github_runner", deliveryEvidence: delivery.deliveryId || operation.dispatch.idempotencyKey });
      return { recorded: true };
    });
    return { ok: true, duplicate: false, requestId, assignmentId: operation.assignmentId, delivery: delivery.status || "submitted_to_github" };
  } catch (error) {
    await store.mutateState((state) => {
      const assignment = state.assignments.find(({ id }) => id === operation.assignmentId);
      if (assignment) {
        assignment.deliveryStatus = "failed";
        assignment.deliveryError = error.message;
        assignment.updatedAt = new Date().toISOString();
      }
      return { recorded: true };
    });
    throw error;
  }
}
