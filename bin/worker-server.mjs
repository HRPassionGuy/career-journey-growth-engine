#!/usr/bin/env node
import http from "node:http";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { integrationReport, recordIntegrationStatus } from "../lib/runtime-ops.mjs";
import { readState, root } from "../lib/state-store.mjs";

const token = process.env.CJGE_WEBHOOK_TOKEN;
if (!token) throw new Error("CJGE_WEBHOOK_TOKEN is required");
const port = Number(process.env.CJGE_PORT || 8787);
const cli = path.join(root, "bin", "cjge.mjs");
const daemon = path.join(root, "bin", "daemon.mjs");

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

function run(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout.trim();
}

const server = http.createServer(async (request, response) => {
  if (request.headers.authorization !== `Bearer ${token}`) return json(response, 401, { error: "unauthorized" });
  try {
    if (request.method === "GET" && request.url === "/health") {
      return json(response, 200, { ok: true, time: new Date().toISOString(), stateVersion: readState().version });
    }
    if (request.method === "GET" && request.url === "/integrations") {
      return json(response, 200, { integrations: integrationReport() });
    }
    if (request.method === "POST" && request.url === "/tick") {
      return json(response, 200, JSON.parse(run(daemon, ["--once"])));
    }
    if (request.method === "GET" && request.url === "/monitor") {
      return json(response, 200, JSON.parse(run(cli, ["monitor"])));
    }
    if (request.method === "GET" && request.url === "/briefing") {
      return json(response, 200, { briefing: run(cli, ["briefing"]) });
    }
    if (request.method === "POST" && request.url === "/integration-status") {
      let body = "";
      for await (const chunk of request) body += chunk;
      const payload = JSON.parse(body);
      recordIntegrationStatus(payload.name, payload.status, payload);
      return json(response, 200, { recorded: true });
    }
    return json(response, 404, { error: "not_found" });
  } catch (error) {
    return json(response, 500, { error: error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(JSON.stringify({ listening: true, host: "127.0.0.1", port }));
});
