# Metric Design Guide

The most important decision in AutoResearch: choosing the right metric.

> "If you give it a bad metric, it will very confidently optimize the wrong thing." — David Ondrej
> "Knowing what to measure — this is the skill that will make millionaires." — David Ondrej

---

## The Golden Rules

### 1. ONE number, ONE direction

The metric must be a single scalar value with a clear direction:
- Lower is better (latency, error rate, loss, cost)
- Higher is better (accuracy, throughput, conversion rate, score)

If you need multiple metrics, create a weighted composite score.

### 2. Automated, no human judgment

The evaluation script must compute the metric without human intervention.
If "better" requires a human to look and decide, AutoResearch will not work.

**Works:** execution time, accuracy %, Lighthouse score, Sharpe ratio
**Fails:** "does this design feel right?", "is this copy authentic?", "is this UX intuitive?"

### 3. Deterministic (or low-variance)

Same input should produce the same (or very similar) metric value.
High variance makes it impossible to distinguish real improvements from noise.

**Reduce variance:**
- Run benchmarks N times and take median
- Use fixed random seeds where possible
- Use large enough eval sets
- Control for external factors (network, other processes)

### 4. Fast to compute

The metric must be computable within the time budget.
If evaluation takes 30 minutes, you get ~16 experiments/day instead of ~100/night.

**Target:** evaluation < 20% of total experiment time.

### 5. Correlated with what actually matters

The metric must proxy for real-world success.
Optimizing Lighthouse score is useless if your real problem is bounce rate.

**Ask:** "If this metric improves 10%, does the business/user actually benefit?"

---

## Anti-Patterns (Goodhart's Law)

> "When a measure becomes a target, it ceases to be a good measure."

| Bad Metric | Why It Fails | Better Alternative |
|-----------|-------------|-------------------|
| Lines of code | Agent will add bloat | Execution time, test coverage |
| Raw word count | Agent will add filler | Engagement score, readability |
| Click-through rate alone | Clickbait optimizes CTR but kills trust | CTR + time-on-page composite |
| Test pass rate | Agent will write easy tests | Mutation testing score |
| Response length | Longer ≠ better | Task accuracy + conciseness |

---

## Composite Metrics

When a single metric is insufficient, create a weighted composite:

```python
def composite_score(results):
    """Weighted score combining multiple objectives."""
    score = (
        0.6 * results['primary_metric'] +
        0.3 * results['secondary_metric'] +
        0.1 * results['constraint_penalty']
    )
    return score
```

**Rules for composites:**
1. Primary objective gets highest weight (>50%)
2. Constraints are penalties (subtract from score)
3. Document the weights in program.md so the agent understands trade-offs
4. Test that the composite actually ranks experiments correctly

---

## Metric Validation Checklist

Before starting the loop, verify:

- [ ] The metric is a single scalar number
- [ ] Direction is clear (higher or lower is better)
- [ ] The metric can be computed automatically
- [ ] Evaluation is deterministic (or low-variance with enough samples)
- [ ] Evaluation completes within the time budget
- [ ] The metric correlates with real-world value
- [ ] The metric cannot be trivially gamed
- [ ] The baseline metric value is established and recorded
- [ ] The metric has enough resolution to distinguish small improvements

---

## Quick Decision Tree

```
Is there a number that defines "better"?
├── NO → NOT autoresearch-able (consider human-in-the-loop)
└── YES → Can a script compute that number automatically?
    ├── NO → NOT autoresearch-able (need automated evaluation)
    └── YES → Does the number correlate with real value?
        ├── NO → Find a better metric (Goodhart risk)
        └── YES → Can evaluation run in < 5 minutes?
            ├── NO → Increase time budget or simplify evaluation
            └── YES → GOOD METRIC — proceed with AutoResearch
```
