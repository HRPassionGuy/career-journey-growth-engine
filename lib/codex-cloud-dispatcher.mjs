const DEFAULT_TIMEOUT_MS = 15_000;

function required(environment, name) {
  const value = environment[name];
  if (!value) throw new Error(`${name} is required for Codex Cloud delivery`);
  return value;
}

export function createCodexCloudDispatcher({ environment = process.env, fetchImpl = globalThis.fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const endpoint = required(environment, "CODEX_CLOUD_DISPATCH_URL");
  const token = required(environment, "CODEX_CLOUD_DISPATCH_TOKEN");
  const endpointUrl = new URL(endpoint);
  if (endpointUrl.protocol !== "https:") throw new Error("CODEX_CLOUD_DISPATCH_URL must use HTTPS");
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required for Codex Cloud delivery");

  return async function dispatch(record) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(endpointUrl, {
        method: "POST",
        redirect: "error",
        signal: controller.signal,
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          "idempotency-key": record.idempotencyKey
        },
        body: JSON.stringify({
          type: "cjge.executive.assignment",
          assignmentId: record.assignmentId,
          executive: record.executive,
          threadId: record.runtimeThreadId,
          entryPoint: record.entryPoint,
          prompt: `Claim CJGE assignment ${record.assignmentId} with ${record.entryPoint}. Read the executive packet before execution and persist the result.`
        })
      });
      if (!response.ok) throw new Error(`Codex Cloud delivery rejected with HTTP ${response.status}`);
      const payload = await response.json().catch(() => ({}));
      if (payload.accepted === false) throw new Error("Codex Cloud delivery was not accepted");
      return { accepted: true, deliveryId: payload.deliveryId || payload.id || null };
    } finally {
      clearTimeout(timeout);
    }
  };
}
