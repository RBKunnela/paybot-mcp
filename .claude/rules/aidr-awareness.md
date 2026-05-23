# AIDR Awareness — AI Decision Record Reference

globs: ["docs/stories/**/*.md", ".aios-core/development/**/*.md", ".claude/rules/**/*.md"]

## What Are AIDRs?

AI Decision Records document WHY the framework makes specific AI design decisions — not just WHAT the system does.
Every AIDR captures: alternatives considered, AI-specific factors, replaceability criteria, and migration paths.

## When to Reference AIDRs

Before modifying any of these areas, check the corresponding AIDR:

| Area | AIDR | Path |
|------|------|------|
| Agent boundaries, adding/removing agents | AIDR-001 | `docs/architecture/aidr/AIDR-001-agent-boundary-design.md` |
| Handoff protocol, token limits, retained count | AIDR-002 | `docs/architecture/aidr/AIDR-002-handoff-protocol-parameters.md` |
| Model routing, tier assignment, fallback chains | AIDR-003 | `docs/architecture/aidr/AIDR-003-model-routing-protocol.md` |
| Persona system, agent names, archetypes | AIDR-004 | `docs/architecture/aidr/AIDR-004-persona-driven-agent-design.md` |
| Task-first architecture, workflow composition | AIDR-005 | `docs/architecture/aidr/AIDR-005-task-first-workflow-design.md` |
| Token economy, 8K budget, audit cycle | AIDR-006 | `docs/architecture/aidr/AIDR-006-token-economy-targets.md` |
| Activation pipeline, parallel loading | AIDR-007 | `docs/architecture/aidr/AIDR-007-unified-activation-pipeline.md` |
| Permission modes, DEV/STAGING/PROD | AIDR-008 | `docs/architecture/aidr/AIDR-008-permission-mode-system.md` |
| Quality foundation, 80% coverage, 2-pass QA | AIDR-009 | `docs/architecture/aidr/AIDR-009-quality-foundation-protocol.md` |
| Session handoff vs autocompact | AIDR-010 | `docs/architecture/aidr/AIDR-010-session-handoff-vs-autocompact.md` |
| Constitution articles, severity levels | AIDR-011 | `docs/architecture/aidr/AIDR-011-constitution-article-design.md` |
| Story Development Cycle, QA loop | AIDR-012 | `docs/architecture/aidr/AIDR-012-story-development-cycle.md` |

## Pre-Phase: AIDR Check (SDC Integration)

When a story touches AI-specific concerns, @architect should check:
1. Does an existing AIDR cover this change? → Reference it in the story
2. Does the change contradict an existing AIDR? → Update the AIDR first
3. Does no AIDR exist for this area? → Create one alongside implementation

**DEV mode:** Advisory (non-blocking)
**STAGING/PROD:** Soft block (override with documented reason)

## AIDR Master Index

Full index: `docs/architecture/aidr/INDEX.md`
Template: `docs/architecture/aidr/templates/aidr-template.md`

## Review Cadence

- **Quarterly (90 days):** @architect reviews all AIDRs for accuracy
- **Event-driven:** New model release → review AIDR-003; Pricing change >20% → review AIDR-006; Agent added/removed → review AIDR-001; Context window change → review AIDR-002, AIDR-010
