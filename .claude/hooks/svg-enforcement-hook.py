#!/usr/bin/env python3
"""
SVG Enforcement Hook — Phase 6.4 Environment-Aware Toggle

Enforces SVG semantic validation requirements based on environment mode.
Reads .aios/config.yaml for environment setting.

DEV: Advisory — logs but never blocks
STAGING: Blocks stories without semantic-intent.md when moving to Done
PROD: Fully blocking — resolution required

Triggered by: PreToolUse on Edit/Write to story files (status changes)

References:
- SVG-7: Environment-Aware Enforcement Toggle
- AIDR-013: Enforcement vs Implementation Gap
- Blocking Mechanisms section in qa-review-build.md
"""

import json
import os
import sys
import re

def get_environment():
    """Read environment from .aios/config.yaml"""
    config_path = os.path.join(os.getcwd(), '.aios', 'config.yaml')

    if not os.path.exists(config_path):
        return 'dev'  # Default fallback

    with open(config_path, 'r') as f:
        content = f.read()

    match = re.search(r'environment:\s*(\w+)', content)
    return match.group(1) if match else 'dev'

def extract_story_id(file_path):
    """Extract story ID from file path"""
    # Match patterns like svg-1.story.md, 6.1.story.md, etc.
    basename = os.path.basename(file_path)
    match = re.match(r'(.+)\.story\.md$', basename)
    return match.group(1) if match else None

def check_semantic_artifacts(story_id):
    """Check if SVG-1 artifacts exist for this story"""
    base = os.path.join(os.getcwd(), 'docs', 'stories', story_id)
    intent_exists = os.path.exists(os.path.join(base, 'semantic-intent.md'))
    mapping_exists = os.path.exists(os.path.join(base, 'semantic-mapping.md'))
    return intent_exists, mapping_exists

def log_audit(action, result, details=None):
    """Log enforcement decision"""
    audit_dir = os.path.join(os.getcwd(), '.aios', 'audit')
    os.makedirs(audit_dir, exist_ok=True)

    audit_path = os.path.join(audit_dir, 'enforcement.log')

    from datetime import datetime
    entry = {
        'timestamp': datetime.now().isoformat(),
        'hook': 'svg-enforcement',
        'action': action,
        'result': result,
        'details': details or {},
    }

    with open(audit_path, 'a') as f:
        f.write(json.dumps(entry) + '\n')

def main():
    tool_input = json.loads(sys.stdin.read())
    tool_name = os.environ.get('TOOL_NAME', '')

    # Only trigger on Write/Edit to story files
    file_path = tool_input.get('file_path', '')
    if not file_path or '.story.md' not in file_path:
        print(json.dumps({"result": "approve"}))
        return

    # Check if this edit changes status to "Done" or "Ready for Review"
    new_content = tool_input.get('new_string', '') or tool_input.get('content', '')
    is_status_change = bool(re.search(r'Status.*(?:Done|Ready for Review|InReview)', new_content, re.IGNORECASE))

    if not is_status_change:
        print(json.dumps({"result": "approve"}))
        return

    env = get_environment()
    story_id = extract_story_id(file_path)

    if not story_id:
        print(json.dumps({"result": "approve"}))
        return

    intent_exists, mapping_exists = check_semantic_artifacts(story_id)

    # DEV mode: advisory only
    if env == 'dev':
        if not intent_exists or not mapping_exists:
            missing = []
            if not intent_exists:
                missing.append('semantic-intent.md')
            if not mapping_exists:
                missing.append('semantic-mapping.md')

            log_audit('svg_check', 'advisory', {
                'environment': 'dev',
                'story_id': story_id,
                'missing': missing,
            })

            print(json.dumps({
                "result": "approve",
                "message": f"[SVG Advisory] Story {story_id} missing: {', '.join(missing)}. "
                           f"These are required in staging/prod."
            }))
        else:
            print(json.dumps({"result": "approve"}))
        return

    # STAGING/PROD: blocking
    if not intent_exists or not mapping_exists:
        missing = []
        if not intent_exists:
            missing.append('semantic-intent.md')
        if not mapping_exists:
            missing.append('semantic-mapping.md')

        log_audit('svg_check', 'blocked', {
            'environment': env,
            'story_id': story_id,
            'missing': missing,
        })

        print(json.dumps({
            "result": "block",
            "message": f"[SVG BLOCKED] Story {story_id} cannot move to Done/Review.\n"
                       f"Missing SVG-1 artifacts: {', '.join(missing)}\n"
                       f"Environment: {env.upper()}\n\n"
                       f"Run semantic intent extraction and mapping before completing this story.\n"
                       f"See: .claude/rules/svg-intent-anchoring.md"
        }))
    else:
        log_audit('svg_check', 'passed', {
            'environment': env,
            'story_id': story_id,
        })
        print(json.dumps({"result": "approve"}))

if __name__ == '__main__':
    main()
