---
name: deployment-topology
description: Infrastructure deployment diagram with environments, services, databases, and network connections
type: template
lifecycle_phase: postmortem
visual_pattern: boundary-hierarchy
---

# Deployment Topology Template

## Runbook: How to Visualize Infrastructure and Deployments

### When to Use
- DevOps documentation of production infrastructure
- Infrastructure planning for new services
- Deployment review before go-live
- Comparing staging vs production topology
- Documenting network connections, ports, and protocols
- Cloud architecture overview for onboarding

### Excalidraw Layout

```
+------------------------------------------------------------------------+
|  TITLE: [Service Name] Deployment Topology                             |
|  TYPE: Deployment Topology    DATE: YYYY-MM-DD    ENV: prod/staging    |
+------------------------------------------------------------------------+
|                                                                        |
|  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~                                        |
|  ( External Services (Cloud)  )                                        |
|  ( Stripe API  |  SendGrid   )                                        |
|  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~                                        |
|         |                                                              |
|         | HTTPS :443                                                   |
|         v                                                              |
|  +=========================== PROD ================================+   |
|  |                                                                 |   |
|  |  +---------------+    :3000    +----------------+               |   |
|  |  | CDN / Edge    |----------->| Next.js App    |               |   |
|  |  | (Vercel Edge) |            | (Vercel SSR)   |               |   |
|  |  +---------------+            +----------------+               |   |
|  |                                      |                         |   |
|  |                                      | :443 REST                |   |
|  |                                      v                         |   |
|  |                               +----------------+               |   |
|  |                               | API Server     |               |   |
|  |                               | (Node.js)      |               |   |
|  |                               +----------------+               |   |
|  |                                 |            |                 |   |
|  |                    :5432        |            |  :6379          |   |
|  |                    v            |            v                 |   |
|  |  /============\                 |     +------------+          |   |
|  |  | PostgreSQL |                 |     | Redis      |          |   |
|  |  | (Neon)     |                 |     | (Upstash)  |          |   |
|  |  \============/                 |     +------------+          |   |
|  |                                 |                              |   |
|  +============================== =============================+   |
|                                    |                              |
|  +=========================== STAGING ========================+   |
|  |  (mirrors prod, reduced scale)                             |   |
|  |  Next.js Preview | API Staging | Neon Branch | Redis Dev   |   |
|  +============================================================+   |
|                                                                    |
+--------------------------------------------------------------------+
```

### Template Fields

| Field | Description | Example |
|-------|-------------|---------|
| Service name | The system or product being deployed | `Synkra Dashboard` |
| Environments | Deployment boundaries (prod, staging, dev) | `prod`, `staging` |
| Services | Application containers or serverless functions | `Next.js App`, `API Server` |
| Databases | Persistent data stores | `PostgreSQL (Neon)`, `Redis (Upstash)` |
| External services | Third-party APIs and cloud providers | `Stripe API`, `SendGrid` |
| Connections | Network links between components | `HTTPS :443`, `TCP :5432` |
| Ports/protocols | Port numbers and protocol types | `:3000 HTTP`, `:5432 TCP` |

### Color Assignments

| Element | Fill | Stroke | Usage |
|---------|------|--------|-------|
| Application services | `#3b82f6` | `#1e3a5f` | Primary: servers, containers, functions |
| Supporting services | `#60a5fa` | `#1e3a5f` | Secondary: caches, queues, CDN |
| Databases | `#a7f3d0` | `#047857` | End/Success green for data stores |
| External/cloud services | `#ddd6fe` | `#6d28d9` | AI/LLM purple for external dependencies |
| Environment boundaries | `#fef3c7` | `#b45309` | Decision amber for env boundary boxes |
| Error/risk zones | `#fecaca` | `#b91c1c` | Error red for known risk areas |
| Connection labels | `#64748b` | -- | Body text for port/protocol labels |
| Title text | `#1e40af` | -- | Title color |

### Element Guidance

- **Environment boundaries**: Large dashed-stroke rectangles grouping all services in one env. Use Decision color (`#fef3c7` fill, `#b45309` stroke). Label top-left with env name (PROD, STAGING, DEV). `roughness: 0`.
- **Application services**: Solid rectangles with Primary fill. Include service name and runtime (e.g., "Next.js App (Vercel SSR)").
- **Databases**: Tall rectangles with slightly rounded top corners to suggest cylinder shape. Use End/Success green fill. Label with engine and provider.
- **External services**: Rounded rectangles or cloud-like shapes with AI/LLM purple fill. Position outside environment boundaries.
- **Network connections**: Dashed arrows (`strokeStyle: dashed`) between services. Label with port and protocol (`:443 HTTPS`, `:5432 TCP`). Arrow color `#1e3a5f`.
- **CDN/Edge**: Place at the top of the production boundary as the entry point.
- **Layout**: Top-to-bottom flow. External services at top, CDN/Edge below, then app tier, then data tier. Staging mirrors prod structure below with reduced detail.

### Example: Next.js + API + Neon on Vercel

**Environments**: Production (Vercel), Staging (Vercel Preview)

**Services**:
- `Vercel Edge` -- CDN and edge functions (Secondary fill)
- `Next.js App` -- SSR application on Vercel (Primary fill)
- `API Server` -- Node.js REST API (Primary fill)
- `PostgreSQL` -- Neon serverless database (Success green fill)
- `Redis` -- Upstash cache (Secondary fill)

**External**:
- `Stripe API` -- payment processing (AI/LLM purple)
- `SendGrid` -- email delivery (AI/LLM purple)

**Connections**:
- User -> Vercel Edge `:443 HTTPS`
- Vercel Edge -> Next.js App `:3000`
- Next.js App -> API Server `:443 REST`
- API Server -> PostgreSQL `:5432 TCP`
- API Server -> Redis `:6379 TCP`
- API Server -> Stripe `:443 HTTPS`
- API Server -> SendGrid `:443 HTTPS`
