# Agent Lifecycle — Enforcement Rule (AIDR-018)

globs: [".aios-core/development/agents/**", ".aios-core/data/agent_lifecycle.yaml", ".claude/hooks/**"]

## Purpose

Every AIOS agent passes through an explicit lifecycle. Prompts are not delivered until the agent reaches `ready_for_prompt`. This rule defines the states, the transitions, and the enforcement.

The full state machine is defined as data in `.aios-core/data/agent_lifecycle.yaml`. This file documents how the harness uses it.

## When This Applies

Every agent activation, every prompt delivery, every handoff. The Stop hook is the primary enforcement point.

## The 7 Lifecycle States

```
spawning → trust_required → loading_context → loading_mcp → ready_for_prompt
                                                                ↓
                                                      prompt_accepted → running
                                                                          ↓
                                                          blocked ←→ running → finished | failed
```

| State | Accepts prompts? | Notes |
|---|---|---|
| spawning | No | Process forked, persona being read |
| trust_required | No | Persona loaded, permissions not yet resolved |
| loading_context | No | Context loader walking dependency graph |
| loading_mcp | No | MCP servers handshaking (slow, deferable) |
| **ready_for_prompt** | **Yes** | Fully loaded, awaiting input |
| prompt_accepted | No (already busy) | Reasoning in flight |
| running | Yes (follow-ups) | Tool calls executing |
| blocked | Yes (clarifications) | Waiting on external input |
| finished | No | Terminal — handoff written |
| failed | No | Terminal — see failure_taxonomy.yaml |

## State Storage

- Path: `.aios/lifecycle/{agent_id}.state`
- Format: JSONL — one transition per line: `{"ts": "2026-04-07T12:34:56Z", "from": "spawning", "to": "trust_required", "trigger": "persona_loaded"}`
- Retention: 30 days, daily rotation
- Read by: Stop hook (for enforcement), `aios doctor` lifecycle-yaml check

## Enforcement by Environment

**DEV** — log violations, never block
**STAGING** — Stop hook blocks prompt delivery if state ∉ {ready_for_prompt, running, blocked}; violations logged to `.aios/lifecycle/violations.jsonl`
**PROD** — same as STAGING + page-on-violation via event router

## Violation Classes

When the Stop hook blocks a prompt, it emits a `LifecycleViolation` failure (see `.aios-core/data/failure_taxonomy.yaml`):

| Violation | Severity | Recovery |
|---|---|---|
| `prompt_to_loading_state` | FAIL | wait for `ready_for_prompt` (30s timeout), then escalate |
| `prompt_to_terminal_state` | FAIL | respawn agent, replay prompt |

## Why This Exists

LLM agents cannot self-report "I'm not ready yet" — they have no introspective access to their own loading state. Without external enforcement, prompts silently land at half-loaded agents and produce confidently-wrong output downstream. SVG-1 (Intent Anchoring) catches this *after the fact*; this rule prevents it *before any prompt is delivered*.

## Adding New States

Edit `.aios-core/data/agent_lifecycle.yaml`:
1. Append to `states:` with `id`, `description`, `is_terminal`, `accepts_prompts`
2. Append to `transitions:` with `from`, `to`, `trigger`
3. Run `aios doctor --check lifecycle-yaml` to verify it parses
4. Update this document if a new violation class emerges

## Synergy with Other AIDRs

- **AIDR-002 (Handoff Protocol)** — handoffs occur between `finished` of agent A and `spawning` of agent B
- **AIDR-007 (Activation Pipeline)** — formalizes the boundaries the pipeline crosses
- **AIDR-017 (Doctor Preflight)** — `aios doctor --check lifecycle-yaml` verifies the schema is intact
- **AIDR-019 (Failure Taxonomy)** — `LifecycleViolation` is a typed failure class with a recovery recipe
- **SVG-1 (Intent Anchoring)** — semantic-intent.md is now produced against a *fully-loaded* agent

## Reference

Schema: `.aios-core/data/agent_lifecycle.yaml`
Decision record: `docs/architecture/aidr/AIDR-018-agent-lifecycle-state-machine.md`
