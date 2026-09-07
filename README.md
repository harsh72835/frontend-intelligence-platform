# Frontend Intelligence Platform

**FIP** is a self-hosted frontend observability platform. It captures real-user performance telemetry from browser applications, stores it in Postgres, detects regressions across releases, and surfaces insights through a dashboard and CI tooling.

Think of it as a lightweight Datadog RUM or SpeedCurve that you own entirely — no vendor lock-in, no per-seat pricing, no sampling limits.

---

## What it does

- **Captures browser telemetry** — Web Vitals (LCP, INP, CLS, TTFB), API timings, JS errors, long tasks, route changes, resource timings
- **Tracks releases** — Every event is tagged with a release version so you can compare `v1.2.0` against `v1.1.0` with statistical precision
- **Detects regressions** — Automated thresholds flag P75 LCP regressions ≥25%, error count spikes, and API latency increases
- **Resolves minified stacks** — Source map upload API lets you see `checkout/page.tsx:42:12` instead of `main.js:1:2345`
- **Alerts your team** — Provider-agnostic alerting (Slack, SNS, email, webhook, or custom) triggered by configurable thresholds
- **Enforces budgets in CI** — CLI tool exits non-zero when Lighthouse scores or bundle sizes exceed your thresholds
- **Aggregates for speed** — Background job pre-computes hourly summaries so dashboard queries stay fast at scale

---

## Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Monorepo | pnpm workspaces |
| Dashboard + API | Next.js 14 App Router |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Auth | NextAuth v5 (JWT, credentials) |
| Validation | Zod |
| UI | Tailwind CSS, Recharts |
| Source maps | source-map-js (pure JS) |

---

## Monorepo layout

```
apps/
  dashboard/        Next.js app — dashboard UI + all API routes
  sample-app/       Instrumented demo Next.js app (port 3001)

packages/
  sdk/              Browser SDK — initFip(), collectors, queue, transport
  shared/           Event types + Zod schemas (shared source of truth)
  budget-checker/   CLI that checks Lighthouse + bundle budgets
  config/           Shared tsconfig base

prisma/
  schema.prisma     All models and indexes

scripts/
  seed.ts           Seeds 3 releases of realistic demo telemetry
  seed-sourcemap.ts Seeds a source map for release 1.2.0
```

---

## Quick start

### Prerequisites

- Node.js ≥20, pnpm ≥9
- PostgreSQL (Docker works fine)

### 1. Install

```bash
pnpm install
```

### 2. Start Postgres

```bash
docker run -d --name fip-pg \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16
```

### 3. Configure environment

```bash
# apps/dashboard/.env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fip_dev"
FIP_APP_ID="sample-app"
AUTH_SECRET="<generate with: openssl rand -base64 32>"
AUTH_USER="admin"
AUTH_PASSWORD="your-password"
FIP_ALERT_PROVIDERS="log"          # comma-separated: log,slack,webhook,sns,email
FIP_ALERT_ERROR_THRESHOLD="10"     # JS errors per hour before alert fires
FIP_ALERT_LCP_THRESHOLD_MS="4000"  # LCP ms threshold for poor rating alert

# apps/sample-app/.env
NEXT_PUBLIC_FIP_APP_ID="sample-app"
NEXT_PUBLIC_FIP_INGEST_URL="http://localhost:3000/api/ingest"
NEXT_PUBLIC_FIP_INGEST_KEY="dev-key-sample-app"
NEXT_PUBLIC_FIP_RELEASE="1.2.0"
NEXT_PUBLIC_FIP_ENV="development"
```

### 4. Migrate and seed

```bash
pnpm db:migrate     # runs prisma migrate dev
pnpm db:generate    # generates Prisma client
pnpm db:seed        # seeds 3 releases of demo data (optional)
```

### 5. Run

```bash
# Terminal 1 — dashboard on :3000
pnpm dev:dashboard

# Terminal 2 — sample app on :3001 (generates live telemetry)
pnpm dev:sample
```

Open `http://localhost:3000` and sign in with the credentials you set in `.env.local`.

---

## Dashboard pages

| Page | Route | What you see |
|---|---|---|
| Overview | `/` | Event totals, P75 LCP/INP trend chart, top routes by traffic, recent JS errors |
| Routes | `/routes` | Per-route table: LCP, INP, CLS, API latency, error count, long tasks |
| Releases | `/releases` | Release list with regression badges; side-by-side metric comparison |
| Errors | `/errors` | JS errors grouped by message+route, with resolved source frames |

