# COS-007: Governance Review

**Procedure ID:** COS-007  
**Procedure Name:** Governance Review  
**Version:** 1.0  
**Status:** Active  
**Owner / Accountable Executive:** Chief of Staff  
**Approver:** CEO  
**Effective Date:** 2026-07-19  
**Review Frequency:** Quarterly and upon a material governance trigger

Governing authority: [Project Constitution](../../PROJECT_CONSTITUTION.md).

---

## Purpose

Verify that governance artifacts and observed executive work remain aligned, effective, current, nonduplicative, and traceable. The outcome is a controlled retain/revise/retire/correct determination for each reviewed item; the impact is prevention of authority drift, policy conflict, undocumented exceptions, and automation of unapproved behavior.

## Scope

Applies to the Constitution, AGENTS.md routing, executive charters, Operating Standards, accepted ADRs, Executive Procedures, catalog, cross-functional handoffs, measurement governance, repository governance, and implementing artifacts that claim traceability. It does not itself amend higher governance, validate specialized content for its functional owner, approve its own changes, or implement automation.

## Trigger

**Scheduled triggers:** quarterly governance review and the governance portion of annual executive review.  
**Event-driven triggers:** governance conflict; repeated exception/control failure; constitutional, charter, standard, or ADR change; new/revised/retired procedure; material decision or initiative failure; proposed automation; audit finding.

## Preconditions

* Review scope, authoritative versions, reviewers, decision authority, and evidence period are defined.
* Controlled artifact inventory, procedure catalog, exception/control logs, and implementation traceability records are accessible.
* Substantive owners and Director of Analytics are available or have provided validated input.
* A reviewer does not approve a change reserved to a higher or different authority.

## Required Inputs

| Input | Source or Owner | Quality or Approval Requirement |
|---|---|---|
| Governance hierarchy and inventory | Chief of Staff | Current authoritative versions and lifecycle status |
| Execution, exception, control, escalation evidence | Procedure/accountable executives | Complete for review period; linked to source procedure |
| KPI/control performance | Director of Analytics | Governed definitions, methods, limitations |
| Substantive owner assessments | All affected executives | Validate charter-specific accuracy, handoffs, and outcomes |
| Implementation traceability | Director of Automation / artifact owner | Maps skills, playbooks, workflows, automations, and AI execution to active procedures |
| Prior findings/approvals | Chief of Staff | Status and evidence reconciled |

## Participants and Responsibilities

| RACI role | Participant | Responsibility | Required Input | Expected Output or Handoff |
|---|---|---|---|---|
| Responsible / Accountable | Chief of Staff | Scope, coordinate, test, synthesize, record, and monitor review | Governance/evidence set | Findings, dispositions, correction plan, approvals |
| Consulted | Functional executives | Validate their authority, responsibilities, specialized knowledge, and actions | Review request | Owner assessment and correction commitment |
| Consulted | Director of Analytics | Validate measurement definitions and evidence quality | KPI/control evidence | Measurement findings |
| Consulted | Director of Automation | Validate implementation traceability/boundaries | Implementation inventory | Traceability findings; no governance approval |
| Informed / approver where reserved | CEO | Decide constitutional, strategic, authority, major-risk, or material governance changes | Decision package | Approval/direction |

## Procedure Steps

1. **Define scope and freeze the review baseline**
   * **Objective:** Establish exactly what authority, artifacts, evidence, and period will be tested.
   * **Responsible:** Chief of Staff.
   * **Required inputs:** Trigger, inventory, prior findings.
   * **Action:** Record review ID, trigger, period, included artifacts/implementations, authoritative versions, owners, reviewers, criteria, exclusions, deadlines, and applicable approvers.
   * **Decision point:** Expand scope only when a discovered dependency materially affects validity; document the change.
   * **Expected output:** Approved review plan and baseline inventory.
   * **Evidence or record:** Versioned scope and artifact list.
   * **Handoff:** Owners acknowledge review requests.
