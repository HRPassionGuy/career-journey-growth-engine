const API_VERSION = "2022-11-28";
const MAX_COMMENT_PAGES = 10;

function requiredText(value, name, maximum) {
  const text = String(value || "").trim();
  if (!text || text.length > maximum) throw new Error(`${name} is required and must be at most ${maximum} characters`);
  return text;
}

function safeArtifactPath(value, required) {
  const path = String(value || "").trim();
  if (!path && !required) return null;
  if (!path.startsWith("deliverables/chief-of-staff/") || path.includes("..") || !/^[\w./-]+\.md$/.test(path)) {
    throw new Error("artifactPath must be a Chief of Staff Markdown deliverable");
  }
  return path;
}

export function validateReturnRecord(record, { repository } = {}) {
  if (!record || record.version !== 1) throw new Error("Return record version must be 1");
  const assignmentId = requiredText(record.assignmentId, "assignmentId", 160);
  const status = String(record.status || "").trim();
  if (!["completed", "blocked"].includes(status)) throw new Error("Return record status must be completed or blocked");
  const issueNumber = Number(record.issueNumber);
  if (!Number.isSafeInteger(issueNumber) || issueNumber < 1) throw new Error("issueNumber must be a positive integer");
  const requestId = requiredText(record.requestId, "requestId", 160);
  if (requestId !== `CHATGPT-GH-${issueNumber}`) throw new Error("Return record issueNumber does not match requestId");
  const recordRepository = requiredText(record.repository, "repository", 200);
  if (!/^[\w.-]+\/[\w.-]+$/.test(recordRepository)) throw new Error("repository must be owner/name");
  if (repository && recordRepository !== repository) throw new Error("Return record repository does not match workflow repository");
  const summary = requiredText(record.summary, "summary", 1200);
  const artifactPath = safeArtifactPath(record.artifactPath, status === "completed");
  const blocker = status === "blocked" ? requiredText(record.blocker, "blocker", 1200) : null;
  const decisions = Array.isArray(record.ceoDecisionsRequired)
    ? record.ceoDecisionsRequired.map((item) => requiredText(item, "CEO decision", 500)).slice(0, 8)
    : [];
  if (record.externalActionAt != null) throw new Error("Return records must use externalActionAt null");
  return { version: 1, assignmentId, requestId, repository: recordRepository, issueNumber, status, summary, artifactPath, blocker, ceoDecisionsRequired: decisions, externalActionAt: null };
}

export function returnMarker(record) {
  return `<!-- cjge-return:${record.assignmentId}:${record.status} -->`;
}

export function renderIssueComment(record, commitSha) {
  const sha = requiredText(commitSha, "commitSha", 40);
  if (!/^[0-9a-f]{40}$/i.test(sha)) throw new Error("commitSha must be a full Git commit SHA");
  const marker = returnMarker(record);
  const status = record.status === "completed" ? "Completed" : "Blocked";
  const lines = [marker, `## CJGE Chief of Staff — ${status}`, "", `**Assignment:** \`${record.assignmentId}\``, `**Status:** \`${record.status}\``, "", record.summary];
  if (record.blocker) lines.push("", `**Blocker:** ${record.blocker}`);
  if (record.artifactPath) {
    const encodedPath = record.artifactPath.split("/").map(encodeURIComponent).join("/");
    lines.push("", `**Durable synthesis:** [\`${record.artifactPath}\`](https://github.com/${record.repository}/blob/${sha}/${encodedPath})`, `**Commit:** [\`${sha.slice(0, 12)}\`](https://github.com/${record.repository}/commit/${sha})`);
  } else {
    lines.push("", `**Commit:** [\`${sha.slice(0, 12)}\`](https://github.com/${record.repository}/commit/${sha})`);
  }
  lines.push("", "**CEO decisions required:**");
  if (record.ceoDecisionsRequired.length) {
    for (const decision of record.ceoDecisionsRequired) lines.push(`- ${decision}`);
  } else {
    lines.push("- None recorded.");
  }
  lines.push("", "`externalActionAt: null`", "", "_This notification was delivered by GitHub Actions without a model or OpenAI API call._");
  return lines.join("\n");
}

async function githubRequest(fetchImpl, url, token, options = {}) {
  const response = await fetchImpl(url, {
    ...options,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "x-github-api-version": API_VERSION,
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error(`GitHub issue return request failed (${response.status}): ${await response.text()}`);
  return response;
}

export async function deliverGithubIssueReturn(recordInput, { token, repository, commitSha, fetchImpl = globalThis.fetch } = {}) {
  if (!token) throw new Error("GITHUB_TOKEN is required");
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required");
  const record = validateReturnRecord(recordInput, { repository });
  const marker = returnMarker(record);
  const base = `https://api.github.com/repos/${record.repository}/issues/${record.issueNumber}/comments`;
  for (let page = 1; page <= MAX_COMMENT_PAGES; page += 1) {
    const response = await githubRequest(fetchImpl, `${base}?per_page=100&page=${page}`, token);
    const comments = await response.json();
    if (!Array.isArray(comments)) throw new Error("GitHub issue comments response is invalid");
    const existing = comments.find((comment) => String(comment?.body || "").includes(marker));
    if (existing) return { delivered: false, duplicate: true, issueNumber: record.issueNumber, commentId: existing.id, commentUrl: existing.html_url || null };
    if (comments.length < 100) break;
  }
  const body = renderIssueComment(record, commitSha);
  const response = await githubRequest(fetchImpl, base, token, { method: "POST", body: JSON.stringify({ body }) });
  const comment = await response.json();
  return { delivered: true, duplicate: false, issueNumber: record.issueNumber, commentId: comment.id, commentUrl: comment.html_url || null };
}
