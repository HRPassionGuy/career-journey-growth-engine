import { submitChiefOfStaffRequest } from "../lib/chief-of-staff-intake.mjs";

const PROOF_REQUEST_ID = "STAGE2-COS-PROOF-20260917-7c41";
const PROOF_OBJECTIVE = "Controlled Stage 2 Chief of Staff proof. Confirm receipt of this CEO request, review the Chief of Staff charter and current CJGE continuity/Stage 2 operating plan, and return a concise internal-only recommendation naming which executive roles should support the next revenue-engine diagnostic. Do not access external accounts, browse social platforms, send messages, publish content, spend money, or take any external action.";

function send(response, status, body) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(body));
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("allow", "GET");
    return send(response, 405, { error: "method_not_allowed" });
  }
  try {
    const result = await submitChiefOfStaffRequest({
      requestId: PROOF_REQUEST_ID,
      request: PROOF_OBJECTIVE,
      priority: "normal"
    });
    return send(response, 202, { proof: "stage2-chief-of-staff", ...result });
  } catch (error) {
    console.error("Stage 2 Chief of Staff proof failed", { name: error.name, message: error.message });
    return send(response, 500, { proof: "stage2-chief-of-staff", error: "proof_failed" });
  }
}
