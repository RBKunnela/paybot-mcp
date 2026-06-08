#!/usr/bin/env bash
# check-no-skip.sh — mechanical zero-skip / no-focus enforcement for the test suite.
#
# "No skipped tests" used to be only a comment in ci.yml. A future .skip / xit /
# xdescribe (or a focused .only left in by accident) would silently pass CI and
# could ship in a published release. This makes the rule mechanical: it greps the
# test files for forbidden patterns and fails the build if any are found.
#
# Forbidden (always fail):
#   .skip(            it.skip / describe.skip / test.skip (any receiver)
#   xit(  xdescribe(  xtest(   legacy disabled forms
#   .only(            it.only / describe.only / test.only — focus leak
#
# Allowed (env-gated conditional skips, NOT a leak):
#   describe.skipIf(...)  it.skipIf(...)  test.skipIf(...)
#   describe.runIf(...)   it.runIf(...)   test.runIf(...)
# These are intentional, condition-driven and are excluded from the match.
#
# Run locally:   bash scripts/check-no-skip.sh
# Run in CI:     invoked from .github/workflows/ci.yml (test job)
#
# Exit codes:
#   0 — clean
#   1 — forbidden pattern found
#   2 — config error (no test dir)

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TESTS_DIR="${REPO_ROOT}/tests"

if [[ ! -d "${TESTS_DIR}" ]]; then
  echo "[check-no-skip] ERROR: tests directory not found at ${TESTS_DIR}" >&2
  exit 2
fi

# Forbidden patterns. skipIf/runIf are excluded by the negative lookahead-free
# approach below: we match .skip(  but NOT .skipIf( because the ( must directly
# follow "skip". Likewise .only( is fine to match unconditionally.
FORBIDDEN_REGEX='\.skip\(|\bxit\(|\bxdescribe\(|\bxtest\(|\.only\('

# Gather test files (*.test.ts and *.test.js under tests/).
mapfile -t TEST_FILES < <(find "${TESTS_DIR}" -type f \( -name '*.test.ts' -o -name '*.test.js' -o -name '*.spec.ts' -o -name '*.spec.js' \))

if [[ ${#TEST_FILES[@]} -eq 0 ]]; then
  echo "[check-no-skip] ERROR: no test files found under ${TESTS_DIR}" >&2
  exit 2
fi

# grep -E across all test files; -n for line numbers, -H for filenames.
MATCHES="$(grep -EnH "${FORBIDDEN_REGEX}" "${TEST_FILES[@]}" || true)"

if [[ -n "${MATCHES}" ]]; then
  echo "[check-no-skip] FAIL — forbidden skip/focus patterns found:" >&2
  echo "${MATCHES}" >&2
  echo "" >&2
  echo "Skipped or focused tests must not be committed. Re-enable the test, or" >&2
  echo "use an env-gated describe.skipIf(...) / it.skipIf(...) for conditional cases." >&2
  exit 1
fi

echo "[check-no-skip] OK — no .skip/.only/xit/xdescribe in ${#TEST_FILES[@]} test file(s)"
exit 0
