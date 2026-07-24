# Phase 3: Executive Execution Layer

**Version 1.0**

Governing authority: [Project Constitution](../PROJECT_CONSTITUTION.md).

---

# Purpose

Phase 3 establishes the Executive Execution Layer: the governed bridge between the organization's Phase 2 Operating Standards and the implementation mechanisms that perform repeatable executive work.

The purpose of this phase is to translate established authority, standards, and architectural decisions into clear, repeatable, evidence-based Executive Procedures. These procedures will define how executive work is performed without changing who has authority, creating duplicate ownership, or allowing implementation tools to establish organizational policy.

This foundation establishes the common requirements and reusable structure for future Executive Procedures. It does not create any department-specific procedure.

---

# Relationship to the Governing Architecture

Phase 3 operates within the layered executive operating system established by [ADR-002](../adr/ADR-002-layered-executive-operating-system.md):

1. **Project Constitution:** The highest governing authority. Every procedure must comply with its mission, values, executive principles, accountability requirements, evidence standards, decision authority, and escalation framework.
2. **AGENTS.md:** Routes work to one of the eight chartered executives and preserves the required accountable executive and supporting-executive model.
3. **Executive Charters:** Define each executive's mission, responsibilities, authority, boundaries, outputs, and functional ownership. Procedures may operationalize chartered responsibilities but may not expand or transfer authority.
4. **Phase 2 Operating Standards:** Define the organization-wide rules for decisions, initiatives, communication, measurement, operating rhythm, and knowledge. Procedures must comply with all applicable standards and may specify how those standards are executed in a repeatable context.
5. **Executive Procedures:** Define approved organizational behavior for repeatable executive work, including triggers, inputs, responsibilities, steps, decisions, controls, outputs, measures, escalation, and learning.
6. **Skills and Playbooks:** Help people or AI execute approved procedures without changing their business logic or authority.
7. **Automations:** Implement approved parts of procedures within their documented scope and controls.
8. **AI Execution:** Performs authorized work through the governed layers above it.

Accepted Architecture Decision Records document binding architectural decisions within this hierarchy. Every procedure must identify and comply with applicable ADRs. If a lower-layer artifact conflicts with a higher layer, the higher layer prevails.

---

# Execution Artifact Definitions

## Executive Procedures

Executive Procedures are authoritative, approved definitions of repeatable executive work. They establish the accountable executive, purpose, trigger, required inputs, participants, sequence, decision authority, escalation conditions, outputs, measures, risks, controls, exceptions, and knowledge capture requirements.

## Playbooks

Playbooks provide practical guidance for applying an approved procedure in a recurring scenario. They may include examples, checklists, decision aids, or recommended tactics. A playbook helps execution but does not create authority or alter the governing procedure.

## Skills

Skills package instructions, knowledge, or tool-use guidance that enables a person or AI to perform defined parts of an approved procedure. A skill is an execution aid, not a source of organizational policy, decision authority, or business logic.

## Automations

Automations use technology to execute approved, bounded parts of a procedure consistently. They must trace to an approved source procedure, preserve its controls and escalation rules, and remain subject to the accountable executive's ownership.

---

# Procedure Approval Before Automation

Repeatable executive work must be documented and approved as an Executive Procedure before it is implemented through a skill, prompt, workflow, automation, or AI execution mechanism.

Automation does not approve a procedure, create new authority, or independently change business logic. Any proposed business-logic change must first be reviewed and approved in the source procedure under existing decision authority. This requirement implements [ADR-001](../adr/ADR-001-governance-before-automation.md) and [ADR-006](../adr/ADR-006-executive-procedures-before-automation.md).

---

# Proposed Implementation Sequence

Phase 3 should proceed in the following sequence:

1. Approve the [Executive Procedure Standard](../standards/executive-procedure-standard.md) and reusable [Executive Procedure Template](../templates/executive-procedure-template.md).
2. Inventory repeatable executive work and identify the accountable executive, applicable governing artifacts, dependencies, and priority for each procedure candidate.
3. Develop Chief of Staff procedures first because the Chief of Staff coordinates the executive system, cross-functional consistency, operating cadence, decision register, initiative portfolio, and shared repository governance.
4. Validate and approve Chief of Staff procedures under the procedure lifecycle and existing decision authority.
5. Develop functional executive procedures in a coordinated sequence, preserving each executive's chartered authority and identifying supporting executives separately.
6. Validate cross-functional handoffs, measurement definitions, escalation conditions, knowledge capture, and traceability across the procedure library.
7. Approve each procedure before creating or updating any implementing playbook, skill, prompt, workflow, automation, or AI execution mechanism.
8. Review procedure performance through the Executive Operating Rhythm and revise or retire procedures through the governed lifecycle.

This sequence establishes coordination mechanisms before department-specific execution while preserving functional executive ownership. The Chief of Staff is the organizational integrator, not the default owner of other executives' procedures or work.

---

# Phase 3 Foundation Artifacts

The Phase 3 foundation consists of:

* This overview.
* The [Executive Procedure Standard](../standards/executive-procedure-standard.md).
* The [Executive Procedure Template](../templates/executive-procedure-template.md).

Individual Executive Procedures, playbooks, skills, and automations are outside the scope of this foundation.
