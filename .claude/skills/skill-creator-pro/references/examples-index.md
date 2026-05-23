# Examples Index — All Available Skill & Tool Examples

## Claude Code Skills (Ready to Reference)

| Skill | Path | Type | Key Pattern |
|-------|------|------|-------------|
| action-creator | `claude-agent-sdk-demos/email-agent/agent/.claude/skills/action-creator/` | Tier 2 | Code generation with templates |
| listener-creator | `claude-agent-sdk-demos/email-agent/agent/.claude/skills/listener-creator/` | Tier 2 | Event-driven with AI classification |
| cookbook-audit | `claude-cookbooks/.claude/skills/cookbook-audit/` | Tier 3 | Quality validation with scoring |
| skill-creator | `ALMA-memory/.claude/skills/skill-creator/` | Tier 2 | Meta-skill (creates other skills) |

## API Skills (Custom)

| Skill | Path | Focus |
|-------|------|-------|
| analyzing-financial-statements | `claude-cookbooks/skills/custom_skills/analyzing-financial-statements/` | Ratio calculation + interpretation |
| applying-brand-guidelines | `claude-cookbooks/skills/custom_skills/applying-brand-guidelines/` | Brand compliance + validation |
| creating-financial-models | `claude-cookbooks/skills/custom_skills/creating-financial-models/` | DCF + sensitivity analysis |

## Agent SDK Demos (Integration Patterns)

| Demo | Path | Pattern |
|------|------|---------|
| hello-world | `claude-agent-sdk-demos/hello-world/` | Basic query + hooks |
| hello-world-v2 | `claude-agent-sdk-demos/hello-world-v2/` | Multi-turn sessions |
| research-agent | `claude-agent-sdk-demos/research-agent/` | Subagent coordination |
| email-agent | `claude-agent-sdk-demos/email-agent/` | Full app with MCP tools + skills |
| simple-chatapp | `claude-agent-sdk-demos/simple-chatapp/` | WebSocket streaming |
| resume-generator | `claude-agent-sdk-demos/resume-generator/` | Web search -> document |
| ask-user-question | `claude-agent-sdk-demos/ask-user-question-previews/` | HTML preview cards |
| excel-demo | `claude-agent-sdk-demos/excel-demo/` | Electron + Python |

## Cookbook Patterns (Jupyter Notebooks)

| Pattern | Path | Focus |
|---------|------|-------|
| Orchestrator-Workers | `claude-cookbooks/patterns/agents/orchestrator_workers.ipynb` | Dynamic task decomposition |
| Evaluator-Optimizer | `claude-cookbooks/patterns/agents/evaluator_optimizer.ipynb` | Quality iteration loops |
| Basic Workflows | `claude-cookbooks/patterns/agents/basic_workflows.ipynb` | Chaining, routing, parallelization |
| Tool Search | `claude-cookbooks/tool_use/tool_search_with_embeddings.ipynb` | Dynamic tool discovery |
| Memory | `claude-cookbooks/tool_use/memory_cookbook.ipynb` | Persistent conversation memory |
| Context Compaction | `claude-cookbooks/tool_use/automatic-context-compaction.ipynb` | Token management |
| Parallel Tools | `claude-cookbooks/tool_use/parallel_tools.ipynb` | Concurrent tool execution |

## SDK Examples (TypeScript)

| Example | Path | Pattern |
|---------|------|---------|
| Zod Tools | `anthropic-sdk-typescript/examples/tools-helpers-zod.ts` | Type-safe tool definitions |
| Tool Runner | `anthropic-sdk-typescript/examples/tools-helpers-advanced.ts` | Auto-loop tool execution |
| Structured Output | `anthropic-sdk-typescript/examples/structured-outputs-zod.ts` | Parsed JSON responses |
| Streaming | `anthropic-sdk-typescript/examples/streaming.ts` | Event-based streaming |
| Memory | `anthropic-sdk-typescript/examples/tools-helpers-memory.ts` | Filesystem memory tool |
| MCP | `anthropic-sdk-typescript/examples/mcp.ts` | MCP server integration |
| Web Search | `anthropic-sdk-typescript/examples/web-search.ts` | Web search tool |

## Utility Libraries

| Library | Path | Use Case |
|---------|------|----------|
| skill_utils.py | `claude-cookbooks/skills/skill_utils.py` | Skills API CRUD operations |
| file_utils.py | `claude-cookbooks/skills/file_utils.py` | Files API download/extract |
| BaseTool | `anthropic-tools/tool_use_package/tools/base_tool.py` | Tool definition base class |
| ToolUser | `anthropic-tools/tool_use_package/tool_user.py` | Tool orchestration loop |
| prompt_constructors | `anthropic-tools/tool_use_package/prompt_constructors.py` | XML prompt formatting |

## Squad Skills (Complex Examples from ALMA)

| Squad | Agents | Tasks | Pattern |
|-------|--------|-------|---------|
| copywriting-squad | 16 | 2+ | Mind clones with real frameworks |
| design | 16 | 50+ | Atomic design + accessibility |
| domain-decoder | 8 | 10 | Codebase analysis pipeline |
| quality-shield | 5 | 15 | Regression + impact analysis |
| hormozi | 16 | 50+ | Business strategy multi-agent |
| content-engine | 20 | 25+ | Content creation pipeline |
