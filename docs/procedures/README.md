# Executive Procedure Library

## Purpose

This library contains all approved Executive Procedures for the Career Journey Growth Engine.

Executive Procedures define repeatable executive work and are governed by the [Executive Procedure Standard](../standards/executive-procedure-standard.md).

---

## Relationship to the Architecture

Executive Procedures are subordinate to:

* The [Project Constitution](../PROJECT_CONSTITUTION.md).
* [AGENTS.md](../../AGENTS.md).
* [Executive Charters](../../agents/).
* [Executive Operating Standards](../standards/).
* [Architecture Decision Records](../adr/).

Procedures must comply with all higher governance artifacts.

---

## Library Organization

Each executive owns a dedicated procedure directory:

* `chief-of-staff/`
* `vp-revenue/`
* `marketing/`
* `community/`
* `creative/`
* `analytics/`
* `research/`
* `automation/`

---

## Procedure Naming Convention

Procedure filenames use lowercase words separated by hyphens:

`procedure-name.md`

Examples:

* `executive-decision-facilitation.md`
* `campaign-planning.md`
* `pricing-recommendation.md`

---

## Procedure Versioning

Every procedure must include:

* Version.
* Status.
* Owner.
* Review date.
* Change history.

---

## Procedure Status Values

Procedure status must use the lifecycle defined by the Executive Procedure Standard and Executive Procedure Template:

* **Draft:** The accountable executive develops the procedure with required supporting input. It is not approved organizational behavior and may not authorize automation.
* **Architecture Review:** The procedure is reviewed for alignment with governing artifacts, cross-functional handoffs, measurement governance, and knowledge requirements.
* **Approval:** The procedure is submitted to the applicable decision authority. Required approval must be recorded before activation or automation.
* **Active:** The approved version governs execution.
* **Review:** The accountable executive evaluates continued alignment, effectiveness, risks, exceptions, feedback, and organizational learning.
* **Revision:** Proposed changes proceed through architecture review and applicable approval before becoming active.
* **Retirement:** The procedure is withdrawn under applicable decision authority, dependent artifacts are addressed, and the procedure is archived according to the Organizational Knowledge Standard.

---

## Ownership

The accountable executive owns procedure content.

The Chief of Staff governs the Executive Procedure Library as a whole, including organizational consistency and cross-functional integration. This governance does not transfer functional ownership to the Chief of Staff.

---

## Validation

Before approval, every procedure must satisfy the Executive Procedure Standard.

No procedure may bypass constitutional governance.

---

## Automation Policy

AI prompts, AI skills, playbooks, and automations must implement approved Executive Procedures.

They may not redefine governance, authority, or business logic.

---

## Future Growth

Additional executive procedures may be added over time without changing the overall library structure.

New procedures should follow the Executive Procedure Standard and be placed within the appropriate executive directory.
