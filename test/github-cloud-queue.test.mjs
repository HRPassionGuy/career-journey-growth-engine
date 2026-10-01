import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { queueGithubCloudIssue, renderCloudQueueComment } from "../lib/github-cloud-queue.mjs";
import { deliverGithubIssueReturn } from "../lib/github-issue-return.mjs";

const repository = "HRPassionGuy/career-journey-growth-engine";

function githubMock() {
  const comments = [];
  let nextId = 1;
  const fetchImpl = async (url, options) => {
    const value = String(url);
    if (value.endsWith("/issues/42")) return new Response(JSON.stringify({ number: 42, title: "[CJGE CEO] Harmless internal test", user: { login: "HRPassionGuy" } }), { status: 200 });
    if (value.includes("/issues/42/comments?") && !options.method) return new Response(JSON.stringify(comments), { status: 200 });
    if (value.endsWith("/issues/42/comments") && options.method === "POST") {
      const comment = { id: nextId++, html_url: `https://github.test/comments/${nextId}`, body: JSON.parse(options.body).body };
      comments.push(comment);
      return new Response(JSON.stringify(comment), { status: 201 });
    }
    return new Response("not found", { status: 404 });
  };
  return { comments, fetchImpl };
}

test("CEO issue is durably queued once without claiming Cloud execution", async () => {
  const mock = githubMock();
  const options = { token: "test-token", repository, issueNumber: 42, fetchImpl: mock.fetchImpl };
  const first = await queueGithubCloudIssue(options);
  const retry = await queueGithubCloudIssue(options);
  assert.equal(first.queued, true);
  assert.equal(first.requestId, "CHATGPT-GH-42");
  assert.equal(retry.duplicate, true);
  assert.equal(mock.comments.length, 1);
  assert.match(mock.comments[0].body, /queued_for_codex_cloud/);
  assert.match(mock.comments[0].body, /Human hinge/);
  assert.doesNotMatch(mock.comments[0].body, /in_progress|delivered to Codex/);
});

test("non-CEO issue fails closed", async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ number: 42, title: "Ordinary issue", user: { login: "someone-else" } }), { status: 200 });
  await assert.rejects(() => queueGithubCloudIssue({ token: "test-token", repository, issueNumber: 42, fetchImpl }), /Only CEO-authored/);
});

test("queue comment states the exact automation boundary", () => {
  const body = renderCloudQueueComment({ issueNumber: 42 });
  assert.match(body, /cannot awaken a signed-in Codex Cloud task/);
  assert.match(body, /No OpenAI API or paid Codex Action was invoked/);
});

test("blocked loop persists one blocker notification and permits one later completion", async () => {
  const mock = githubMock();
  await queueGithubCloudIssue({ token: "test-token", repository, issueNumber: 42, fetchImpl: mock.fetchImpl });
  const base = {
    version: 1, assignmentId: "ASN-COS-BLOCKED-42", requestId: "CHATGPT-GH-42", repository, issueNumber: 42,
    summary: "Internal analysis stopped at an approval boundary.", ceoDecisionsRequired: ["Approve or reject the bounded next step."], externalActionAt: null
  };
  const options = { token: "test-token", repository, commitSha: "a".repeat(40), fetchImpl: mock.fetchImpl };
  const blocked = { ...base, status: "blocked", blocker: "CEO authorization is required before the external action." };
  assert.equal((await deliverGithubIssueReturn(blocked, options)).delivered, true);
  assert.equal((await deliverGithubIssueReturn(blocked, options)).duplicate, true);
  const completed = { ...base, status: "completed", artifactPath: "deliverables/chief-of-staff/synthesis.md", summary: "Internal synthesis completed after authorization was recorded." };
  assert.equal((await deliverGithubIssueReturn(completed, options)).delivered, true);
  assert.equal((await deliverGithubIssueReturn(completed, options)).duplicate, true);
  assert.equal(mock.comments.filter(({ body }) => /cjge-return:ASN-COS-BLOCKED-42:blocked/.test(body)).length, 1);
  assert.equal(mock.comments.filter(({ body }) => /cjge-return:ASN-COS-BLOCKED-42:completed/.test(body)).length, 1);
});

test("Cloud queue workflow is non-model and legacy kill switches remain closed", () => {
  const queueWorkflow = fs.readFileSync(new URL("../.github/workflows/cjge-chatgpt-ceo-intake.yml", import.meta.url), "utf8");
  const paidWorkflow = fs.readFileSync(new URL("../.github/workflows/cjge-executive-dispatch.yml", import.meta.url), "utf8");
  const monitoring = JSON.parse(fs.readFileSync(new URL("../config/monitoring.json", import.meta.url), "utf8"));
  assert.match(queueWorkflow, /github-cloud-queue\.mjs/);
  assert.doesNotMatch(queueWorkflow, /CJGE_BASE_URL|CJGE_WEBHOOK_TOKEN|OPENAI_API_KEY|openai\/codex-action|\/api\/chief-of-staff/);
  assert.match(paidWorkflow, /if: \$\{\{ vars\.CJGE_API_EXECUTION_ENABLED == 'true' \}\}/);
  assert.equal(monitoring.costControls.dailyExecutionMaximum, 0);
});