2. **Test hierarchy, authority, ownership, and approval integrity**
   * **Objective:** Detect conflicts with higher governance and unauthorized decisions.
   * **Responsible:** Chief of Staff; source owners validate responsibilities.
   * **Required inputs:** Baseline artifacts and governance hierarchy.
   * **Action:** Trace each artifact upward through Constitution, AGENTS.md, charters, standards, ADRs, and procedures; verify one accountable executive, decision rights, CEO reservations, functional boundaries, approvals, status, effective date, and change history.
   * **Decision point:** Stop any active conflicting path; escalate unresolved strategic/authority conflict to CEO via COS-001.
   * **Expected output:** Authority/ownership findings.
   * **Evidence or record:** Citation, observed state, severity, owner response.
   * **Handoff:** Findings to control/handoff tests.
3. **Test execution, controls, handoffs, knowledge, and measurement**
   * **Objective:** Confirm approved governance produces traceable behavior.
   * **Responsible:** Chief of Staff; Analytics and functional owners validate their domains.
   * **Required inputs:** Execution samples, logs, records, KPI evidence.
   * **Action:** Sample procedure executions; verify required inputs/steps/decisions/approvals/outputs, exception authority, one-owner handoffs, duplicate controls, communications, repository lifecycle, KPI references, and dashboard governance.
   * **Decision point:** Measurement defects belong to Analytics; specialized knowledge defects to the functional owner; repository lifecycle defects to Chief of Staff.
   * **Expected output:** Control and operating-effectiveness findings.
   * **Evidence or record:** Sample selection, test result, evidence links, limitation.
   * **Handoff:** Findings to implementation test.
4. **Test procedure and automation traceability**
   * **Objective:** Prevent lower layers from creating or changing organizational authority.
   * **Responsible:** Chief of Staff; Director of Automation supplies implementation evidence.
   * **Required inputs:** Active procedure catalog and implementation inventory.
   * **Action:** Verify each repeatable executive implementation traces to an approved active procedure and stays within scope, authority, controls, approvals, and escalation boundaries; identify orphaned, stale, or divergent implementations.
   * **Decision point:** Pause an implementation lacking valid traceability; business-logic changes must return to procedure revision before implementation.
   * **Expected output:** Implementation traceability findings and containment.
   * **Evidence or record:** Procedure-to-implementation matrix and pause evidence.
   * **Handoff:** Findings to disposition.
5. **Classify findings and obtain owner responses**
   * **Objective:** Convert evidence into accountable corrections.
   * **Responsible:** Chief of Staff; finding owner supplies response.
   * **Required inputs:** All test findings.
   * **Action:** Classify each as compliant, improvement, deficiency, material conflict, or immediate risk; assign one owner, root-cause response, corrective output, acceptance criteria, deadline, interim control, and required approval.
   * **Decision point:** Chief of Staff may require correction/containment within existing governance; substantive revision/retirement follows source authority and lifecycle; CEO decides reserved changes.
   * **Expected output:** Accepted findings and corrective-action plan.
   * **Evidence or record:** Owner acknowledgment, disagreement, rationale, authority.
   * **Handoff:** Material decisions to COS-001; systemic risk to COS-008.
6. **Approve, publish, and verify closure**
   * **Objective:** Preserve the review and ensure findings remain open until evidence proves correction.
   * **Responsible:** Proper approver decides; Chief of Staff publishes/monitors.
   * **Required inputs:** Findings, responses, decision records, closure evidence.
   * **Action:** Record retain/revise/retire/correct dispositions; route revisions through architecture review and approval; update catalog/repository only after approval; verify corrective evidence; publish review summary and unresolved-risk disclosure.
   * **Decision point:** Do not close on management assertion alone; repeated/failed correction invokes COS-006, COS-008, or CEO escalation.
   * **Expected output:** Governance review record, controlled updates, closed/open action state.
   * **Evidence or record:** Approvals, version/change history, closure tests, communications.
   * **Handoff:** COS-003/004 tracks actions; COS-005 receives strategic findings.

## Decision Points

| Decision | Criteria and Evidence | Decision Owner | Required Approver | Resulting Path |
|---|---|---|---|---|
| Review scope, test plan, finding severity, repository/catalog control | Governance evidence | Chief of Staff | None within governance-coordination authority | Review/correction workflow |
| Specialized content correction | Domain evidence | Functional executive | Applicable authority | Validated revision |
| KPI/method/reporting correction | Measurement evidence | Director of Analytics | Applicable authority for material KPI change | Measurement correction |
| Constitutional, strategic, authority, major-risk, material governance change | Decision package | CEO | CEO | Approved revision/direction |

