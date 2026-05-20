# Release Gate — paybot-mcp v0.3.0

**Target tag:** `v0.3.0`
**Sprint:** Bank-pitch (2026-05 → 2026-06-30)
**Owner:** @devops (Gage)
**Approval required:** PO sign-off + Renata sign-off before `git tag` and `npm publish`.

This file is the binary checklist. Any unchecked item = no tag, no publish.

---

## 1. Code & Tests

- [ ] All P0 stories closed (link epic here once @sm assigns IDs)
- [ ] All P1 stories closed OR explicitly deferred with @po note
- [ ] 10 new tools implemented + exported (target list from `docs/AGENT-ECONOMY-MCP-GAPS.md`)
- [ ] Existing 4 tools (`paybot_pay`, `paybot_balance`, `paybot_history`, `paybot_register`) regression-tested — no behaviour change
- [ ] `npm test -- --coverage` exits 0
- [ ] Coverage ≥85% on all changed files (`scripts/coverage-gate.sh 85` PASS)
- [ ] No `.skip`, `xit`, `xdescribe` in test files (`grep -rE '\.(skip|todo)\b|^x(it|describe)' src/ test/` returns nothing)

## 2. Boundary

- [ ] `bash scripts/verify-open-core-boundary.sh` PASS
- [ ] No `boundary-override:` lines in any of the merged PRs for this release
- [ ] `.audit/boundary-overrides.jsonl` empty for the release window, OR all entries reviewed by @architect

## 3. Documentation

- [ ] README.md lists all 14 tools (4 existing + 10 new) with input schemas
- [ ] Each new tool has a `### tool_name` heading with full parameter table
- [ ] CHANGELOG.md entry under `## [0.3.0] — YYYY-MM-DD` follows Keep-a-Changelog format
- [ ] CHANGELOG covers: Added (10 tools), Changed (any), Fixed (any), Deprecated (none expected)
- [ ] CONTRIBUTING.md exists (new in this release — see Hardening Checklist)
- [ ] SECURITY.md exists with vuln-disclosure email + supported-versions table

## 4. Registry & Metadata

- [ ] `server.json` version field = `0.3.0` (matches `package.json`)
- [ ] `server.json` validates against `https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json` (`ajv-cli` PASS)
- [ ] `server.json.name` = `io.github.RBKunnela/paybot-mcp` (unchanged)
- [ ] If new env vars introduced by tools (e.g. EUR-specific config), they are added to `server.json.packages[0].environmentVariables` with `isSecret` set correctly
- [ ] `package.json.keywords` includes `mcp`, `model-context-protocol`, `paybot`, `x402`

## 5. Smoke Test

Define `--self-test` in `src/cli.ts` (new in v0.3.0):

```
npx paybot-mcp@0.3.0 --self-test
```

The `--self-test` flag must:

1. Print the version (`paybot-mcp v0.3.0`)
2. List all 14 registered tool names — one per line
3. For each tool, invoke a dry-run validator (no network) that confirms the input schema parses
4. Exit 0 on success, 1 on any failure
5. NEVER require `PAYBOT_API_KEY` (self-test is offline-only)
6. NEVER hit any network endpoint
7. Complete in <3 seconds on a clean install

- [ ] `--self-test` implemented and unit-tested
- [ ] Smoke test executed against the npm tarball:
      ```
      npm pack
      mkdir -p /tmp/paybot-smoke && cd /tmp/paybot-smoke
      npm init -y && npm install <path-to-tarball>
      npx paybot-mcp --self-test
      ```
      → exits 0, prints all 14 tools

## 6. Release Mechanics

- [ ] PO has validated all stories in this release (`*validate-story-draft` for each)
- [ ] Renata sign-off captured in `.audit/release-approvals.jsonl`
- [ ] Branch protection on `main` enforced; `required` check green
- [ ] Manual environment approval (`npm-publish` env in GitHub) configured with Renata + @devops as approvers
- [ ] Tag created: `git tag v0.3.0 && git push origin v0.3.0` (Gage only)
- [ ] CI publish job triggered, manual approval given
- [ ] npm package `paybot-mcp@0.3.0` resolvable via `npm view paybot-mcp@0.3.0`
- [ ] MCP registry submission updated (if registry sync is manual — check current process)
- [ ] Post-publish smoke: `npx paybot-mcp@0.3.0 --self-test` from a clean container → exit 0

---

## README Hardening Checklist

First-pass scan of `paybot-mcp/README.md` (current state, 2026-05-20):

### URLs requiring attention

| URL | Issue | Action |
|-----|-------|--------|
| `https://paybotcore.com` | Domain status unverified — needs DNS check before pitch | Verify resolves; if not registered, choose canonical domain and update before v0.3.0 |
| `https://api.paybotcore.com` | Hardcoded in README example | Keep as default but document via `PAYBOT_FACILITATOR_URL` env (already documented — OK) |

### Missing badges (add to top of README, below H1)

```markdown
[![npm](https://img.shields.io/npm/v/paybot-mcp.svg)](https://www.npmjs.com/package/paybot-mcp)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-purple)](https://modelcontextprotocol.io)
[![Coverage](https://img.shields.io/badge/coverage-%E2%89%A585%25-brightgreen)](#testing)
[![CI](https://github.com/RBKunnela/paybot-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/RBKunnela/paybot-mcp/actions)
```

### Missing sections

- [ ] **Open-Core Governance** — one paragraph explaining: paybot (private, BSL 1.1) is the core; this package is the thin Apache-2.0 MCP wrapper; SDK is MIT. Link to `paybot/docs/open-core.md`.
- [ ] **Contributing** — link to `CONTRIBUTING.md` (must be created); pre-commit hook install instructions; boundary script note.
- [ ] **Security** — link to `SECURITY.md` (must be created); supported versions; vuln-disclosure email.
- [ ] **Testing** — how to run tests, what coverage is enforced, how `--self-test` works.
- [ ] **Versioning** — semver policy; v0.x = pre-stable, breaking changes possible in minor bumps; v1.0 commitment date.

### Minor hardening

- [ ] Replace mojibake `�?"` (em-dashes) with proper `—` (likely encoding artefact from Windows clipboard)
- [ ] Add `PAYBOT_FACILITATOR_URL` env example with `https://api.paybotcore.com` and a sandbox alternative
- [ ] Add a "Production checklist" callout (set `PAYBOT_WALLET_KEY`, lock spending limits via `paybot_register`, monitor with `paybot_history`)

---

## Sign-off Block

| Role | Name | Date | Signature/commit |
|------|------|------|------------------|
| @po | Pax | | |
| @qa | (assigned) | | |
| @devops | Gage | | |
| Renata | Renata Baldissara-Kunnela | | |

Tag `v0.3.0` MUST NOT be pushed until all four rows are filled.
