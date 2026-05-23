# Quality Foundation Checklist — Quick Reference

Compact checklist for all agents. Full protocol in `quality-foundation.md`.

---

## @dev Self-Check (Before requesting QA)

### Tests
- [ ] Every new function has >= 3 unit tests (happy path, error path, edge case)
- [ ] Every new API endpoint has integration test
- [ ] Every acceptance criterion has a matching test
- [ ] Test coverage >= 80% on all changed files
- [ ] Zero skipped tests (no `.skip`, `xit`, `xdescribe`)
- [ ] Test names follow: `[CATEGORY] functionName — should [behavior] when [condition]`
- [ ] All tests pass locally (`npm test`)

### Documentation
- [ ] Every exported function has JSDoc/TSDoc comment (what, params, returns, throws, example)
- [ ] Every module/file has top-level comment (purpose, dependencies, used by)
- [ ] Complex logic (> 10 lines, conditionals, algorithms) has inline WHY comments
- [ ] API endpoints documented (method, path, request, response, errors)
- [ ] Database changes documented (what, why, rollback)

### Regression
- [ ] Existing tests still pass after changes
- [ ] No test deleted (fix broken tests, don't remove them)
- [ ] Bug fixes include regression test reproducing the bug

---

## @qa Validation Matrix (Run on EVERY story)

| # | Check | First Pass | Re-Test | Final |
|---|-------|-----------|---------|-------|
| 1 | All unit tests pass | ✓ | ✓ | ✓ |
| 2 | Coverage >= 80% changed files | ✓ | ✓ | ✓ |
| 3 | No skipped tests | ✓ | ✓ | ✓ |
| 4 | 3 tests per new function | ✓ | — | ✓ |
| 5 | All AC met with evidence | ✓ | ✓ | ✓ |
| 6 | No regressions in related areas | ✓ | ✓ | ✓ |
| 7 | Doc comments on exports | ✓ | — | ✓ |
| 8 | Module-level docs present | ✓ | — | ✓ |
| 9 | Complex logic commented | ✓ | — | ✓ |
| 10 | API docs complete | ✓ | — | ✓ |
| 11 | Security basics (OWASP) | ✓ | — | ✓ |
| 12 | Performance within limits | ✓ | — | ✓ |

**Minimum 2 passes required. FAIL if any test/doc check fails.**

---

## @devops Push Gate

```
[ ] npm run lint — PASS
[ ] npm run typecheck — PASS
[ ] npm test — ALL PASS, zero skipped
[ ] Coverage >= 80% on changed files
[ ] No deleted tests without @architect approval
[ ] QA verdict = PASS (2+ passes documented)
```

**Block push if ANY fails. No exceptions.**

---

## VETO Quick Reference

| Trigger | Action | Agent |
|---------|--------|-------|
| Function with 0 tests | VETO — cannot merge | @dev must fix |
| Coverage < 80% on changed files | VETO — cannot merge | @dev must add tests |
| Skipped test found | VETO — cannot merge | @dev must unskip or remove with reason |
| Exported function without doc comment | VETO — cannot merge | @dev must document |
| Module without top-level comment | VETO — cannot merge | @dev must document |
| Story moves to Done without 2 QA passes | VETO — return to QA | @qa must re-test |
| Bug fix without regression test | VETO — cannot merge | @dev must add test |
| Test deleted without @architect approval | VETO — cannot merge | @dev must restore |
| Push without full test suite passing | VETO — blocked | @devops enforces |
