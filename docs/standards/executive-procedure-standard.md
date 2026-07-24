# Executive Procedure Standard

**Version 1.0**

Governing authority: [Project Constitution](../PROJECT_CONSTITUTION.md).

---

## Purpose

The Executive Procedure Standard establishes the organizational requirements for defining, reviewing, approving, operating, improving, and retiring repeatable executive work.

Its purpose is to translate higher governance layers into clear and traceable execution without changing established authority. It ensures Executive Procedures are consistent, evidence-based, measurable, reusable, and suitable for human or AI-assisted execution before any automation is introduced.

## Scope

An Executive Procedure is an approved, repeatable definition of executive work that operationalizes responsibilities governed by the Project Constitution, AGENTS.md, an executive charter, applicable Executive Operating Standards, and accepted Architecture Decision Records.

An Executive Procedure qualifies when the work has a recurring or reusable trigger, requires consistent organizational behavior, has defined authority and accountability, and produces identifiable outputs or decisions. It may govern departmental or cross-functional work, but it must have one accountable executive.

An Executive Procedure is not:

* A source of new organizational authority or a substitute for the Project Constitution, AGENTS.md, an executive charter, an Operating Standard, or an ADR.
* A one-time strategic initiative, decision record, project plan, or routine conversation.
* A playbook, checklist, reference guide, prompt, skill, workflow, automation, or AI execution mechanism.
* An informal description of work that has not completed the required approval lifecycle.

## Guiding Principles

Every Executive Procedure must follow these principles:

* **One accountable executive:** One chartered executive owns the procedure and its execution. Supporting participants do not share or dilute accountability.
* **Clear authority:** Decision rights, approvals, boundaries, and escalation routes must follow the Constitution, AGENTS.md, and applicable charters.
* **Repeatability:** The procedure must make recurring work executable with consistent expectations while allowing documented judgment where needed.
* **Evidence-based execution:** Inputs, decisions, and evaluations must distinguish evidence, assumptions, interpretations, and uncertainty where relevant.
* **Minimum necessary complexity:** The procedure should contain only the structure, controls, and detail necessary for reliable execution.
* **Traceability:** The procedure must link its authority, requirements, decisions, controls, measures, and changes to governing artifacts and records.
* **Knowledge capture:** Significant decisions, outcomes, lessons, exceptions, and improvements must be preserved according to the Organizational Knowledge Standard.
* **Compliance with higher governance layers:** The procedure and every artifact implementing it must comply with the Project Constitution, AGENTS.md, executive charters, Executive Operating Standards, and accepted ADRs.

## Required Procedure Structure

Every Executive Procedure must include:

1. **Procedure title:** A clear, specific name for the repeatable work.
2. **Version:** The current controlled version.
3. **Status:** The current lifecycle state.
4. **Accountable executive:** One of the eight chartered executives who owns the content and execution.
5. **Purpose:** The organizational outcome the procedure exists to support.
6. **Trigger:** The event, condition, cadence, or approved request that starts the procedure.
7. **Preconditions:** Conditions that must be true before execution begins.
8. **Required inputs:** Information, evidence, approvals, records, or resources needed to execute.
9. **Participants and responsibilities:** Supporting executives or contributors, their bounded responsibilities, required inputs, and expected outputs.
10. **Procedure steps:** The ordered actions, responsible party for each action, and required records or handoffs.
11. **Decision points:** Choices that may alter execution, including decision criteria, decision owner, and required approver where applicable.
12. **Escalation conditions:** Conditions requiring functional, cross-functional, or CEO-level escalation under the constitutional framework.
13. **Outputs:** Required deliverables, records, decisions, handoffs, or state changes.
14. **Success criteria:** Observable completion and outcome conditions.
15. **KPIs or performance indicators:** Measures used to assess effectiveness, with definitions governed by the Director of Analytics.
16. **Risks and controls:** Material risks, preventive or detective controls, control owners, and required evidence.
17. **Exceptions:** Permitted deviations, who may authorize them, documentation requirements, and limits. Exceptions may not bypass higher governance or reserved authority.
18. **Knowledge capture requirements:** Records, decisions, outcomes, lessons, and repository handoffs required by the Organizational Knowledge Standard.
19. **Related standards:** Applicable Executive Operating Standards and other approved standards.
20. **Related charters:** The accountable executive's charter and all supporting charters relevant to execution or handoffs.
21. **Related ADRs:** All accepted ADRs that govern or materially inform the procedure.
22. **Review cadence:** The event-based or time-based schedule for confirming continued accuracy, effectiveness, and alignment.
23. **Change history:** Version, date, change summary, rationale, owner, and approval record for each controlled change.

