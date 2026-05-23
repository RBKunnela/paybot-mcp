# Experiment Quality Checklist

Run this checklist to validate that an AutoResearch experiment is well-designed before starting the autonomous loop.

---

## Pre-Loop Validation

### 3-File Architecture

- [ ] `program.md` exists with all required sections (overview, setup, constraints, metric, output, logging, loop, crash handling)
- [ ] Editable file exists and contains a working baseline
- [ ] Evaluation script exists and is marked as immutable
- [ ] Evaluation script outputs metric in grep-able format: `metric_name: value`

### Baseline Established

- [ ] Baseline run completed successfully
- [ ] Baseline metric recorded in `results.tsv`
- [ ] Baseline committed to git with descriptive message
- [ ] Baseline value is reasonable (not 0, not NaN, not infinity)

### Git Setup

- [ ] Clean working directory (no uncommitted changes)
- [ ] On dedicated branch (`autoresearch/{tag}`)
- [ ] `results.tsv` is in `.gitignore` (not committed)
- [ ] `run.log` is in `.gitignore` (not committed)

### Constraints Documented

- [ ] Time budget specified in program.md
- [ ] Resource limits specified (memory, API calls, etc.)
- [ ] What CAN be modified is explicitly listed
- [ ] What CANNOT be modified is explicitly listed
- [ ] Crash handling protocol is defined
- [ ] Timeout handling protocol is defined

### Metric Quality

- [ ] Metric is a single scalar number
- [ ] Direction (higher/lower is better) is documented
- [ ] Metric has sufficient precision (enough decimal places)
- [ ] Two consecutive runs of the same code produce similar results (variance check)
- [ ] Metric correlates with actual desired outcome

---

## During-Loop Monitoring

### After 5 Experiments

- [ ] At least 1 experiment kept (agent is finding improvements)
- [ ] No more than 3 consecutive crashes (system is stable)
- [ ] Metric values are in expected range (no wild outliers)
- [ ] Git history shows clean commit/reset pattern

### After 20 Experiments

- [ ] Keep rate > 15% (agent is productive, not random)
- [ ] Crash rate < 20% (experiments are well-formed)
- [ ] Metric frontier is improving (best value getting better over time)
- [ ] Agent is trying diverse approaches (not stuck in local optimum)

### Warning Signs

- [ ] 10+ consecutive discards → agent may be stuck, consider resetting strategy
- [ ] 5+ consecutive crashes → fundamental issue with experiment design
- [ ] Keep rate > 80% → metric may be too easy or poorly designed
- [ ] All experiments have identical metric → evaluation may be broken
