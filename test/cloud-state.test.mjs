import test from "node:test";
import assert from "node:assert/strict";
import { createSupabaseStateStore } from "../lib/supabase-state-store.mjs";
import { createCloudWorker } from "../lib/cloud-worker.mjs";
import { vercelHandler } from "../lib/vercel-api.mjs";
import { createGithubCodexDispatcher } from "../lib/github-codex-dispatcher.mjs";
import fs from "node:fs";

function mockSupabase() {
  let revision = 0;
  let state = { version: 4, initializedAt: "2026-08-24T00:00:00.000Z", metrics: {} };
  const fetchImpl = async (_url, options) => {
    await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 4)));
    const payload = JSON.parse(options.body);
    if (payload.p_operation === "read") return new Response(JSON.stringify({ revision, state }), { status: 200 });
    if (payload.p_expected_revision !== revision) return new Response(JSON.stringify({ updated: false, revision }), { status: 200 });
    state = structuredClone(payload.p_state);
    revision += 1;
    return new Response(JSON.stringify({ updated: true, revision }), { status: 200 });
  };
  return { fetchImpl, inspect: () => ({ revision, state: structuredClone(state) }) };
}

function store(mock) {
  return createSupabaseStateStore({
    environment: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test-only" },
    fetchImpl: mock.fetchImpl,
    maxRetries: 20
  });
}

test("Supabase adapter persists state across separate store invocations", async () => {
  const mock = mockSupabase();
  await store(mock).mutateState((state) => { state.metrics.persisted = { value: "yes" }; });
  assert.equal((await store(mock).readState()).metrics.persisted.value, "yes");
});

test("Supabase compare-and-swap adapter preserves concurrent mutations", async () => {
  const mock = mockSupabase();
  const first = store(mock);
  const second = store(mock);
  await Promise.all(Array.from({ length: 10 }, (_, index) => (index % 2 ? first : second).mutateState((state) => {
    state.metrics[`concurrent_${index}`] = { value: index };
  })));
  const state = await first.readState();
  for (let index = 0; index < 10; index += 1) assert.equal(state.metrics[`concurrent_${index}`].value, index);
});

test("Supabase idempotency keys suppress duplicate mutations", async () => {
  const mock = mockSupabase();
  const adapter = store(mock);
  let calls = 0;
  const mutate = () => adapter.mutateState((state) => { calls += 1; state.reports.push({ id: calls }); return calls; }, { idempotencyKey: "same-event" });
  assert.equal((await mutate()).duplicate, false);
  assert.equal((await mutate()).duplicate, true);
  assert.equal((await adapter.readState()).reports.length, 1);
});

