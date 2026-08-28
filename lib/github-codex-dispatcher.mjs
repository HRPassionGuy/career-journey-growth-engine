const DEFAULT_TIMEOUT_MS = 15_000;

function required(environment, name) {
  const value = environment[name];
  if (!value) throw new Error(`${name} is required for GitHub Codex delivery`);
  return value;
}

export function createGithubCodexDispatcher({ environment = process.env, fetchImpl = globalThis.fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const repository = required(environment, "CJGE_GITHUB_REPOSITORY");
  const token = required(environment, "CJGE_GITHUB_DISPATCH_TOKEN");
  const workflow = environment.CJGE_GITHUB_WORKFLOW || "cjge-executive-dispatch.yml";
  const ref = environment.CJGE_GITHUB_REF || "cloud-migration";
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error("CJGE_GITHUB_REPOSITORY must be owner/repository");
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required for GitHub delivery");

  return async function dispatch(record) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(`https://api.github.com/repos/${repository}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`, {
        method: "POST",
        redirect: "error",
        signal: controller.signal,
        headers: {
          accept: "application/vnd.github+json",
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          "x-github-api-version": "2022-11-28"
        },
        body: JSON.stringify({ ref, inputs: {
          deployment_ref: ref,
          assignment_id: record.assignmentId,
          executive: record.executive,
          entry_point: record.entryPoint,
          dispatch_key: record.idempotencyKey,
          dispatched_at: record.dispatchedAt
        } })
      });
      if (response.status !== 204) throw new Error(`GitHub workflow dispatch rejected with HTTP ${response.status}`);
      return { accepted: true, deliveryId: record.idempotencyKey, status: "submitted_to_github" };
    } finally {
      clearTimeout(timeout);
    }
  };
}
