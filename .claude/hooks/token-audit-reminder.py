#!/usr/bin/env python3
"""
SessionStart Hook — 14-Day Token Audit Reminder
Checks .aiox/analytics/last-audit.json for the last audit timestamp.
If > 14 days ago (or never), injects a reminder into additionalContext.
"""
import json
import sys
import os
from datetime import datetime, timedelta


def main():
    try:
        hook_input = json.loads(sys.stdin.read()) if not sys.stdin.isatty() else {}
    except (json.JSONDecodeError, Exception):
        hook_input = {}

    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", ".")
    audit_file = os.path.join(project_dir, ".aiox", "analytics", "last-audit.json")

    needs_audit = False
    days_since = None

    if os.path.exists(audit_file):
        try:
            with open(audit_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            last_audit = datetime.fromisoformat(data.get("last_audit", "2000-01-01"))
            days_since = (datetime.now() - last_audit).days
            needs_audit = days_since > 14
        except Exception:
            needs_audit = True
            days_since = "unknown"
    else:
        needs_audit = True
        days_since = "never"

    result = {"decision": "approve"}

    if needs_audit:
        result["additionalContext"] = (
            f"TOKEN AUDIT OVERDUE: Last audit was {days_since} days ago. "
            f"Run `/context-surgeon scan` to measure context health. "
            f"Target: < 8k tokens overhead. See Token Economy section in CLAUDE.md."
        )

    print(json.dumps(result))


if __name__ == "__main__":
    main()
