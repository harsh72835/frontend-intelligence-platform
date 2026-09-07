# Architecture

## Goal

Frontend Intelligence Platform (FIP) is a frontend-focused observability system that captures browser telemetry, stores it for analysis, detects regressions, and exposes insights through a dashboard and CI tooling.

The architecture is intentionally simple in V1 so the project stays buildable while still showing strong system design decisions.

## High-Level Flow

```txt
Instrumented App
  -> Browser SDK
  -> Ingestion API
  -> Postgres
  -> Aggregation Queries / Summary Tables
  -> Dashboard

CI Reports
  -> Budget Checker CLI
  -> Pass / Fail
```

## System Components

### Browser SDK

The SDK runs inside a frontend application and captures browser-side telemetry.

Responsibilities:

- initialize with app and release metadata
- capture Web Vitals
- capture route transitions
- capture API timings
- capture JS runtime errors
- capture long tasks
- batch events and send them to the ingestion API

Design constraints:

- low runtime overhead
- should never break the host app
- use `sendBeacon` where appropriate
- fall back to `fetch`

### Ingestion API

The ingestion API receives batched telemetry from browser clients.

Responsibilities:

- validate request payloads
- normalize event metadata
- attach server receipt timestamps
- persist raw telemetry
- return accepted/rejected counts

V1 decision:

- host ingestion in the dashboard app using Next.js API routes or route handlers

This keeps deployment and local development simple.

### Postgres Storage

Postgres is the primary V1 datastore.

It stores:

- application metadata
- release metadata
- raw events
- route summary metrics
- release summary metrics

Why Postgres for V1:

- good enough for moderate telemetry volume
- easy schema iteration with Prisma
- strong querying for grouped analytics
- credible without over-engineering

### Processing and Analytics

This layer turns raw events into useful product insights.

Responsibilities:

- aggregate route metrics
- aggregate release metrics
- compare current and baseline windows
- flag regressions

V1 approach:

- use direct SQL/ORM queries for initial analytics
- introduce summary tables for dashboard-heavy views
- keep background jobs optional until needed

### Dashboard

The dashboard is the main product surface.

Responsibilities:

- show app health overview
- display route-level performance data
- compare releases
- show regression and error views

The dashboard should answer:

- which routes are slow
- whether the latest release regressed
- whether API latency is worsening UX
- whether errors increased after deployment

### Budget Checker CLI

The CLI is the governance module.

Responsibilities:

- read Lighthouse and bundle reports
- compare values against configured budgets
- print pass/fail output
- fail CI when thresholds are violated

This completes the story from monitoring to enforcement.

## V1 Deployment Shape

```txt
apps/dashboard
  - UI pages
  - ingestion routes
  - analytics routes

packages/sdk
  - browser package

packages/shared
  - event types
  - Zod schemas

packages/budget-checker
  - CLI

prisma
  - schema and migrations
```

## Data Flow Detail

### Runtime telemetry flow

1. app initializes SDK
2. SDK captures frontend events
3. events are queued locally in memory
4. SDK flushes batched events to `/api/ingest`
5. ingestion layer validates and persists events
6. dashboard queries raw and aggregated data
7. regression logic compares current metrics to baselines

### CI enforcement flow

1. CI generates Lighthouse and/or bundle reports
2. budget checker reads reports and config
3. checker compares values against thresholds and tolerances
4. checker exits non-zero on failure

## Key Architecture Decisions

### Single app for UI and ingestion in V1

Reason:

- faster development
- fewer deployment surfaces
- simpler local setup

Tradeoff:

- not ideal for high-volume scaling, but acceptable for V1

### Raw events plus summary tables

Reason:

- raw events preserve detail and flexibility
- summary tables keep dashboard queries fast

Tradeoff:

- duplicated derived data, but improves product responsiveness

### Typed shared event contracts

Reason:

- prevents schema drift across SDK and server
- improves maintainability
- makes validation explicit

### No queues or streaming infra in V1

Reason:

- V1 should optimize for completeness, not infra complexity
- queue systems are unnecessary before proving product value

## Main Risks

- collecting too many event types too early
- unstable schema design causing rework
- overbuilding analytics before ingestion is solid
- overcomplicating the dashboard before the data model is useful

## V1 Success Criteria

The architecture is successful if:

- the SDK can emit telemetry from a sample app
- the ingestion API validates and stores events reliably
- the dashboard can show route and release insights
- regressions are computed and visible
- CI can block performance budget failures
