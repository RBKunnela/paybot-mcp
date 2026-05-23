---
name: autoresearch
description: |
  Autonomous experiment loop based on the Karpathy AutoResearch pattern.
  Set up and run hundreds of experiments overnight — the agent hypothesizes,
  modifies code, evaluates results, keeps improvements, discards failures.

  Use when: optimizing anything with a measurable scalar metric —
  code performance, prompts, copy, configs, algorithms, model training.

  Domains: optimization, experimentation, A/B testing, prompt tuning,
  code performance, ML training, marketing copy, trading strategies.
---

# AutoResearch

Autonomous experiment loop: hypothesize, modify, run, evaluate, commit or reset. Repeat.

Based on Andrej Karpathy's AutoResearch pattern (github.com/karpathy/autoresearch).

## Core Concept

The Karpathy Loop runs hundreds of experiments overnight:

```
Hypothesize → Modify ONE file → Run (timeboxed) → Evaluate metric
  ├── Better? → git commit (keep improvement)
  └── Worse?  → git reset  (discard, try again)
REPEAT FOREVER until manually stopped
```

**Formula:** one editable file + one scalar metric + a timeboxed loop = AutoResearch-able.

## The 3-File Architecture

Every AutoResearch project needs exactly 3 files:

| File | Who Edits | Purpose |
|------|-----------|---------|
| `program.md` | Human | Goals, constraints, rules, what "better" means |
| The editable file | AI Agent | The ONE file the agent modifies each experiment |
| The evaluation script | Nobody | Fixed scoring — measures results, outputs the metric |

**Critical invariant:** The evaluation script is IMMUTABLE. If the agent could edit it, it would rewrite scoring to fake improvements.

## Viability Check

Before starting, verify the domain passes ALL criteria. Load `checklists/viability-checklist.md` and run through it.

**Quick check — all must be YES:**

1. Is there a single scalar metric that defines "better"?
2. Can that metric be computed automatically (no human judgment)?
3. Can the optimization target fit in ONE editable file?
4. Can each experiment run in a fixed time window (1-10 min)?
5. Is the evaluation deterministic (same input = same score)?

If ANY answer is NO, this domain is NOT autoresearch-able. Consider alternatives.

## Setup Phase

### Step 1: Define the Domain

Identify clearly:
- **What to optimize:** (code speed, prompt accuracy, copy CTR, model loss, etc.)
- **The metric:** ONE scalar number, lower-is-better or higher-is-better
- **The editable file:** ONE file the agent will modify
- **The evaluation method:** How to compute the metric automatically
- **Time budget:** How long each experiment runs (default: 5 minutes)

### Step 2: Create Project Structure

Create the project directory with the 3-file architecture:

```
project-name/
├── program.md          # Agent instructions (generate from template)
├── {editable-file}     # The ONE file to optimize (e.g., train.py, prompt.txt, config.yaml)
├── evaluate.{ext}      # Evaluation script (e.g., evaluate.py, evaluate.sh)
└── results.tsv         # Experiment log (created by agent, not committed)
```

### Step 3: Write program.md

Use the template at `references/program-template.md`. Adapt it to the domain.

**Required sections in program.md:**
1. **Overview** — What the agent is optimizing and why
2. **Setup** — Initial steps (read files, verify prerequisites, create results.tsv)
3. **Constraints** — What CAN and CANNOT be modified, time budget, resource limits
4. **Metric** — The ONE number to optimize, direction (lower/higher is better)
5. **Output format** — How the evaluation script reports results
6. **Logging** — TSV format specification (commit, metric, status, description)
7. **Experiment loop** — The infinite loop instructions
8. **Crash handling** — What to do when experiments fail

### Step 4: Write the Evaluation Script

The evaluation script MUST:
- Be deterministic (same input = same output)
- Output the metric in a grep-able format: `metric_name: value`
- Run within the time budget
- Exit cleanly (exit code 0 on success, non-zero on failure)
- NOT be modifiable by the agent

### Step 5: Create Baseline

Run the evaluation once with the initial editable file to establish baseline:

```bash
# Run evaluation
{run-command} > run.log 2>&1

# Extract metric
grep "^{metric_name}:" run.log
```

Record the baseline in `results.tsv`:
```
commit	{metric_name}	status	description
{hash}	{value}	keep	baseline
```

### Step 6: Start the Loop

Hand off to the agent with:

> Read program.md and start autonomous experiments. Do not ask permission to continue — run the loop until I stop you.

## The Experiment Loop (Agent Execution)

Once started, the agent follows this cycle:

