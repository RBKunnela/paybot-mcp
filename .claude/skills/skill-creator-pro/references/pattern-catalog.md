# Pattern Catalog — Extracted from Anthropic Official Repositories

## Source Repositories

| Repo | Path | Focus |
|------|------|-------|
| claude-cookbooks | `D:\workspace\claude\claude-cookbooks` | Tutorials, patterns, skills API |
| claude-agent-sdk-demos | `D:\workspace\claude\claude-agent-sdk-demos` | Agent SDK integration patterns |
| anthropic-tools | `D:\workspace\claude\anthropic-tools` | Tool use package (legacy, patterns still valid) |
| anthropic-sdk-typescript | `D:\workspace\claude\anthropic-sdk-typescript` | TypeScript SDK, tool helpers, streaming |
| apitools | `D:\workspace\claude\apitools` | HTTP abstractions, code generation, retry logic |
| blobfile | `D:\workspace\claude\blobfile` | File abstraction, multi-backend, parallel ops |

---

## Agent Patterns (from cookbooks/patterns/agents/)

### 1. Prompt Chaining
Sequential LLM calls where output of one becomes input of next.
- **When**: Linear workflows with clear stages
- **File**: `claude-cookbooks/patterns/agents/basic_workflows.ipynb`

### 2. Routing
Classify input first, then route to specialized handler.
- **When**: Multiple task types need different approaches
- **File**: `claude-cookbooks/patterns/agents/basic_workflows.ipynb`

### 3. Parallelization
Run multiple LLM calls simultaneously, combine results.
- **When**: Independent subtasks, multiple perspectives needed
- **File**: `claude-cookbooks/patterns/agents/basic_workflows.ipynb`

### 4. Orchestrator-Workers
Central LLM analyzes task, dynamically creates subtasks for worker LLMs.
- **When**: Can't predict subtasks in advance, need adaptive decomposition
- **File**: `claude-cookbooks/patterns/agents/orchestrator_workers.ipynb`
- **Key class**: `FlexibleOrchestrator` with XML-based task parsing
- **Implementation**: Orchestrator prompt -> parse_tasks() -> worker prompts -> results

### 5. Evaluator-Optimizer
Generate output, evaluate quality, iterate until satisfactory.
- **When**: Quality criteria are clear but achieving them requires iteration
- **File**: `claude-cookbooks/patterns/agents/evaluator_optimizer.ipynb`

---

## Agent SDK Patterns (from claude-agent-sdk-demos/)

### 6. Single-Turn Agentic Loop
```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';
const q = query({ prompt, options: { maxTurns, allowedTools, model } });
for await (const message of q) { /* process */ }
```
- **File**: `claude-agent-sdk-demos/hello-world/hello-world.ts`

### 7. Multi-Turn Session (V2 API)
```typescript
import { unstable_v2_createSession } from '@anthropic-ai/claude-agent-sdk';
await using session = unstable_v2_createSession({ model });
await session.send('message');
for await (const msg of session.stream()) { /* process */ }
```
- **File**: `claude-agent-sdk-demos/hello-world-v2/v2-examples.ts`

### 8. Custom MCP Server Tools
```typescript
import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
const server = createSdkMcpServer({
  name: "domain",
  tools: [tool("name", "desc", schema, handler)]
});
```
- **File**: `claude-agent-sdk-demos/email-agent/ccsdk/custom-tools.ts`

### 9. Hook-Based Tool Validation
```typescript
hooks: {
  PreToolUse: [{
    matcher: "Write|Edit",
    hooks: [async (input) => ({
      decision: valid ? undefined : 'block',
      continue: valid
    })]
  }]
}
```
- **File**: `claude-agent-sdk-demos/hello-world/hello-world.ts`

### 10. Subagent Coordination via Task Tool
```python
agents = {
  "researcher": AgentDefinition(tools=["WebSearch"], prompt=prompt, model="haiku"),
  "analyst": AgentDefinition(tools=["Glob", "Read", "Bash"], prompt=prompt)
}
```
- **File**: `claude-agent-sdk-demos/research-agent/research_agent/agent.py`

### 11. Message Queue Streaming
```typescript
class MessageQueue {
  async *[Symbol.asyncIterator]() { yield from queue }
  push(content) { /* add to queue */ }
}
```
- **File**: `claude-agent-sdk-demos/simple-chatapp/server/ai-client.ts`

### 12. WebSocket Server Blocking (AskUserQuestion)
Promise-based blocking pattern for server-browser round trips.
- **File**: `claude-agent-sdk-demos/ask-user-question-previews/server.ts`

---

## Tool Use Patterns (from anthropic-tools/)

### 13. BaseTool Inheritance
```python
class MyTool(BaseTool):
    def __init__(self, name, description, parameters):
        super().__init__(name, description, parameters)
    def use_tool(self, **kwargs): return result
```
- **File**: `anthropic-tools/tool_use_package/tools/base_tool.py`

### 14. ToolUser Orchestrator
Manages Claude conversation loop with automatic tool execution.
- Modes: "manual" (returns at each tool call) or "automatic" (loops until done)
- **File**: `anthropic-tools/tool_use_package/tool_user.py`

### 15. Search Tool with Token Truncation
Truncate search results to token budget using Anthropic tokenizer.
- **File**: `anthropic-tools/tool_use_package/tools/search/brave_search_tool.py`

