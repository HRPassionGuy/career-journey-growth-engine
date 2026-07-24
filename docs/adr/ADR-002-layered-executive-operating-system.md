# ADR-002: Layered Executive Operating System

- Status: Accepted
- Date: 2026-07-19
- Decision Owners: Chief of Staff

## Context

The organization needs a clear hierarchy connecting constitutional authority, executive routing, functional governance, repeatable procedures, and AI-enabled execution. Without an explicit layering model, lower-level implementation artifacts could be mistaken for sources of organizational authority.

## Decision

The system is organized into distinct layers:

1. Project Constitution
2. AGENTS.md routing
3. Executive Charters
4. Executive Operating Standards
5. Executive Procedures
6. Skills and Playbooks
7. Automations
8. AI Execution

Each lower layer must comply with the layers above it.

## Rationale

The hierarchy makes authority traceable from governing principles to execution. It preserves the Constitution as the highest detailed project authority, keeps routing and functional ownership explicit, and prevents implementation mechanisms from redefining policy.

## Consequences

Conflicts are resolved upward through the hierarchy, and every implementation artifact must demonstrate compliance with its governing layers. This adds review work when new procedures or capabilities are introduced, but reduces ambiguity, drift, and unauthorized behavior. Strategic conflicts and decisions reserved by existing governance remain subject to CEO escalation or approval.

## Related Artifacts

- [Project Constitution](../PROJECT_CONSTITUTION.md)
- [AGENTS.md](../../AGENTS.md)
- [Phase 2 Operating Standards Version 1.0](../releases/phase-2-operating-standards-v1.0.md)
- [ADR-001](ADR-001-governance-before-automation.md)
- [ADR-006](ADR-006-executive-procedures-before-automation.md)
