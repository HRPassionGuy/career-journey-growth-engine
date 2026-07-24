# n8n Runtime Workflows

These exported workflows call the Career Journey Growth Engine worker endpoint. Import the JSON files into the existing n8n instance and configure:

- n8n variable `CJGE_BASE_URL`: an HTTPS URL that can reach `bin/worker-server`
- n8n variable `CJGE_WEBHOOK_TOKEN`: the same bearer token used by the worker server

Credentials and tokens are never stored in these exports.

## Workflows

- `cjge-dispatch-monitor.json`: polls every minute, creates proactive assignments, dispatches due work, recovers stalled executions, and returns current queue state.
- `cjge-daily-chief-of-staff-briefing.json`: collects the verified daily briefing at 6:45 AM America/Detroit.
- `cjge-integration-health.json`: checks the worker and retrieves the visible integration-status matrix every 15 minutes.

The workflows are designed to be idempotent. The repository runtime owns assignment deduplication, temporal evidence, retries, and shared-state locking.
