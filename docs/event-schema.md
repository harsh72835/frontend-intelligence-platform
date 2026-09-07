# Event Schema

## Purpose

FIP relies on a shared event contract between the browser SDK and ingestion API.

The schema must be:

- typed
- validated
- versionable
- simple enough for V1

V1 uses a discriminated union model so event types remain explicit and easy to process.

## Design Principles

- keep a common base event shape
- use one `type` field as the discriminator
- include enough metadata to support route- and release-level analysis
- prefer explicit event-specific payload fields over vague generic blobs

## Base Event

```ts
type FipEnvironment = "development" | "staging" | "production"

type BaseEvent = {
  id: string
  type: string
  appId: string
  environment: FipEnvironment
  release: string
  sessionId: string
  route: string
  url: string
  timestamp: number
  userAgent: string
}
```

## Event Types in V1

- `web_vital`
- `route_change`
- `api_timing`
- `js_error`
- `long_task`

## Web Vital Event

```ts
type WebVitalEvent = BaseEvent & {
  type: "web_vital"
  metric: "LCP" | "CLS" | "INP" | "TTFB"
  value: number
  rating?: "good" | "needs-improvement" | "poor"
}
```

Purpose:

- track key user-centric performance metrics
- support route and release aggregation

## Route Change Event

```ts
type RouteChangeEvent = BaseEvent & {
  type: "route_change"
  fromRoute: string | null
  toRoute: string
  navigationType: "push" | "replace" | "pop" | "initial"
}
```

Purpose:

- understand navigational flow
- associate route transitions with route-level performance patterns

## API Timing Event

```ts
type ApiTimingEvent = BaseEvent & {
  type: "api_timing"
  method: string
  endpoint: string
  durationMs: number
  status: number | null
  ok: boolean
}
```

Purpose:

- measure API latency impact on user experience
- show slow endpoints per route or release

## JS Error Event

```ts
type JsErrorEvent = BaseEvent & {
  type: "js_error"
  message: string
  source: string | null
  lineno: number | null
  colno: number | null
  stack: string | null
  kind: "error" | "unhandledrejection"
}
```

Purpose:

- capture runtime failures
- correlate error spikes with releases and routes

## Long Task Event

```ts
type LongTaskEvent = BaseEvent & {
  type: "long_task"
  durationMs: number
  startTime: number
}
```

Purpose:

- identify main-thread blocking
- expose CPU-heavy user experience degradation

## Union Type

```ts
type FipEvent =
  | WebVitalEvent
  | RouteChangeEvent
  | ApiTimingEvent
  | JsErrorEvent
  | LongTaskEvent
```

## Ingestion Request Shape

```ts
type IngestRequest = {
  events: FipEvent[]
}
```

## Ingestion Response Shape

```ts
type IngestResponse = {
  accepted: number
  rejected: number
}
```

## Validation Rules

### Base validation

- `id` must be present
- `type` must be a supported event type
- `appId` must be present
- `environment` must be valid
- `release` must be present
- `sessionId` must be present
- `route` must be present
- `url` must be present
- `timestamp` must be a valid numeric epoch value
- `userAgent` must be present

### Event-specific validation

- `web_vital.value` must be numeric
- `api_timing.durationMs` must be numeric and non-negative
- `js_error.message` must be present
- `long_task.durationMs` must be numeric and non-negative

### Request-level validation

- payload must include `events`
- `events` must be an array
- empty arrays may be rejected or accepted as a no-op based on implementation choice
- payload size should be capped

## Schema Evolution Strategy

V1 should keep the schema stable and simple.

When evolving later:

- add optional fields before introducing breaking changes
- version SDK and shared schema together
- avoid reusing old fields for new meanings

## Recommended Implementation Notes

- define source-of-truth types in `packages/shared`
- define matching Zod schemas in the same package
- import shared validators into both SDK and server
- use the discriminated union directly for ingestion parsing
