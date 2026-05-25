---
name: scope-discipline
description: For concrete, well-bounded tool requests, skip strategic roundtables and go straight to the build chain. Established 2026-05-22.
metadata:
  type: feedback
---

For concrete, well-bounded tool requests ("build me a GitHub Action that runs the 9 agents"), do NOT spawn a strategic roundtable. Go straight to the build chain: @architect (design) → @dev (implement) → @devops (ship).

**Why:** Roundtables are reserved for ambiguous decisions where multiple correct answers exist and explicit specialist disagreement adds signal. Concrete tool requests have a clear shape and a clear deliverable — convoking a roundtable for "implement this well-specified action" adds latency without adding signal. Operator established this rule 2026-05-22 during the sinkra-action build session, where the request was already shape-locked by the prior conversation and a strategic roundtable would have been overhead.

**How to apply:**
- If the operator's request has a clear deliverable and a known shape (e.g. "build X that does Y"), @aiox-master goes directly to the appropriate build chain. Typically @architect → @dev → @devops, or @dev → @devops if @architect input has already been captured.
- If the operator's request is genuinely ambiguous (e.g. "should we use Stripe Connect or Lightspark for X?"), the [[roundtable-decisions]] rule still applies — convoke 2-4 specialists for explicit disagreement.
- The line: shape-locked + scope-locked = build chain. Shape-open OR scope-open = roundtable.
- Related: [[sinkra-action]] is the artifact this rule was forged against.

**Edge cases:**
- "Build me X but pick the right framework" — shape-open on framework choice; roundtable on framework, then build chain.
- "Build me X like Y" — shape-locked by analogy; build chain.
- "Build me X and also decide whether to do Z" — split into two: roundtable on Z, build chain on X.
