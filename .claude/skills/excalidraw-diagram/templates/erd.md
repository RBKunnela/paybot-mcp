---
name: entity-relationship-diagram
description: Database schema ERD with tables, columns, types, and foreign key relationships
type: template
lifecycle_phase: postmortem
visual_pattern: structured-grid
---

# Entity-Relationship Diagram Template

## Runbook: How to Visualize Database Schemas

### When to Use
- Database design and schema documentation
- Data modeling for new features or services
- Reviewing table relationships and foreign keys
- Onboarding developers to an existing data layer
- Auditing schema for normalization or denormalization decisions

### Excalidraw Layout

```
+-----------------------------------------------------------------------+
|  TITLE: [Schema Name] ERD                                             |
|  TYPE: Entity-Relationship Diagram   DATE: YYYY-MM-DD                 |
+-----------------------------------------------------------------------+
|                                                                       |
|  +------------------+       +-------------------+                     |
|  | users            |       | posts             |                     |
|  |------------------|       |-------------------|                     |
|  | **id** (uuid PK) |--1:N--| **id** (uuid PK)  |                    |
|  | email (varchar)  |       | author_id (uuid FK)|                    |
|  | name (varchar)   |       | title (text)       |                    |
|  | created_at (ts)  |       | body (text)        |                    |
|  +------------------+       | published (bool)   |                    |
|                             | created_at (ts)    |                    |
|                             +-------------------+                     |
|                                    |                                  |
|                                   1:N                                 |
|                                    |                                  |
|                             +-------------------+                     |
|                             | comments          |                     |
|                             |-------------------|                     |
|                             | **id** (uuid PK)  |                     |
|                             | post_id (uuid FK) |                     |
|                             | author_id (uuid FK)|                    |
|                             | body (text)        |                    |
|                             | created_at (ts)    |                    |
|                             +-------------------+                     |
|                                                                       |
|  +---------------------+                                              |
|  | LEGEND              |                                              |
|  | PK = Primary Key    |                                              |
|  | FK = Foreign Key     |                                             |
|  | 1:N = One-to-Many   |                                              |
|  | N:M = Many-to-Many  |                                              |
|  +---------------------+                                              |
+-----------------------------------------------------------------------+
```

### Template Fields

| Field | Description | Example |
|-------|-------------|---------|
| Schema name | Name of the database or bounded context | `synkra_core` |
| Entities | Each table or view in the schema | `users`, `posts`, `comments` |
| Columns | Column name, data type, constraints | `id (uuid PK)`, `email (varchar UNIQUE)` |
| Relationships | FK connections with cardinality labels | `users.id --1:N-- posts.author_id` |
| Cardinality | Relationship multiplicity | `1:1`, `1:N`, `N:M` |
| Indexes | Notable indexes worth visualizing | `idx_posts_author_id` |

### Color Assignments

| Element | Fill | Stroke | Usage |
|---------|------|--------|-------|
| Core tables | `#3b82f6` | `#1e3a5f` | Primary domain entities |
| Junction/lookup tables | `#60a5fa` | `#1e3a5f` | Join tables, enums, config |
| Column listing area | `#1e293b` | -- | Evidence artifact style background |
| Column text | `#22c55e` | -- | Monospace, evidence artifact style |
| Table name header | `#1e40af` | -- | Bold, title color |
| FK arrow labels | `#64748b` | -- | Body text color for cardinality |
| PK columns | `#1e40af` | -- | Bold to distinguish from regular columns |

### Element Guidance

- **Tables**: Rectangles with `roughness: 0`. Header row contains table name in bold (`#1e40af`). Body area uses evidence artifact style (`bg: #1e293b`, `text: #22c55e`) to list columns in monospace.
- **Primary keys**: Bold text, listed first in each table.
- **Foreign keys**: Marked with `FK` suffix. Draw a labeled arrow from the FK column to the referenced PK.
- **Arrows**: Solid lines with arrowheads. Label each with cardinality (`1:1`, `1:N`, `N:M`). Stroke `#1e3a5f`.
- **Junction tables**: Use Secondary fill (`#60a5fa`) to visually separate from core entities.
- **Legend**: Small rectangle in bottom-left with notation key.
- **Layout**: Arrange tables so FK arrows flow left-to-right or top-to-bottom. Avoid crossing arrows where possible.

### Example: Blog Schema

**Entities**: `users` (core), `posts` (core), `comments` (core), `post_tags` (junction), `tags` (lookup)

**Relationships**:
- `users.id` --1:N-- `posts.author_id`
- `users.id` --1:N-- `comments.author_id`
- `posts.id` --1:N-- `comments.post_id`
- `posts.id` --N:M-- `tags.id` via `post_tags`

**Column details** (evidence artifact style per table):
```
users:          id (uuid PK) | email (varchar) | name (varchar) | created_at (timestamptz)
posts:          id (uuid PK) | author_id (uuid FK) | title (text) | body (text) | published (bool)
comments:       id (uuid PK) | post_id (uuid FK) | author_id (uuid FK) | body (text)
post_tags:      post_id (uuid FK,PK) | tag_id (uuid FK,PK)
tags:           id (uuid PK) | name (varchar UNIQUE)
```

Core tables (`users`, `posts`, `comments`) get Primary fill. Junction table (`post_tags`) and lookup (`tags`) get Secondary fill.
