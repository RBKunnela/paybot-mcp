---
name: system-context
description: High-level system boundary diagram for stakeholder alignment and executive briefings
type: template
lifecycle_phase: communication
visual_pattern: boundary-boxes
---

# System Context Diagram

## When to Use

- Stakeholder alignment meetings where technical depth is unwelcome
- Executive briefings that need a single-slide system overview
- Onboarding new team members to understand system boundaries
- Architecture decision records that require visual context
- RFP responses showing integration landscape

## ASCII Layout

```
+--------------------------------------------------+
|                    [TITLE]                        |
|                   [SUBTITLE]                      |
|                                                   |
|   [Actor A]          [Actor B]       [Actor C]    |
|      |                  |               |         |
|      v                  v               v         |
|  +------------------------------------------+     |
|  |            SYSTEM BOUNDARY               |     |
|  |                                          |     |
|  |   +-------------+   +-------------+     |     |
|  |   |  Module A   |-->|  Module B   |     |     |
|  |   +-------------+   +-------------+     |     |
|  |                                          |     |
|  +------------------------------------------+     |
|      |                  |               |         |
|      v                  v               v         |
|   [Ext DB]        [Ext API]       [Ext Service]   |
|                                                   |
|  +----------------------------------------------+ |
|  | LEGEND: [color key]                          | |
|  +----------------------------------------------+ |
+--------------------------------------------------+
```

## Template Fields

| Field | Description | Example |
|-------|-------------|---------|
| `system_name` | Name of the central system | "AIOS Core Platform" |
| `actors` | External users or systems that interact | User, Admin, CI/CD Pipeline |
| `boundaries` | Logical grouping of internal modules | Core Engine, Plugin Layer |
| `data_flows` | Labeled arrows between elements | "REST API", "Webhook", "gRPC" |
| `external_systems` | Databases, APIs, services outside boundary | PostgreSQL, Stripe API, S3 |

## Element Guidance

### System Boundary Box
- Type: `rectangle`
- Fill: `#3b82f6` (primary), stroke: `#1e3a5f`, strokeWidth: 2
- Use dashed border (`strokeStyle: "dashed"`) for trust boundaries
- roughness: 0

### External Actors (Users, Roles)
- Type: `rectangle` with rounded corners (borderRadius: 8)
- Fill: `#fed7aa` (trigger), stroke: `#c2410c`
- Place OUTSIDE the system boundary, top row

### External Systems (APIs, DBs, Services)
- Type: `rectangle`
- Fill: `#60a5fa` (secondary), stroke: `#1e3a5f`
- Place OUTSIDE the system boundary, bottom row

### Internal Modules
- Type: `rectangle`
- Fill: `#ffffff`, stroke: `#1e3a5f`, strokeWidth: 1
- Place INSIDE the system boundary

### Data Flow Arrows
- Type: `arrow`
- stroke: `#64748b`, strokeWidth: 1
- Add text label on each arrow describing the protocol or data type

### Title
- fontSize: 28, fontFamily: 3 (monospace), color: `#1e40af`

### Subtitle
- fontSize: 16, fontFamily: 1 (sans-serif), color: `#3b82f6`

### Legend Box
- Type: `rectangle`, fill: `#f8fafc`, stroke: `#1e3a5f`, strokeWidth: 1
- Place at bottom of diagram
- Include color swatches with labels: "System Boundary", "External Actor", "External System"

## Example: AIOS Core Platform

```
Title: "AIOS Core — System Context"
Subtitle: "How external actors interact with the platform"

Actors (top):
  - "Developer" (trigger color)    → arrow "CLI Commands" → System
  - "CI/CD Pipeline" (trigger)     → arrow "Webhooks"     → System
  - "Dashboard User" (trigger)     → arrow "HTTP/REST"    → System

System Boundary (primary color, dashed):
  - "Agent Engine"
  - "Story Tracker"
  - "Config Resolver"

External Systems (bottom):
  - "GitHub API" (secondary)       ← arrow "REST" ← System
  - "Supabase DB" (secondary)      ← arrow "SQL"  ← System
  - "LLM Provider" (AI/LLM color)  ← arrow "API"  ← System

Legend:
  [#fed7aa] External Actor
  [#3b82f6] System Boundary
  [#60a5fa] External System
  [#ddd6fe] AI/LLM Service
```
