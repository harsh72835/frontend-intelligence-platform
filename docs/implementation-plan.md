# Implementation Plan

## Goal

Build FIP V1 in small, stable phases so the core telemetry path works early and the project stays finishable.

The highest priority is establishing the end-to-end path:

SDK -> ingestion -> storage -> analytics -> dashboard -> CI enforcement

## Phase 0: Project Setup

Deliverables:

- project foundation docs
- initial repository structure
- package manager choice
- monorepo setup decision

Tasks:

- create `apps`, `packages`, `prisma`, and `docs`
- decide on `pnpm` and optional turborepo usage
- define base TypeScript configuration

Exit criteria:

- repo layout is ready for implementation

## Phase 1: Shared Contracts

Deliverables:

- shared TypeScript event types
- shared Zod schemas
- config constants

Tasks:

- define base event type
- define all V1 event unions
- define ingestion request/response types
- add validation schemas

Exit criteria:

- SDK and API can import the same event contracts

## Phase 2: Database Schema

Deliverables:

- Prisma schema
- local Postgres setup
- initial migrations

Tasks:

- create `apps`, `releases`, `events` tables
- draft `route_summaries` and `release_summaries`
- add useful indexes

Exit criteria:

- database can store raw telemetry and summary data

## Phase 3: SDK Foundation

Deliverables:

- SDK init API
- event queue
- transport layer

Tasks:

- create `initFip(config)`
- create session ID handling
- add batch flush logic
- add `sendBeacon` transport with `fetch` fallback
- ensure host app safety with internal error guards

Exit criteria:

- SDK can queue and send test events

## Phase 4: Browser Instrumentation

Deliverables:

- Web Vitals capture
- route tracking
- API timing instrumentation
- error capture
- long-task capture

Tasks:

- integrate vitals observation
- capture SPA route transitions
- instrument `fetch` for timing
- add `window.onerror` and `unhandledrejection` handlers
- use `PerformanceObserver` for long tasks

Exit criteria:

- SDK emits all planned V1 event types

## Phase 5: Ingestion API

Deliverables:

- `POST /api/ingest`
- validation and persistence

Tasks:

- parse request payload
- validate batched events with shared schemas
- attach server receipt timestamp if needed
- insert raw events into Postgres
- return accepted/rejected counts

Exit criteria:

- valid telemetry is persisted end to end

## Phase 6: Basic Analytics

Deliverables:

- overview metrics queries
- route metrics queries
- release comparison queries

Tasks:

- compute p75 `LCP` and `INP`
- compute average `CLS`
- compute API latency averages
- compute JS error counts
- compute long-task counts

Exit criteria:

- dashboard can retrieve meaningful metrics from stored events

## Phase 7: Dashboard UI

Deliverables:

- overview page
- routes page
- releases page
- errors page

Tasks:

- build summary cards
- build trend chart section
- build slow routes table
- build release comparison panels
- build error lists and counts

Exit criteria:

- core product insights are visible in UI

## Phase 8: Regression Engine

Deliverables:

- threshold rules
- baseline comparison logic
- regression display in dashboard

Tasks:

- compare latest release to previous release
- compare current and prior time windows
- compute delta percentages
- classify regression severity

Exit criteria:

- meaningful regressions are surfaced automatically

## Phase 9: Budget Checker CLI

Deliverables:

- CLI entry point
- config parser
- report parsers
- CI exit behavior

Tasks:

- parse Lighthouse JSON
- parse bundle stats JSON
- compare values against configured thresholds
- print readable pass/fail output
- exit with status code `1` on failure

Exit criteria:

- CI can enforce performance budgets reliably

## Phase 10: Polish and Demo

Deliverables:

- seed/demo data
- improved dashboard polish
- final README
- architecture diagrams
- portfolio-ready screenshots

Tasks:

- add seeded telemetry data
- make charts and tables presentable
- document setup and architecture
- prepare case study notes

Exit criteria:

- project is demoable and resume-ready

## Recommended Implementation Order

Build in this order:

1. shared contracts
2. Prisma schema
3. SDK skeleton
4. ingestion endpoint
5. event persistence
6. overview analytics
7. overview dashboard UI
8. routes and releases pages
9. regression logic
10. budget checker
11. docs and demo polish

## Suggested Milestones

### Milestone 1

Foundation complete:

- docs written
- monorepo scaffolded
- shared schemas started

### Milestone 2

Telemetry path working:

- SDK sends data
- ingestion receives it
- database stores it

### Milestone 3

Analytics visible:

- overview page works
- route metrics render
- sample data is useful

### Milestone 4

Intelligence layer working:

- release comparisons
- regression flags
- error summaries

### Milestone 5

Governance complete:

- budget checker works in CI
- docs and screenshots are ready

## Guardrails

- keep V1 focused on frontend performance intelligence
- avoid infra complexity until the core path is complete
- do not add event types without a dashboard or analytics use case
- prefer simple direct queries before background job systems
- prioritize end-to-end functionality over extra polish early
