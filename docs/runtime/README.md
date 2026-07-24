# AI Executive Runtime Specification Library

**Library Version:** 1.0  
**Status:** Architecture Review  
**Owner:** Chief of Staff  
**Review Date:** 2026-07-19

This directory contains the implementation configuration for the eight AI executives routed by [AGENTS.md](../../AGENTS.md). Each runtime is subordinate to the [Project Constitution](../PROJECT_CONSTITUTION.md), its controlling charter, the [Operating Standards](../standards/), accepted [ADRs](../adr/), and its Active [Executive Procedures](../procedures/PROCEDURE-CATALOG.md). The [Executive Runtime Specification Standard](../standards/executive-runtime-standard.md) and [runtime template](../templates/executive-runtime-template.md) control library structure.

Runtime specifications configure identity, monitoring, invocation, collaboration, cadence, knowledge access, communication, tool readiness, and fail-closed execution. They do not create authority, reproduce governance, or restate procedure steps. Procedure libraries remain the executable source for triggers, inputs, controls, decisions, escalation, outputs, and records.

## Runtime Inventory

| Runtime | Runtime ID | Executive | Charter | Procedure Library |
|---|---|---|---|---|
| [Chief of Staff](chief-of-staff-runtime.md) | COS-RT-001 | Chief of Staff | [Charter](../../agents/chief-of-staff.md) | [COS](../procedures/chief-of-staff/) |
| [VP of Revenue](vp-revenue-runtime.md) | REV-RT-001 | VP of Revenue | [Charter](../../agents/vp-revenue.md) | [REV](../procedures/vp-revenue/) |
| [Marketing Director](marketing-director-runtime.md) | MKT-RT-001 | Marketing Director | [Charter](../../agents/marketing-director.md) | [MKT](../procedures/marketing/) |
| [Creative Director](creative-director-runtime.md) | CRE-RT-001 | Creative Director | [Charter](../../agents/creative-director.md) | [CRE](../procedures/creative/) |
| [Director of Analytics](analytics-director-runtime.md) | ANA-RT-001 | Director of Analytics | [Charter](../../agents/director-analytics.md) | [ANA](../procedures/analytics/) |
| [Director of Research & Product Development](research-product-development-runtime.md) | RPD-RT-001 | Director of Research & Product Development | [Charter](../../agents/director-research-product-development.md) | [RPD](../procedures/research/) |
| [Director of Community](community-director-runtime.md) | COM-RT-001 | Director of Community | [Charter](../../agents/director-community.md) | [COM](../procedures/community/) |
| [Director of Automation](automation-director-runtime.md) | AUT-RT-001 | Director of Automation | [Charter](../../agents/director-automation.md) | [AUT](../procedures/automation/) |

## Governance and Procedure Relationship

Precedence and routing are defined by the Constitution, AGENTS.md, and [ADR-002](../adr/ADR-002-layered-executive-operating-system.md). The Chief of Staff integration model follows [ADR-003](../adr/ADR-003-chief-of-staff-as-organizational-integrator.md); measurement follows [ADR-004](../adr/ADR-004-centralized-measurement-governance.md); knowledge stewardship follows [ADR-005](../adr/ADR-005-shared-knowledge-repository-governance.md); and procedure-before-automation sequencing follows [ADR-006](../adr/ADR-006-executive-procedures-before-automation.md). [ADR-001](../adr/ADR-001-governance-before-automation.md) keeps governance ahead of implementation.

Each runtime may invoke only the versioned Active procedures listed in its specification. Any status/version mismatch, missing evidence, missing approval, ambiguous ownership, or access uncertainty pauses execution at the last safe state and routes the issue under the controlling source.

## Future AI Agents

These files are deployment inputs, not deployed agents. A future agent must be provisioned with least-privilege knowledge and tools, validated through the runtime lifecycle, explicitly approved, and activated at a controlled version. Tool availability never grants organizational authority. Future integrations named in a runtime remain unavailable until reviewed, approved, provisioned, tested, and recorded in an Active runtime revision.

## Library Validation

The version 1.0 review covers all eight runtimes and confirms inventory completeness, charter and procedure-library coverage, eight-by-eight collaboration coverage, consistent escalation routing, consistent role terminology, reference-based governance, and absence of copied procedure steps. Activation approval and platform-specific access provisioning remain deployment-stage records; they do not affect this architecture-review library's internal conformance.
