---
name: data-flow
description: Assembly-line diagram showing data movement through sources, transforms, and sinks
type: template
lifecycle_phase: planning
visual_pattern: assembly-line
---

# Data Flow Diagram

## When to Use

- API design reviews to visualize request/response pipelines
- ETL pipeline documentation showing extraction, transformation, and loading stages
- Data architecture discussions where format changes matter
- Debugging data corruption by tracing transformation steps
- Documenting integration contracts between services

## ASCII Layout

```
+------------------------------------------------------------------+
|                         [TITLE]                                   |
|                        [SUBTITLE]                                 |
|                                                                   |
|  +-----------+     +-----------+     +-----------+     +--------+ |
|  |  SOURCE   |---->| TRANSFORM |---->| TRANSFORM |---->|  SINK  | |
|  |    A      |     |     1     |     |     2     |     |   X    | |
|  +-----------+     +-----------+     +-----------+     +--------+ |
|       |                 |                 |                 |      |
|  +---------+       +---------+       +---------+      +---------+ |
|  | evidence|       | evidence|       | evidence|      | evidence| |
|  | artifact|       | artifact|       | artifact|      | artifact| |
|  +---------+       +---------+       +---------+      +---------+ |
|                                                                   |
|  +-----------+     +-----------+                       +--------+ |
|  |  SOURCE   |---->| TRANSFORM |---------------------->|  SINK  | |
|  |    B      |     |     3     |                       |   Y    | |
|  +-----------+     +-----------+                       +--------+ |
|                                                                   |
+------------------------------------------------------------------+
```

## Template Fields

| Field | Description | Example |
|-------|-------------|---------|
| `pipeline_name` | Name of the data pipeline | "User Registration Flow" |
| `sources` | Origin systems producing data | Webhook, CSV Upload, API Call |
| `transforms` | Processing steps that modify shape or content | Validate, Enrich, Normalize |
| `sinks` | Destination systems consuming data | Database, S3 Bucket, Queue |
| `data_formats` | Shape of data at each stage | JSON, CSV, Protobuf |
| `error_paths` | Where failures route to | Dead Letter Queue, Error Log |

## Element Guidance

### Source Nodes
- Type: `rectangle`, borderRadius: 8
- Fill: `#fed7aa` (trigger/start), stroke: `#c2410c`, strokeWidth: 2
- Label includes source name and protocol
- roughness: 0

### Transform Nodes
- Type: `rectangle`, borderRadius: 4
- Fill: `#3b82f6` (primary), stroke: `#1e3a5f`, strokeWidth: 2
- Label includes operation name
- For AI/LLM transforms: fill `#ddd6fe`, stroke `#6d28d9`

### Sink Nodes
- Type: `rectangle`, borderRadius: 8
- Fill: `#a7f3d0` (success/end), stroke: `#047857`, strokeWidth: 2
- Label includes destination name and protocol

### Error Paths
- Type: `arrow`, stroke: `#dc2626`, strokeStyle: "dashed"
- Target node: fill `#fecaca` (error), stroke `#b91c1c`
- Label: failure condition

### Evidence Artifacts (Data Samples)
- Type: `rectangle`, borderRadius: 4
- Fill: `#1e293b` (dark background), stroke: `#1e3a5f`
- Text color: `#22c55e` (green on dark)
- fontSize: 12, fontFamily: 3 (monospace)
- Content: actual data shape at that stage, truncated to 3-5 lines
- Place directly below the node it describes

### Flow Arrows
- Type: `arrow`, stroke: `#64748b`, strokeWidth: 2
- Label with data format or protocol on arrow midpoint
- Arrow from source to first transform, chained through to sink

### Title
- fontSize: 28, fontFamily: 3, color: `#1e40af`

### Subtitle
- fontSize: 16, fontFamily: 1, color: `#3b82f6`

## Example: Webhook Ingestion Pipeline

```
Title: "Webhook Ingestion Pipeline"
Subtitle: "GitHub events to analytics database"

Source: "GitHub Webhook" (trigger color)
  Evidence: { "action": "opened", "pull_request": { "id": 42, ... } }

Transform 1: "Validate & Parse" (primary color)
  Evidence: { "event": "pr_opened", "repo": "aios-core", "author": "dev1" }

Transform 2: "Enrich with LLM" (AI/LLM color)
  Evidence: { ...prev, "sentiment": "positive", "complexity": "medium" }

Sink: "Analytics DB" (success color)
  Evidence: INSERT INTO events (type, repo, author, sentiment) VALUES (...)

Error Path (dashed red):
  Transform 1 --"invalid signature"--> "Dead Letter Queue" (error color)
    Evidence: { "error": "HMAC_MISMATCH", "webhook_id": "abc123" }
```
