#!/usr/bin/env bash
# verify-open-core-boundary.sh — paybot-mcp local copy
#
# This is a self-contained wrapper that enforces the open-core boundary
# on paybot-mcp/src/ even when paybot-core is not checked out alongside.
#
# Canonical script lives at: paybot/scripts/verify-open-core-boundary.sh
# This copy stays in sync with it; pre-commit hook calls THIS file.
#
# Run locally:   bash scripts/verify-open-core-boundary.sh
# Run in CI:     invoked from .github/workflows/ci.yml (boundary job)
#
# Exit codes:
#   0 — clean
#   1 — violation
#   2 — config error
#
# Override (PR comment recognition handled in CI, NOT here):
#   In CI, if the PR description or any review comment contains a line
#   matching "boundary-override: <reason>", the CI job logs the override
#   to .audit/boundary-overrides.jsonl and continues. Local runs never honour overrides.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SRC_DIR="${REPO_ROOT}/src"

VIOLATIONS=0

# Tokens that must NEVER appear in paybot-mcp/src/.
# Case-insensitive substring match against *.ts files.
# Keep aligned with paybot/scripts/verify-open-core-boundary.sh.
FORBIDDEN_PATTERNS=(
  'MiCA'
  'FIN-FSA'
  'Chainalysis'
  'Elliptic'
  'Onfido'
  'Tink'
  'PSD2'
  'AML_PROVIDER'
  'KYC_ISSUER_DID'
  '/security/aml'
  '/integrations/psd2'
)

# Carve-out: type-name and adapter-interface references are permitted.
# Pattern like "Psd2AdapterInterface" (no underscore, capitalised) is allowed.
ALLOWLIST_REGEX='(Psd2|Aml|Mica|Kyc)[A-Z][A-Za-z]*'

# EURC token addresses — banned (move to env or core config).
FORBIDDEN_EURC_ADDRESSES=(
  '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42'
  '0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42'
)

red()    { printf '\033[31m%s\033[0m' "$1"; }
green()  { printf '\033[32m%s\033[0m' "$1"; }
yellow() { printf '\033[33m%s\033[0m' "$1"; }
fail()   { printf '%s %s\n' "$(red '[FAIL]')" "$*" >&2; }
ok()     { printf '%s %s\n' "$(green '[OK]')" "$*"; }
warn()   { printf '%s %s\n' "$(yellow '[WARN]')" "$*" >&2; }

if [ ! -d "${SRC_DIR}" ]; then
  warn "no src/ at ${SRC_DIR} — nothing to check"
  exit 0
fi

check_pattern() {
  local pat="$1"
  local hits
  # -F fixed string, -i case-insensitive, -n line numbers, --include=*.ts
  hits="$(grep -rniF --include='*.ts' "${pat}" "${SRC_DIR}" 2>/dev/null || true)"
  if [ -z "${hits}" ]; then return 0; fi

  # Filter allowlist: lines whose only hit is a permitted type name.
  local filtered=""
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    # The match text (everything after second colon).
    local text="${line#*:*:}"
    if echo "$text" | grep -qE "${ALLOWLIST_REGEX}" \
       && ! echo "$text" | grep -qiE "(${pat}_|${pat} )"; then
      continue
    fi
    filtered+="${line}"$'\n'
  done <<< "${hits}"

  if [ -n "${filtered}" ]; then
    fail "forbidden token '${pat}' in paybot-mcp/src/"
    printf '%s' "${filtered}" | sed 's/^/        /'
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
}

for p in "${FORBIDDEN_PATTERNS[@]}"; do check_pattern "$p"; done
for a in "${FORBIDDEN_EURC_ADDRESSES[@]}"; do check_pattern "$a"; done

# Hard-coded 0x address literals — any 20-byte hex is suspect in MCP.
hex_hits="$(grep -rniE --include='*.ts' "0x[a-fA-F0-9]{40}" "${SRC_DIR}" 2>/dev/null || true)"
if [ -n "${hex_hits}" ]; then
  fail "hard-coded 0x address literal in paybot-mcp/src/ (move to env)"
  printf '%s\n' "${hex_hits}" | sed 's/^/        /'
  VIOLATIONS=$((VIOLATIONS + 1))
fi

if [ "${VIOLATIONS}" -eq 0 ]; then
  ok "paybot-mcp open-core boundary clean."
  exit 0
fi
fail "paybot-mcp boundary VIOLATED. ${VIOLATIONS} violation(s)."
echo ""
echo "Rule: MCP tool definitions take generic params (token address, currency,"
echo "      policy name) and pass-through to SDK. Business logic belongs in core."
echo "      To request a temporary exemption, add 'boundary-override: <reason>'"
echo "      to your PR body — CI will log it for audit."
exit 1
