# Career Journey Growth Engine — Agent Governance

> Source note: Distilled from the attached Career Journey Growth Engine architecture conversations; the full transcripts are intentionally not reproduced here.

## Governing Authority

`docs/PROJECT_CONSTITUTION.md` is the highest detailed project authority. Read it before making material recommendations or changes. For work within an executive function, also read the relevant charter before beginning.

If a charter conflicts with the Project Constitution, follow the Project Constitution. If a strategic conflict remains unresolved, or a decision involves major investment, a pricing change, organizational priorities, legal or ethical risk, or a material change in direction, escalate it to the CEO. Revenue owns pricing strategy and recommendations, but every pricing change requires CEO approval.

## Executive Routing

| Work | Accountable executive | Charter |
|---|---|---|
| Executive coordination, priorities, governance, cross-functional planning | Chief of Staff | `agents/chief-of-staff.md` |
| Revenue, pricing, offers, funnels, conversion, sales | VP of Revenue | `agents/vp-revenue.md` |
| Content strategy, educational assets, storytelling, creative production | Creative Director | `agents/creative-director.md` |
| Campaigns, channels, distribution, launches, audience acquisition | Marketing Director | `agents/marketing-director.md` |
| Community engagement, moderation, advocacy, voice of customer | Director of Community | `agents/director-community.md` |
| KPIs, dashboards, measurement, experiment measurement and evaluation, executive intelligence | Director of Analytics | `agents/director-analytics.md` |
| Workflow automation, integrations, operational efficiency | Director of Automation | `agents/director-automation.md` |
| Research, customer needs, product discovery, portfolio evolution | Director of Research & Product Development | `agents/director-research-product-development.md` |

## Cross-Functional Work

Every initiative must have one accountable executive owner. Identify supporting executives separately, with their expected inputs and outputs. Departments may recommend work outside their authority but must hand execution to the proper owner.

Functional executives retain ownership of experiments within their domains. The Director of Analytics supports experiment measurement and evaluation.

Do not create substitute or generic executive roles. Use the eight roles above exactly.

## Operational Execution

This repository has a live executive control plane. For recurring revenue, content, social, community, research, analytics, and automation work:

1. Run `./bin/cjge daily` once per operating day.
2. Run `./bin/cjge briefing` to identify due work.
3. Run `./bin/cjge packet <executive-slug>` before executing an executive's work.
4. Read every governing file named in the packet, then perform the work with the connected Codex tools and browser sessions.
5. Record verified completion, retry, or precise blockers with `./bin/cjge update`.
6. Record available business outcomes with `./bin/cjge metric`.
7. Record every external workflow with `./bin/cjge record '<json>'`. A record marked `completed` must contain the timestamp of a new external action performed during that run. If the run only discovers or verifies an action performed earlier, record `verified_prior_work` with no `externalActionAt`; never attribute it to the current run.

The executable capability assignments are in `config/capabilities.json`; shared operating state is in `state/operating-state.json`. Never count an attempted external action as completed. Do not create planning or architecture documents when a due operational item can be executed instead.

The independently activatable Codex executive instances are registered in `config/runtime-instances.json`. The Chief of Staff delegates by creating a durable assignment with `./bin/cjge delegate`, then sending the assignment ID to the registered executive task. Each executive must claim it through its own `./bin/executive <slug> <assignment-id>` entry point and persist a result through `./bin/cjge result`. Supporting work uses `./bin/cjge handoff`; changing conversational roles inside the Chief of Staff task is not independent delegation.
