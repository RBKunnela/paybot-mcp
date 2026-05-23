# 14-Day Token Audit Checklist

Recurring audit to keep token overhead under control. Run every 14 days.

## Targets

| Metric | Target | Current |
|--------|--------|---------|
| Controllable overhead | < 8k tokens | ______ |
| Commands count | < 80 | ______ |
| Agents count | < 30 | ______ |
| Rules (eager, no globs) | < 5 | ______ |
| MCP servers active | < 3 | ______ |
| CLAUDE.md lines | < 200 | ______ |
| MEMORY.md lines | < 120 | ______ |
| Usage ratio (invoked/total) | > 50% | ______ |

## Phase 1: Measure (Day 1)

- [ ] Run `/context-surgeon scan` to measure current overhead
- [ ] Count commands: `find .claude/commands -name "*.md" | wc -l`
- [ ] Count agents: `find .claude/agents -name "*.md" | wc -l`
- [ ] Count eager rules: `find .claude/rules -name "*.md" | wc -l` (no globs = eager)
- [ ] Count active MCPs: check `settings.local.json` mcpServers
- [ ] Measure CLAUDE.md: `wc -l .claude/CLAUDE.md`
- [ ] Measure MEMORY.md: `wc -l` of auto-memory MEMORY.md

## Phase 2: Identify Waste (Day 1-2)

- [ ] List commands never invoked in last 14 days (candidate for deletion)
- [ ] List agents never activated in last 14 days (candidate for deletion)
- [ ] List rules without glob patterns (candidate for adding globs)
- [ ] List rules that are pure enforcement (candidate for hook conversion)
- [ ] List MCP servers not used in last 14 days (candidate for disabling)
- [ ] Check MEMORY.md for entries older than 14 days (candidate for trimming)

## Phase 3: Cut (Day 2-3)

- [ ] Delete unused commands (or move to `.deprecated/`)
- [ ] Delete unused agents (or move to `.deprecated/`)
- [ ] Add glob patterns to path-specific rules
- [ ] Convert enforcement rules to pre-commit hooks (0 tokens)
- [ ] Disable unused MCP servers in settings
- [ ] Trim MEMORY.md (remove stale entries)
- [ ] Slim CLAUDE.md if > 200 lines

## Phase 4: Verify (Day 3)

- [ ] Re-run `/context-surgeon scan` to measure new overhead
- [ ] Confirm overhead < 8k tokens
- [ ] Confirm no broken references (run `dead-refs.sh`)
- [ ] Verify all actively used commands/agents still work

## Phase 5: Prevent (Ongoing)

- [ ] Set calendar reminder for next audit (14 days from now)
- [ ] Before adding new command/agent, check if existing one covers the need
- [ ] New rules: always add glob unless truly universal
- [ ] New MCPs: start disabled, enable only when needed

## Quick Wins (Do First)

1. **Commands with 0 invocations** — delete immediately, highest token tax per item (~30 tok each)
2. **Rules without globs** — add glob patterns, saves ~930 tok each
3. **Enforcement rules** — convert to hooks, saves ~2k tok each
4. **Unused MCPs** — disable in settings, saves ~1k each
