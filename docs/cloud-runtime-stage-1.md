# Cloud Runtime Stage 1 Deployment

Stage 1 prepares, but does not activate, CJGE for a controlled Vercel deployment. GitHub remains the source repository and the existing **Career Journey** Supabase project holds the production state document. Vercel exposes filesystem-routed functions at `/api/health`, `/api/integrations`, `/api/tick`, `/api/monitor`, `/api/briefing`, `/api/integration-status`, and `/api/dispatch-status`; no rewrite may collapse those paths into one route.

## Vercel environment

Set these values in Vercel Production settings; never place their values in Git:

- `CJGE_STATE_ADAPTER` — exactly `supabase`
- `CJGE_WEBHOOK_TOKEN` — a long random bearer token shared only with authorized n8n workflows
- `CJGE_DISPATCH_CALLBACK_TOKEN` — a separate long random token accepted only by `/api/dispatch-status`
- `SUPABASE_URL` — URL of the existing Career Journey project
- `SUPABASE_SERVICE_ROLE_KEY` — server-side service role credential
- `CJGE_GITHUB_REPOSITORY` — `owner/repository` for this authoritative repository
- `CJGE_GITHUB_DISPATCH_TOKEN` — fine-grained GitHub token permitted to dispatch the CJGE workflow
- `CJGE_GITHUB_WORKFLOW` — `cjge-executive-dispatch.yml`
- `CJGE_GITHUB_REF` — the authoritative deployment branch; Stage 1 defaults to `cloud-migration`

Set these GitHub Actions repository secrets:

- `OPENAI_API_KEY` — server-side OpenAI API key consumed only by `openai/codex-action@v1`
- `CJGE_BASE_URL` — deployed Vercel origin, without a trailing slash
- `CJGE_DISPATCH_CALLBACK_TOKEN` — the same dedicated callback token configured in Vercel
- `SUPABASE_URL` — URL of the existing Career Journey project
- `SUPABASE_SERVICE_ROLE_KEY` — server-side service credential used by the action to claim and complete assignments

The checked-out ref is supplied by the authenticated Vercel workflow dispatch and defaults to `cloud-migration` in code. Protect that branch and require reviewed changes before it is used for deployment.

Apply `supabase/migrations/202608240001_cjge_state.sql` to the existing project before deployment. It creates one RLS-protected singleton table and one service-role-only compare-and-swap function. Import the current live state through a one-time, reviewed database update; the repository intentionally contains no live state.

n8n must use bounded schedules rather than polling: daily briefing once daily, dispatch/monitor no more frequently than the existing operational schedule, and integration health on a low-frequency schedule. Do not activate production workflows during Stage 1. All API paths require `Authorization: Bearer <CJGE_WEBHOOK_TOKEN>`, including health reads.

## Supported Codex execution path

CJGE does not assume that a Codex conversation `threadId` is remotely callable and does not require an invented Codex webhook. After reserving a dispatch atomically, Vercel uses GitHub's supported workflow-dispatch API to start `.github/workflows/cjge-executive-dispatch.yml` on the explicit deployment ref. The workflow checks out that authoritative branch and invokes the documented `openai/codex-action@v1` with `OPENAI_API_KEY`. The action prompt identifies the assignment and executive, requires the existing governance packet, claims Supabase state, performs the work, and persists the terminal result. See the official [Codex GitHub Action](https://github.com/openai/codex-action) and [GitHub workflow dispatch REST API](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event).

GitHub accepting the workflow changes assignment delivery to `submitted`, not `delivered`. Only the authenticated terminal callback after the Codex Action finishes records `codex_action_completed` or `codex_action_failed`, including the durable result evidence read back from Supabase. This preserves assignment and executive continuity without a task or thread identifier.

The callback uses `CJGE_DISPATCH_CALLBACK_TOKEN`, which is intentionally different from the n8n operational webhook token. Each cloud claim is idempotent by dispatch key rather than assignment ID alone, so a duplicate delivery cannot create a second execution while a bounded retry attempt can still claim the same assignment after a genuine stall.

Economy Mode is enabled in `config/monitoring.json`. Each cloud dispatch is counted by operating date, the daily ceiling stops additional dispatch, duplicate minute ticks are idempotently suppressed, retries use the bounded exponential-backoff policy, and a blocked platform-unavailable integration opens the dispatch circuit.

The local CLI and `CJGE_STATE_FILE` remain supported for development and automated tests only. The production Vercel API does not import or read a local state file.
