# Runbook: Governed Action Demo (cross-verb HITL + replayable proof)

**Story:** AK-3 — MCP tool-call interceptor · **Epic:** EPIC-AP2-KERNEL-2026-06
**Sibling of:** the DP-1.3 HITL payment demo (same approval state machine, a
non-payment verb).

This is the exact, verified sequence that produces the flagship cross-verb demo:

> agent calls `delete_database` → core gate → **PENDING** → operator approves →
> tool executes (mock) → tamper-evident proof in the audit chain → replay shows
> who approved.

> **Scope note.** AK-3's story places this runbook in the core repo
> (`paybot/docs/runbooks/`). Because the AK-3 work is confined to `paybot-mcp`
> (and the AK-2 core worktree is read-only for this story), the canonical copy
> ships here in `paybot-mcp`. Port it to the core repo when AK-2 merges.

---

## 0. Prerequisites

- The AK-2 core (`feat/ak-2-action-intent`) built/runnable — it provides
  `POST /actions/govern`, `POST /actions/approvals/:id/approve|deny`, and the
  reused `GET /approvals/:id` poll.
- `paybot-mcp` with the AK-3 interceptor (this branch).
- Node 18+ (global `fetch`).

The whole demo reproduces from a clean boot in well under 10 minutes (AC5).

---

## 1. Boot core in MOCK mode (Terminal A)

From the core worktree:

```bash
SETTLEMENT_MODE=mock NODE_ENV=development PORT=3007 \
  API_KEY=pb_test_default_key PENDING_APPROVAL_TTL_MS=120000 \
  npm run start:server
```

Wait for: `MOCK SETTLEMENT MODE: No real blockchain transactions will be submitted.`
Mock mode means no real settlement and no real side effects anywhere.

---

## 2. Drive the agent side (Terminal B)

The MCP interceptor calls `POST /actions/govern`. For the runbook we drive it
with `curl` (the MCP client does the identical calls under the hood). The bot id
`demo-runbook-bot` lets us read the trace back per actor.

### Take 1 — APPROVE

```bash
BASE=http://localhost:3007; KEY=pb_test_default_key; BOT=demo-runbook-bot
HASH=$(node -e "const c=require('crypto');console.log(c.createHash('sha256').update(JSON.stringify({database:'analytics-staging'})).digest('hex'))")
POL='{"trustLevel":3,"allowedVerbs":["delete_database"],"forbiddenTargets":[],"allowedTargets":[],"maxActionsPerHour":60,"autoAllowIrreversible":false}'

# 1) Agent tries delete_database → core gate → PENDING
curl -s -X POST $BASE/actions/govern -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d "{\"intent_id\":\"act_approve_take\",\"actor\":{\"type\":\"agent\",\"subject_ref\":\"$BOT\"},\"action\":{\"verb\":\"delete_database\",\"target_ref\":\"db:analytics-staging\",\"params_hash\":\"$HASH\"},\"risk_class\":\"irreversible\",\"channel\":\"mcp\",\"policy\":$POL}"
# → {"decision":"pending", ..., "approval_id":"ap_..."}

# 2) Operator approves via the ACTION approvals route (NOT /approvals/:id/approve)
curl -s -X POST $BASE/actions/approvals/<approval_id>/approve -H "X-API-Key: $KEY"
# → {"decision":"APPROVED","intent_id":"act_approve_take","params_hash":"...","decided_by":"default-operator", ...}
```

With the live interceptor (`PAYBOT_ENABLE_DEMO_TOOLS=true` + `block` mode), step 2
unblocks the agent's call, the interceptor **re-checks the params hash**, runs the
mock handler, and appends `executed: params_hash=…, result_hash=…` to the output.

### Take 2 — DENY

