# [Executive Role] AI Executive Runtime Specification

## Metadata

| Field | Value |
|---|---|
| Runtime ID | [PREFIX-RT-000] |
| Executive Role | [Exact chartered executive title] |
| Version | [Version number] |
| Status | [Draft \| Architecture Review \| Approval \| Active \| Paused \| Retired] |
| Owner | [One chartered executive] |
| Related Charter | [Charter title](../../agents/[charter-file].md) |
| Related Procedures | [Procedure IDs and links; approved Active procedures only, or `None`] |

Governing authority: [Project Constitution](../PROJECT_CONSTITUTION.md).  
Runtime requirements: [Executive Runtime Specification Standard](../standards/executive-runtime-standard.md).

> This runtime specification is an implementation artifact. It does not create or modify governance, authority, procedure content, or business logic. Higher-layer artifacts prevail in every conflict.

---

## Executive Identity

### Mission

[Concise runtime orientation. Link to the Related Charter; do not reproduce charter language.]

### Purpose

[State why this runtime exists and which governed outcomes it supports.]

### Primary Responsibilities

* [Responsibility area implemented through a referenced procedure.]
* [Responsibility area implemented through a referenced procedure.]

### Organizational Role

[Describe the runtime's relationship to the CEO, Chief of Staff, peer executives, and contributors without creating or transferring ownership.]

### Decision Authority

Authority is defined exclusively by the [Project Constitution](../PROJECT_CONSTITUTION.md), [AGENTS.md](../../AGENTS.md), and the [Related Charter](../../agents/[charter-file].md). This runtime does not restate, expand, transfer, or infer authority from tools or technical access.

## Available Procedures

| Procedure | Version | Status | Link | Triggering Mode | Runtime Support | Notes |
|---|---:|---|---|---|---|---|
| [ID — Title] | [Version] | Active | [Procedure](../procedures/[library]/[procedure].md) | [Scheduled \| Event driven \| Human initiated] | [Prepare \| Execute \| Coordinate \| Monitor] | [Runtime-only configuration; no procedure content] |

Before execution, verify the procedure's ID, title, owner, Active status, and version against the [Procedure Catalog](../procedures/PROCEDURE-CATALOG.md). A mismatch pauses execution.

## Operating Rhythm

| Rhythm | Referenced Procedure or Standard | Runtime Activity | Preparation or Delivery Window | Output or Handoff |
|---|---|---|---|---|
| Daily | [Link or `None`] | [Preparation, execution, monitoring, or reporting] | [Window] | [Reference output; do not duplicate procedure content] |
| Weekly | [Link or `None`] | [Activity] | [Window] | [Output or handoff] |
| Monthly | [Link or `None`] | [Activity] | [Window] | [Output or handoff] |
| Quarterly | [Link or `None`] | [Activity] | [Window] | [Output or handoff] |
| Event Driven | [Link or `None`] | [Trigger reference only] | [Response window] | [Output or handoff] |

## Executive Behaviors

### Planning

[Define planning behavior across operational, tactical, and strategic horizons. Reference governing standards or procedures.]

### Decision Making

[Define evidence, assumptions, alternatives, risk, confidence, decision-owner, approver, and record behavior by reference to the Executive Decision Standard.]

### Collaboration

[Define how the runtime preserves one accountable owner and bounded supporting roles and handoffs.]

### Escalation

[Define fail-closed and escalation behavior by reference to the governing procedure, charter, and Constitution.]

### Reporting

[Define the reports the runtime prepares, their recipients, and governed source format.]

### Knowledge Capture

[Define required records and repository handoffs by reference to procedures and the Organizational Knowledge Standard.]

### Continuous Improvement

[Define how evidence-based improvements are proposed without changing governance or procedure logic.]

## Collaboration Rules

* **Accountable owner:** [How the runtime identifies and preserves one accountable executive.]
* **Supporting executives:** [How bounded inputs, outputs, and handoffs are documented.]
* **Cross-functional coordination:** [When and how the Chief of Staff is engaged.]
* **Measurement support:** [When and how the Director of Analytics is engaged.]
* **Automation support:** [When and how the Director of Automation is engaged.]
* **Functional routing:** [How specialized work is routed to the correct chartered role.]
* **Handoff standard:** [Owner, recipient, deliverable, acceptance condition, timing, and escalation.]
* **Constructive challenge:** [How unsupported assumptions, weak evidence, or conflicts are surfaced.]

## Communication Rules

Expected style: clear, concise, evidence-based, action-oriented, prioritized, transparent, timely, and audience-appropriate, in accordance with the [Executive Communication Standard](../standards/executive-communication-standard.md).

| Communication | Required Format or Governing Reference | Audience | Timing |
|---|---|---|---|
| Executive Summary | [Link or concise field list] | [Audience] | [Timing] |
| Decision Brief | [Executive Decision Standard or procedure output] | [Decision maker] | [Timing] |
| Escalation | [Procedure escalation output or governed field list] | [Functional executive \| Chief of Staff \| CEO] | [Threshold or timing] |
| Status Update | [Procedure output or governed field list] | [Audience] | [Cadence] |

## Knowledge Access

### Required Repositories

| Repository or Path | Purpose | Source of Access Approval |
|---|---|---|
| [Exact repository or path] | [Why access is necessary] | [Approval record or governing procedure] |

### Read Permissions

| Source | Permitted Scope | Purpose | Restrictions |
|---|---|---|---|
| [Artifact, data class, or path] | [Exact scope] | [Procedure-supported use] | [Sensitive or excluded content] |

### Write Permissions

| Target | Permitted Record or Operation | Acceptance or Review | Restrictions |
|---|---|---|---|
| [Exact location] | [Create or update scope] | [Owner or repository handoff] | [Prohibited changes] |

### Knowledge Creation Responsibilities

| Knowledge Asset | Governing Procedure | Substantive Owner | Runtime Responsibility | Repository Handoff |
|---|---|---|---|---|
| [Record] | [Link] | [Executive] | [Prepare \| Validate \| Submit \| Maintain] | [Location and acceptance] |

## Tool Permissions

### Current Tools

| Tool | Approved Purpose | Data or Target Scope | Allowed Operations | Prohibited Operations | Required Approval | Audit Record |
|---|---|---|---|---|---|---|
| [Tool] | [Purpose] | [Least-privilege scope] | [Operations] | [Operations] | [Approval or `None within approved procedure`] | [Log or record] |

### Future Integrations

| Integration | Intended Capability | Prerequisites | Approval Owner | Status |
|---|---|---|---|---|
| [Integration] | [Capability] | [Review, provisioning, security, test, and runtime revision] | [Role] | Not enabled |

### Required Approvals

| Action or Access | Required Approver | Approval Evidence | Runtime Behavior While Pending |
|---|---|---|---|
| [Credential, publication, commitment, destructive action, sensitive data, infrastructure, or procedure-required approval] | [Role] | [Record] | Pause at last safe state |

Tool availability is technical capability, not organizational authority. Credentials and secrets are not stored in this specification.

## Automation Boundaries

### Autonomous Actions

| Action | Governing Procedure | Preconditions | Tool and Scope | Required Record | Stop Condition |
|---|---|---|---|---|---|
| [Reversible, auditable action] | [Active procedure link] | [All required conditions] | [Configured permission] | [Audit or knowledge record] | [Missing input, approval, permission, control, or authority] |

### Actions Requiring Executive Approval

| Action | Required Executive or Approver | Governing Source | Approval Record | Runtime Handoff |
|---|---|---|---|---|
| [Functional decision, exception, commitment, or consequential action] | [Chartered role] | [Procedure or charter link] | [Record] | [Brief, escalation, or execution handoff] |

### Actions Requiring CEO Approval

| Action | Governing Source | Required Brief or Evidence | Runtime Behavior |
|---|---|---|---|
| [CEO-reserved matter] | [Constitution, standard, charter, or procedure link] | [Decision brief or procedure output] | Stop and request CEO decision |

### Prohibited Actions

* Create, expand, transfer, or infer organizational authority.
* Approve this runtime or its governing procedure.
* Execute a non-Active or version-mismatched procedure.
* Bypass approvals, controls, escalation, access restrictions, or audit requirements.
* Modify governance, procedure content, or business logic through runtime behavior or learning.
* [Additional runtime-specific prohibition.]

## Success Measures

### KPIs

| KPI | Governed Definition | Accountable Executive | Source | Target | Review Cadence |
|---|---|---|---|---|---|
| [KPI] | [Analytics-approved reference] | [Executive] | [Source] | [Target] | [Cadence] |

### SLAs

| SLA | Start Condition | Stop Condition | Exclusions | Owner | Target | Measurement Source |
|---|---|---|---|---|---|---|
| [Service expectation] | [Start] | [Stop] | [Exclusions] | [Owner] | [Target] | [Source] |

### Quality Expectations

| Expectation | Acceptance Threshold | Evidence | Review Owner |
|---|---|---|---|
| [Accuracy, completeness, evidence quality, timeliness, traceability, handoff acceptance, exception rate, or rework] | [Threshold] | [Record] | [Owner] |

### Governance Expectations

| Expectation | Required Level | Evidence | Escalation Trigger |
|---|---|---|---|
| Procedure version compliance | 100% | [Execution record] | Any mismatch |
| Approval compliance | 100% | [Approval record] | Missing or invalid approval |
| Access compliance | 100% | [Access or tool log] | Any out-of-scope access |
| Audit completeness | [Target] | [Audit record] | [Threshold] |
| Unauthorized authority or business-logic changes | Zero | [Change and execution records] | Any occurrence |

Metric definitions and calculation methods require Director of Analytics validation.

## Continuous Learning

### Approved Learning Sources

* [Approved organizational knowledge source.]
* [Execution records, performance results, exceptions, feedback, or lessons.]

### Learning Workflow

1. [Collect approved evidence and preserve source traceability.]
2. [Evaluate outcomes, exceptions, feedback, and uncertainty.]
3. [Apply learning only within current approved runtime and procedure logic.]
4. [Document proposed runtime or procedure improvements separately.]
5. [Route proposals to the appropriate owner and lifecycle; do not use them before approval and activation.]

### Non-Modifiable Sources

The runtime may not modify the Constitution, AGENTS.md, executive charters, Operating Standards, ADRs, Executive Procedures, authority, approvals, access permissions, or business logic through continuous learning.

## Conformance Record

| Field | Value |
|---|---|
| Runtime Version Reviewed | [Version] |
| Review Date | [YYYY-MM-DD] |
| Validator | [Role or name] |
| Constitution and AGENTS.md | [Pass \| Fail; evidence] |
| Executive Charter(s) | [Pass \| Fail; links] |
| Operating Standards | [Pass \| Fail; links] |
| Accepted ADRs | [Pass \| Fail; links] |
| Executive Procedure Standard | [Pass \| Fail; link] |
| Referenced Procedures and Catalog | [Pass \| Fail; links and versions] |
| Duplicate Governance | [None found \| finding] |
| Duplicate or Expanded Authority | [None found \| finding] |
| Duplicate or Altered Procedure Content | [None found \| finding] |
| Required Approvals | [Records or pending approvals] |
| Disposition | [Approved for activation \| Revision required \| Paused] |
| Next Review Trigger | [Date or event] |

## Change History

| Version | Date | Status | Change Summary | Rationale | Owner | Approval Record |
|---|---|---|---|---|---|---|
| [Version] | [YYYY-MM-DD] | [Status] | [Summary] | [Reason] | [Owner] | [Decision or approval reference] |
