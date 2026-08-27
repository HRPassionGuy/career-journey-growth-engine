# Cloud Runtime Stage 1 Deployment

Stage 1 prepares, but does not activate, CJGE for a controlled Vercel deployment. GitHub remains the source repository and the existing **Career Journey** Supabase project holds the production state document. Vercel exposes filesystem-routed functions at `/api/health`, `/api/integrations`, `/api/tick`, `/api/monitor`, `/api/briefing`, `/api/integration-status`, and `/api/dispatch-status`; no rewrite may collapse those paths into one route.

## Vercel environment

Set these values in Vercel Production settings; never place their values in Git:

- `CJGE_STATE_ADAPTER` — exactly `supabase`
- `CJGE_WEBHOOK_TOKEN` — a long random bearer token shared only with authorized n8n workflows
- `SUPABASE_URL` — URL of the existing Career Journey project
- `SUPABASE_SERVICE_ROLE_KEY` — server-side service role credential
- `CJGE_GITHUB_REPOSITORY` — `owner/repository` for this authoritative repository
- `CJGE_GITHUB_DISPATCH_TOKEN` — fine-grained GitHub token permitted to dispatch the CJGE workflow
- `CJGE_GITHUB_WORKFLOW` — `cjge-executive-dispatch.yml`
- `CJGE_GITHUB_REF` — the protected deployment branch, normally `main`

Set these GitHub Actions repository secrets:

- `CODEX_ACCESS_TOKEN` — noninteractive Codex authentication accepted by `codex login --with-access-token`
- `CODEX_CLOUD_ENVIRONMENT_ID` — the existing Codex Cloud environment connected to this repository
- `CJGE_BASE_URL` — deployed Vercel origin, without a trailing slash
- `CJGE_WEBHOOK_TOKEN` — the same webhook token configured in Vercel

Configure the existing Codex Cloud environment with `CJGE_STATE_ADAPTER=supabase`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`. These are required by `bin/cloud-executive.mjs` so the task claims and completes the durable Supabase assignment rather than creating local state inside its checkout.

Apply `supabase/migrations/202608240001_cjge_state.sql` to the existing project before deployment. It creates one RLS-protected singleton table and one service-role-only compare-and-swap function. Import the current live state through a one-time, reviewed database update; the repository intentionally contains no live state.

n8n must use bounded schedules rather than polling: daily briefing once daily, dispatch/monitor no more frequently than the existing operational schedule, and integration health on a low-frequency schedule. Do not activate production workflows during Stage 1. All API paths require `Authorization: Bearer <CJGE_WEBHOOK_TOKEN>`, including health reads.

## Supported Codex execution path

CJGE does not assume that a Codex conversation `threadId` is remotely callable and does not require an invented Codex webhook. After reserving a dispatch atomically, Vercel uses GitHub's supported workflow-dispatch API to start `.github/workflows/cjge-executive-dispatch.yml`. That bounded runner installs the official Codex CLI, authenticates noninteractively, and invokes `codex cloud exec --env <ENV_ID> --attempts 1` to create a real Codex Cloud task. See the official [Codex CLI reference](https://developers.openai.com/codex/cli/reference/) and [GitHub workflow dispatch REST API](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event).

GitHub accepting the workflow changes assignment delivery to `submitted`, not `delivered`. Only the authenticated `/api/dispatch-status` callback after `codex cloud exec` succeeds records `delivered_to_codex_cloud`; CLI rejection records a durable failure. This preserves the assignment and executive packet as continuity while replacing the uncallable conversational-thread routing with a Codex Cloud environment and task.

Economy Mode is enabled in `config/monitoring.json`. Each cloud dispatch is counted by operating date, the daily ceiling stops additional dispatch, duplicate minute ticks are idempotently suppressed, retries use the bounded exponential-backoff policy, and a blocked platform-unavailable integration opens the dispatch circuit.

The local CLI and `CJGE_STATE_FILE` remain supported for development and automated tests only. The production Vercel API does not import or read a local state file.
