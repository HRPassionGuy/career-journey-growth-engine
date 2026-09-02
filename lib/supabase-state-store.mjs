import { normalizeState } from "./state-store.mjs";

const DEFAULT_RETRIES = 4;

function configuration(environment = process.env) {
  const url = environment.SUPABASE_URL?.replace(/\/$/, "");
  const key = environment.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  return { url, key };
}

function headers(key) {
  return { apikey: key, "content-type": "application/json" };
}

async function request(fetchImpl, endpoint, options) {
  const response = await fetchImpl(endpoint, options);
  if (!response.ok) throw new Error(`Supabase state request failed (${response.status}): ${await response.text()}`);
  const body = await response.text();
  return body ? JSON.parse(body) : null;
}

export function createSupabaseStateStore({ environment = process.env, fetchImpl = globalThis.fetch, maxRetries = DEFAULT_RETRIES } = {}) {
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required");
  const { url, key } = configuration(environment);
  const endpoint = `${url}/rest/v1/rpc/cjge_state_snapshot`;

  async function snapshot() {
    const value = await request(fetchImpl, endpoint, {
      method: "POST", headers: headers(key), body: JSON.stringify({ p_operation: "read" })
    });
    return { revision: Number(value.revision), state: normalizeState(value.state) };
  }

  async function mutate(mutator, { idempotencyKey = null } = {}) {
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const current = await snapshot();
      if (idempotencyKey && current.state.idempotencyKeys[idempotencyKey]) {
        return { duplicate: true, previous: current.state.idempotencyKeys[idempotencyKey] };
      }
      const draft = structuredClone(current.state);
      const value = await mutator(draft);
      if (idempotencyKey) draft.idempotencyKeys[idempotencyKey] = { recordedAt: new Date().toISOString(), value };
      const result = await request(fetchImpl, endpoint, {
        method: "POST",
        headers: headers(key),
        body: JSON.stringify({
          p_operation: "compare_and_swap",
          p_expected_revision: current.revision,
          p_state: normalizeState(draft)
        })
      });
      if (result.updated) return idempotencyKey ? { duplicate: false, value } : value;
      if (attempt === maxRetries) throw new Error("Supabase state mutation exceeded concurrency retry limit");
      await new Promise((resolve) => setTimeout(resolve, Math.min(250, 10 * (2 ** attempt))));
    }
  }

  return { readState: async () => (await snapshot()).state, mutateState: mutate };
}

export function productionStateStore(options = {}) {
  const environment = options.environment || process.env;
  if (environment.CJGE_STATE_ADAPTER !== "supabase") {
    throw new Error("Production requires CJGE_STATE_ADAPTER=supabase");
  }
  return createSupabaseStateStore({ ...options, environment });
}