---

## SDK integration

Install in any web application:

```bash
npm install @fip/sdk
```

Initialize once at app startup:

```ts
import { initFip } from "@fip/sdk"

initFip({
  appId: "my-app",
  ingestUrl: "https://your-fip.example.com/api/ingest",
  ingestKey: "your-ingest-key",   // created in the dashboard or seeded
  release: process.env.NEXT_PUBLIC_RELEASE_VERSION,
  environment: "production",

  // all collectors are enabled by default — opt out individually:
  // collectVitals: false,
  // collectApiTimings: false,
  // collectErrors: false,
  // collectLongTasks: false,
  // collectRouteChanges: false,
  // collectResourceTimings: false,
})
```

**What gets captured automatically:**

| Collector | Events emitted | Mechanism |
|---|---|---|
| Web Vitals | `web_vital` (LCP, INP, CLS, TTFB) | `web-vitals` library |
| Route changes | `route_change` | `history.pushState` / `popstate` patches |
| API timings | `api_timing` (method, url, durationMs, status) | `fetch` proxy |
| JS errors | `js_error` (message, stack, source, line, col) | `window.onerror` + `unhandledrejection` |
| Long tasks | `long_task` (durationMs, startTime) | `PerformanceObserver` |
| Resource timings | `resource_timing` (url, initiator, durationMs, size) | `PerformanceObserver` |

Events are batched (default: 20 events or 5 seconds, whichever comes first) and flushed with `fetch` + `keepalive: true` so in-flight batches survive page unloads.

---

## API reference

### Ingest

```
POST /api/ingest
Content-Type: application/json
x-fip-key: <your-ingest-key>
```

```json
{
  "events": [ ...FipEvent[] ]
}
```

Response `200`:
```json
{ "accepted": 20, "rejected": 0 }
```

Rate limited to **1000 requests/minute per app** (sliding window). Exceeding returns `429` with `Retry-After` header.

Validates with Zod — malformed events return `422` with per-field issue list.

### Source map upload

```
POST /api/source-maps
Content-Type: application/json
x-job-secret: <AUTH_SECRET>
```

```json
{
  "appId": "my-app",
  "release": "2.0.0",
  "filename": "main.js",
  "content": "<source map JSON string>"
}
```

### Bundle report

```
POST /api/bundle-report
Content-Type: application/json
x-job-secret: <AUTH_SECRET>
```

```json
{
  "appId": "my-app",
  "releaseId": "<release-id>",
  "totalSizeKb": 342.1,
  "gzipSizeKb": 108.4,
  "chunks": [
    { "name": "main.js", "sizeKb": 210 },
    { "name": "vendor.js", "sizeKb": 132 }
  ]
}
```

### Alert check (cron target)

```
POST /api/alerts/check
x-job-secret: <AUTH_SECRET>
```

Runs all alert checks for the configured app. Meant to be called by a cron job or scheduler every 5–15 minutes.

### Aggregation job

```
POST /api/jobs/aggregate
Content-Type: application/json
x-job-secret: <AUTH_SECRET>

{ "windowHours": 48 }
```

Recomputes hourly `RouteSummary` and `ReleaseSummary` rows for the window. Called automatically (fire-and-forget) after every ingest; can also be called manually or via cron.

---

## Budget checker (CI)

```bash
pnpm --filter @fip/budget-checker check \
  --config budget.config.json \
  --lighthouse lighthouse-report.json \
  --bundle bundle-stats.json
```

Exits `0` on pass, `1` on any violation. Drop into any CI pipeline after a Lighthouse run.

Example `budget.config.json`:

```json
{
  "lcp": { "warn": 2500, "fail": 4000 },
  "cls": { "warn": 0.1, "fail": 0.25 },
  "performance": { "warn": 85, "fail": 70 },
  "totalBundleKb": { "warn": 400, "fail": 600 },
  "chunkBudgets": {
    "main.js": { "warn": 200, "fail": 300 }
  }
}
```

---

## Alert providers

