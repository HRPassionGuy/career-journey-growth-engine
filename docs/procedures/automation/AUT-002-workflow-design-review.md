# AUT-002: Workflow Design Review

**Version:** 1.0  
**Status:** Active  
**Accountable Executive:** Director of Automation

Governing authority: [Project Constitution](../../PROJECT_CONSTITUTION.md).

---

## Purpose

Review a proposed workflow design for traceability, reliability, controls, handoffs, observability, maintainability, and adherence to its approved source procedure.

## Scope

This procedure governs recurring Automation work for workflow design review, from intake through decision, handoff, and knowledge capture. It does not authorize another function's work or any CEO-reserved decision.

## Trigger

A workflow design reaches review readiness or a material design change is proposed.

## Preconditions

* The request, objective, accountable owner, intended decision, planning horizon, and required date are documented.
* Applicable approvals, source records, access, capacity, and current controlled definitions are available.
* Material gaps, conflicts, confidentiality constraints, and known risks are disclosed before execution.

## Required Inputs

| Input | Source or Owner | Quality or Approval Requirement |
|---|---|---|
| Decision question, objective, scope, target or acceptance criteria | Requesting/accountable executive | Current, specific, mission-aligned, and within authority |
| Domain evidence and prior decisions | Director of Automation / functional source owners | Traceable, dated, relevant, and limitations disclosed |
| KPI definitions, methods, source and quality record | Director of Analytics | Governed and validated for intended use |
| Dependencies, risks, capacity and required approvals | Affected executives / Chief of Staff / CEO | Owner-confirmed; reserved approvals explicit |

## Participants and Responsibilities

| RACI role | Participant | Responsibility | Required Input | Expected Output or Handoff |
|---|---|---|---|---|
| Responsible / Accountable | Director of Automation | Own procedure execution, domain judgment, disposition, and substantive records | Complete validated inputs | Controlled decision and handoffs |
| Consulted | Director of Analytics | Own KPI definitions, methods, quality, and reporting consistency | Measurement request and source evidence | Validation, definitions, and limitations |
| Consulted / coordinator | Chief of Staff | Coordinate cross-functional conflicts and accept repository handoffs | Decision or knowledge package | Routing, repository acceptance, or escalation |
| Consulted | Affected functional executives | Validate facts and decisions within their charters; accept bounded handoffs | Domain-specific request | Owner-confirmed input or action |
| Informed / decision maker when reserved | CEO | Decide strategy, major investment, pricing, priorities, significant risk, mission, or final executive conflict | Decision-ready package | Approval, rejection, or direction |

## Procedure Steps

1. **Verify source authority and requirements**
   * **Responsible:** Director of Automation; supporting owners contribute only within charter.
   * **Action:** Trace every trigger, rule, decision, role, input, output, exception, approval, and handoff to an active procedure and accepted requirement; identify any design-created business logic.
   * **Decision point:** Continue only when required evidence and authority are sufficient; otherwise return for correction, qualify the result, or escalate at the appropriate level.
   * **Evidence or record:** Dated inputs, analysis, owner confirmations, decision rationale, exceptions, and version.
   * **Handoff:** Accepted output to next procedure step.
2. **Review architecture and handoffs**
   * **Responsible:** Director of Automation; supporting owners contribute only within charter.
   * **Action:** Review components, integrations, data contracts, identity and access, state, idempotency, concurrency, versioning, environments, human checkpoints, audit trail, and maintainable documentation.
   * **Decision point:** Continue only when required evidence and authority are sufficient; otherwise return for correction, qualify the result, or escalate at the appropriate level.
   * **Evidence or record:** Dated inputs, analysis, owner confirmations, decision rationale, exceptions, and version.
   * **Handoff:** Accepted output to next procedure step.
3. **Test failure, security, and recovery controls**
   * **Responsible:** Director of Automation; supporting owners contribute only within charter.
   * **Action:** Simulate invalid input, dependency outage, timeout, duplicate event, partial completion, unauthorized access, stale data, rollback, recovery, notification, and manual fallback; define monitoring and ownership.
   * **Decision point:** Continue only when required evidence and authority are sufficient; otherwise return for correction, qualify the result, or escalate at the appropriate level.
   * **Evidence or record:** Dated inputs, analysis, owner confirmations, decision rationale, exceptions, and version.
   * **Handoff:** Accepted output to next procedure step.
4. **Approve design readiness or return defects**
   * **Responsible:** Director of Automation; supporting owners contribute only within charter.
   * **Action:** Approve design readiness, conditionally approve bounded corrections, or return material defects; freeze the reviewed architecture and route infrastructure, credential, cross-functional, or reserved approvals.
   * **Decision point:** Continue only when required evidence and authority are sufficient; otherwise return for correction, qualify the result, or escalate at the appropriate level.
   * **Evidence or record:** Dated inputs, analysis, owner confirmations, decision rationale, exceptions, and version.
   * **Handoff:** Accepted output to named recipients and the controlled repository.

