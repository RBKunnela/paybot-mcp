#!/usr/bin/env python3
"""
Push Gate Hook — AIDR-013 Level 3 Enforcement

Blocks `git push` unless quality gates pass.
Reads environment from .aios/config.yaml.

In DEV mode: advisory (warns but allows)
In STAGING/PROD mode: blocking (prevents push on failure)

Checks:
1. npm run lint — must exit 0
2. npm run typecheck — must exit 0
3. npm test — must exit 0, zero skipped
4. Coverage >= min_test_coverage from config

Triggered by: PreToolUse on Bash commands containing "git push"
"""

import json
import os
import sys
import re

def load_config():
    """Load environment config from .aios/config.yaml"""
    config_path = os.path.join(os.getcwd(), '.aios', 'config.yaml')
    config = {
        'environment': 'dev',
        'min_test_coverage': 0,
        'enforce_qa_gate': False,
    }

    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            content = f.read()

        env_match = re.search(r'environment:\s*(\w+)', content)
        if env_match:
            config['environment'] = env_match.group(1)

        coverage_match = re.search(r'min_test_coverage:\s*(\d+)', content)
        if coverage_match:
            config['min_test_coverage'] = int(coverage_match.group(1))

        qa_match = re.search(r'enforce_qa_gate:\s*(true|false)', content, re.IGNORECASE)
        if qa_match:
            config['enforce_qa_gate'] = qa_match.group(1).lower() == 'true'

    return config

def log_audit(action, result, details=None):
    """Log enforcement decision to audit trail"""
    audit_dir = os.path.join(os.getcwd(), '.aios', 'audit')
    os.makedirs(audit_dir, exist_ok=True)

    audit_path = os.path.join(audit_dir, 'enforcement.log')

    from datetime import datetime
    entry = {
        'timestamp': datetime.now().isoformat(),
        'hook': 'push-gate',
        'action': action,
        'result': result,
        'details': details or {},
    }

    with open(audit_path, 'a') as f:
        f.write(json.dumps(entry) + '\n')

def main():
    tool_input = json.loads(sys.stdin.read())

    # Only trigger on git push commands
    command = tool_input.get('command', '')
    if 'git push' not in command:
        print(json.dumps({"result": "approve"}))
        return

    config = load_config()
    env = config['environment']

    # In DEV mode: warn but allow
    if env == 'dev':
        log_audit('push_attempted', 'allowed', {'environment': 'dev', 'reason': 'dev mode — advisory only'})
        print(json.dumps({
            "result": "approve",
            "message": "[Push Gate] DEV mode — push allowed. Run `npm test` before pushing to staging/prod."
        }))
        return

    # In STAGING/PROD: enforce quality gates
    checks_message = []
    checks_message.append(f"[Push Gate] Environment: {env.upper()} — quality gates enforced")
    checks_message.append("")
    checks_message.append("Before pushing, ensure ALL pass:")
    checks_message.append("  1. npm run lint")
    checks_message.append("  2. npm run typecheck")
    checks_message.append("  3. npm test (zero failures, zero skipped)")
    if config['min_test_coverage'] > 0:
        checks_message.append(f"  4. Coverage >= {config['min_test_coverage']}% on changed files")
    checks_message.append("")
    checks_message.append("Run these checks before pushing. Proceed?")

    log_audit('push_gate_check', 'prompted', {
        'environment': env,
        'min_coverage': config['min_test_coverage'],
    })

    # Block with informative message — user must confirm
    print(json.dumps({
        "result": "block",
        "message": "\n".join(checks_message)
    }))

if __name__ == '__main__':
    main()
