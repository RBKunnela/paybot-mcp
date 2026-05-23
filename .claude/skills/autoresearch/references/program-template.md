# Program Template for AutoResearch

Use this template to write `program.md` for any domain. Replace all `{placeholders}` with domain-specific values.

---

# {PROJECT_NAME} — Autonomous Experiment Program

## Overview

An autonomous LLM agent conducts {DOMAIN} research by iteratively improving {WHAT_IS_BEING_OPTIMIZED}. The agent modifies `{EDITABLE_FILE}`, runs fixed-time experiments ({TIME_BUDGET} minutes), evaluates results, and keeps improvements — all without human intervention.

## Setup

1. Agree on a run tag: `autoresearch/{tag}` (e.g., `autoresearch/mar31`)
2. Create a new git branch: `git checkout -b autoresearch/{tag}`
3. Read all in-scope files:
   - `{EDITABLE_FILE}` — the file you will modify
   - `{EVALUATION_SCRIPT}` — the evaluation script (READ-ONLY, do NOT modify)
   - This file (`program.md`) — your instructions
4. Verify prerequisites:
   - {PREREQUISITE_1} (e.g., "data exists at {path}")
   - {PREREQUISITE_2} (e.g., "API key is set in environment")
5. Create `results.tsv` with this header:
   ```
   commit	{METRIC_NAME}	status	description
   ```

## Experimentation

### Time Budget

Each experiment gets exactly **{TIME_BUDGET} minutes** of wall-clock execution time (excluding setup/evaluation overhead). This is non-negotiable — it enables fair comparison between experiments.

### What You CAN Modify

- `{EDITABLE_FILE}` — this is the ONLY file you may edit
- Within it, you may change: {LIST_OF_CHANGEABLE_THINGS}
  - Example: "architecture, hyperparameters, algorithms, data processing, prompts"

### What You CANNOT Modify

- `{EVALUATION_SCRIPT}` — this is READ-ONLY
- `program.md` — these are your instructions
- No new package/dependency installations
- No modifications to the evaluation metric or scoring logic
- {ADDITIONAL_CONSTRAINTS}

### Primary Objective

{METRIC_DIRECTION} `{METRIC_NAME}` ({METRIC_DIRECTION_WORD} is better).

- Metric: `{METRIC_NAME}` — {METRIC_DESCRIPTION}
- Direction: {METRIC_DIRECTION_WORD} (e.g., "lower" or "higher")
- Baseline: ~{BASELINE_VALUE} (established in first run)

### Resource Constraints

- {RESOURCE_1}: {LIMIT} (e.g., "Memory: soft limit, some increase acceptable for meaningful gains")
- {RESOURCE_2}: {LIMIT} (e.g., "API calls: max 100 per experiment")
- Simplicity criterion: prefer simpler solutions when performance is equal

## Output Format

The evaluation script (`{EVALUATION_SCRIPT}`) prints results in this format:

```
---
{METRIC_NAME}:    {value}
{SECONDARY_METRIC_1}: {value}
{SECONDARY_METRIC_2}: {value}
---
```

Extract the primary metric:
```bash
grep "^{METRIC_NAME}:" run.log
```

## Logging Results

Log every experiment in `results.tsv` (tab-separated, NOT comma-separated):

| Column | Type | Description |
|--------|------|-------------|
| commit | string | Git short hash (7 chars) |
| {METRIC_NAME} | float | Achieved metric value (use 0.0 for crashes) |
| status | enum | `keep`, `discard`, or `crash` |
| description | string | Short description of the experimental change |

Example:
```
commit	{METRIC_NAME}	status	description
a1b2c3d	{BASELINE_VALUE}	keep	baseline
b2c3d4e	{IMPROVED_VALUE}	keep	{example improvement description}
c3d4e5f	{WORSE_VALUE}	discard	{example failed change description}
d4e5f6g	0.0	crash	{example crash description}
```

**Important:** Do NOT commit `results.tsv` to git. It stays local.

## The Experiment Loop

**LOOP FOREVER** (until manually stopped):

1. Check current state: `git log --oneline -3` and review `results.tsv`
2. Generate a hypothesis: What change might improve `{METRIC_NAME}`?
   - Review what worked and what didn't in previous experiments
   - Try diverse approaches — don't just tweak the same parameter
   - Consider: {DOMAIN_SPECIFIC_HYPOTHESIS_GUIDANCE}
3. Modify `{EDITABLE_FILE}` to implement the hypothesis
4. Commit: `git add {EDITABLE_FILE} && git commit -m "{description}"`
5. Run experiment:
   ```bash
   {RUN_COMMAND} > run.log 2>&1
   ```
6. Extract results:
   ```bash
   grep "^{METRIC_NAME}:" run.log
   ```
7. Handle outcomes:
   - **Crash** (grep returns empty):
     - `tail -n 50 run.log` to see error
     - If trivial bug: fix and retry
     - If fundamental failure: log as crash, move on
   - **Improved** ({METRIC_NAME} {COMPARISON_OPERATOR} previous best):
     - Keep the commit (branch advances)
     - Log as `keep` in results.tsv
   - **Worse or equal**:
     - `git reset --hard HEAD~1` (revert to previous state)
     - Log as `discard` in results.tsv
8. Append result to `results.tsv`
9. **GOTO step 1 — NEVER ask "should I continue?" — keep running forever**

### Timeout Handling

- If experiment exceeds {TIMEOUT_MINUTES} minutes: kill the process
- Log as `crash` with description "timeout — exceeded {TIMEOUT_MINUTES}min budget"
- Continue to next experiment

### Consecutive Crash Recovery

- If 3+ consecutive crashes: step back, try a completely different approach
- Review what the last successful experiment looked like
- Reset to last known good state if needed

---

**Expected throughput:** ~{EXPERIMENTS_PER_HOUR} experiments/hour = ~{EXPERIMENTS_OVERNIGHT} over 8 hours

**Remember:** You are autonomous. The human may be sleeping. Never pause, never ask permission, never stop unless explicitly interrupted.
