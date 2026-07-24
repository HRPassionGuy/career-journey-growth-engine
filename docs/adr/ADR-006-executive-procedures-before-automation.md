# ADR-006: Executive Procedures Before Automation

- Status: Accepted
- Date: 2026-07-19
- Decision Owners: Chief of Staff; Director of Automation

## Context

Repeatable executive work needs an authoritative, reviewable definition before it is encoded in AI skills, prompts, workflows, or automations. Otherwise, implementation artifacts could silently create organizational policy, alter authority, or scale an unapproved process.

## Decision

Repeatable executive work must first be defined as an approved Executive Procedure. AI skills, prompts, workflows, and automations may implement approved procedures but must not independently define organizational behavior or authority.

## Rationale

Executive Procedures create a governed bridge between Operating Standards and implementation. They make ownership, inputs, outputs, controls, escalation, and expected results explicit before automation, consistent with governance-before-automation and the layered operating system.

## Consequences

Automation work must trace to an approved Executive Procedure and remain within its scope. Procedure approval and changes follow existing authority and escalation rules; an automation cannot approve its own governing procedure. This introduces an additional design and review step but improves auditability, consistency, maintainability, and safe delegation to AI.

## Related Artifacts

- [Project Constitution](../PROJECT_CONSTITUTION.md)
- [AGENTS.md](../../AGENTS.md)
- [Chief of Staff Charter](../../agents/chief-of-staff.md)
- [Director of Automation Charter](../../agents/director-automation.md)
- [Executive Decision Standard](../standards/executive-decision-standard.md)
- [ADR-001](ADR-001-governance-before-automation.md)
- [ADR-002](ADR-002-layered-executive-operating-system.md)