## Decision Rules

Chief of Staff may define review scope, request evidence, classify findings, require containment, coordinate architecture review, govern catalog/repository status, and reject incomplete or untraceable implementation. Chief of Staff may not amend higher governance, approve its own required approval, validate specialized substance, or authorize automation without an active procedure. CEO approves reserved and material governance changes. Functional executives retain content/functional ownership; Analytics retains measurement authority; Automation implements only approved behavior. Escalate any hierarchy conflict, unauthorized decision, orphan automation, significant risk, repeated control failure, or unresolved owner dispute.

## Escalation Conditions

| Condition | Escalation Level | Escalation Recipient | Required Information | Execution Impact |
|---|---|---|---|---|
| Functional/content deficiency | Department | Functional executive | Finding, source, correction criteria/date | Correct; contain if material |
| Cross-functional handoff/control failure | Cross-functional | Chief of Staff via COS-006 | Evidence, impact, owners, options | Pause contested/noncompliant work |
| Higher-governance conflict/reserved change | Executive | CEO via COS-001 | Conflict, consequences, options, recommendation | Stop conflicting path |
| Significant/systemic risk | Executive | CEO and COS-008 | Exposure, controls, recommendation | Immediate containment and decision |

## Outputs

| Output | Owner | Recipient or Repository | Acceptance or Completion Condition |
|---|---|---|---|
| Review plan/baseline | Chief of Staff | Governance review record | Scope, versions, tests, owners complete |
| Findings and evidence matrix | Chief of Staff / source owners | Knowledge Repository | Classification, evidence, owner response complete |
| Corrective action and decision queue | Proper owners | Action log / COS-001 / COS-008 | One owner, criteria, date, authority |
| Controlled artifact/catalog updates | Artifact owner / Chief of Staff | Source repositories | Required lifecycle and approval complete |
| Traceability matrix | Chief of Staff / Director of Automation | Governance repository | Every implementation mapped or contained |

## Success Criteria

* Every reviewed artifact has valid hierarchy, ownership, approval, lifecycle, and traceability.
* Conflicting or unapproved behavior is contained immediately and corrected only by proper authority.
* Findings close only with acceptance evidence and all changes update versions, history, dependencies, and repository state.
* Functional, measurement, automation, and repository responsibilities remain separate and charter-consistent.

## KPIs or Performance Indicators

| Indicator | Business Objective | Definition or Method | Accountable Executive | Source | Target | Cadence |
|---|---|---|---|---|---|---|
| Governance review completion | Governance reliability | Reference Analytics-governed definition | Chief of Staff | Review register | KPI registry target | Quarterly |
| Finding closure timeliness | Risk reduction | Reference Analytics-governed definition | Chief of Staff | Action log | KPI registry target | Monthly/quarterly |
| Implementation traceability | Safe automation | Reference Analytics-governed definition | Chief of Staff | Traceability matrix | KPI registry target | Quarterly |
| Repeated control failure rate | Governance effectiveness | Reference Analytics-governed definition | Chief of Staff | Findings/exceptions | KPI registry target | Quarterly |

## Risks and Controls

| Risk | Impact | Control | Control Owner | Required Evidence | Escalation Threshold |
|---|---|---|---|---|---|
| Reviewer creates authority | Governance breach | Source-authority/approver map | Chief of Staff | Approval matrix | Any unauthorized change |
| Self-approval | Invalid lifecycle state | Segregated approver check | Chief of Staff | Approval record | Owner equals required approver without authority |
| Missing documentation | Unverifiable compliance | Evidence-required finding/closure gates | Chief of Staff | Evidence links | Any material unsupported closure |
| Orphan/divergent automation | Scaled policy violation | Traceability test and pause | Chief of Staff / Automation | Mapping/pause record | Any business-logic divergence |
| Duplicated/conflicting artifacts | Confusion | Inventory comparison and canonical-source designation | Chief of Staff | Inventory disposition | Material conflict |

