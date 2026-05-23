---
paths: **/*
---

# MCP Server Usage Rules - AIOX Architecture

## MCP Governance

**IMPORTANT:** All MCP infrastructure management is handled EXCLUSIVELY by the **DevOps Agent (@devops / Gage)**.

| Operation | Agent | Command |
|-----------|-------|---------|
| Search MCP catalog | DevOps | `*search-mcp` |
| Add MCP server | DevOps | `*add-mcp` |
| List enabled MCPs | DevOps | `*list-mcps` |
| Remove MCP server | DevOps | `*remove-mcp` |
| Setup Docker MCP | DevOps | `*setup-mcp-docker` |

Other agents (Dev, Architect, etc.) are MCP **consumers**, not administrators. If MCP management is needed, delegate to @devops.

---

## MCP Configuration Architecture

AIOX uses Docker MCP Toolkit as the primary MCP infrastructure:

### Direct in Claude Code (global ~/.claude.json)
| MCP | Purpose |
|-----|---------|
| **playwright** | Browser automation, screenshots, web testing |
| **desktop-commander** | Docker container operations via docker-gateway |
| **EXA** | Semantic search, content extraction, academic papers, company intel |
| **Brave Search** | Keyword search, news, local/places, videos, images, discussions |
| **zai-mcp-server** | Z.AI integration |
| **hostinger-mcp** | Hostinger API management |

### Inside Docker Desktop (via docker-gateway)

| MCP | Purpose |
|-----|---------|
| **Context7** | Library documentation lookup |
| **Apify** | Web scraping, Actors, social media data extraction |

## CRITICAL: Tool Selection Priority

ALWAYS prefer native Claude Code tools over MCP servers:

| Task | USE THIS | NOT THIS |
|------|----------|----------|
| Read files | `Read` tool | docker-gateway |
| Write files | `Write` / `Edit` tools | docker-gateway |
| Run commands | `Bash` tool | docker-gateway |
| Search files | `Glob` tool | docker-gateway |
| Search content | `Grep` tool | docker-gateway |
| List directories | `Bash(ls)` or `Glob` | docker-gateway |

## desktop-commander (docker-gateway) Usage

### ONLY use docker-gateway when:
1. User explicitly says "use docker" or "use container"
2. User explicitly mentions "Desktop Commander"
3. Task specifically requires Docker container operations
4. Accessing MCPs running inside Docker (Context7, Apify)
5. User asks to run something inside a Docker container

### NEVER use docker-gateway for:
- Reading local files (use `Read` tool)
- Writing local files (use `Write` or `Edit` tools)
- Running shell commands on host (use `Bash` tool)
- Searching files (use `Glob` or `Grep` tools)
- Listing directories (use `Bash(ls)` or `Glob`)
- Running Node.js or Python scripts on host (use `Bash` tool)

## playwright MCP Usage

### ONLY use playwright when:
1. User explicitly asks for browser automation
2. User wants to take screenshots of web pages
3. User needs to interact with a website
4. Task requires web scraping or testing
5. Filling forms or clicking elements on web pages

### NEVER use playwright for:
- General file operations
- Running commands
- Anything not related to web browsers

## EXA MCP Usage (Direct STDIO)

### Use EXA for:
1. Semantic web searches (meaning-based, not just keywords)
2. Research and documentation lookup
3. Company and competitor research
4. Academic paper search
5. Content extraction (full page text)
6. Find similar pages

### Access pattern (8 tools):
```text
mcp__exa__web_search_exa           # Semantic web search
mcp__exa__research_paper_search    # Academic papers
mcp__exa__company_research         # Company intel
mcp__exa__crawling                 # Content extraction
mcp__exa__competitor_finder        # Competitor analysis
mcp__exa__linkedin_search          # LinkedIn profiles
mcp__exa__wikipedia_search_exa     # Wikipedia
mcp__exa__github_search            # GitHub repos/code
```

## Brave Search MCP Usage (Direct STDIO)

### Use Brave Search for:
1. Keyword-based web searches (precise queries)
2. News search (current events, trending topics)
3. Local/Places search (businesses, locations, maps)
4. Video search (YouTube, Vimeo, etc.)
5. Image search
6. Discussion search (Reddit, StackOverflow threads)
7. Summarizer (AI-powered result summaries)

### Access pattern (6 tools):

```text
mcp__brave-search__brave_web_search       # General web search
mcp__brave-search__brave_local_search     # Local business/place search
mcp__brave-search__brave_news_search      # News articles
mcp__brave-search__brave_video_search     # Video search
mcp__brave-search__brave_image_search     # Image search
mcp__brave-search__brave_summarizer       # AI-powered summarization
```

### When to use Brave vs EXA:

| Task | Use Brave | Use EXA |
|------|-----------|---------|
| Keyword search (exact terms) | YES | -- |
| News / current events | YES | -- |
| Local businesses / places | YES | -- |
| Video search | YES | -- |
| Image search | YES | -- |
| Reddit/SO discussions | YES | -- |
| Semantic search (meaning-based) | -- | YES |
| Content extraction (full page) | -- | YES |
| Academic papers | -- | YES |
| Company intelligence / deep research | -- | YES |
| Find similar pages | -- | YES |
| LinkedIn search | -- | YES |

**Rule of thumb:** Brave for breadth and freshness (news, local, multimedia). EXA for depth and semantics (research, extraction, similarity).

## Context7 MCP Usage (via Docker)

### Use Context7 for:
1. Library documentation lookup
2. API reference for packages/frameworks
3. Getting up-to-date docs for dependencies

### Access pattern:
```
mcp__docker-gateway__resolve-library-id
mcp__docker-gateway__get-library-docs
```

## Apify MCP Usage (via Docker)

### Use Apify for:
1. Searching Actors in Apify Store (web scrapers, automation tools)
2. Running web scrapers for social media (Instagram, TikTok, LinkedIn, etc.)
3. Extracting data from e-commerce sites
4. Automated data collection from any website
5. RAG-enabled web browsing for AI context

### Access pattern (7 tools available):

```text
mcp__docker-gateway__apify-slash-rag-web-browser  # RAG-enabled web browsing
mcp__docker-gateway__search-actors                 # Search for Actors
mcp__docker-gateway__call-actor                    # Run an Actor
mcp__docker-gateway__fetch-actor-details           # Get Actor info/schema
mcp__docker-gateway__get-actor-output              # Get results from Actor run
mcp__docker-gateway__search-apify-docs             # Search Apify documentation
mcp__docker-gateway__fetch-apify-docs              # Fetch documentation page
```

### When to use Apify vs other tools:
| Task | Tool |
|------|------|
| Keyword web search | Brave (`brave_web_search`) |
| Semantic web search | EXA (`web_search_exa`) |
| News search | Brave (`brave_news_search`) |
| Local/places search | Brave (`brave_local_search`) |
| Scrape specific website | Apify (`call-actor`) |
| Social media data extraction | Apify (use specialized Actors) |
| Library documentation | Context7 |
| Academic research | EXA (`research_paper_search`) |

---

## Rationale

- **Native tools** execute on the LOCAL system (Windows/Mac/Linux)
- **docker-gateway** executes inside Docker containers (Linux)
- Using docker-gateway for local operations causes path mismatches and failures
- Native tools are faster and more reliable for local file operations
- Context7 and Apify run inside Docker for isolation and consistent environment
- EXA, Brave Search, and playwright run directly via STDIO for speed and reliability

---

## Known Issues

### Docker MCP Secrets Bug (Dec 2025)

**Issue:** Docker MCP Toolkit's secrets store and template interpolation do not work properly. Credentials set via `docker mcp secret set` are NOT passed to containers.

**Symptoms:**
- `docker mcp tools ls` shows "(N prompts)" instead of "(N tools)"
- MCP server starts but fails authentication
- Verbose output shows `-e ENV_VAR` without values

**Workaround:** Edit `~/.docker/mcp/catalogs/docker-mcp.yaml` directly with hardcoded env values:
```yaml
{mcp-name}:
  env:
    - name: API_TOKEN
      value: 'actual-token-value'
```

**Affected MCPs:** Any MCP requiring authentication (Apify, Notion, Slack, etc.)

**Working MCPs:** EXA works because its key is in `~/.docker/mcp/config.yaml` under `apiKeys`

For detailed instructions, see `*add-mcp` task or ask @devops for assistance.