## Decision Points

| Decision | Criteria and Evidence | Decision Owner | Required Approver | Resulting Path |
|---|---|---|---|---|
| Accept input and proceed | Completeness, provenance, relevance, authority, risk | Director of Automation | None within delegated authority | Execute or return for correction |
| Approve domain disposition | Evidence, criteria, customer value, risk, confidence | Director of Automation | None within approved functional scope | Record action or recommendation |
| Define or validate measurement | Definition, method, source, quality, comparability | Director of Analytics | None within measurement authority | Validate, qualify, or reject measure |
| Change another function's work | Charter-specific evidence and impact | Relevant functional executive | Applicable decision authority | Accepted owner handoff |
| Decide reserved matter | Strategy, major investment, pricing, priorities, significant risk, mission or final conflict | CEO | CEO | COS-001 decision record |

## Decision Rules

Director of Automation owns Automation judgment and this procedure's disposition. Analytics alone owns KPI definitions, measurement methods, data quality, and reporting consistency; business executives own objectives, targets, interpretation, corrective action, and outcomes. The Chief of Staff coordinates cross-functional governance without assuming functional ownership. No procedure result authorizes pricing, strategy, major investment, organizational priorities, significant risk acceptance, mission changes, or another executive's work.

## Escalation Conditions

| Condition | Escalation Level | Escalation Recipient | Required Information | Execution Impact |
|---|---|---|---|---|
| Routine disposition within scope | Department | Director of Automation | Evidence, criteria, decision record | Decide and continue |
| Measurement definition or quality dispute | Department / cross-functional | Director of Analytics; Chief of Staff if unresolved | Definitions, methods, evidence, impact | Do not publish unsupported claim |
| Ownership, dependency, or priority conflict | Cross-functional | Chief of Staff via COS-006 | Owner positions, impact, options, urgency | Pause contested action |
| Reserved authority, legal/ethical risk, mission issue, or unresolved executive conflict | Executive | CEO via COS-001 | Situation, evidence, alternatives, risks, recommendation, confidence | No affected action before decision |

## Outputs

| Output | Owner | Recipient or Repository | Acceptance or Completion Condition |
|---|---|---|---|
| Controlled workflow design review record | Director of Automation | Functional record | Scope, evidence, decision, authority, version, and limitations complete |
| Measurement validation | Director of Analytics | KPI registry / linked record | Definition, method, source, quality, and limitations confirmed |
| Decision or action handoff | Relevant executive | Named owner / COS-001 where required | Scope, acceptance, due date, and approval route recorded |
| Organizational learning asset | Director of Automation | Shared Knowledge Repository | Substantively validated and accepted by Chief of Staff |

## Success Criteria

* The procedure produces a timely, evidence-bounded, traceable disposition with one accountable executive.
* Measurement content is Analytics-governed and functional actions remain with their chartered owners.
* Risks, uncertainty, exceptions, approvals, handoffs, and completion conditions are explicit.
* Required decisions and learning are accepted into the appropriate controlled records without duplicate authority.

## KPIs or Performance Indicators

| Indicator | Business Objective | Definition or Method | Accountable Executive | Source | Target | Cadence |
|---|---|---|---|---|---|---|
| Design first-pass approval rate | Reliable execution | Analytics-governed definition | Director of Automation | Procedure records | KPI registry target | Monthly |
| Control coverage | Decision quality | Analytics-governed method | Director of Automation | Validation and decision records | KPI registry target | Monthly/quarterly |
| Post-design defect rate | Organizational learning | Analytics-governed definition | Director of Automation | Outcome and repository records | KPI registry target | Quarterly |

## Risks and Controls

| Risk | Impact | Control | Control Owner | Required Evidence | Escalation Threshold |
|---|---|---|---|---|---|
| Unsupported or selective conclusion | Poor decision and loss of trust | Evidence classification, limitations, alternatives, confidence | Director of Automation | Review record | Any material unsupported claim |
| Measurement inconsistency | Misleading comparison | Analytics-controlled definition and validation | Director of Analytics | KPI/validation reference | Material method or data defect |
| Ownership or approval overreach | Invalid action | RACI, decision-rights gate, owner acceptance, CEO reservation | Director of Automation / Chief of Staff | Decision and handoff record | Any contested or reserved action |
| Stale, duplicate, or lost knowledge | Repeated error and confusion | Version control and repository acceptance | Director of Automation / Chief of Staff | Repository link and review date | Missing or conflicting material record |

## Exceptions