## Exceptions

| Permitted Exception | Authorizing Role | Conditions and Limits | Required Documentation | Follow-up |
|---|---|---|---|---|
| Emergency containment before full review | Existing authority; CEO if reserved | Prevent immediate harm; no permanent governance change | Risk, action, scope, owner, expiry | Full review promptly |
| Required reviewer unavailable | Chief of Staff for timing | Delegate or documented limitation; no approval transfer | Delegation/gap | Obtain substantive validation before closure |
| Incomplete sample/evidence | Chief of Staff for review method | Limitation disclosed; material finding not cleared | Missing evidence and risk | Supplemental test |

## Knowledge Capture Requirements

| Knowledge Asset | Content Required | Substantive Owner | Repository Handoff | Timing |
|---|---|---|---|---|
| Governance review record | Scope, tests, evidence, findings, responses, decisions, closure | Chief of Staff | Publish at review close/update while open | Throughout review |
| Revised governance artifact | Required metadata, rationale, approvals, dependencies, history | Artifact owner | Chief of Staff accepts/publishes | After approval |
| Specialized correction/learning | Root cause, correction, reusable lesson | Functional executive | Validated submission | At closure |

## Related Standards

* [Executive Procedure Standard](../../standards/executive-procedure-standard.md); [Executive Decision Standard](../../standards/executive-decision-standard.md); [Executive Operating Rhythm](../../standards/executive-operating-rhythm.md); [Executive Communication Standard](../../standards/executive-communication-standard.md); [Strategic Initiative Standard](../../standards/strategic-initiative-standard.md); [KPI & Performance Standard](../../standards/kpi-performance-standard.md); [Organizational Knowledge Standard](../../standards/organizational-knowledge-standard.md)

## Related Charters

* [Chief of Staff Charter](../../../agents/chief-of-staff.md); [Director of Analytics Charter](../../../agents/director-analytics.md); [Director of Automation Charter](../../../agents/director-automation.md); all affected [Executive Charters](../../../agents/)

## Related ADRs

* [ADR-001](../../adr/ADR-001-governance-before-automation.md); [ADR-002](../../adr/ADR-002-layered-executive-operating-system.md); [ADR-003](../../adr/ADR-003-chief-of-staff-as-organizational-integrator.md); [ADR-004](../../adr/ADR-004-centralized-measurement-governance.md); [ADR-005](../../adr/ADR-005-shared-knowledge-repository-governance.md); [ADR-006](../../adr/ADR-006-executive-procedures-before-automation.md)

## Related Procedures

* [COS-001](COS-001-executive-decision-facilitation.md), [COS-002](COS-002-strategic-initiative-intake.md), [COS-003](COS-003-weekly-executive-review.md), [COS-004](COS-004-monthly-executive-review.md), [COS-005](COS-005-quarterly-strategic-review.md), [COS-006](COS-006-cross-functional-issue-escalation.md), [COS-008](COS-008-organizational-risk-assessment.md)

## Future Automation Considerations

AI may inventory artifacts, validate metadata/links, compare authority and versions, sample records, detect missing approvals/duplicates, maintain traceability matrices, and monitor corrective actions. Human approval remains required for governance changes, risk acceptance, artifact activation/retirement where authority requires it, and substantive owner validation. Integrations may include repositories, catalog, registers, audit logs, dashboard, and implementation inventory. Automation must not approve itself, amend authority, validate specialized content, silently change business logic, or reactivate a contained implementation.

## Review Cadence

* **Scheduled review:** Quarterly; annual expanded review within the annual operating rhythm.
* **Event-based review triggers:** listed in Trigger and any material governance exception.
* **Review owner:** Chief of Staff.
* **Supporting reviewers:** all affected executives; Analytics for measures; Automation for traceability; CEO for reserved changes.

## Change History

| Version | Date | Status | Change Summary | Rationale | Owner | Approval Record |
|---|---|---|---|---|---|---|
| 1.0 | 2026-07-19 | Active | Initial controlled release | Establish repeatable governance assurance | Chief of Staff | CEO approval recorded by authorization of the Chief of Staff Executive Procedure Library Version 1.0 |
