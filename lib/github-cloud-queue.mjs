const API_VERSION = "2022-11-28";
const MAX_COMMENT_PAGES = 10;

function validateRepository(value) {
  const repository = String(value || "").trim();
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error("repository must be owner/name");
  return repository;
}

function validateIssueNumber(value) {
  const issueNumber = Number(value);
  if (!Number.isSafeInteger(issueNumber) || issueNumber < 1) throw new Error("issueNumber must be a positive integer");
  return issueNumber;
}

async function request(fetchImpl, url, token, options = {}) {
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
  if (!response.ok) throw new Error(`GitHub Cloud queue request failed (${response.status}): ${await response.text()}`);
  return response;
}

export function cloudQueueMarker(issueNumber) {
  return `<!-- cjge-cloud-queue:CHATGPT-GH-${validateIssueNumber(issueNumber)} -->`;
}

export function renderCloudQueueComment({ issueNumber }) {
  const number = validateIssueNumber(issueNumber);
  return [
    cloudQueueMarker(number),
    "## CJGE Chief of Staff — Queued for Codex Cloud",
    "",
    `**Request:** \`CHATGPT-GH-${number}\``,
    "**Status:** `queued_for_codex_cloud`",
    "",
    "The CEO request is durably queued in this issue. No OpenAI API or paid Codex Action was invoked.",
    "",
    "**Human hinge:** GitHub can preserve and signal this work, but it cannot awaken a signed-in Codex Cloud task in the currently proven environment. Marcus must start or reopen the Chief-of-Staff Cloud task and provide this issue number. Once active, the task can continue through governed analysis, persistence, and the existing completion/blocker return channel without another `continue` prompt.",
    "",
    "If execution becomes blocked, the Chief of Staff must commit a `blocked` return record so the independent issue notification is delivered exactly once."
  ].join("\n");
}

export async function queueGithubCloudIssue({ token, repository, issueNumber, expectedAuthor = "HRPassionGuy", fetchImpl = globalThis.fetch } = {}) {
  if (!token) throw new Error("GITHUB_TOKEN is required");
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required");
  const repo = validateRepository(repository);
  const number = validateIssueNumber(issueNumber);
  const issueUrl = `https://api.github.com/repos/${repo}/issues/${number}`;
  const issueResponse = await request(fetchImpl, issueUrl, token);
  const issue = await issueResponse.json();
  if (issue.pull_request || issue.user?.login !== expectedAuthor || !String(issue.title || "").startsWith("[CJGE CEO]")) {
    throw new Error("Only CEO-authored [CJGE CEO] issues can enter the Cloud queue");
  }
  const marker = cloudQueueMarker(number);
  const commentsUrl = `${issueUrl}/comments`;
  for (let page = 1; page <= MAX_COMMENT_PAGES; page += 1) {
    const response = await request(fetchImpl, `${commentsUrl}?per_page=100&page=${page}`, token);
    const comments = await response.json();
    if (!Array.isArray(comments)) throw new Error("GitHub issue comments response is invalid");
    const existing = comments.find((comment) => String(comment?.body || "").includes(marker));
    if (existing) return { queued: false, duplicate: true, issueNumber: number, requestId: `CHATGPT-GH-${number}`, commentId: existing.id, commentUrl: existing.html_url || null };
    if (comments.length < 100) break;
  }
  const body = renderCloudQueueComment({ issueNumber: number });
  const response = await request(fetchImpl, commentsUrl, token, { method: "POST", body: JSON.stringify({ body }) });
  const comment = await response.json();
  return { queued: true, duplicate: false, issueNumber: number, requestId: `CHATGPT-GH-${number}`, commentId: comment.id, commentUrl: comment.html_url || null };
}