```
1. Review results history (results.tsv) — identify what worked, what didn't
2. Generate hypothesis — what change might improve the metric?
3. Modify the editable file — implement the hypothesis
4. git commit — snapshot the experiment
5. Run evaluation — execute within time budget
   → Redirect output: {run-command} > run.log 2>&1
6. Extract metric — grep "^{metric_name}:" run.log
7. Decide:
   a. If IMPROVED: keep commit, update branch, log as "keep"
   b. If WORSE/EQUAL: git reset --hard HEAD~1, log as "discard"
   c. If CRASHED: log as "crash", diagnose, continue
8. Append to results.tsv (DO NOT commit results.tsv)
9. GOTO 1 — NEVER stop, NEVER ask "should I continue?"
```

**Crash protocol:**
- If experiment crashes, read last 50 lines of run.log
- If trivial bug (typo, import error): fix and retry
- If fundamental failure (OOM, architecture incompatible): log as crash, move on
- If >3 consecutive crashes: try a completely different approach

**Timeout protocol:**
- If experiment exceeds 2x the time budget: kill the process
- Log as crash with description "timeout"
- The time budget is a HARD constraint for fair comparison

## Results Tracking

All results are logged in `results.tsv` (tab-separated, NOT comma-separated):

```
commit	metric_value	status	description
a1b2c3d	0.997900	keep	baseline
b2c3d4e	0.993200	keep	increase learning rate to 0.04
c3d4e5f	1.005000	discard	switch to GeLU activation
d4e5f6g	0.000000	crash	double model width (OOM)
```

**Status values:**
- `keep` — metric improved, commit preserved
- `discard` — metric worse or equal, commit reverted
- `crash` — experiment failed to complete

**Git tracking:**
- Each experiment = one atomic commit
- Kept experiments advance the branch
- Discarded experiments are reverted (`git reset`)
- `results.tsv` is NOT committed (stays local)

## Analysis

After stopping the loop, analyze results:

1. **Count outcomes:** How many keep/discard/crash?
2. **Best metric:** What's the best value achieved?
3. **Improvement trajectory:** Plot metric over time (the "frontier")
4. **Winning patterns:** What types of changes tend to improve the metric?
5. **Failed patterns:** What types of changes consistently fail?
6. **Recommendations:** Based on patterns, what should be tried next?

## Token Optimization for Experiment Loops

AutoResearch loops are long-running, autonomous sessions. Token efficiency is critical.

### CLAUDE_CODE_SIMPLE Mode

The experiment loop only needs 3 tools: `Bash` (run experiments), `Read` (parse logs), `Edit` (modify the editable file). Set this environment variable before starting the loop:

```bash
export CLAUDE_CODE_SIMPLE=1
```

This strips the tool schema from ~42 tools down to 3, saving ~5-10k tokens/turn. Over 100 experiments at ~30 turns each, this saves millions of tokens.

### Subagent Context Strategy

When spawning subagents for analysis (e.g., pattern analysis after experiments):
- Use `context: fork` (not `context: conversation`) — fork inherits the prompt cache byte-for-byte, cheaper when the subagent doesn't need prior chat history
- Delegate verbose operations (reading 50+ files, large result analysis) to subagents — keeps parent context clean

### MCP Stability

Do NOT add/remove MCP servers mid-session. Tools are ordered alphabetically for prompt cache stability. Changing the tool list breaks the cache prefix and forces a full re-read. Freeze your MCP configuration before starting the loop.

### Session Length

Longer sessions amortize the system prompt overhead. The autoresearch loop is ideal for this — one long session running 8+ hours is far cheaper per-experiment than many short sessions.

## Domain-Specific Examples

Load `references/domain-examples.md` for detailed examples in:
- Code performance optimization (Lighthouse, execution time)
- Prompt engineering (eval accuracy, task score)
- Marketing copy (CTR, open rate, conversion)
- ML model training (val_bpb, accuracy, loss)
- Trading strategies (Sharpe ratio, returns)
- System configuration (throughput, latency)

## Bundled Resources

| Resource | Purpose |
|----------|---------|
| `references/program-template.md` | Template for writing program.md |
| `references/domain-examples.md` | Domain-specific adaptation examples |
| `references/metric-design-guide.md` | How to choose the right metric |
| `references/token-optimization.md` | Deep dive on CLAUDE_CODE_SIMPLE, cache, subagents |
| `checklists/viability-checklist.md` | Is this domain autoresearch-able? |
| `checklists/experiment-quality.md` | Is the experiment well-designed? |