```bash
curl -s -X POST $BASE/actions/govern -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d "{\"intent_id\":\"act_deny_take\",\"actor\":{\"type\":\"agent\",\"subject_ref\":\"$BOT\"},\"action\":{\"verb\":\"delete_database\",\"target_ref\":\"db:prod\",\"params_hash\":\"$HASH\"},\"risk_class\":\"irreversible\",\"channel\":\"mcp\",\"policy\":$POL}"
curl -s -X POST $BASE/actions/approvals/<approval_id>/deny -H "X-API-Key: $KEY"
# → {"decision":"DENIED","intent_id":"act_deny_take","decided_by":"default-operator", ...}
```

The denied call never executes the handler.

---

## 3. Export & replay the audit chain (the proof)

```bash
# Bot-side: the ACTION_GOVERNED intake events
curl -s "$BASE/history?botId=demo-runbook-bot&limit=20" -H "X-API-Key: $KEY"
# Operator-side: the decision events (APPROVAL_* + ACTION_APPROVED/DENIED)
curl -s "$BASE/history?botId=default-operator&limit=20" -H "X-API-Key: $KEY"
```

---

## 4. Captured trace (recorded 2026-06-10 against the live AK-2 core, mock mode)

**Take 1 — govern → pending → approve**

```
POST /actions/govern  → {"decision":"pending","reasons":[{"gate":"RISK_CLASS",
  "reason":"Irreversible action 'delete_database' requires operator approval"}],
  "policy_level":3,"audit_seq_id":49,
  "audit_hash":"ee005ac28b6a524fa0f0bcb0811009a8eab04148e3d740028aba4790ef3310c6",
  "approval_id":"ap_302437d8-f2fb-48d8-babc-faf80847a129"}

POST /actions/approvals/ap_302437d8.../approve → {"decision":"APPROVED",
  "intent_id":"act_approve_take",
  "params_hash":"253959711d34893f688d7fa66a599be30e71424314fe90d304a83f008ba388c0",
  "decided_by":"default-operator","audit_seq_id":51,
  "audit_hash":"4afde87a79ee0e3bd325f1792556a5c9ea914011b54dc6a43b0787d89816a573"}
```

**Take 2 — govern → pending → deny**

```
POST /actions/approvals/ap_791f7b24.../deny → {"decision":"DENIED",
  "intent_id":"act_deny_take","decided_by":"default-operator","audit_seq_id":55,
  "audit_hash":"313739cdac66835271bfeb20e89ead1fd35c7f31f340362365f2a8b836723172"}
```

**Audit chain — the AK-2 triad, joined by approval id + params_hash**

```
# Take 1 (act_approve_take)
ACTION_GOVERNED  decision=pending   approval=ap_302437d8...  params_hash=253959711d34...
APPROVAL_GRANTED                    approval=ap_302437d8...  by=default-operator
ACTION_APPROVED  intent=act_approve_take  approval=ap_302437d8...  by=default-operator  params_hash=253959711d34...

# Take 2 (act_deny_take)
ACTION_GOVERNED  decision=pending   approval=ap_791f7b24...
APPROVAL_DENIED                     approval=ap_791f7b24...  by=default-operator
ACTION_DENIED    intent=act_deny_take  approval=ap_791f7b24...  by=default-operator
```

Each take forms the chain `ACTION_GOVERNED → APPROVAL_GRANTED/DENIED →
ACTION_APPROVED/DENIED`, joined by the same `approval_id`, with `decided_by`
recording **who approved**. The monotonic `audit_seq_id` + per-event `audit_hash`
make the chain tamper-evident; the same join replays externally.

---

## 5. Automated reproduction

The unmocked integration test reproduces takes 1 (approve) and the deny take, plus
the allow path, the deny-by-default unknown verb, and the TOCTOU refusal, against
this same live core:

```bash
PAYBOT_CORE_URL=http://localhost:3007 PAYBOT_API_KEY=pb_test_default_key \
  npx vitest run tests/governance-integration.test.ts
```

(Env-gated; it does **not** mock the facilitator — DP-0.1 lesson.)
