import { timingSafeEqual } from "node:crypto";
import { createCloudWorker } from "./cloud-worker.mjs";

const MAX_BODY_BYTES = 64 * 1024;

function send(response, status, body) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(body));
}

function authorized(request, token) {
  const supplied = String(request.headers.authorization || "");
  const expected = `Bearer ${token}`;
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  return suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
}

async function readBody(request) {
  if (request.body && typeof request.body === "object") return request.body;
  let value = "";
  for await (const chunk of request) {
    value += chunk;
    if (Buffer.byteLength(value) > MAX_BODY_BYTES) throw new Error("request_too_large");
  }
  return value ? JSON.parse(value) : {};
}

export function vercelHandler(endpoint, { createWorker = createCloudWorker } = {}) {
  return async function handler(request, response) {
    const runnerEndpoint = ["runner-claim", "runner-result", "runner-evidence"].includes(endpoint);
    const token = runnerEndpoint ? process.env.CJGE_RUNNER_TOKEN : endpoint === "dispatch-status" ? process.env.CJGE_DISPATCH_CALLBACK_TOKEN : process.env.CJGE_WEBHOOK_TOKEN;
    if (!token) return send(response, 503, { error: "worker_not_configured" });
    if (!authorized(request, token)) return send(response, 401, { error: "unauthorized" });
    try {
      const worker = createWorker();
      if (endpoint === "health" && request.method === "GET") {
        const state = await worker.store.readState();
        return send(response, 200, { ok: true, time: new Date().toISOString(), stateVersion: state.version, adapter: "supabase" });
      }
      if (endpoint === "integrations" && request.method === "GET") return send(response, 200, { integrations: await worker.integrations() });
      if (endpoint === "tick" && request.method === "POST") return send(response, 200, await worker.tick());
      if (endpoint === "monitor" && request.method === "GET") return send(response, 200, await worker.monitor());
      if (endpoint === "briefing" && request.method === "GET") return send(response, 200, { briefing: await worker.briefing() });
      if (endpoint === "integration-status" && request.method === "POST") return send(response, 200, await worker.recordIntegrationStatus(await readBody(request)));
      if (endpoint === "dispatch-status" && request.method === "POST") return send(response, 200, await worker.recordDispatchStatus(await readBody(request)));
      if (endpoint === "runner-claim" && request.method === "POST") return send(response, 200, await worker.claimRunnerAssignment(await readBody(request)));
      if (endpoint === "runner-result" && request.method === "POST") return send(response, 200, await worker.recordRunnerResult(await readBody(request)));
      if (endpoint === "runner-evidence" && request.method === "POST") return send(response, 200, await worker.runnerEvidence(await readBody(request)));
      response.setHeader("allow", ["tick", "integration-status", "dispatch-status", "runner-claim", "runner-result", "runner-evidence"].includes(endpoint) ? "POST" : "GET");
      return send(response, 405, { error: "method_not_allowed" });
    } catch (error) {
      const badRequest = error instanceof SyntaxError || /^(Valid |Unknown |Runner |Assignment |Terminal result)/.test(error.message) || error.message === "request_too_large";
      if (!badRequest) console.error("CJGE API failure", { name: error.name, message: error.message });
      return send(response, badRequest ? 400 : 500, { error: badRequest ? error.message : "internal_error" });
    }
  };
}
