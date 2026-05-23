# AutoResearch Domain Examples

Concrete examples of adapting the 3-file pattern to different domains.

---

## 1. Code Performance Optimization

**Metric:** Execution time (ms) — lower is better
**Editable file:** `optimize.js` (or `.py`, `.ts`, etc.)
**Evaluation:** Run the function N times, report median execution time

```
program.md constraints:
- Only modify optimize.js
- Cannot change the test harness or input data
- Each run: 2 minutes (compile + execute + benchmark)
- Must produce identical output (correctness check)

evaluate.sh:
  node benchmark.js > run.log 2>&1
  # Outputs: execution_ms: 45.2

results.tsv:
  commit  execution_ms  status  description
  a1b2c3d 50.0         keep    baseline
  b2c3d4e 45.2         keep    replace forEach with for loop
  c3d4e5f 51.0         discard switch to Map (slower for small sets)
```

---

## 2. Prompt Engineering

**Metric:** Task accuracy (%) — higher is better
**Editable file:** `system-prompt.txt`
**Evaluation:** Run prompt against eval set, measure correct answers

```
program.md constraints:
- Only modify system-prompt.txt
- Cannot change the eval set or scoring logic
- Each run: 3 minutes (API calls + scoring)
- Budget: max 50 API calls per experiment
- Try different: phrasings, languages, complexity levels, examples

evaluate.py:
  - Loads system-prompt.txt
  - Runs 50 test cases through the LLM
  - Scores each response (correct/incorrect)
  - Outputs: accuracy_pct: 78.0

results.tsv:
  commit  accuracy_pct  status  description
  a1b2c3d 72.0         keep    baseline prompt (English)
  b2c3d4e 78.0         keep    add 3 few-shot examples
  c3d4e5f 71.0         discard try Portuguese translation
  d4e5f6g 80.5         keep    add chain-of-thought instruction
```

---

## 3. Website Performance (Lighthouse)

**Metric:** Lighthouse performance score — higher is better
**Editable file:** `index.html` (or `styles.css`, `main.js`)
**Evaluation:** Run Lighthouse audit, extract performance score

```
program.md constraints:
- Only modify index.html
- Cannot change the Lighthouse config or test URL
- Each run: 2 minutes (build + serve + audit)
- Must maintain visual appearance (no breaking layout)

evaluate.sh:
  npm run build
  lighthouse http://localhost:3000 --output=json > audit.json
  node extract-score.js audit.json > run.log
  # Outputs: lighthouse_score: 85

results.tsv:
  commit  lighthouse_score  status  description
  a1b2c3d 72               keep    baseline
  b2c3d4e 85               keep    lazy-load images, defer scripts
  c3d4e5f 83               discard inline critical CSS (marginal)
```

---

## 4. Marketing Copy (Email Subject Lines)

**Metric:** Predicted open rate score — higher is better
**Editable file:** `subjects.txt` (list of subject lines)
**Evaluation:** Score subjects using a pre-trained engagement model or heuristic scorer

```
program.md constraints:
- Only modify subjects.txt
- Cannot change the scoring model or evaluation logic
- Each run: 1 minute (score all subjects)
- Generate 10 subject line variants per experiment
- Maintain brand voice (no clickbait, no ALL CAPS)

evaluate.py:
  - Loads subjects.txt
  - Scores each line on: length, power words, curiosity gap, urgency
  - Outputs: engagement_score: 7.8 (weighted composite, 0-10)

results.tsv:
  commit  engagement_score  status  description
  a1b2c3d 6.2              keep    baseline subjects
  b2c3d4e 7.8              keep    add curiosity gaps and numbers
  c3d4e5f 6.0              discard try emoji-heavy subjects
```

---

## 5. Trading Strategy

**Metric:** Sharpe ratio — higher is better
**Editable file:** `strategy.py` (buy/sell rules)
**Evaluation:** Backtest against historical data, compute Sharpe ratio

```
program.md constraints:
- Only modify strategy.py
- Cannot change historical data, backtest engine, or fee model
- Each run: 5 minutes (full backtest over 5 years of data)
- Must maintain reasonable position sizing (no all-in bets)
- Must handle transaction costs

evaluate.py:
  - Loads strategy.py
  - Runs backtest on 5 years of daily price data
  - Computes: Sharpe ratio, max drawdown, total return
  - Outputs: sharpe_ratio: 1.45

results.tsv:
  commit  sharpe_ratio  status  description
  a1b2c3d 0.8          keep    baseline moving average crossover
  b2c3d4e 1.45         keep    add RSI filter for entry timing
  c3d4e5f 0.6          discard mean reversion strategy (worse)
```

---

## 6. ML Model Training (Original Karpathy Use Case)

**Metric:** val_bpb (validation bits per byte) — lower is better
**Editable file:** `train.py` (model architecture + optimizer + hyperparameters)
**Evaluation:** `prepare.py` → `evaluate_bpb()` function (immutable)

```
program.md constraints:
- Only modify train.py
- Cannot modify prepare.py, install packages, or change evaluation
- Each run: 5 minutes of wall-clock training time
- Metric: val_bpb (vocab-size-independent, lower is better)
- VRAM: soft limit, some increase acceptable for meaningful gains
- Simplicity criterion: prefer simpler solutions

results.tsv:
  commit  val_bpb   memory_gb  status  description
  a1b2c3d 0.997900  44.0       keep    baseline
  b2c3d4e 0.993200  44.2       keep    increase LR to 0.04
  c3d4e5f 1.005000  44.0       discard switch to GeLU activation
  d4e5f6g 0.000000  0.0        crash   double model width (OOM)
```

---

## 7. System Configuration / Infrastructure

**Metric:** Throughput (requests/second) or latency (p99 ms) — higher/lower is better
**Editable file:** `config.yaml` (nginx config, database tuning, app settings)
**Evaluation:** Load test, measure throughput/latency

```
program.md constraints:
- Only modify config.yaml
- Cannot change the load test script or monitoring
- Each run: 3 minutes (warm up + load test + cool down)
- Must not crash or produce errors
- Must maintain data correctness

evaluate.sh:
  docker-compose restart app
  sleep 10  # warm up
  k6 run loadtest.js > run.log 2>&1
  # Outputs: throughput_rps: 1250

results.tsv:
  commit  throughput_rps  status  description
  a1b2c3d 800            keep    baseline config
  b2c3d4e 1250           keep    increase connection pool to 50
  c3d4e5f 750            discard enable gzip (CPU bottleneck)
```

---

## Mapping to AIOS Squads

| Domain | Existing Squad | Metric to Use |
|--------|---------------|---------------|
| Email copy | content-engine, copywriting-squad | engagement_score, open_rate |
| YouTube titles | youtube-title | predicted_ctr |
| YouTube hooks | youtube-scripts | retention_30s_pct |
| Landing pages | hormozi | conversion_rate |
| Offer copy | hormozi, copywriting-squad | response_rate |
| Code performance | (dev tools) | execution_ms, lighthouse_score |
| Prompts | (any squad with prompts) | accuracy_pct, task_score |
| Trading | (custom) | sharpe_ratio |
| ML training | (custom) | val_bpb, accuracy |
