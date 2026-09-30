import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { deliverGithubIssueReturn, renderIssueComment, validateReturnRecord } from "../lib/github-issue-return.mjs";

const commitSha = "a".repeat(40);
const completed = {
  version: 1,
  assignmentId: "ASN-COS-RETURN-1",
  requestId: "CHATGPT-GH-42",
  repository: "HRPassionGuy/career-journey-growth-engine",
  issueNumber: 42,
  status: "completed",
  summary: "The Chief of Staff completed the bounded analysis.",
  artifactPath: "deliverables/chief-of-staff/2026-09-25-codex-cloud-organizational-acceptance-test.md",
  ceoDecisionsRequired: ["Approve or reject the bounded pilot."],
  externalActionAt: null
};

test("completed return record renders durable synthesis and CEO decision links", () => {
  const record = validateReturnRecord(completed, { repository: completed.repository });
  const body = renderIssueComment(record, commitSha);
  assert.match(body, /CJGE Chief of Staff — Completed/);
  assert.match(body, /cjge-return:ASN-COS-RETURN-1:completed/);
  assert.match(body, /2026-09-25-codex-cloud-organizational-acceptance-test\.md/);
  assert.match(body, /Approve or reject the bounded pilot/);
  assert.match(body, /externalActionAt: null/);
});

test("return delivery posts once and suppresses a retry by marker", async () => {
  const requests = [];
  let postedBody;
  const fetchImpl = async (url, options) => {
    requests.push({ url: String(url), options });
    if (!options.method) {
      const comments = postedBody ? [{ id: 99, html_url: "https://github.test/comment/99", body: postedBody }] : [];
      return new Response(JSON.stringify(comments), { status: 200 });
    }
    postedBody = JSON.parse(options.body).body;
    return new Response(JSON.stringify({ id: 99, html_url: "https://github.test/comment/99" }), { status: 201 });
  };
  const options = { token: "test-token", repository: completed.repository, commitSha, fetchImpl };
  const first = await deliverGithubIssueReturn(completed, options);
  const retry = await deliverGithubIssueReturn(completed, options);
  assert.deepEqual(first, { delivered: true, duplicate: false, issueNumber: 42, commentId: 99, commentUrl: "https://github.test/comment/99" });
  assert.deepEqual(retry, { delivered: false, duplicate: true, issueNumber: 42, commentId: 99, commentUrl: "https://github.test/comment/99" });
  assert.equal(requests.filter(({ options: request }) => request.method === "POST").length, 1);
});

test("blocked return requires and renders a precise blocker", () => {
  const record = validateReturnRecord({ ...completed, status: "blocked", artifactPath: null, blocker: "CEO approval is required before outreach." });
  const body = renderIssueComment(record, commitSha);
  assert.match(body, /CJGE Chief of Staff — Blocked/);
  assert.match(body, /CEO approval is required before outreach/);
  assert.match(body, /cjge-return:ASN-COS-RETURN-1:blocked/);
});

test("return records fail closed on linkage, repository, artifact, and external action mismatches", () => {
  assert.throws(() => validateReturnRecord({ ...completed, requestId: "CHATGPT-GH-41" }), /does not match requestId/);
  assert.throws(() => validateReturnRecord(completed, { repository: "other/repository" }), /does not match workflow repository/);
  assert.throws(() => validateReturnRecord({ ...completed, artifactPath: "../secret.md" }), /Chief of Staff Markdown/);
  assert.throws(() => validateReturnRecord({ ...completed, externalActionAt: "2026-09-30T00:00:00Z" }), /externalActionAt null/);
});

test("return workflow has least privilege and cannot invoke paid Codex execution", () => {
  const workflow = fs.readFileSync(new URL("../.github/workflows/cjge-chief-of-staff-return.yml", import.meta.url), "utf8");
  assert.match(workflow, /permissions:\s*\n\s*contents: read\s*\n\s*issues: write/);
  assert.doesNotMatch(workflow, /OPENAI_API_KEY|openai\/codex-action|CJGE_API_EXECUTION_ENABLED|workflow_call/);
  assert.match(workflow, /github-issue-return\.mjs/);
});

test("CEO issue intake persists the originating issue return-channel linkage", () => {
  const workflow = fs.readFileSync(new URL("../.github/workflows/cjge-chatgpt-ceo-intake.yml", import.meta.url), "utf8");
  assert.match(workflow, /returnChannel:\{type:"github_issue",repository:\$repository,issueNumber:\$issueNumber\}/);
});