test("cloud worker starts and runs without a local operating-state file", async () => {
  const mock = mockSupabase();
  const worker = createCloudWorker({ store: store(mock) });
  assert.deepEqual(await worker.monitor(), { queued: [], inProgress: [], blocked: [], failed: [], stalled: [], openHandoffs: [] });
  assert.match(await worker.briefing(), /^# Chief of Staff Daily Briefing/);
});

test("cloud tick submits the assignment to the GitHub Codex runner without claiming Codex acceptance", async () => {
  const mock = mockSupabase();
  const adapter = store(mock);
  await adapter.mutateState((state) => state.assignments.push({
    id: "ASN-CLOUD-DELIVERY", capabilityId: "REV-OPS-001", owner: "vp-revenue", support: [],
    objective: "Verify cloud delivery", status: "queued", attempt: 1, createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z", lastDispatchAt: null, deliveryStatus: "not_dispatched"
  }));
  const delivered = [];
  const worker = createCloudWorker({ store: adapter, deliver: async (record) => {
    delivered.push(record);
    return { accepted: true, deliveryId: "codex-delivery-1" };
  } });
  const result = await worker.tick(new Date("2026-08-24T00:00:00.000Z"));
  assert.equal(result.deliveries[0].status, "submitted");
  assert.equal(delivered[0].assignmentId, "ASN-CLOUD-DELIVERY");
  assert.match(delivered[0].idempotencyKey, /^dispatch:ASN-CLOUD-DELIVERY:/);
  const state = await adapter.readState();
  assert.equal(state.assignments[0].deliveryStatus, "submitted");
  assert.deepEqual(state.dispatchLog.map(({ status }) => status), ["dispatch_requested", "submitted_to_github_runner"]);
  const duplicate = await worker.tick(new Date("2026-08-24T00:00:00.000Z"));
  assert.equal(duplicate.duplicate, true);
  assert.equal(delivered.length, 1);
});

test("cloud tick records delivery failure instead of treating a dispatch request as delivery", async () => {
  const mock = mockSupabase();
  const adapter = store(mock);
  await adapter.mutateState((state) => state.assignments.push({
    id: "ASN-CLOUD-FAILURE", capabilityId: "ANA-OPS-001", owner: "analytics", support: [],
    objective: "Reject cloud delivery", status: "queued", attempt: 1, createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z", lastDispatchAt: null, deliveryStatus: "not_dispatched"
  }));
  const worker = createCloudWorker({ store: adapter, deliver: async () => { throw new Error("gateway unavailable"); } });
  const result = await worker.tick(new Date("2026-08-24T00:01:00.000Z"));
  assert.equal(result.deliveries[0].status, "failed");
  const state = await adapter.readState();
  assert.equal(state.assignments[0].deliveryStatus, "failed");
  assert.deepEqual(state.dispatchLog.map(({ status }) => status), ["dispatch_requested", "delivery_failed"]);
});

test("GitHub dispatcher invokes the supported executive workflow on the configured deployment ref", async () => {
  let request;
  const dispatch = createGithubCodexDispatcher({
    environment: { CJGE_GITHUB_REPOSITORY: "owner/repository", CJGE_GITHUB_DISPATCH_TOKEN: "dispatch-secret", CJGE_GITHUB_REF: "release-candidate" },
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(null, { status: 204 });
    }
  });
  const result = await dispatch({ assignmentId: "ASN-1", executive: "analytics", entryPoint: "./bin/executive analytics", idempotencyKey: "dispatch:ASN-1:1", dispatchedAt: "2026-08-27T00:00:00Z" });
  assert.equal(result.status, "submitted_to_github");
  assert.equal(request.options.headers.authorization, "Bearer dispatch-secret");
  assert.match(String(request.url), /api\.github\.com\/repos\/owner\/repository\/actions\/workflows/);
  const payload = JSON.parse(request.options.body);
  assert.equal(payload.ref, "release-candidate");
  assert.equal(payload.inputs.deployment_ref, "release-candidate");
  assert.equal(payload.inputs.dispatch_key, "dispatch:ASN-1:1");
});

test("GitHub dispatcher defaults Stage 1 to cloud-migration", async () => {
  let payload;
  const dispatch = createGithubCodexDispatcher({
    environment: { CJGE_GITHUB_REPOSITORY: "owner/repository", CJGE_GITHUB_DISPATCH_TOKEN: "dispatch-secret" },
    fetchImpl: async (_url, options) => { payload = JSON.parse(options.body); return new Response(null, { status: 204 }); }
  });
  await dispatch({ assignmentId: "ASN-DEFAULT", executive: "analytics", entryPoint: "./bin/cloud-executive.mjs", idempotencyKey: "dispatch:ASN-DEFAULT:1", dispatchedAt: "2026-08-28T00:00:00Z" });
  assert.equal(payload.ref, "cloud-migration");
  assert.equal(payload.inputs.deployment_ref, "cloud-migration");
});

test("workflow uses Codex Action and has no manual Codex login or cloud task invocation", () => {
  const workflow = fs.readFileSync(new URL("../.github/workflows/cjge-executive-dispatch.yml", import.meta.url), "utf8");
  assert.match(workflow, /uses:\s*openai\/codex-action@v1/);
  assert.match(workflow, /openai-api-key:\s*\$\{\{ secrets\.OPENAI_API_KEY \}\}/);
  assert.match(workflow, /ref:\s*\$\{\{ inputs\.deployment_ref \}\}/);
  assert.doesNotMatch(workflow, /codex login|codex cloud exec|CODEX_ACCESS_TOKEN|CODEX_CLOUD_ENVIRONMENT_ID|npm install --global @openai\/codex/);
});

