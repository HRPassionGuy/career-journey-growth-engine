#!/usr/bin/env node

const [command, executive, assignmentId, argument4, argument5] = process.argv.slice(2);
const baseUrl = process.env.CJGE_BASE_URL?.replace(/\/$/, "");
const runnerToken = process.env.CJGE_RUNNER_TOKEN;

if (!baseUrl || !runnerToken) throw new Error("CJGE_BASE_URL and CJGE_RUNNER_TOKEN are required");
if (!/^https:\/\//.test(baseUrl)) throw new Error("CJGE_BASE_URL must use HTTPS");

async function lifecycle(endpoint, payload) {
  const response = await fetch(`${baseUrl}/api/${endpoint}`, {
    method: "POST",
    redirect: "error",
    headers: { authorization: `Bearer ${runnerToken}`, "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`CJGE runner lifecycle request failed (${response.status})`);
  return response.json();
}

if (command === "claim") {
  const dispatchKey = argument4;
  if (!executive || !assignmentId || !dispatchKey?.startsWith(`dispatch:${assignmentId}:`)) throw new Error("Usage: cloud-executive claim <executive> <assignment-id> <dispatch-key>");
  console.log(JSON.stringify(await lifecycle("runner-claim", { executive, assignmentId, dispatchKey }), null, 2));
} else if (command === "result") {
  const executionId = argument4;
  if (!executive || !assignmentId || !executionId || !argument5) throw new Error("Usage: cloud-executive result <executive> <assignment-id> <execution-id> '<json>'");
  const result = JSON.parse(argument5);
  const dispatchKey = result.dispatchKey;
  delete result.dispatchKey;
  if (!dispatchKey?.startsWith(`dispatch:${assignmentId}:`)) throw new Error("Result JSON requires the scoped dispatchKey");
  console.log(JSON.stringify(await lifecycle("runner-result", { executive, assignmentId, dispatchKey, executionId, result }), null, 2));
} else if (command === "evidence") {
  const dispatchKey = argument4;
  if (!executive || !assignmentId || !dispatchKey?.startsWith(`dispatch:${assignmentId}:`)) throw new Error("Usage: cloud-executive evidence <executive> <assignment-id> <dispatch-key>");
  console.log(JSON.stringify(await lifecycle("runner-evidence", { executive, assignmentId, dispatchKey }), null, 2));
} else {
  throw new Error("Usage: cloud-executive claim|result|evidence ...");
}
