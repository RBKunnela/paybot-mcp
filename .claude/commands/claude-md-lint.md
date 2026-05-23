CLAUDE.MD LINT — Version-Aware Configuration Audit

You are auditing the project's Claude Code configuration files against the CURRENT Claude Code version to find redundant, outdated, or missing rules.

---

## STEP 1: Version Check

1. Run `claude --version` to get current version
2. Read `.claude/.claude-code-version` for the previously stored version
3. If versions differ, note the upgrade path (e.g., 2.1.80 → 2.1.90)
4. Web search for: `"Claude Code" changelog {version}` OR `site:docs.anthropic.com Claude Code release notes`
5. Also web search: `site:github.com/anthropics/claude-code releases` for detailed changelogs
6. Summarize what's NEW in this version (features, native behaviors, defaults)

If web search returns nothing useful, check `claude --help` for new flags/features and note "changelog not found — manual review recommended."

---

## STEP 2: Read All Configuration

Read these files (all of them, in parallel):

1. `.claude/CLAUDE.md` — main config
2. ALL files in `.claude/rules/*.md` — rule files
3. `.claude/settings.local.json` — hooks configuration

Count total lines and estimate token cost of each file.

---

## STEP 3: Analyze Each Rule

For EVERY section/rule in CLAUDE.md and every file in rules/, classify as:

### KEEP
Rule enforces something SPECIFIC to this project that Claude Code does NOT do natively.
Examples: project-specific naming conventions, AIOS agent authority matrix, story-driven workflow.

### REDUNDANT
Rule enforces something Claude Code NOW does out of the box (based on changelog or known native behavior).
Examples: "use Read tool instead of cat" (native since v2.x), "prefer Edit over sed" (native instruction).

### CONSOLIDATE
Rule exists in multiple places (CLAUDE.md + rules/ file) or overlaps with another rule.
Flag both locations and suggest which to keep.

### HEAVY
Rule is correct but uses too many tokens for its value. Suggest a slimmer version.
Compare: current token cost vs proposed token cost.

### MISSING
Something important that SHOULD be in CLAUDE.md based on the project structure but ISN'T.
Only flag if genuinely needed — don't invent rules.

### ASK USER
Rule where you're unsure if it's still needed. Present the tradeoff and let the user decide.

---

## STEP 4: Output Report

Format the report as:

```
# CLAUDE.md Lint Report
**Claude Code Version:** {version}
**Previous Version:** {previous or "first run"}
**Date:** {today}
**Total Config Size:** {lines} lines (~{tokens} tokens)

## Version Changes
{summary of what's new, or "no changelog found"}

## Findings

### REDUNDANT (remove these)
| Rule | File | Line | Reason | Tokens Saved |
|------|------|------|--------|-------------|
| ... | ... | ... | ... | ... |

### HEAVY (slim these down)
| Rule | File | Current Size | Proposed Size | Savings |
|------|------|-------------|--------------|---------|
| ... | ... | ... | ... | ... |

### CONSOLIDATE (merge these)
| Rule | Locations | Suggestion |
|------|-----------|-----------|
| ... | ... | ... |

### ASK USER (you decide)
| Rule | File | Question |
|------|------|---------|
| ... | ... | ... |

### KEEP (confirmed needed)
| Rule | File | Why |
|------|------|-----|
| ... | ... | ... |

### MISSING (consider adding)
| Rule | Reason |
|------|--------|
| ... | ... |

## Summary
- **Current overhead:** ~{X}k tokens
- **After cleanup:** ~{Y}k tokens (estimated)
- **Savings:** ~{Z}k tokens ({percent}%)
```

---

## STEP 5: Interactive Review

After presenting the report, enter interactive mode:

1. For each REDUNDANT item: "Remove {rule}? (y/n)"
2. For each HEAVY item: "Slim down {rule}? I'll show the proposed version first. (y/n)"
3. For each ASK USER item: Present the tradeoff, wait for decision
4. For each CONSOLIDATE item: "Merge into {location}? (y/n)"

Apply approved changes immediately using Edit tool.

After all changes applied:
- Update `.claude/.claude-code-version` with current version
- Show final token count vs starting token count

---

## KNOWN NATIVE BEHAVIORS (reference)

These are things Claude Code does NATIVELY — rules enforcing these are likely REDUNDANT:

- Prefer Read/Edit/Write/Glob/Grep over bash equivalents (native instruction)
- Conventional commits format (native instruction)
- Don't add unnecessary features/comments/docstrings (native instruction)
- Security vulnerability awareness (native instruction)
- Don't create files unless necessary (native instruction)
- Break down work with TaskCreate (native instruction)
- Call multiple tools in parallel when independent (native instruction)
- Short, concise responses (native instruction)

**Important:** This list may be outdated. Always verify against the ACTUAL current version's behavior by checking the changelog and `claude --help`.

---

## RULES FOR THIS AUDIT

- Be AGGRESSIVE about finding redundancy — the goal is a slim CLAUDE.md
- But NEVER remove project-specific rules (AIOS agents, story workflow, etc.)
- When in doubt, classify as ASK USER, never silently remove
- Show token math — users need to see the cost/benefit
- The target is < 8k tokens total overhead (CLAUDE.md + rules/)
