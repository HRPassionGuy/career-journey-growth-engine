import test from "node:test";
import assert from "node:assert/strict";
import { createSupabaseStateStore } from "../lib/supabase-state-store.mjs";
import { createCloudWorker } from "../lib/cloud-worker.mjs";
import { vercelHandler } from "../lib/vercel-api.mjs";

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
