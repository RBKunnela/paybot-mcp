#!/usr/bin/env python3
"""
Skill Packager Pro - Validates and creates distributable zip.

Usage:
    package_skill.py <path/to/skill> [output-directory]
"""

import sys
import zipfile
from pathlib import Path
from validate_skill import validate_skill


def package_skill(skill_path, output_dir=None):
    skill_path = Path(skill_path).resolve()

    if not skill_path.exists() or not skill_path.is_dir():
        print(f"Error: Invalid path: {skill_path}")
        return None

    # Validate first
    print("Validating skill...")
    valid, issues, warnings = validate_skill(skill_path)

    if not valid:
        print("FAIL: Cannot package. Fix these issues:")
        for i in issues:
            print(f"  ERROR: {i}")
        return None

    if warnings:
        print("Warnings (non-blocking):")
        for w in warnings:
            print(f"  WARNING: {w}")

    # Package
    output_dir = Path(output_dir).resolve() if output_dir else Path.cwd()
    output_dir.mkdir(parents=True, exist_ok=True)
    zip_path = output_dir / f"{skill_path.name}.zip"

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for file in skill_path.rglob("*"):
            if file.is_file() and '.git' not in str(file):
                arcname = file.relative_to(skill_path.parent)
                zf.write(file, arcname)

    size_kb = zip_path.stat().st_size / 1024
    print(f"\nPackaged: {zip_path} ({size_kb:.1f} KB)")
    return zip_path


def main():
    if len(sys.argv) < 2:
        print("Usage: package_skill.py <path/to/skill> [output-dir]")
        sys.exit(1)

    skill_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None

    result = package_skill(skill_path, output_dir)
    sys.exit(0 if result else 1)


if __name__ == "__main__":
    main()
