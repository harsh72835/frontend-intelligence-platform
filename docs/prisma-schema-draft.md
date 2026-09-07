# Prisma Schema Draft

## Purpose

This document defines the initial Prisma schema direction for Frontend Intelligence Platform (FIP).

The goal is not to model every future need immediately. The goal is to support V1 cleanly while leaving room for later production-oriented versions.

## Schema Design Principles

- store raw events for fidelity
- keep app and release entities explicit
- support route- and release-level analytics
- use JSON payloads where event types differ significantly
- keep the first schema simple and evolvable

## Core Entities

The initial schema should include:

- `App`
- `Release`
- `Event`
- `RouteSummary`
- `ReleaseSummary`

Optional later additions:

- `Workspace`
- `User`
- `ApiKey`
- `AlertRule`
- `AggregationJob`

## Prisma Model Draft

```prisma
model App {
  id          String           @id @default(cuid())
  name        String
  slug        String           @unique
  ingestKey   String           @unique
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  releases    Release[]
  events      Event[]
  routeSummaries RouteSummary[]
  releaseSummaries ReleaseSummary[]
}

model Release {
  id          String           @id @default(cuid())
  appId       String
  version     String
  environment Environment
  createdAt   DateTime         @default(now())

  app         App              @relation(fields: [appId], references: [id], onDelete: Cascade)
  events      Event[]
  routeSummaries RouteSummary[]
  releaseSummaries ReleaseSummary[]

  @@index([appId, createdAt])
  @@unique([appId, version, environment])
}

model Event {
  id          String           @id
  appId       String
  releaseId   String?
  type        EventType
  environment Environment
  sessionId   String
  route       String
  url         String
  timestamp   DateTime
  userAgent   String
  payload     Json
  receivedAt  DateTime         @default(now())

  app         App              @relation(fields: [appId], references: [id], onDelete: Cascade)
  release     Release?         @relation(fields: [releaseId], references: [id], onDelete: SetNull)

  @@index([appId, timestamp])
  @@index([appId, route, timestamp])
  @@index([appId, type, timestamp])
  @@index([releaseId, timestamp])
  @@index([sessionId, timestamp])
}

model RouteSummary {
  id              String           @id @default(cuid())
  appId           String
  releaseId       String?
  route           String
  bucketStart     DateTime
  granularity     SummaryGranularity
  p75Lcp          Float?
  p75Inp          Float?
  avgCls          Float?
  avgApiLatency   Float?
  jsErrorCount    Int              @default(0)
  longTaskCount   Int              @default(0)
  sampleCount     Int              @default(0)
  createdAt       DateTime         @default(now())

  app             App              @relation(fields: [appId], references: [id], onDelete: Cascade)
  release         Release?         @relation(fields: [releaseId], references: [id], onDelete: SetNull)

  @@index([appId, route, bucketStart])
  @@index([releaseId, bucketStart])
  @@unique([appId, releaseId, route, bucketStart, granularity])
}

model ReleaseSummary {
  id                String           @id @default(cuid())
  appId             String
  releaseId         String
  p75Lcp            Float?
  p75Inp            Float?
  avgCls            Float?
  avgApiLatency     Float?
  jsErrorCount      Int              @default(0)
  longTaskCount     Int              @default(0)
  sampleCount       Int              @default(0)
  regressionStatus  RegressionStatus?
  createdAt         DateTime         @default(now())

  app               App              @relation(fields: [appId], references: [id], onDelete: Cascade)
  release           Release          @relation(fields: [releaseId], references: [id], onDelete: Cascade)

  @@index([appId, createdAt])
  @@unique([releaseId])
}

enum Environment {
  development
  staging
  production
}

enum EventType {
  web_vital
  route_change
  api_timing
  js_error
  long_task
}

enum SummaryGranularity {
  hour
  day
}

enum RegressionStatus {
  healthy
  warning
  regressed
}
```

## Model Notes

### `App`

Represents an instrumented frontend application.

Why it exists:

- scopes all telemetry
- supports multiple apps later
- provides an anchor for ingestion credentials

### `Release`

Represents a deployable version of an app in an environment.

Why it exists:

- powers release comparison views
- allows regression analysis by deployment

### `Event`

Stores raw telemetry from the SDK.

Why `payload` is JSON:

- event-specific fields differ by type
- avoids wide sparse tables in V1
- makes schema evolution easier early on

Why `id` is not auto-generated:

- event IDs should come from the SDK
- helps with dedupe strategies later

### `RouteSummary`

Stores aggregated metrics per route and time bucket.

Why it exists:

- avoids recalculating expensive route-level analytics repeatedly
- makes dashboard views faster

### `ReleaseSummary`

Stores aggregated release-level metrics and regression status.

Why it exists:

- improves release comparison queries
- gives a simple place to store computed release health state

## Why Not Separate Tables Per Event Type?

For V1, a single raw `Event` table is better because:

- simpler ingestion path
- easier shared persistence model
- easier to evolve early
- good enough for MVP-scale event volume

Later versions could split or warehouse specific event types if needed.

## Recommended Query Patterns

The schema is optimized around these V1 query types:

- events by app and time range
- events by route and time range
- events by type and time range
- release summaries for comparison
- route summaries for dashboard tables and charts

## Suggested Future Models

These should wait until V3 or later unless clearly needed.

### `Workspace`

Needed for multi-team or multi-tenant product workflows.

### `User`

Needed for auth and ownership.

### `ApiKey`

Useful once ingestion key rotation or multiple keys per app are needed.

### `AlertRule`

Useful when regression alerts become configurable.

### `AggregationJob`

Useful when summary generation becomes asynchronous and operationally visible.

## Migration Strategy Notes

- start with raw events and summary tables only
- keep enums tight and intentional
- prefer additive schema changes in later versions
- avoid introducing too many nullable columns beyond what V1 genuinely needs

## Implementation Notes

When this becomes the real Prisma schema:

- map SDK event timestamps to `DateTime`
- resolve `releaseId` from `appId + version + environment`
- normalize route strings before persistence
- consider hashing or truncating very large stack traces if necessary

## Recommended Next Step

After this draft, the next implementation doc should define:

- exact Zod validators
- ingestion persistence flow
- summary aggregation query strategy

That will make schema implementation much more direct.
