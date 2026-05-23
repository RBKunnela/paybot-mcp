#!/usr/bin/env python3
"""
TaskCompleted Hook — Tool Usage Analytics Collection
Fires after task-completed-dashboard.py to collect tool usage data.
Calls .aiox-core/infrastructure/scripts/collect-tool-usage.js with --prune-only
to enforce 30-day retention, and logs the event for analytics pipeline.
"""
import json
import sys
import os
import subprocess
from datetime import datetime


def main():
    try:
        hook_input = json.loads(sys.stdin.read()) if not sys.stdin.isatty() else {}
    except (json.JSONDecodeError, Exception):
        hook_input = {}

    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", ".")
    analytics_dir = os.path.join(project_dir, ".aiox", "analytics")
    os.makedirs(analytics_dir, exist_ok=True)

    # Log tool usage event
    event_log_path = os.path.join(analytics_dir, "tool-usage-events.jsonl")
    event = {
        "timestamp": datetime.now().isoformat(),
        "event": "task_completed",
        "session_id": os.environ.get("CLAUDE_SESSION_ID", "unknown"),
    }
    try:
        with open(event_log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(event) + "\n")
    except Exception:
        pass

    # Run collect-tool-usage.js --prune-only (retention enforcement)
    script_path = os.path.join(
        project_dir, ".aiox-core", "infrastructure", "scripts", "collect-tool-usage.js"
    )
    if os.path.exists(script_path):
        try:
            subprocess.run(
                ["node", script_path, "--prune-only"],
                cwd=project_dir,
                timeout=10,
                capture_output=True,
            )
        except Exception:
            pass  # Non-blocking — analytics must never block work

    # Output: no additionalContext needed, pass through
    result = {"decision": "approve"}
    print(json.dumps(result))


if __name__ == "__main__":
    main()
