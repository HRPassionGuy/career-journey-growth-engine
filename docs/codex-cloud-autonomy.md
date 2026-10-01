# Codex Cloud Autonomy Boundary

**Verified:** 2026-09-30
**Migration status:** controlled, not operationally complete

## Capability classification

| Capability | Classification | Evidence and boundary |
|---|---|---|
| Active-task continuation | **PROVEN** | A running Codex Cloud task can plan, use bounded subagents, synthesize, edit, test, commit, and return a final result without repeated `continue` prompts. This does not prove survival after the task stops. |
| Interrupted-task resumption | **AVAILABLE BUT UNPROVEN** | GitHub issues, commits, artifacts, request IDs, and return records preserve enough context for a new task to resume. Automatic restoration of the same Cloud task is not exposed or proven. |
| Scheduled reasoning work | **NOT AVAILABLE / EXTERNAL DEPENDENCY** | GitHub Actions can run a clock and create or inspect durable queue state without a model. No supported mechanism available to this repository can awaken a signed-in Codex Cloud reasoning task on that schedule. The paid API path remains disabled. |
| Event-triggered reasoning work | **NOT AVAILABLE / EXTERNAL DEPENDENCY** | A `[CJGE CEO]` issue can trigger durable queueing and notification, but the GitHub event cannot start Codex Cloud reasoning in the proven environment. |
| Blocker escalation | **PROVEN** | A Cloud task can commit a `blocked` return record. The return workflow posts one marker-deduplicated issue comment using GitHub Actions and `GITHUB_TOKEN`, with no model call. |
| Cross-task continuity | **AVAILABLE BUT UNPROVEN** | The issue/request ID, repository artifacts, Git history, and return records form a durable handoff package. A live handoff between two independently started Cloud tasks has not been proven here. |

The current Codex tool surface provides in-task planning/continuation and bounded
delegation. It does not expose a callable wall-clock scheduler or a GitHub webhook
that starts or resumes this signed-in Cloud task. Official manual retrieval was
attempted during Phase 4 but was unavailable because the environment could not
resolve `developers.openai.com`; no undocumented capability is assumed.

## Maximum safe autonomous loop

```text
CEO opens [CJGE CEO] issue
  -> GitHub Action validates the issue
  -> one idempotent queue comment persists CHATGPT-GH-<issue>
  -> HUMAN HINGE: Marcus starts or reopens the Chief-of-Staff Codex Cloud task
  -> active Cloud task reads the issue/repository and continues without nudging
  -> task commits the final synthesis and completed/blocked return record
  -> push to cloud-migration runs the non-model return workflow
  -> originating issue receives exactly one status-specific comment
  -> normal GitHub notifications reach Marcus
```

GitHub performs durable queueing, clock/event triggers, and notification only. It
does not perform reasoning and does not dispatch the legacy paid Codex workflow.

## Queue and claim protocol

1. The CEO opens an issue titled `[CJGE CEO] ...`.
2. `.github/workflows/cjge-chatgpt-ceo-intake.yml` runs with `contents: read` and
   `issues: write`, validates the issue, and adds one queue comment identified by
   `<!-- cjge-cloud-queue:CHATGPT-GH-<issue> -->`.
3. Retrying the workflow finds that marker and does not create another comment.
4. Marcus starts or reopens the Chief-of-Staff Cloud task with the issue number.
5. The task treats the issue as the durable intake, uses the matching request ID,
   and records its synthesis under `deliverables/chief-of-staff/`.
6. The same commit adds a completed or blocked JSON record under
   `deliverables/chief-of-staff/return-channel/`.
7. The existing return workflow comments once per assignment and terminal status.

## Scheduled and event-triggered work

GitHub schedules or webhooks may safely create the same durable CEO-issue queue
record, provided they do not call a model endpoint. They cannot complete the
reasoning leg. Do not add polling that dispatches `openai/codex-action@v1`, and do
not claim a queued issue is an accepted or running Cloud task.

Until Codex Cloud exposes and proves an authenticated, plan-included trigger that
can start or resume a task, every scheduled or event-triggered reasoning item has
one exact human hinge: **Marcus must start or reopen the Chief-of-Staff Codex Cloud
task with the queued GitHub issue number.**

## Blocked assignments

A blocked internal assignment must persist:

- `status: "blocked"`;
- a precise `blocker`;
- the originating repository, issue, and `CHATGPT-GH-<issue>` request ID;
- CEO decisions or actions required;
- `externalActionAt: null`.

The return workflow's marker includes assignment ID and status. Replays of the
same blocked record do not duplicate the blocker comment. A later completed
record is allowed and produces one separate completion notification.

## Cost and authority guardrails

- `CJGE_API_EXECUTION_ENABLED` remains disabled.
- `dailyExecutionMaximum` remains `0`.
- Queue and return workflows use only GitHub-hosted execution and `GITHUB_TOKEN`.
- No queue state authorizes customer outreach, publishing, spending, pricing, or
  any other external business action.
- A queue comment proves durable intake only; it does not prove Cloud delivery,
  claim, work, completion, or a business outcome.
