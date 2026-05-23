# AutoResearch Viability Checklist

Run through this checklist BEFORE starting an AutoResearch loop. All items in the "Must Pass" section must be YES. Any NO = this domain is NOT autoresearch-able.

---

## Must Pass (ALL must be YES)

- [ ] **Single scalar metric exists** — There is ONE number that defines "better" (e.g., execution time, accuracy, score)
- [ ] **Clear direction** — It's unambiguous whether higher or lower is better
- [ ] **Automated evaluation** — A script can compute the metric without human judgment
- [ ] **Deterministic (or low-variance)** — Same input produces consistent results
- [ ] **Single editable file** — The optimization target fits in ONE file
- [ ] **Timeboxable** — Each experiment can run in a fixed time window (1-10 minutes)
- [ ] **Correctness preservable** — Changes to the editable file don't break fundamental correctness
- [ ] **Git-trackable** — The editable file can be meaningfully diffed and committed

## Should Pass (Strengthen confidence)

- [ ] **Metric correlates with value** — If metric improves 10%, does it actually matter?
- [ ] **Not trivially gameable** — Agent can't cheat the metric (Goodhart's Law)
- [ ] **Sufficient resolution** — Metric has enough decimal precision to distinguish small improvements
- [ ] **Fast feedback** — Evaluation takes < 20% of total experiment time
- [ ] **Rich hypothesis space** — There are many different things the agent could try
- [ ] **Incremental improvement possible** — Small changes can yield small improvements (not all-or-nothing)

## Red Flags (Any YES = reconsider)

- [ ] **Requires human judgment** — "Does this feel right?" (brand, UX, aesthetics)
- [ ] **Multi-file dependency** — Changes require coordinated edits across multiple files
- [ ] **Non-deterministic evaluation** — Results vary wildly between runs
- [ ] **External dependencies** — Metric depends on network, third-party APIs, or other systems
- [ ] **Slow evaluation** — Each experiment takes > 15 minutes to evaluate
- [ ] **Binary outcome** — Metric is pass/fail with no gradient (hard to distinguish improvements)

---

## Verdict

| Result | Action |
|--------|--------|
| All "Must Pass" = YES, no red flags | Proceed with AutoResearch |
| All "Must Pass" = YES, some red flags | Proceed with caution, document mitigations |
| Any "Must Pass" = NO | NOT autoresearch-able — find different approach |

## Domain Quick Reference

| Domain | Viable? | Metric | Notes |
|--------|---------|--------|-------|
| Code performance | YES | execution_ms, lighthouse_score | Highly deterministic |
| ML model training | YES | val_loss, accuracy, bpb | Original Karpathy use case |
| Prompt engineering | YES | accuracy_pct, task_score | Needs large eval set for stability |
| Email subject lines | MAYBE | predicted_open_rate | Need scoring model, not real sends |
| Trading strategies | YES | sharpe_ratio | Historical backtest, deterministic |
| Landing pages | MAYBE | predicted_conversion | Need scoring model or rapid A/B |
| Brand design | NO | Subjective | Requires human judgment |
| UX design | NO | Subjective | "Better" is a feeling |
| Pricing | MAYBE | Revenue | Needs real traffic volume |
| Creative writing | NO | Subjective | Quality is taste-dependent |
| Config tuning | YES | throughput_rps, latency_p99 | Highly measurable |
| SEO content | MAYBE | predicted_ranking | Evaluation is slow (days) |
