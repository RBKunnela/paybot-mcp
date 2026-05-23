---
name: install-excalidraw-skill
description: Install and configure the Excalidraw Diagram skill in any Claude Code project. Zero wrong paths.
type: workflow
phases: 4
owner: "@devops"
---

# Workflow: Install Excalidraw Diagram Skill

Fluxo unidirecional. Nada volta. Cada fase tem veto conditions que BLOQUEIAM avanço se não atendidas.

## Overview

```
DETECT → INSTALL → SETUP → VALIDATE
  │         │         │         │
  ▼         ▼         ▼         ▼
Check if  Clone &   Renderer  Smoke test
exists    copy      deps      render
```

---

## Phase 1: DETECT — Check Target Project

**Owner:** Executor (any agent)
**Duration:** < 10s

### Steps

1. Check if `.claude/skills/excalidraw-diagram/SKILL.md` exists in target project
2. Check if `uv` is available: `uv --version`
3. Check if Python >= 3.11 is available: `python --version`

### Decision Gate

| Condition | Action |
|-----------|--------|
| Skill already exists + renderer works | SKIP — already installed |
| Skill exists but renderer broken | Jump to Phase 3 (SETUP) |
| Skill does not exist | Continue to Phase 2 |
| `uv` not installed | VETO — install uv first: `pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Python < 3.11 | VETO — upgrade Python first |

### Veto Conditions
- **VETO** if `uv` not available and cannot be installed
- **VETO** if Python < 3.11

---

## Phase 2: INSTALL — Clone & Copy

**Owner:** Executor
**Duration:** < 30s

### Steps

1. Create skill directory if missing:
   ```bash
   mkdir -p .claude/skills/excalidraw-diagram
   ```

2. Clone from source:
   ```bash
   git clone https://github.com/coleam00/excalidraw-diagram-skill.git /tmp/excalidraw-skill-tmp
   ```

3. Copy contents (NOT the .git directory):
   ```bash
   cp -r /tmp/excalidraw-skill-tmp/* .claude/skills/excalidraw-diagram/
   cp /tmp/excalidraw-skill-tmp/.gitignore .claude/skills/excalidraw-diagram/
   rm -rf /tmp/excalidraw-skill-tmp
   ```

4. Verify file structure:
   ```
   .claude/skills/excalidraw-diagram/
   ├── SKILL.md                 # MUST exist
   ├── README.md                # MUST exist
   ├── .gitignore               # MUST exist
   └── references/
       ├── color-palette.md     # MUST exist
       ├── element-templates.md # MUST exist
       ├── json-schema.md       # MUST exist
       ├── render_excalidraw.py # MUST exist
       ├── render_template.html # MUST exist
       └── pyproject.toml       # MUST exist
   ```

### Veto Conditions
- **VETO** if SKILL.md missing after copy
- **VETO** if any references/ file missing
- **VETO** if .git directory was copied (must be removed)

---

## Phase 3: SETUP — Install Renderer Dependencies

**Owner:** Executor
**Duration:** < 60s

### Steps

1. Install Python dependencies:
   ```bash
   cd .claude/skills/excalidraw-diagram/references && uv sync
   ```

2. Install Playwright Chromium:
   ```bash
   cd .claude/skills/excalidraw-diagram/references && uv run playwright install chromium
   ```

3. Verify Playwright works:
   ```bash
   cd .claude/skills/excalidraw-diagram/references && uv run python -c "from playwright.sync_api import sync_playwright; print('OK')"
   ```

### Veto Conditions
- **VETO** if `uv sync` fails (check pyproject.toml integrity)
- **VETO** if Playwright install fails (check network, permissions)
- **VETO** if Playwright import fails

---

## Phase 4: VALIDATE — Smoke Test

**Owner:** Executor
**Duration:** < 30s

### Steps

1. Create minimal test diagram:
   ```bash
   cat > /tmp/test-excalidraw.excalidraw << 'EOF'
   {
     "type": "excalidraw",
     "version": 2,
     "source": "https://excalidraw.com",
     "elements": [
       {
         "type": "rectangle",
         "id": "test1",
         "x": 100, "y": 100, "width": 200, "height": 100,
         "strokeColor": "#1e3a5f",
         "backgroundColor": "#3b82f6",
         "fillStyle": "solid",
         "strokeWidth": 2,
         "strokeStyle": "solid",
         "roughness": 0,
         "opacity": 100,
         "angle": 0,
         "seed": 12345,
         "version": 1,
         "versionNonce": 67890,
         "isDeleted": false,
         "groupIds": [],
         "boundElements": [{"id": "text1", "type": "text"}],
         "link": null,
         "locked": false,
         "roundness": {"type": 3}
       },
       {
         "type": "text",
         "id": "text1",
         "x": 130, "y": 132,
         "width": 140, "height": 25,
         "text": "Smoke Test OK",
         "originalText": "Smoke Test OK",
         "fontSize": 16,
         "fontFamily": 3,
         "textAlign": "center",
         "verticalAlign": "middle",
         "strokeColor": "#ffffff",
         "backgroundColor": "transparent",
         "fillStyle": "solid",
         "strokeWidth": 1,
         "strokeStyle": "solid",
         "roughness": 0,
         "opacity": 100,
         "angle": 0,
         "seed": 11111,
         "version": 1,
         "versionNonce": 22222,
         "isDeleted": false,
         "groupIds": [],
         "boundElements": null,
         "link": null,
         "locked": false,
         "containerId": "test1",
         "lineHeight": 1.25
       }
     ],
     "appState": {
       "viewBackgroundColor": "#ffffff",
       "gridSize": 20
     },
     "files": {}
   }
   EOF
   ```

2. Render test diagram:
   ```bash
   cd .claude/skills/excalidraw-diagram/references && uv run python render_excalidraw.py /tmp/test-excalidraw.excalidraw --output /tmp/test-excalidraw.png
   ```

3. Verify PNG was created:
   ```bash
   test -f /tmp/test-excalidraw.png && echo "PASS" || echo "FAIL"
   ```

4. Clean up:
   ```bash
   rm -f /tmp/test-excalidraw.excalidraw /tmp/test-excalidraw.png
   ```

### Veto Conditions
- **VETO** if render fails — renderer is broken, do not mark as installed
- **VETO** if PNG not created — something in the pipeline is wrong

### Success Criteria
- PNG file generated from test diagram
- Skill is available via `/excalidraw-diagram` in Claude Code
- Color palette, templates, and schema references are accessible

---

## Post-Install

After successful installation:

1. **Invoke via:** `/excalidraw-diagram` or just ask "Create an Excalidraw diagram of..."
2. **Customize colors:** Edit `.claude/skills/excalidraw-diagram/references/color-palette.md`
3. **Output location:** `.excalidraw` files go wherever the user specifies (typically `docs/diagrams/`)
4. **Render command:** `cd .claude/skills/excalidraw-diagram/references && uv run python render_excalidraw.py <file.excalidraw>`

---

## Cross-Project Deployment

This skill propagates to all projects via the AIOS auto-sync mechanism:
- **Source:** `aios-core/.claude/skills/excalidraw-diagram/`
- **Sync:** Windows Task Scheduler copies `.claude/` to all 36+ projects
- **Per-project setup:** Phase 3 (renderer deps) must run once per project that needs rendering

### Deployment Script (for auto-sync targets)

```bash
# Run in any target project after sync copies the skill files
SKILL_DIR=".claude/skills/excalidraw-diagram/references"
if [ -f "$SKILL_DIR/pyproject.toml" ] && ! [ -f "$SKILL_DIR/.venv/pyvenv.cfg" ]; then
  echo "Setting up Excalidraw renderer..."
  cd "$SKILL_DIR" && uv sync && uv run playwright install chromium
fi
```
