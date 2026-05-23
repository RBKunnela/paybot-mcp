# Token Economy — The 10 Commandments

Strategic framework for reducing Claude Code token waste. Combines the 10 Commandments methodology (1,020 sessions, 48.6M tokens mapped) with Claude Code source code internals.

## The Waste Formula

```
overhead x turns/session x sessions = TOTAL WASTE

Unoptimized: 57.4k x 30 x 2,000 = 3.4B tok/month = $51,300
Optimized:    7.7k x 30 x 2,000 = 462M tok/month =  $6,930
Savings:                                             -$44,370/month (86.6%)
```

## The 11 Ingestion Phases

| Phase | What | Strategy | Tokens | Controllable? |
|-------|------|----------|--------|---------------|
| F0 | Managed Policy | EAGER (fixed) | ~500 | NO |
| F1 | User Settings | EAGER (fixed) | ~200 | NO |
| F2 | Project Settings | EAGER (fixed) | ~300 | NO |
| F3 | CLAUDE.md | EAGER (fixed) | ~3,000 | YES (slim) |
| F4 | Rules (no globs) | EAGER | ~14,000 | YES (add globs) |
| F4 | Rules (with globs) | LAZY (JIT) | 0 | -- |
| F5 | Auto-memory | EAGER (fixed) | ~2,900 | YES (max 200 lines) |
| F6 | Skills discovery | EAGER (metadata) | ~2,000 | YES (metadata only) |
| F6 | Skills body | LAZY (invoke) | 0 | -- |
| F7 | Commands discovery | EAGER (desc) | ~22,900 | YES (delete unused) |
| F8 | Agents discovery | EAGER (desc) | ~14,200 | YES (delete unused) |
| F9 | MCP tool schemas | EAGER (deferred) | ~5,000 | YES (disable unused) |
| F10 | Git status | EAGER (fixed) | ~800 | NO |
| F11 | System prompt assembly | EAGER (fixed) | ~1,500 | NO |

**Fixed cost zone (F0-F5):** ~8.7k tokens. Accept it.
**Variable cost zone (F6-F9):** 0 to 50k+. **85% of savings come from here.**

## The 10 Commandments

### I. Context = Managed Cache
Each token in the system prompt is charged N times (N = turns). Turn 1 = X tokens. Turn 50 = 50X. "Lost in the Middle": 50k noise is WORSE than 8k clean.

### II. Know the 11 Phases
F0-F5 = fixed low cost. F6-F9 = variable, FOCUS HERE. The system does NOT distinguish "used daily" from "never invoked."

### III. Progressive Disclosure in 3 Layers
- Layer 1 (EAGER): metadata ~100 tok/skill
- Layer 2 (LAZY): body ~2k/skill — only when invoked
- Layer 3 (LAZY): references — only when Claude decides to read

### IV. Filter Schemas Dynamically
MCP tools are deferred by default (source code confirmed). Disable unused MCPs to save ~1k each. 3 unused MCPs x 1k = 3k/session.

### V. Prompt Caching
System prompt cached after turn 1. Turns 2-N pay cache price (~10% of full). BUT: dynamic hooks (additionalContext) can BREAK the cache prefix. Keep headers stable.

**Source code insight:** Sticky header latches (`afkModeHeaderLatched`, `fastModeHeaderLatched`, `cacheEditingHeaderLatched`) exist specifically to preserve cache. Don't toggle modes mid-session.

### VI. Compact Proactively
Auto-compaction triggers at 83.5% context. It's LOSSY. At 50% usage: structured backup. At 70%: controlled /compact. NEVER hit 83.5%.

### VII. Isolate Verbose in Subagents
Without subagent: 50 files x 2k = 100k in context. With subagent: 1.5k summary. 98.5% savings. Rule: expected output > 5k? Delegate.

**Source code insight:** Use `context: fork` for subagents that don't need chat history — inherits prompt cache byte-for-byte, cheaper than `context: conversation`.

### VIII. Every File = Token Tax
762 commands x ~30 avg = 22,860 tok/session. 254 agents x ~56 avg = 14,224 tok/session. 15 rules x ~930 avg = 13,950 tok/session. TOTAL TAX: 53,904 tok/session.

### IX. Instruction != Enforcement
A 2,000 tok rule that INSTRUCTS can become a 20-line validator script: 0 tokens. Enforcement via pre-commit hooks = 0 tokens. Path-specific instructions via glob-rules = 0 until match.

### X. Measure or Don't Manage
- Controllable overhead: TARGET < 8k tokens
- Commands: TARGET < 80
- Agents: TARGET < 30
- Usage ratio: TARGET > 50%
- Audit cycle: every 14 days

## Source Code Internals

### Deferred Tools
```typescript
export function isDeferredTool(tool: Tool): boolean {
  if (tool.alwaysLoad === true) return false
  if (tool.isMcp === true) return true  // Always deferred
}
```
MCP tools cost 0 until ToolSearch is invoked.

### Tool Ordering
Tools sorted alphabetically for cache stability. Adding/removing MCP servers breaks sort order = breaks cache.

### CLAUDE_CODE_SIMPLE
Set `CLAUDE_CODE_SIMPLE=1` to reduce to 3 tools (Bash, Read, Edit). Saves ~8-12k tokens/turn for autonomous loops.

### 25 Hook Events (not just 4-5 documented)

| Hook | Potential |
|------|-----------|
| PreCompact / PostCompact | Save/restore state around compaction |
| TeammateIdle | Detect when swarm workers stop |
| TaskCreated / TaskCompleted | Auto-track progress |
| FileChanged | React to file changes (live monitoring) |
| CwdChanged | Detect directory changes |
| InstructionsLoaded | Hook when CLAUDE.md loads |
| Prompt hooks (type: prompt) | LLM evaluates action using Haiku (~1/60th cost) |
| HTTP hooks (type: http) | Webhook to external dashboards |

### Prompt Hooks (Cheap Safety)
```yaml
hooks:
  PreToolUse:
    - matcher: "Bash(rm *)"
      hooks:
        - type: prompt
          prompt: "Is this delete command safe? $ARGUMENTS"
          model: "haiku"  # Uses Haiku, not Opus
```

*Source: 10 Commandments methodology (1,020 sessions, 48.6M tokens) + Claude Code source code analysis (Mar 2026)*