test("terminal Codex Action callback remains distinct and persists actual result evidence", async () => {
  const mock = mockSupabase();
  const adapter = store(mock);
  await adapter.mutateState((state) => {
    state.assignments.push({ id: "ASN-CALLBACK", owner: "analytics", deliveryStatus: "submitted" });
    state.dispatchLog.push({ assignmentId: "ASN-CALLBACK", status: "dispatch_requested", idempotencyKey: "dispatch:ASN-CALLBACK:1", dispatchedAt: "2026-08-27T00:00:00Z" });
  });
  const worker = createCloudWorker({ store: adapter });
  const evidence = JSON.stringify({ executionId: "EXEC-1", result: { status: "completed", summary: "Verified result", evidence: ["durable-result"] } });
  await worker.recordDispatchStatus({ assignmentId: "ASN-CALLBACK", dispatchKey: "dispatch:ASN-CALLBACK:1", status: "completed", taskEvidence: evidence });
  const state = await adapter.readState();
  assert.equal(state.assignments[0].deliveryStatus, "delivered");
  assert.equal(state.dispatchLog.at(-1).status, "codex_action_completed");
  assert.equal(state.dispatchLog.at(-1).deliveryEvidence, evidence);
});

test("Supabase RPC authorization relies on service-role grants, not auth.role runtime claims", () => {
  const migration = fs.readFileSync(new URL("../supabase/migrations/202608240001_cjge_state.sql", import.meta.url), "utf8");
  assert.doesNotMatch(migration, /auth\.role\s*\(/);
  assert.match(migration, /revoke all on function[\s\S]+from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function[\s\S]+to service_role/i);
});

function responseCapture() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(value) { this.body = JSON.parse(value); }
  };
}

test("Vercel handlers enforce authentication and endpoint methods", async () => {
  const previous = process.env.CJGE_WEBHOOK_TOKEN;
  const previousCallback = process.env.CJGE_DISPATCH_CALLBACK_TOKEN;
  process.env.CJGE_WEBHOOK_TOKEN = "unit-test-token";
  process.env.CJGE_DISPATCH_CALLBACK_TOKEN = "unit-test-callback-token";
  try {
    const fakeWorker = {
      store: { readState: async () => ({ version: 4 }) },
      integrations: async () => [], tick: async () => ({ dispatched: [] }), monitor: async () => ({}),
      briefing: async () => "briefing", recordIntegrationStatus: async () => ({ recorded: true }), recordDispatchStatus: async () => ({ recorded: true })
    };
    const createWorker = () => fakeWorker;
    const unauthorized = responseCapture();
    await vercelHandler("tick", { createWorker })({ method: "POST", headers: {} }, unauthorized);
    assert.equal(unauthorized.statusCode, 401);
    const callbackWithOperationalToken = responseCapture();
    await vercelHandler("dispatch-status", { createWorker })({ method: "POST", headers: { authorization: "Bearer unit-test-token" }, body: {} }, callbackWithOperationalToken);
    assert.equal(callbackWithOperationalToken.statusCode, 401);

    for (const [endpoint, method] of [["health", "GET"], ["integrations", "GET"], ["tick", "POST"], ["monitor", "GET"], ["briefing", "GET"], ["integration-status", "POST"], ["dispatch-status", "POST"]]) {
      const response = responseCapture();
      const token = endpoint === "dispatch-status" ? "unit-test-callback-token" : "unit-test-token";
      await vercelHandler(endpoint, { createWorker })({ method, headers: { authorization: `Bearer ${token}` }, body: ["integration-status", "dispatch-status"].includes(endpoint) ? {} : undefined }, response);
      assert.equal(response.statusCode, 200, endpoint);
      assert.equal(response.headers["cache-control"], "no-store");
    }
    const wrongMethod = responseCapture();
    await vercelHandler("tick", { createWorker })({ method: "GET", headers: { authorization: "Bearer unit-test-token" } }, wrongMethod);
    assert.equal(wrongMethod.statusCode, 405);
  } finally {
    if (previous === undefined) delete process.env.CJGE_WEBHOOK_TOKEN;
    else process.env.CJGE_WEBHOOK_TOKEN = previous;
    if (previousCallback === undefined) delete process.env.CJGE_DISPATCH_CALLBACK_TOKEN;
    else process.env.CJGE_DISPATCH_CALLBACK_TOKEN = previousCallback;
  }
});
