import { timingSafeEqual } from "node:crypto";
import { productionStateStore } from "../lib/supabase-state-store.mjs";
import { createGithubCodexDispatcher } from "../lib/github-codex-dispatcher.mjs";

function send(response, status, body) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(body));
}

function authorized(request, token) {
  const supplied = String(request.headers.authorization || "");
  const expected = `Bearer ${token}`;
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export default async function handler(request, response) {
  if (request.method !== "POST") return send(response, 405, { error: "method_not_allowed" });
  const token = process.env.CJGE_WEBHOOK_TOKEN;
  if (!token) return send(response, 503, { error: "worker_not_configured" });
  if (!authorized(request, token)) return send(response, 401, { error: "unauthorized" });

  try {
    const store = productionStateStore();
    const proofKey = "stage1-cloud-proof-20260914-v3";
    const mutation = await store.mutateState((state) => {
      const now = new Date().toISOString();
      const assignmentId = `ASN-STAGE1-PROOF-${Date.now()}`;
      const dispatchKey = `dispatch:${assignmentId}:1`;
      const assignment = {
        id: assignmentId,
        capabilityId: "AUT-OPS-001",
        owner: "automation",
        support: ["chief-of-staff"],
        objective: "Controlled Stage 1 migration proof only. Verify the CJGE cloud execution path and return concise evidence. Do not access external accounts, browsers, n8n, social platforms, email, or change any external system. Do not perform any external action.",
        requiresExternalAction: false,
        requestedBy: "stage1-migration-proof",
        parentAssignmentId: null,
        status: "queued",
        priority: "high",
        createdAt: now,
        updatedAt: now,
        dueAt: null,
        activeExecutionId: null,
        attempt: 1,
        lastDispatchAt: now,
        runtimeThreadId: null,
        runtimeExecutionMechanism: "openai/codex-action@v1",
        deliveryStatus: "pending",
        idempotencyKey: proofKey
      };
      const record = {
        assignmentId,
        executive: "automation",
        dispatchedAt: now,
        runtimeExecutionMechanism: "openai/codex-action@v1",
        entryPoint: "./bin/cloud-executive.mjs",
        status: "dispatch_requested",
        idempotencyKey: dispatchKey
      };
      state.assignments.push(assignment);
      state.dispatchLog.push(record);
      return { assignmentId, record };
    }, { idempotencyKey: proofKey });

    if (mutation?.duplicate) return send(response, 200, { ok: true, duplicate: true, previous: mutation.previous });

    const { assignmentId, record } = mutation.value;
    const evidence = await createGithubCodexDispatcher()(record);
    await store.mutateState((state) => {
      const assignment = state.assignments.find((item) => item.id === assignmentId);
      if (assignment) {
        assignment.deliveryStatus = "submitted";
        assignment.submittedAt = new Date().toISOString();
        assignment.updatedAt = assignment.submittedAt;
      }
      state.dispatchLog.push({
        assignmentId,
        executive: "automation",
        dispatchedAt: record.dispatchedAt,
        recordedAt: new Date().toISOString(),
        runtimeExecutionMechanism: record.runtimeExecutionMechanism,
        status: "submitted_to_github_runner",
        deliveryEvidence: evidence.deliveryId,
        error: null,
        idempotencyKey: record.idempotencyKey
      });
      return { recorded: true };
    });

    return send(response, 200, { ok: true, duplicate: false, assignmentId, dispatchKey: record.idempotencyKey, delivery: evidence.status });
  } catch (error) {
    console.error("CJGE Stage 1 proof failure", { name: error.name, message: error.message });
    return send(response, 500, { error: "internal_error" });
  }
}