Set `FIP_ALERT_PROVIDERS` to a comma-separated list. All listed providers receive every alert (fan-out via `Promise.allSettled` — one failure won't block others).

| Provider | Env vars required |
|---|---|
| `log` | none — prints to stdout |
| `slack` | `FIP_SLACK_WEBHOOK_URL` |
| `webhook` | `FIP_WEBHOOK_URL` |
| `sns` | `FIP_SNS_TOPIC_ARN`, `AWS_REGION`, AWS credentials |
| `email` | `FIP_EMAIL_FROM`, `FIP_EMAIL_TO`, `FIP_SMTP_HOST`, `FIP_SMTP_PORT`, `FIP_SMTP_USER`, `FIP_SMTP_PASS` |

Example multi-provider setup:

```bash
FIP_ALERT_PROVIDERS="slack,webhook"
FIP_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
FIP_WEBHOOK_URL="https://your-pagerduty-endpoint.com/..."
```

Alert kinds: `lcp_poor_routes`, `js_error_spike`, `api_latency_spike`. Each has a per-kind 1-hour cooldown to suppress duplicate pages.

---

## Database schema

**Core models:**

- `App` — registered application with a unique `ingestKey`
- `Release` — versioned release `(appId, version, environment)` — unique constraint prevents duplicates
- `Event` — raw telemetry rows; JSON `payload` holds metric-specific fields
- `RouteSummary` — pre-aggregated hourly buckets per `(route, releaseId)` — what the dashboard queries first
- `ReleaseSummary` — one row per release, rolled up from its `RouteSummary` rows
- `BundleReport` — CI-submitted bundle size snapshots
- `SourceMap` — uploaded source map content, resolved on-demand for error frames
- `Alert` — fired alert log with fingerprint for deduplication

**Indexes:**

Every hot query path is indexed: `(appId, timestamp)` for time-range scans, `(appId, route, timestamp)` for per-route queries, `(appId, type, timestamp)` for event-type filters, `(releaseId, timestamp)` for release comparisons.

---

## Architecture

### Data flow

```
Browser (instrumented app)
  └─ @fip/sdk
       └─ EventQueue (batches, flushes every 5s or 20 events)
            └─ fetch POST /api/ingest  (x-fip-key header)
                 ├─ validateIngestKey  → 401/403 if missing/invalid
                 ├─ checkRateLimit     → 429 if > 1000 req/min
                 ├─ Zod validation     → 422 if schema mismatch
                 ├─ prisma.event.createMany
                 └─ runAggregation()   (fire-and-forget, 2h window)

Dashboard (server components)
  └─ getRouteMetrics()
       ├─ [fast path] prisma.routeSummary.findMany  (pre-aggregated)
       └─ [fallback]  prisma.event.findMany + in-process percentile calc
```

### Aggregation pipeline

The background aggregator (`runAggregation`) runs:
1. Fetch all relevant events in the window
2. Group into hourly buckets per `(route, releaseId, hourBucket)`
3. For each bucket: compute P75 LCP/INP (sorted array + index math), avg CLS/API latency, count errors/long tasks
4. Batch upsert `RouteSummary` rows (50 at a time to avoid Postgres saturation)
5. Roll up to `ReleaseSummary` (one row per release, aggregated from its `RouteSummary` rows)

Dashboard queries always try `RouteSummary` first. If none exist (e.g., before the first aggregation run), they fall back to scanning raw events inline.

### Authentication

NextAuth v5 with JWT sessions. Credentials provider validates `AUTH_USER` / `AUTH_PASSWORD` env vars — no user table needed for single-operator deployments. Middleware protects all routes except the public API paths (`/api/ingest`, `/api/alerts`, `/api/jobs`, `/api/source-maps`, `/api/bundle-report`).

### Source map resolution

Stack frames from `js_error` events reference minified files (`main.js:1:2345`). When a source map is uploaded for that `(appId, release, filename)`, the error detail view resolves each frame using `source-map-js` (pure-JS fork of Mozilla's `source-map` — chosen because Next.js SSR cannot bundle `.wasm` files). Consumers are cached in process memory after first load.

### Rate limiting

In-memory sliding window per `appId`. `checkRateLimit(key, 1000)` filters the timestamp array to the last 60 seconds, rejects if count ≥ limit, otherwise appends the current timestamp. A periodic purge drops stale entries to prevent unbounded growth. Resets on server restart — appropriate for single-instance deployments; swap in Redis for multi-instance.

---

## Key design decisions

### fetch + keepalive instead of sendBeacon

`navigator.sendBeacon` cannot set custom headers. Since we authenticate every ingest request with `x-fip-key`, `sendBeacon` was a non-starter. We use `fetch` with `keepalive: true` instead — the browser keeps the request alive through page unload, giving us the same "fire-and-forget on navigation" behavior without sacrificing auth.

### source-map-js over source-map

The `source-map` npm package (Mozilla) uses a WebAssembly file (`mappings.wasm`) that Next.js doesn't bundle into its SSR output. Importing it in a server component or API route produces `ENOENT: no such file or directory, open '.next/server/vendor-chunks/mappings.wasm'`. `source-map-js` is a maintained pure-JS fork with an identical API — same `SourceMapConsumer`, same `originalPositionFor` call, zero WASM.

### RouteSummary as a read accelerator

Scanning raw events on every dashboard load does not scale — a busy app generating 10k events/hour over 7 days means 1.68M rows per query. `RouteSummary` pre-computes per-route hourly buckets. The dashboard reads O(hours × routes) rows instead of O(events). The aggregation job runs fire-and-forget after every ingest (2-hour window) and can also be called by a cron job for a full recompute.

### Provider-agnostic alerting

Alert providers implement a single interface: `{ name: string; send(alert: AlertPayload): Promise<void> }`. The router reads `FIP_ALERT_PROVIDERS` at runtime, fans out to all listed providers via `Promise.allSettled`, and logs individual failures without blocking others. Adding a new provider means writing one ~20-line file and adding it to the registry — no core changes needed.

### Discriminated union event schema

All events share a base shape (`id, appId, route, timestamp, ...`) and carry a `type` discriminator. The Zod schema is a `z.discriminatedUnion("type", [...])` — each variant validates only the fields relevant to its type. The JSON `payload` column in Postgres stores the metric-specific data. This lets us add new event types without schema migrations.

---

## Deploy (Railway)

### 1. Create project

```bash
railway init
railway add postgresql
```

### 2. Set environment variables

In the Railway dashboard → Variables, add all vars from `apps/dashboard/.env.local`:

```
DATABASE_URL         (Railway injects this automatically from the Postgres plugin)
AUTH_SECRET
AUTH_USER
AUTH_PASSWORD
FIP_APP_ID
FIP_ALERT_PROVIDERS
# + provider-specific vars (FIP_SLACK_WEBHOOK_URL etc.)
```

### 3. Configure build

`railway.toml` (create at project root):

```toml
[build]
builder = "nixpacks"
buildCommand = "pnpm install && pnpm db:generate && pnpm --filter dashboard build"

[deploy]
startCommand = "pnpm --filter dashboard start"
healthcheckPath = "/api/health"
```

### 4. Migrate and seed

```bash
railway run pnpm db:migrate
railway run pnpm db:seed   # optional
```

### 5. Set up cron (alert checks + full aggregation)

Railway Cron jobs or an external scheduler hitting:

```
POST https://your-app.railway.app/api/alerts/check
x-job-secret: <AUTH_SECRET>
```

Every 10 minutes. Optional full aggregation recompute every hour:

```
POST https://your-app.railway.app/api/jobs/aggregate
x-job-secret: <AUTH_SECRET>
{ "windowHours": 168 }
```

---

## CI integration (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @fip/shared typecheck
      - run: pnpm --filter @fip/sdk typecheck
      - run: pnpm --filter @fip/budget-checker typecheck
      - run: pnpm --filter dashboard typecheck

  budget-check:
    runs-on: ubuntu-latest
    needs: typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      # Run Lighthouse CI, generate report, then check budgets
      - run: |
          pnpm --filter @fip/budget-checker check \
            --config budget.config.json \
            --lighthouse lighthouse-report.json \
            --bundle bundle-stats.json
```

---

## Multi-app support

The schema is multi-tenant at the `App` level — each `App` row has a unique `ingestKey` and all telemetry is scoped by `appId`. To onboard a second application:

1. Insert an `App` row (or add an admin UI endpoint for this)
2. Distribute the generated `ingestKey` to the new app's SDK config
3. All dashboard queries will need an `appId` selector — the current UI defaults to `FIP_APP_ID` from env

Full multi-tenant dashboard UI (app switcher, per-app views) is the next natural evolution.

---

## What this is not

FIP is purpose-built for **frontend performance observability**. It does not do:

- Session replay or heatmaps (OpenReplay, FullStory)
- Backend APM or distributed tracing (Datadog, Sentry)
- Log aggregation (Logtail, Axiom)
- Real-time streaming (Kafka, ClickHouse-backed pipelines)
- RBAC or team management

If you need those, you need those products. FIP's value is owning your performance data without paying $500/month for the privilege.
