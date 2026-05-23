#!/usr/bin/env python3
"""
TaskCompleted Hook — Dashboard Auto-Update
Fires when a task is marked as completed.
Updates .aios/dashboard/status.json with task progress.
"""
import json
import sys
import os
from datetime import datetime

def main():
    try:
        hook_input = json.loads(sys.stdin.read()) if not sys.stdin.isatty() else {}
    except (json.JSONDecodeError, Exception):
        hook_input = {}

    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", ".")
    status_path = os.path.join(project_dir, ".aios", "dashboard", "status.json")

    # Read current status
    status = {}
    if os.path.exists(status_path):
        try:
            with open(status_path, "r", encoding="utf-8") as f:
                status = json.load(f)
        except (json.JSONDecodeError, Exception):
            status = {}

    # Update task completion counter
    if "task_completions" not in status:
        status["task_completions"] = []

    status["task_completions"].append({
        "timestamp": datetime.now().isoformat(),
        "data": hook_input
    })

    # Keep only last 50 entries
    status["task_completions"] = status["task_completions"][-50:]
    status["last_task_completed"] = datetime.now().isoformat()

    # Write updated status
    os.makedirs(os.path.dirname(status_path), exist_ok=True)
    with open(status_path, "w", encoding="utf-8") as f:
        json.dump(status, f, indent=2)

    result = {"decision": "allow"}
    print(json.dumps(result))

if __name__ == "__main__":
    main()