## Procedure Lifecycle

Every Executive Procedure progresses through these stages:

1. **Draft:** The accountable executive develops the procedure with required supporting input. A draft is not approved organizational behavior and may not authorize automation.
2. **Architecture review:** The procedure is checked against the Constitution, AGENTS.md, relevant charters, Operating Standards, accepted ADRs, cross-functional handoffs, measurement governance, and knowledge requirements. The Chief of Staff coordinates consistency review; relevant functional executives validate their responsibilities; the Director of Analytics validates measurement definitions. Architecture review does not transfer content ownership or reserved decision authority.
3. **Approval:** The procedure is approved by the decision authority applicable to its scope under the Constitution and Executive Decision Standard. CEO-reserved matters require CEO approval. Approval must be recorded before activation or automation.
4. **Active:** The approved version governs execution. Participants use only the current active version, and implementing artifacts must trace to it.
5. **Review:** The accountable executive evaluates performance, alignment, risks, exceptions, user feedback, and organizational learning at the defined cadence or when a material trigger occurs.
6. **Revision:** Proposed changes return through architecture review and applicable approval before becoming active. Material business-logic, authority, control, measurement, or handoff changes may not be implemented silently.
7. **Retirement:** The procedure is withdrawn when no longer required or valid. Retirement follows applicable decision authority, records the rationale and effective date, addresses dependent artifacts, and archives the procedure under the Organizational Knowledge Standard.

## Ownership

* The accountable executive owns the procedure content and execution.
* The Chief of Staff governs cross-functional consistency and the overall procedure library, without becoming the default owner or assuming another executive's functional work.
* The Director of Analytics governs measurement definitions, calculation methodology, measurement quality, data standards, and reporting consistency. Accountable executives retain ownership of objectives, targets, interpretation, corrective action, and outcomes.
* The Director of Automation may automate only approved procedures and may not change their governance or business logic independently.
* Functional executives remain responsible for their departmental authority, specialized work, required contributions, and the substantive accuracy of knowledge produced within their functions.

## Validation Requirements

Before approval, every procedure must be checked for:

* Constitutional alignment.
* Charter alignment.
* Operating Standard alignment.
* ADR alignment.
* Clear ownership.
* Clear handoffs.
* Clear inputs and outputs.
* Defined decision authority.
* Defined escalation conditions.
* Measurable success criteria.
* Knowledge capture.

Validation findings that conflict with a higher governance layer must be resolved before approval. Review completion and any required approvals must be traceable in the procedure record.

## Relationship to Automation

* A procedure defines approved organizational behavior.
* A skill or playbook helps execute a procedure.
* An automation implements approved parts of a procedure.
* Automation does not create new authority.
* Any change to business logic must first be approved in the source procedure.

Every prompt, workflow, skill, playbook, automation, or AI execution mechanism implementing repeatable executive work must trace to an approved, active procedure and remain within its scope, controls, decision authority, and escalation conditions. An automation may not approve its own governing procedure.

## Continuous Improvement

The accountable executive reviews each procedure at its documented cadence and when triggered by a material governance change, repeated exception, control failure, performance gap, significant decision, completed initiative, or relevant organizational learning.

Reviews should use evidence from performance indicators, execution records, risks, exceptions, participant feedback, outcomes, and lessons learned. The accountable executive determines whether to retain, revise, simplify, or recommend retirement of the procedure, with Analytics governing measurement definitions and the Chief of Staff coordinating cross-functional consistency and library status.

Revisions and retirements must follow the Procedure Lifecycle and applicable decision authority. Approved changes must update the version, change history, related implementation artifacts, and required repository records. Functional executives remain responsible for the accuracy and maintenance of specialized knowledge, while the Chief of Staff governs repository organization and lifecycle status.

## Document Ownership

**Document Owner:** Chief of Staff

The Chief of Staff is responsible for maintaining this standard, governing consistency across the procedure library, and recommending updates based on organizational learning. Updates remain subject to the Project Constitution and applicable decision authority.
