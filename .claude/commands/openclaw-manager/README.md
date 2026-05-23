# OpenClaw Manager -- Fleet Orchestrator

> Unified orchestration layer connecting the 3 OpenClaw squads (setup + skill-factory + ops). E2E Pipeline: Memory Extraction > Credentials > Setup > Skills > Ops > Monitoring.

## Overview

| Metric | Value |
|--------|-------|
| **Agents** | 4 specialists |
| **Tasks** | 7 executable tasks |
| **Checklists** | 1 provision checklist |
| **Workflows** | 3 multi-phase pipelines |
| **Templates** | 6 output templates |
| **Data Files** | 1 fleet registry schema |
| **Domain** | ai-agent-management |

## Architecture

```
TIER 0: ORCHESTRATOR
  openclaw-chief       Fleet Orchestrator — routing, coordination, cross-squad handoffs

TIER 1: SPECIALISTS
  claw-provisioner     Provisioning Pipeline Manager (delegates to openclaw-setup, openclaw-skill-factory)
  skill-ops            Skill Lifecycle Manager (delegates to openclaw-skill-factory, openclaw-ops)
  fleet-monitor        Fleet Health & Dashboard
```

### Delegates To

| Squad | Responsibility |
|-------|---------------|
| **openclaw-setup** | Identity + Infra + Memory + Immune System |
| **openclaw-skill-factory** | Skill creation + testing + deployment |
| **openclaw-ops** | Daily operations + ClickUp + VPS sync |

### Owns

- Fleet registry (multi-claw)
- Credential collection + validation
- Cross-squad handoffs (automated)
- Health monitoring (fleet-wide)
- Dashboard / reporting

## Tasks (7)

| Task | Description |
|------|-------------|
| `provision-new-claw` | Provision New Claw |
| `memory-extraction` | Extract Profile via User's AI Memory |
| `credential-collection` | Collect & Validate Credentials |
| `fleet-health` | Fleet Health Check |
| `skill-inventory` | Skill Registry Sync |
| `upgrade-existing-claw` | Brownfield Upgrade -- Audit & Remediate |
| `daily-ops` | Daily Fleet Operations |

## Workflows (3)

| Workflow | Description |
|----------|-------------|
| `wf-provision` | Provision New Claw -- E2E Pipeline |
| `wf-brownfield-upgrade` | Brownfield Upgrade -- Audit & Remediate Existing Claw |
| `wf-daily-fleet` | Daily Fleet Operations |

## Quick Start

```bash
# Use the orchestrator (routes to correct specialist)
/openclaw-manager:openclaw-chief

# Or invoke specialists directly:
/openclaw-manager:claw-provisioner    # Provision new claws
/openclaw-manager:skill-ops           # Skill lifecycle management
/openclaw-manager:fleet-monitor       # Fleet health & dashboard

# Tasks:
/openclaw-manager:tasks:provision-new-claw
/openclaw-manager:tasks:credential-collection
/openclaw-manager:tasks:fleet-health
```

## Veto Conditions

| ID | Trigger | Severity |
|----|---------|----------|
| VT-OC-001 | Create skill without active claw | VETO |
| VT-OC-002 | Setup without SOUL.md filled | VETO |
| VT-OC-003 | Deploy skill without security checklist | VETO |
| VT-OC-004 | Ops without automated health check | VETO |
| VT-OC-005 | Multi-claw without centralized registry | VETO |
| VT-OC-006 | Manual handoff between squads | VETO |
| VT-OC-007 | Complete setup without validated credentials | VETO |
| VT-OC-008 | Hardcoded credential in any file | CRITICAL VETO |
| VT-OC-009 | Create SKILL.md via heredoc on VPS | VETO |

## Source

Squad source: `squads/openclaw-manager/`
Config: `squads/openclaw-manager/config.yaml`

## Version

- **v1.0.0** -- Initial commands installation (2026-03-30)
- Author: Pedro Valerio (arq-structure)
