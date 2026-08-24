import { createCloudWorker } from "../lib/cloud-worker.mjs";

function send(response, status, body) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(body));
}

async function body(request) {
  if (request.body && typeof request.body === "object") return request.body;
  let value = "";
  for await (const chunk of request) value += chunk;
  return value ? JSON.parse(value) : {};
}

export default async function handler(request, response) {
  const token = process.env.CJGE_WEBHOOK_TOKEN;
  if (!token) return send(response, 503, { error: "worker_not_configured" });
  if (request.headers.authorization !== `Bearer ${token}`) return send(response, 401, { error: "unauthorized" });
  const pathname = new URL(request.url, "https://cjge.invalid").pathname.replace(/^\/api/, "") || "/";
  try {
    const worker = createCloudWorker();
    if (request.method === "GET" && pathname === "/health") {
      const state = await worker.store.readState();
      return send(response, 200, { ok: true, time: new Date().toISOString(), stateVersion: state.version, adapter: "supabase" });
    }
    if (request.method === "GET" && pathname === "/integrations") return send(response, 200, { integrations: await worker.integrations() });
    if (request.method === "POST" && pathname === "/tick") return send(response, 200, await worker.tick());
    if (request.method === "GET" && pathname === "/monitor") return send(response, 200, await worker.monitor());
    if (request.method === "GET" && pathname === "/briefing") return send(response, 200, { briefing: await worker.briefing() });
    if (request.method === "POST" && pathname === "/integration-status") return send(response, 200, await worker.recordIntegrationStatus(await body(request)));
    return send(response, 404, { error: "not_found" });
  } catch (error) {
    console.error("CJGE API failure", { name: error.name, message: error.message });
    return send(response, 500, { error: "internal_error" });
  }
}
