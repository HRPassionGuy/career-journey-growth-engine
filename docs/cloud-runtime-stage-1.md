# Cloud Runtime Stage 1 Deployment

Stage 1 prepares, but does not activate, CJGE for a controlled Vercel deployment. GitHub remains the source repository and the existing **Career Journey** Supabase project holds the production state document. Vercel exposes the six filesystem-routed functions at `/api/health`, `/api/integrations`, `/api/tick`, `/api/monitor`, `/api/briefing`, and `/api/integration-status`; no rewrite may collapse those paths into one route.

## Vercel environment

Set these values in Vercel Production settings; never place their values in Git:

- `CJGE_STATE_ADAPTER` — exactly `supabase`
- `CJGE_WEBHOOK_TOKEN` — a long random bearer token shared only with authorized n8n workflows
- `SUPABASE_URL` — URL of the existing Career Journey project
- `SUPABASE_SERVICE_ROLE_KEY` — server-side service role credential

Apply `supabase/migrations/202608240001_cjge_state.sql` to the existing project before deployment. It creates one RLS-protected singleton table and one service-role-only compare-and-swap function. Import the current live state through a one-time, reviewed database update; the repository intentionally contains no live state.

n8n must use bounded schedules rather than polling: daily briefing once daily, dispatch/monitor no more frequently than the existing operational schedule, and integration health on a low-frequency schedule. Do not activate production workflows during Stage 1. All API paths require `Authorization: Bearer <CJGE_WEBHOOK_TOKEN>`, including health reads.

Economy Mode is enabled in `config/monitoring.json`. Each cloud dispatch is counted by operating date, the daily ceiling stops additional dispatch, duplicate minute ticks are idempotently suppressed, retries use the bounded exponential-backoff policy, and a blocked platform-unavailable integration opens the dispatch circuit.

The local CLI and `CJGE_STATE_FILE` remain supported for development and automated tests only. The production Vercel API does not import or read a local state file.