### 16. SQL Tool with Schema Display
Custom `format_tool_for_claude()` that includes DB schema in prompt.
- **File**: `anthropic-tools/tool_use_package/tools/sql_tool.py`

---

## TypeScript SDK Patterns (from anthropic-sdk-typescript/)

### 17. Zod Tool Definition
```typescript
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
const tool = betaZodTool({
  name: 'tool', description: 'desc',
  inputSchema: z.object({ param: z.string() }),
  run: async (args) => 'result'
});
```
- **File**: `anthropic-sdk-typescript/examples/tools-helpers-zod.ts`

### 18. ToolRunner Auto-Loop
```typescript
const runner = client.beta.messages.toolRunner({
  model, max_tokens, tools, messages, max_iterations
});
for await (const message of runner) { /* process */ }
```
- **File**: `anthropic-sdk-typescript/src/lib/tools/BetaToolRunner.ts`

### 19. Structured Output Parsing
```typescript
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
const response = await client.messages.parse({
  model, max_tokens, messages,
  output_format: zodOutputFormat(MySchema)
});
const parsed = response.parsed_output; // typed!
```
- **File**: `anthropic-sdk-typescript/examples/structured-outputs-zod.ts`

### 20. Skills API (Beta)
```typescript
const skill = await client.beta.skills.create({ display_title, files });
const version = await client.beta.skills.versions.create({ skill_id, files });
```
- **File**: `anthropic-sdk-typescript/src/resources/beta/skills/skills.ts`

### 21. MCP Tool Integration
```typescript
import { betaMCPTool } from '@anthropic-ai/sdk/helpers/beta/mcp';
// Converts MCP protocol tools to Anthropic format
```
- **File**: `anthropic-sdk-typescript/src/tools/mcp/`

### 22. Event-Based Streaming
```typescript
const stream = client.messages.stream({...})
  .on('text', (text) => process.stdout.write(text))
  .on('thinking', (thinking) => {})
  .on('finalMessage', (msg) => {});
```
- **File**: `anthropic-sdk-typescript/src/lib/MessageStream.ts`

---

## Infrastructure Patterns (from apitools/ and blobfile/)

### 23. Exponential Backoff Retry
```python
def _retry_backoff(initial=0.1, maximum=60, multiplier=2):
    delay = initial
    while True:
        yield delay * random()
        delay = min(delay * multiplier, maximum)
```
- **Source**: blobfile/_common.py

### 24. Multi-Backend File Abstraction
Unified interface for local, GCS, Azure with pluggable backends.
- **Source**: blobfile/__init__.py

### 25. Code Generation from Schema
Parse API discovery documents, generate typed client libraries.
- **Source**: apitools/gen/gen_client_lib.py

### 26. Structured Error Hierarchy
```
Error (base)
├── TypecheckError
├── NotFoundError
├── InvalidDataError
├── CommunicationError
│   └── HttpError
└── CredentialsError
```
- **Source**: apitools/base/py/exceptions.py

---

## Skill Patterns (from cookbooks/skills/ and agent-sdk-demos/)

### 27. API Skill with Code Execution
```python
response = client.beta.messages.create(
    container={"skills": [{"type": "custom", "skill_id": id, "version": "latest"}]},
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}],
    betas=["code-execution-2025-08-25", "files-api-2025-04-14", "skills-2025-10-02"]
)
```
- **Source**: claude-cookbooks/skills/skill_utils.py

### 28. Action Creator Skill (Event-Triggered Code Generation)
Generates TypeScript action templates with config + handler pattern.
- **Source**: claude-agent-sdk-demos/email-agent/agent/.claude/skills/action-creator/

### 29. Listener Creator Skill (Event-Driven Automation)
Generates event-driven listener files with AI-powered classification.
- **Source**: claude-agent-sdk-demos/email-agent/agent/.claude/skills/listener-creator/

### 30. Financial Analysis Skill (Domain Expert)
Scripts for ratio calculation + interpretation with reference data.
- **Source**: claude-cookbooks/skills/custom_skills/analyzing-financial-statements/

### 31. Brand Guidelines Skill (Standards Reference)
Complete brand spec as skill body, scripts for validation/application.
- **Source**: claude-cookbooks/skills/custom_skills/applying-brand-guidelines/

---

## Context Engineering Patterns (from cookbooks/tool_use/)

### 32. Automatic Context Compaction
Compress conversation history when approaching token limits.
- **File**: `claude-cookbooks/tool_use/automatic-context-compaction.ipynb`

### 33. Memory Tool Pattern
Persistent memory across conversations with save/retrieve.
- **File**: `claude-cookbooks/tool_use/memory_cookbook.ipynb`

### 34. Parallel Tool Execution
Run multiple tools simultaneously for efficiency.
- **File**: `claude-cookbooks/tool_use/parallel_tools.ipynb`

### 35. Tool Search with Embeddings
Dynamically discover relevant tools from large catalog using semantic search.
- **File**: `claude-cookbooks/tool_use/tool_search_with_embeddings.ipynb`

### 36. Programmatic Tool Calling (PTC)
Client-side tool execution without LLM in the loop for deterministic steps.
- **File**: `claude-cookbooks/tool_use/programmatic_tool_calling_ptc.ipynb`
