# Failure Taxonomy + Recovery — Enforcement Rule (AIDR-019)

globs: [".aios-core/development/agents/qa.md", ".aios-core/development/tasks/qa-*.md", ".aios-core/data/failure_taxonomy.yaml"]

## Purpose

When a quality gate fails, the failure is **classified** against a closed taxonomy *before* the qa-loop is invoked. Known failure classes get one auto-recovery attempt; persistent failures escalate to the right agent. Unknown failures fall to `Unknown` (catch-all) and route to @aios-master.

The taxonomy is data: `.aios-core/data/failure_taxonomy.yaml`. This file documents how @qa, @dev, and @devops use it.

## When This Applies

Every quality gate failure. Specifically:
- @qa fails any of the 12 quality checks
- @devops push gate fails (lint, typecheck, test, coverage)
- A hook returns non-zero exit
- A tool call errors

## The Rule

**@qa MUST classify a failure before invoking the qa-loop.**

Classification flow:
1. Capture the failure signature (error message, stack trace excerpt, exit code)
2. Match against `signature_patterns` in `failure_taxonomy.yaml`
3. First match wins (`Unknown` is the catch-all at the end)
4. If the matched class has `auto_recovery.action ≠ noop` AND `auto_recovery.max_attempts > 0`, run the recovery once
5. If recovery succeeds, retry the failed check
6. If recovery fails OR no recovery is defined, escalate to `on_recovery_failure.escalate_to`

**The qa-loop iteration counter does NOT increment** when an auto-recovery succeeds. This prevents env failures from burning through the 5-iteration budget.

## The 12 Initial Classes

| Class | Severity | Auto-recovery | Escalates to |
|---|---|---|---|
| `LifecycleViolation` | FAIL | none | @aios-master |
| `McpHandshakeFailure` | WARN | restart_mcp_server | @devops |
| `StaleBranch` | WARN | merge_forward_from_main | @dev |
| `FlakyTest` | WARN | retry_test | @qa |
| `MissingDependency` | WARN | reinstall_dep | @devops |
| `LintRulesetDrift` | WARN | none (human decision) | @dev |
| `TypecheckCacheStale` | WARN | clear_typecheck_cache | @dev |
| `PermissionDenied` | FAIL | none (intentional) | @devops |
| `TokenBudgetExceeded` | WARN | none (handoff) | @aios-master |
| `HookExecutionFailure` | WARN | none (side effects) | @devops |
| `RegistryStale` | WARN | rebuild_registry | @aios-master |
| `Unknown` | FAIL | none (catch-all) | @aios-master |

## Enforcement by Environment

**DEV** — classify but don't auto-recover (observe mode)
**STAGING** — classify + auto-recover; log to `.aios/recovery-log.jsonl`
**PROD** — same as STAGING + qa-loop entry blocked without classification

## Health Metric

The taxonomy is healthy when **≤5% of failures fall to `Unknown`** over a 30-day window. When this threshold is exceeded, framework-audit.js (AIDR-013) auto-prioritizes taxonomy expansion and notifies @aios-master.

## Adding New Classes

When `Unknown` matches the same signature ≥3 times:
1. Edit `.aios-core/data/failure_taxonomy.yaml`
2. Append a new class with `signature_patterns`, `auto_recovery`, `on_recovery_failure`
3. Run `aios doctor --check failure-taxonomy` to verify it parses
4. Test against the historical failures with `node .aios-core/infrastructure/scripts/replay-failures.js` (future tooling)

## Why This Exists

Today AIOS collapses every failure into "QA FAIL → re-run @dev". This:
- Burns 3 iterations on flaky tests that pass on retry
- Re-narrates env failures as if they were bugs
- Loses information across iterations
- Erodes user confidence in agent autonomy

A typed taxonomy with one-shot recovery resolves ~30% of failures at zero LLM cost (estimate from claw-code roadmap data, validation pending in this rollout).

## Synergy with Other AIDRs

- **AIDR-009 (Quality Foundation)** — this rule refines how Pillar 4 (Regression Shield) handles failures
- **AIDR-013 (Enforcement vs Implementation Gap)** — taxonomy is enforcement, not just rules
- **AIDR-017 (Doctor)** — `aios doctor --check failure-taxonomy` verifies the file is well-formed
- **AIDR-018 (Lifecycle)** — `LifecycleViolation` is a member of this taxonomy
- **SVG-1 (Intent Anchoring)** — semantic-intent.md is consulted before classifying as `Unknown` (the failure may not be a failure, just a misalignment with intent)

## Reference

Data: `.aios-core/data/failure_taxonomy.yaml`
Decision record: `docs/architecture/aidr/AIDR-019-failure-taxonomy-recovery.md`
Recovery log: `.aios/recovery-log.jsonl` (created on first auto-recovery)
