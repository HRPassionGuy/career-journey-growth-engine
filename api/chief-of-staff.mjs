import { timingSafeEqual } from "node:crypto";
import { submitChiefOfStaffRequest } from "../lib/chief-of-staff-intake.mjs";

const MAX_BODY_BYTES = 16 * 1024;

function send(response, status, body) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(body));
}

function authorized(request) {
  const token = process.env.CJGE_WEBHOOK_TOKEN;
  if (!token) return false;
  const supplied = Buffer.from(String(request.headers.authorization || ""));
  const expected = Buffer.from(`Bearer ${token}`);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
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

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("allow", "POST");
    return send(response, 405, { error: "method_not_allowed" });
  }
  if (!process.env.CJGE_WEBHOOK_TOKEN) return send(response, 503, { error: "worker_not_configured" });
  if (!authorized(request)) return send(response, 401, { error: "unauthorized" });
  try {
    const result = await submitChiefOfStaffRequest(await readBody(request));
    return send(response, 202, result);
  } catch (error) {
    const badRequest = error instanceof SyntaxError || error.message === "request_too_large" || /^Chief of Staff request/.test(error.message);
    if (!badRequest) console.error("CJGE Chief of Staff intake failure", { name: error.name, message: error.message });
    return send(response, badRequest ? 400 : 500, { error: badRequest ? error.message : "internal_error" });
  }
}
