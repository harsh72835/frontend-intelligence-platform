# Ingestion Flow

## Purpose

This document defines how telemetry moves from the browser SDK into storage inside Frontend Intelligence Platform (FIP).

The ingestion path is the backbone of the system. If it is not clean, reliable, and easy to reason about, the rest of the platform becomes fragile.

## V1 Goal

Receive browser telemetry safely, validate it consistently, persist it reliably, and make it available for dashboard analytics.

## High-Level Flow

```txt
Instrumented App
  -> SDK collects events
  -> SDK batches events
  -> POST /api/ingest
  -> request validation
  -> app/release resolution
  -> event persistence
  -> accepted/rejected response
```

## Runtime Flow Step By Step

### 1. SDK collects events

The browser SDK listens for telemetry sources such as:

- Core Web Vitals
- route transitions
- fetch/API timings
- JS runtime errors
- unhandled promise rejections
- long tasks

Each event is converted into the shared event contract shape.

### 2. SDK batches events locally

The SDK should not send every event immediately by default.

Instead, it should:

- push events into an in-memory queue
- flush on interval
- flush when batch size threshold is reached
- attempt final flush on page unload using `sendBeacon`

Why:

- reduces request overhead
- keeps network usage reasonable
- better matches telemetry ingestion patterns

### 3. SDK sends request to ingestion endpoint

Target endpoint:

`POST /api/ingest`

Suggested request body:

```json
{
  "events": []
}
```

Suggested headers later:

- `Content-Type: application/json`
- ingestion key header for protected environments

### 4. API validates request shape

The server should:

- parse JSON body
- validate the request against the shared Zod schema
- reject invalid structures early
- apply request size limits

If invalid:

- return a client error response
- avoid partial persistence of malformed request bodies

### 5. Resolve app and release context

For each valid event, the server should determine:

- which app the event belongs to
- which release record it maps to
- whether the app and environment are valid

Suggested release mapping logic:

- lookup by `appId + release + environment`
- create release record if it does not exist, or require pre-registration based on final design choice

For V1, auto-create can be acceptable if documented.

### 6. Normalize data before persistence

Before writing events, the ingestion layer may normalize:

- route string format
- empty nullable values
- timestamp conversion to database `DateTime`
- endpoint naming if needed

Normalization should stay conservative in V1.

The system should avoid mutating semantic meaning during ingest.

### 7. Persist raw events

The server writes raw events to the `Event` table.

Recommended stored fields:

- event ID
- app ID
- release ID
- type
- environment
- route
- url
- session ID
- timestamp
- user agent
- event-specific payload JSON
- received-at timestamp

Why raw persistence matters:

- preserves debugging detail
- allows analytics model evolution later
- supports recomputation of summaries

### 8. Return ingest response

Suggested V1 response:

```json
{
  "accepted": 12,
  "rejected": 0
}
```

This gives immediate ingestion feedback while keeping the API simple.

## V1 Failure Handling

The ingestion layer should be resilient to bad input.

### Failure cases to handle

- invalid JSON body
- missing `events`
- unsupported event type
- malformed event fields
- unknown app ID
- invalid ingestion key in later protected versions
- database insertion failure

### Recommended behavior

- fail safely
- never crash the server process because of a bad event
- log enough detail for maintainers
- return predictable response codes

## Batch Handling Strategy

Two valid approaches exist:

### Option A: All-or-nothing batch

If one event is invalid, reject the whole batch.

Pros:

- simple reasoning
- easier consistency guarantees

Cons:

- one bad event can drop many good ones

### Option B: Partial acceptance

Accept valid events and count rejected ones.

Pros:

- better resilience
- more practical for telemetry systems

Cons:

- slightly more complex processing

Recommended for this project:

- V1 can use all-or-nothing for simplicity
- V2 or V3 can move to partial acceptance if needed

## Data Flow Into Analytics

After raw persistence, analytics can happen in two ways:

### V1

- query raw events directly for some views
- optionally maintain summary tables for frequent dashboard queries

### V2+

- background aggregation jobs compute route and release summaries
- dashboard relies more on summary tables than raw scans

## Security Notes For Later Versions

V1 can be relaxed in local/dev use, but production-oriented versions should add:

- ingestion keys
- rate limiting
- payload size caps
- abuse protection
- audit visibility for ingest failures

## Operational Notes

The platform should eventually monitor its own ingestion health.

Useful metrics later:

- requests per minute
- accepted vs rejected event counts
- ingest error rate
- insert latency
- top failure reasons

## Recommended Implementation Order

1. shared Zod request/event schemas
2. `POST /api/ingest` route
3. request parsing and validation
4. app/release lookup logic
5. database persistence
6. response contract
7. logging and failure handling
8. optional summary triggers or aggregation hooks

## Final Principle

Keep ingestion boring, predictable, and strongly validated.

If ingestion is simple and trustworthy, the rest of the product becomes much easier to build well.
