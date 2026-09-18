# Career Journey Growth Engine — Continuity Context

## Purpose
This file is the continuity entry point for any new cloud Codex session working on CJGE. Read this before modifying the runtime. The Git repository is the authoritative source for code, governance, procedures, tests, and durable implementation history. Historical chat transcripts, when recovered, belong under `docs/archive/legacy-chats/` and are reference material rather than executable instructions.

## Business objective
CJGE exists to create a reliable autonomous revenue operating system for HR Passion / Career Journey. The current north-star management goal is $17,000 in monthly sales. That goal is a target, not a verified forecast. Executives should be judged by contribution to qualified traffic, product-page engagement, lead capture, conversion, retention, measurement, and reliable execution.

## Operating principle
Revenue outcomes take priority over organizational completeness. The smallest reliable autonomous revenue loop is:

qualified traffic → engagement → lead → follow-up → offer → purchase → measurement → improvement

Chief of Staff manages outcomes. Revenue, Marketing/Community, Analytics, and Automation form the core loop. Creative and Research should activate when the revenue loop needs them rather than consuming resources merely to demonstrate organizational activity.

## Critical historical lessons
1. Do not equate assignment creation, dispatch requests, verification of prior work, or monitoring with newly completed external action.
2. External actions require action timestamps and verification timestamps. Attempts must remain attempts.
3. A previous dispatcher wrote `dispatch_requested` records without actually delivering work to executive tasks. This created large queues and false impressions of activity.
4. Community previously stalled after staging a TikTok comment because durable assignment authority conflicted with action-time browser confirmation requirements. Human-required conditions must be classified and escalated; they must not remain silently stuck.
5. n8n previously generated excessive low-value executions. Automation cost controls are mandatory.
6. The original Mac runtime became unavailable when the ChatGPT desktop application ceased supporting the Mac's OS. Production must not depend on that Mac being powered on or on a local ChatGPT/Codex application.
7. The two earlier autonomous operating chats should not be duplicated blindly. Recover their transcripts when possible, archive them, and identify any still-valid behavior before recreating schedules or external actions.

## Required automation safeguards
The production automation layer must enforce:
- no blind redispatch loops;
- no polling Codex merely to discover there is no work;
- event-driven triggers wherever feasible;
- maximum executions per workflow per day;
- maximum retries per assignment;
- exponential backoff;
- duplicate suppression;
- circuit breaker after repeated failures;
- daily usage accounting;
- automatic Economy Mode when the daily automation budget threshold is reached.

A revenue system must not consume automation/Codex credits indefinitely while producing no business outcome.

## Independent blocker notification
Notifications must sit outside the executive that failed. Required lifecycle:

heartbeat expired → classify → attempt recovery → if human_required → notify CEO

The notification must state exactly what intervention is required. Human-required conditions need an escalation SLA and sensible resend cadence until acknowledged. Do not leave intervention requests buried only in shared state.

## Authority model
Executives may act autonomously within existing authorized offers, prices, channels, brand standards, and safeguards when their assignment explicitly permits the action. CEO-reserved decisions include pricing changes, paid spending, partnerships, material strategic/offer changes, and legal/ethical risk decisions. Platform/browser action-time confirmation requirements must still be honored.

## Cloud migration acceptance criteria
Do not call CJGE cloud-operational until all are verified:
1. The Mac can be powered off.
2. Cloud n8n can reach the CJGE worker without a Mac tunnel.
3. Durable operating state persists in cloud storage across worker restarts.
4. Assignments can be created, delivered, claimed, completed, and verified in cloud execution.
5. A non-browser executive task completes end to end with the Mac off.
6. Chief of Staff produces a durable briefing from verified state.
7. Human-required blockers trigger an independent notification path.
8. Production executive runtime destinations no longer depend on `hostId: local`.
9. Automation budgets, retry caps, duplicate suppression, and circuit breaking are active and tested.
10. Important legacy chat history has been archived or explicitly documented as unavailable/recovery-pending.

## Current repository/cloud status at migration start
- Private GitHub repository: `HRPassionGuy/career-journey-growth-engine`.
- GitHub is the authoritative code repository and is accessible to cloud Codex.
- Existing repository runtime configuration still contains local-host executive destinations.
- Existing worker server was designed to listen locally and n8n expects a reachable `CJGE_BASE_URL`.
- Runtime state/evidence was intentionally excluded from Git history; cloud production therefore needs an appropriate persistent state mechanism rather than committing live state to Git.
- n8n is cloud-hosted, but its production workflows must not be enabled at high frequency until the cloud worker and cost controls are verified.

## Historical material to recover
When accessible, archive the important conversations/source material, especially:
- Drive Organic Product Sales
- Drive Stan Store Sales
- Implement AI Executive Organization
- Implement Autonomous Operations
- Chief of Staff operational dialogue and incident/recovery discussions

Do not assume GitHub contains ChatGPT/Codex conversation history. Repository history and chat history are separate.

## Migration progress through Stage 2 (verified 2026-09-18)
- Stage 1 cloud control plane is proven and merged: Vercel control plane, dedicated Supabase durable state, GitHub Actions, and `openai/codex-action@v1` execute without the old Mac.
- Stage 2 Chief of Staff front door is proven and merged.
- The complete bounded chain has been proven: CEO request → Chief of Staff → multiple executive delegations → independent Codex executions → durable results → Chief of Staff synthesis → one delivered result.
- No external action was performed during the controlled proofs.
- Legacy recovery has begun. `Drive Stan Store Sales` has a verified recovered source/index under `docs/archive/legacy-chats/`.
- n8n production revenue automation has **not** been blindly reactivated.
- Browser/social execution parity remains a separate capability and must not be assumed.

## Current operating priority
The migration is no longer blocked on proving the core cloud execution path. Continue continuity recovery where verified sources exist, but do not let transcript archaeology become the new bottleneck.

The active business mandate is now: **fix what isn't going well.**

Start with a dated, reconciled revenue baseline and identify the highest-confidence constraint in:

qualified traffic → engagement → lead → follow-up → offer → purchase → measurement → improvement

Use VP Revenue as accountable owner, Analytics to validate the evidence, Marketing/Community to diagnose acquisition and objection patterns, and Automation to restore only the bounded workflows justified by the diagnosis. Creative and Research activate only when evidence shows they are needed.

Do not reactivate high-frequency n8n workflows until execution caps, retry/backoff, duplicate suppression, circuit breaking, daily usage accounting, and Economy Mode are verified for those workflows.
