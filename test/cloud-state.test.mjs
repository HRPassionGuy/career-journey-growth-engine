import test from "node:test";
import assert from "node:assert/strict";
import { createSupabaseStateStore } from "../lib/supabase-state-store.mjs";
import { createCloudWorker } from "../lib/cloud-worker.mjs";
import { vercelHandler } from "../lib/vercel-api.mjs";
import { createCodexCloudDispatcher } from "../lib/codex-cloud-dispatcher.mjs";
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

test("cloud tick delivers the assignment to Codex Cloud before claiming delivery", async () => {
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
  assert.equal(result.deliveries[0].status, "delivered");
  assert.equal(delivered[0].assignmentId, "ASN-CLOUD-DELIVERY");
  assert.match(delivered[0].idempotencyKey, /^dispatch:ASN-CLOUD-DELIVERY:/);
  const state = await adapter.readState();
  assert.equal(state.assignments[0].deliveryStatus, "delivered");
  assert.deepEqual(state.dispatchLog.map(({ status }) => status), ["dispatch_requested", "delivered_to_thread"]);
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

test("Codex Cloud dispatcher sends an authenticated idempotent assignment envelope", async () => {
  let request;
  const dispatch = createCodexCloudDispatcher({
    environment: { CODEX_CLOUD_DISPATCH_URL: "https://codex.example/dispatch", CODEX_CLOUD_DISPATCH_TOKEN: "dispatch-secret" },
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({ accepted: true, deliveryId: "delivery-123" }), { status: 202 });
    }
  });
  const result = await dispatch({ assignmentId: "ASN-1", executive: "analytics", runtimeThreadId: "thread-1", entryPoint: "./bin/executive analytics", idempotencyKey: "dispatch:ASN-1:1" });
  assert.equal(result.deliveryId, "delivery-123");
  assert.equal(request.options.headers.authorization, "Bearer dispatch-secret");
  assert.equal(request.options.headers["idempotency-key"], "dispatch:ASN-1:1");
  assert.equal(JSON.parse(request.options.body).threadId, "thread-1");
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
  process.env.CJGE_WEBHOOK_TOKEN = "unit-test-token";
  try {
    const fakeWorker = {
      store: { readState: async () => ({ version: 4 }) },
      integrations: async () => [], tick: async () => ({ dispatched: [] }), monitor: async () => ({}),
      briefing: async () => "briefing", recordIntegrationStatus: async () => ({ recorded: true })
    };
    const createWorker = () => fakeWorker;
    const unauthorized = responseCapture();
    await vercelHandler("tick", { createWorker })({ method: "POST", headers: {} }, unauthorized);
    assert.equal(unauthorized.statusCode, 401);

    for (const [endpoint, method] of [["health", "GET"], ["integrations", "GET"], ["tick", "POST"], ["monitor", "GET"], ["briefing", "GET"], ["integration-status", "POST"]]) {
      const response = responseCapture();
      await vercelHandler(endpoint, { createWorker })({ method, headers: { authorization: "Bearer unit-test-token" }, body: endpoint === "integration-status" ? {} : undefined }, response);
      assert.equal(response.statusCode, 200, endpoint);
      assert.equal(response.headers["cache-control"], "no-store");
    }
    const wrongMethod = responseCapture();
    await vercelHandler("tick", { createWorker })({ method: "GET", headers: { authorization: "Bearer unit-test-token" } }, wrongMethod);
    assert.equal(wrongMethod.statusCode, 405);
  } finally {
    if (previous === undefined) delete process.env.CJGE_WEBHOOK_TOKEN;
    else process.env.CJGE_WEBHOOK_TOKEN = previous;
  }
});
