# V1 Scope

## Product Definition

Frontend Intelligence Platform (FIP) V1 is a frontend observability and performance governance platform.

Its purpose is to let a frontend team:

- measure real user performance
- inspect route and release health
- identify regressions
- connect runtime behavior to performance quality
- enforce performance standards in CI

## V1 Promise

A developer can install the SDK into a web app, send telemetry to FIP, view route and release insights in a dashboard, and fail CI when budgets regress.

## Included in V1

### Browser SDK

- SDK init API
- session identification
- Web Vitals capture
- route change capture
- API timing capture
- JS error capture
- unhandled rejection capture
- long-task capture
- batching and transport

### Ingestion Layer

- `POST /api/ingest`
- payload validation
- accepted/rejected counts
- ingestion metadata attachment
- persistence to Postgres

### Storage

- app metadata
- release metadata
- raw events
- route summaries
- release summaries

### Dashboard

- overview page
- routes page
- releases page
- errors page
- time range filtering
- route and release comparisons

### Regression Detection

- threshold-based checks
- release-over-release comparisons
- time-window comparisons
- visible regression flags in UI

### Budget Checker

- CLI entry point
- config file support
- Lighthouse report parsing
- bundle report parsing
- pass/fail exit behavior

## Excluded from V1

- user authentication
- role-based access control
- alert delivery
- Slack/email notifications
- source map processing
- session replay
- resource waterfall explorer
- anomaly detection
- streaming pipelines
- queue workers
- true real-time dashboards
- org/workspace multi-tenancy

## Primary Use Cases

### Use Case 1: Monitor app health

A frontend engineer opens the dashboard overview and sees:

- current vitals snapshot
- top slow routes
- recent regressions
- top runtime errors

### Use Case 2: Investigate slow route

A frontend engineer filters to a route and inspects:

- p75 LCP
- p75 INP
- average CLS
- API latency
- long-task volume
- associated errors

### Use Case 3: Compare releases

A lead compares the latest release with the previous one and sees:

- which metrics worsened
- which routes regressed
- whether error volume increased

### Use Case 4: Enforce performance budgets

CI runs the budget checker and fails the build when:

- synthetic performance score drops too far
- LCP crosses the configured budget
- bundle size exceeds allowed growth

## V1 Deliverables

### Required deliverables

- working monorepo scaffold
- shared event contracts
- browser SDK package
- ingestion API
- Postgres schema and persistence
- dashboard with core views
- regression engine
- budget checker CLI
- docs and demo setup

### Nice-to-have but not required

- seeded demo dataset
- polished charts
- sample instrumented app
- screenshots for case study

## Acceptance Criteria

V1 is complete when:

1. telemetry can be emitted from an instrumented sample app
2. telemetry is validated and stored successfully
3. overview dashboard shows useful app metrics
4. routes and releases can be analyzed
5. regressions are surfaced clearly
6. CI budget checker can fail with a non-zero exit code

## Product Boundaries

FIP V1 is not trying to fully compete with Sentry, Datadog, or New Relic.

It is a focused frontend engineering intelligence platform that emphasizes:

- frontend performance
- route and release analysis
- developer-facing observability
- performance governance

## Why This Scope Is Right

This scope is intentionally narrow enough to finish while still showing:

- instrumentation design
- telemetry pipeline thinking
- analytics and schema design
- observability UX
- CI enforcement strategy
