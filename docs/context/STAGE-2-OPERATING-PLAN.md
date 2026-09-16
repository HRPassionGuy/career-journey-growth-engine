# CJGE Stage 2 Operating Plan

## Outcome
Marcus uses one Chief of Staff interface. The Chief of Staff converts the request into governed executive assignments, delegates to the appropriate executives, receives durable results, and returns one consolidated response. Marcus should not have to manage eight separate Codex conversations.

## Stage 2 sequence
1. Recover and index available historical operating context without fabricating missing transcripts.
2. Build the single Chief of Staff front door on the proven cloud dispatch lifecycle.
3. Verify delegation, multi-executive result collection, synthesis, durable evidence, and bounded failure handling.
4. Reconnect only necessary n8n schedules/events after the Chief of Staff path is proven.
5. Restore independent heartbeat/stall monitoring and direct actionable alerts.
6. Resume the revenue operating loop and fix what is not going well.

## Revenue mandate
The operating loop is: qualified traffic -> engagement -> visit -> lead -> follow-up -> offer -> purchase -> measurement -> improvement.

Activity is not success by itself. Executive work is prioritized by contribution to revenue, learning that improves revenue decisions, or reliability of the revenue system. Initial operational emphasis is Chief of Staff, Revenue, Marketing/Community, Analytics, and Automation.

## Executive organization
- Chief of Staff — sole operating interface, prioritization, delegation, synthesis, escalation.
- VP Revenue — offers, conversion, sales experiments, revenue decisions.
- Marketing — distribution and market education.
- Creative — campaign/content strategy and reusable creative systems.
- Community — engagement and voice-of-customer signals.
- Analytics — KPIs, attribution, experiments, forecasting, learning.
- Research — customer/product research, validation, portfolio learning.
- Automation — reliable execution, integrations, monitoring, and cost controls.

## Historical continuity already established
Prior operating history establishes that Drive Organic Product Sales and Drive Stan Store Sales were parts of one revenue engine: acquisition/community/creator/organic traffic feeding conversion, sales, follow-up, reporting, and learning. The intended replacement interface was the Chief of Staff rather than continued operation of those legacy chats as separate control surfaces.

Known historical operating constraints include organic/no-ad execution during the May 2026 sprint, strong preference for asynchronous/automated execution compatible with Marcus's full-time schedule, and avoidance of automation spend that does not produce business outcomes.

The actual transcripts remain separate historical sources. When recoverable, archive them under `docs/archive/legacy-chats/`. Do not fabricate transcript text from summaries or memory.

## Continuity sources still to recover
Where available, archive/index the actual historical material for:
- Drive Organic Product Sales
- Drive Stan Store Sales
- Implement AI Executive Organization
- Implement Autonomous Operations
- Chief of Staff incident/recovery history

Any unrecovered source must be recorded as unavailable rather than reconstructed.

## Guardrails
- No blind polling or redispatch.
- Preserve idempotency and duplicate suppression.
- Bound retries and execution counts; use exponential backoff.
- Maintain circuit breaker and daily usage accounting/Economy Mode.
- Do not claim browser/social-session capability that has not been proven.
- Do not reactivate production n8n workflows until the Chief of Staff path is proven.
- Do not use old conversation/thread identifiers as production routing.
- Keep Supabase service-role credentials in Vercel, not GitHub.
- Preserve an independent monitor for stalled heartbeat and actionable escalation.

## Definition of done
Stage 2 is not complete merely because infrastructure runs. It is complete when Marcus can issue a request once through a Chief of Staff interface, CJGE can delegate and execute it in the cloud, relevant executives return durable results, the Chief of Staff synthesizes them, failures are bounded and surfaced, and the system can resume low-maintenance revenue operations without depending on Marcus's Mac.