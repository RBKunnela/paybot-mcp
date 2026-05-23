# Token Optimization for AutoResearch Loops

Deep dive on reducing token waste during autonomous experiment loops. Based on Claude Code source code analysis (Mar 2026).

## CLAUDE_CODE_SIMPLE Mode

The most impactful optimization. Set before starting the loop:

```bash
export CLAUDE_CODE_SIMPLE=1
```

**What it does:** Reduces tool count from ~42 to 3 (Bash, Read, Edit).
**Why it matters:** Each tool schema costs ~200-500 tokens in the system prompt. 40 extra tools = ~8-12k wasted tokens/turn. Over 100 experiments at 30 turns each = 24-36M tokens saved.

**When to use:** Any autoresearch loop where the agent only needs to:
- Edit the editable file (Edit)
- Run experiments (Bash)
- Parse logs (Read/Bash grep)

**When NOT to use:** If the agent needs web search, MCP tools, or Glob/Grep for exploration.

## Prompt Cache Stability

Claude Code maintains "sticky header latches" to preserve the prompt cache across turns:

```
afkModeHeaderLatched: boolean
fastModeHeaderLatched: boolean
cacheEditingHeaderLatched: boolean
```

**Key rules for cache stability:**
1. **Do NOT add/remove MCP servers mid-session** — tools are sorted alphabetically for cache stability. Changing the list breaks the cache prefix.
2. **Do NOT toggle modes mid-loop** — switching between fast/normal mode invalidates the cached header.
3. **Keep system prompt stable** — any change to CLAUDE.md, rules, or settings during a loop forces cache invalidation.

**Cost impact:** Cache hits cost ~90% less than cache misses. Breaking cache on turn 50 of a 100-experiment session = paying full price for 50 turns = ~$15-25 wasted on a single session.

## Subagent Context Strategy

### Fork vs Conversation

When spawning subagents for analysis tasks:
- **`context: fork`** — Inherits prompt cache byte-for-byte from parent. Cheaper when the subagent doesn't need prior chat history. Use for: result analysis, pattern detection, report generation.
- **`context: conversation`** — Carries full conversation history. Use only when the subagent needs to reference earlier discussion.

### Isolation Rule

Delegate to subagents when expected output > 5k tokens:
- **Without subagent:** 50 files x 2k = 100k tokens polluting parent context
- **With subagent:** Agent(Explore) returns ~1.5k summary to parent
- **Savings:** 98.5% (98.5k tokens)

## Deferred Tools (MCP)

MCP tools are ALWAYS deferred by default in Claude Code:

```typescript
export function isDeferredTool(tool: Tool): boolean {
  if (tool.alwaysLoad === true) return false
  if (tool.isMcp === true) return true  // Always deferred
}
```

This means MCP tool schemas only load when the model explicitly requests them via `ToolSearch`. Our 4+ MCP servers (playwright, exa, context7, brave) cost 0 tokens until invoked.

**Recommendation:** For autoresearch loops, MCP tools are irrelevant. Using `CLAUDE_CODE_SIMPLE=1` ensures they're completely absent from the prompt.

## Session Length Economics

```
overhead_cost = system_prompt_tokens x turns x price_per_token

Short session (10 turns):   8k x 10  = 80k tokens overhead
Long session (100 turns):   8k x 100 = 800k tokens overhead
BUT: 10 short sessions:     8k x 10 x 10 = 800k + 10x startup cost

Amortization: longer sessions spread startup cost across more turns.
Prompt caching: turns 2-N pay cache price (~10% of full price).
```

**For autoresearch:** One 8-hour session >> many 30-minute sessions. The loop runs indefinitely, amortizing the system prompt across ~100+ experiments.

## Pre-Loop Checklist

Before starting an autoresearch experiment loop:

- [ ] Set `CLAUDE_CODE_SIMPLE=1` if only Bash/Read/Edit needed
- [ ] Freeze MCP server configuration (don't add/remove mid-session)
- [ ] Ensure CLAUDE.md and rules are stable (no edits during loop)
- [ ] Close other Claude Code sessions sharing the same API key (avoid rate limits)
- [ ] Verify prompt cache is working: check that turn 2+ cost is ~10% of turn 1