| Permitted Exception | Authorizing Role | Conditions and Limits | Required Documentation | Follow-up |
|---|---|---|---|---|
| Expedited review | Director of Automation | Urgent, within authority, minimum evidence and controls retained | Reason, omissions, risk, expiry | Complete normal record promptly |
| Qualified disposition with incomplete evidence | Director of Automation; Analytics for measurement qualification | Limitations explicit; no material irreversible or reserved action | Gaps, confidence, safeguards, evidence plan | Reassess by dated checkpoint |

Exceptions may not bypass the Constitution, charter boundaries, measurement governance, repository governance, or CEO-reserved authority.

## Knowledge Capture Requirements

| Knowledge Asset | Content Required | Substantive Owner | Repository Handoff | Timing |
|---|---|---|---|---|
| Procedure record | Trigger, inputs, analysis, decision, approvals, handoffs, exceptions | Director of Automation | Controlled functional record | Each execution |
| Measurement record | Definitions, method, source, quality, limitations | Director of Analytics | KPI registry / linked validation | Before material reporting |
| Learning asset | Outcome, unexpected effects, root causes, reusable lesson, improvement | Director of Automation | Chief of Staff accepts and publishes | At closure or review |

## Governance Controls

* The Constitution, AGENTS.md, applicable charters, Operating Standards, and accepted ADRs prevail over this procedure.
* One accountable executive is retained; supporting participation never creates shared or duplicate authority.
* Material decisions use the Executive Decision Standard; cross-functional conflicts use COS-006 and reserved decisions use COS-001.
* Changes to business logic, authority, controls, measurement, or handoffs require controlled revision and approval before use.

## Related Standards

* [Executive Decision Standard](../../standards/executive-decision-standard.md); [Executive Communication Standard](../../standards/executive-communication-standard.md); [Executive Operating Rhythm](../../standards/executive-operating-rhythm.md); [KPI & Performance Standard](../../standards/kpi-performance-standard.md); [Organizational Knowledge Standard](../../standards/organizational-knowledge-standard.md); [Strategic Initiative Standard](../../standards/strategic-initiative-standard.md); [Executive Procedure Standard](../../standards/executive-procedure-standard.md)

## Related Charters

* [Director of Automation Charter](../../../agents/director-automation.md); supporting charters: [Chief of Staff](../../../agents/chief-of-staff.md); [VP of Revenue](../../../agents/vp-revenue.md); [Marketing Director](../../../agents/marketing-director.md); [Creative Director](../../../agents/creative-director.md); [Director of Community](../../../agents/director-community.md); [Director of Analytics](../../../agents/director-analytics.md); [Director of Research & Product Development](../../../agents/director-research-product-development.md); [Director of Automation](../../../agents/director-automation.md)

## Related ADRs

* [ADR-001](../../adr/ADR-001-governance-before-automation.md); [ADR-002](../../adr/ADR-002-layered-executive-operating-system.md); [ADR-003](../../adr/ADR-003-chief-of-staff-as-organizational-integrator.md); [ADR-004](../../adr/ADR-004-centralized-measurement-governance.md); [ADR-005](../../adr/ADR-005-shared-knowledge-repository-governance.md); [ADR-006](../../adr/ADR-006-executive-procedures-before-automation.md)

## Related Procedures

* [AUT-001](AUT-001-automation-opportunity-assessment.md), [AUT-003](AUT-003-automation-readiness-review.md), [AUT-004](AUT-004-automation-performance-review.md), [COS-001](../chief-of-staff/COS-001-executive-decision-facilitation.md), [COS-006](../chief-of-staff/COS-006-cross-functional-issue-escalation.md)

## Future Automation Considerations

Automation may validate required fields, retrieve approved sources, calculate approved methods, flag thresholds or conflicts, assemble drafts, route handoffs, and monitor review dates. Humans retain domain judgment, evidence interpretation, exception authorization, owner acceptance, risk decisions, and all CEO-reserved approvals. Automation may not create authority, change business logic, redefine KPIs, conceal uncertainty, approve its source procedure, or execute a contested or reserved decision.

## Review Cadence

* **Scheduled review:** Quarterly and at the applicable executive operating cadence.
* **Event-based review triggers:** governance change, material performance gap, repeated exception, control failure, unresolved conflict, source-procedure change, or automation proposal.
* **Review owner:** Director of Automation.
* **Supporting reviewers:** Director of Analytics for measurement; Chief of Staff for cross-functional consistency and library governance; affected functional executives; CEO for reserved implications.

## Change History

| Version | Date | Status | Change Summary | Rationale | Owner | Approval Record |
|---|---|---|---|---|---|---|
| 1.0 | 2026-07-19 | Active | Initial controlled release | Establish governed workflow design review | Director of Automation | CEO approval recorded by authorization of the Automation Executive Procedure Library Version 1.0 |
