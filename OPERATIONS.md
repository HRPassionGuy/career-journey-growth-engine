# Operating the Career Journey Growth Engine

This repository now contains an executable control plane for the AI executive team. It does not replace Codex’s signed-in browser or connected applications; it tells the existing Codex automations which executive owns each activity, what evidence is required, and where shared operating state is recorded.

Use the repository command:

```text
./bin/cjge init
./bin/cjge daily
./bin/cjge packet chief-of-staff
./bin/cjge packet vp-revenue
./bin/cjge briefing
```

During an automation run:

1. Run `daily` once to create today’s work.
2. The Chief of Staff reads the briefing and routes the work.
3. Each executive reads its packet, runtime, charter, and applicable procedure.
4. The executive performs the work with the connected browser or application.
5. Record only verified results with `update <work-id> completed <evidence>`.
6. Use `retry` for recoverable failures and `blocked` only for a precise login, approval, or user-only action.
7. Record business measures with `metric <name> <value>`.
8. Record external execution evidence with `record '<json>'`. Use `completed` only when `externalActionAt` occurred during the current run. Use `verified_prior_work` when the run only verifies something completed earlier.
9. Run `briefing` at close.

The operational capability source is [config/capabilities.json](config/capabilities.json). It assigns the work previously concentrated in Drive Stan Store Sales and Drive Organic Product Sales across the eight executives without removing any of the working channels, tools, or cadences.

Independent executive execution:

```text
./bin/cjge delegate <capability-id> '<assignment-json>'
./bin/executive <executive-slug> <assignment-id>
./bin/cjge handoff <parent-assignment-id> <from> <to> <capability-id> <request>
./bin/cjge result <assignment-id> <execution-id> '<result-json>'
./bin/cjge monitor
./bin/cjge consolidate <assignment-id> [child-assignment-id...]
```

`config/runtime-instances.json` maps each executive to its independently invocable Codex task. Assignment, execution, handoff, and result records are durable and concurrency-safe in `state/operating-state.json`.

## Continuous operations

The local dispatcher and secured worker endpoint are:

```text
./bin/daemon --once
./bin/daemon
CJGE_WEBHOOK_TOKEN=... ./bin/worker-server
```

The dispatcher creates authority-bounded proactive assignments, dispatches due work, records dispatch evidence, and recovers stale executions with bounded exponential backoff. Executives must update heartbeats while long-running work is active:

```text
./bin/cjge heartbeat <executive> <execution-id> <assignment-id> running
```

Integration preflight results are visible through:

```text
./bin/cjge integration list
./bin/cjge integration set "LinkedIn" blocked "Session expired; sign in required"
```

Blocked integrations are classified precisely. Authentication, expired sessions, captchas, permissions, and approvals require human intervention; outages, rate limits, and transient network failures use retry/backoff when safe. Verification of a prior action never triggers a duplicate fallback action.

Versioned n8n workflows live in `n8n/`. They require `CJGE_BASE_URL` and `CJGE_WEBHOOK_TOKEN` in the n8n environment and contain no credentials.
