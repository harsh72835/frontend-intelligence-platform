# Zod Schema Draft

## Purpose

This document defines the initial validation strategy for Frontend Intelligence Platform (FIP) shared event contracts using Zod.

The main goal is to keep validation logic centralized and consistent between the browser SDK and the ingestion API.

## Why Zod

Zod fits this project well because it provides:

- runtime validation
- TypeScript-friendly schema inference
- explicit discriminated unions
- shared validation between client and server

## Validation Goals

The schema layer should ensure:

- event payloads are structurally valid
- unsupported event types are rejected
- bad ingest requests fail safely
- SDK and API stay aligned on contracts

## Shared Validation Structure

Recommended package location:

`packages/shared/src/schemas/`

Suggested files later:

- `base-event.ts`
- `web-vital-event.ts`
- `route-change-event.ts`
- `api-timing-event.ts`
- `js-error-event.ts`
- `long-task-event.ts`
- `fip-event.ts`
- `ingest-request.ts`

## Base Schema Draft

```ts
import { z } from "zod"

export const environmentSchema = z.enum([
  "development",
  "staging",
  "production",
])

export const baseEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  appId: z.string().min(1),
  environment: environmentSchema,
  release: z.string().min(1),
  sessionId: z.string().min(1),
  route: z.string().min(1),
  url: z.string().url(),
  timestamp: z.number().finite(),
  userAgent: z.string().min(1),
})
```

## Event-Specific Schemas

### Web Vital Event

```ts
export const webVitalEventSchema = baseEventSchema.extend({
  type: z.literal("web_vital"),
  metric: z.enum(["LCP", "CLS", "INP", "TTFB"]),
  value: z.number().finite(),
  rating: z.enum(["good", "needs-improvement", "poor"]).optional(),
})
```

### Route Change Event

```ts
export const routeChangeEventSchema = baseEventSchema.extend({
  type: z.literal("route_change"),
  fromRoute: z.string().nullable(),
  toRoute: z.string().min(1),
  navigationType: z.enum(["push", "replace", "pop", "initial"]),
})
```

### API Timing Event

```ts
export const apiTimingEventSchema = baseEventSchema.extend({
  type: z.literal("api_timing"),
  method: z.string().min(1),
  endpoint: z.string().min(1),
  durationMs: z.number().finite().nonnegative(),
  status: z.number().int().nullable(),
  ok: z.boolean(),
})
```

### JS Error Event

```ts
export const jsErrorEventSchema = baseEventSchema.extend({
  type: z.literal("js_error"),
  message: z.string().min(1),
  source: z.string().nullable(),
  lineno: z.number().int().nullable(),
  colno: z.number().int().nullable(),
  stack: z.string().nullable(),
  kind: z.enum(["error", "unhandledrejection"]),
})
```

### Long Task Event

```ts
export const longTaskEventSchema = baseEventSchema.extend({
  type: z.literal("long_task"),
  durationMs: z.number().finite().nonnegative(),
  startTime: z.number().finite().nonnegative(),
})
```

## Discriminated Union

```ts
export const fipEventSchema = z.discriminatedUnion("type", [
  webVitalEventSchema,
  routeChangeEventSchema,
  apiTimingEventSchema,
  jsErrorEventSchema,
  longTaskEventSchema,
])
```

## Ingest Request Schema

```ts
export const ingestRequestSchema = z.object({
  events: z.array(fipEventSchema).min(1),
})
```

## Ingest Response Schema

```ts
export const ingestResponseSchema = z.object({
  accepted: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
})
```

## Type Inference Draft

```ts
export type FipEvent = z.infer<typeof fipEventSchema>
export type IngestRequest = z.infer<typeof ingestRequestSchema>
export type IngestResponse = z.infer<typeof ingestResponseSchema>
```

## Recommended Validation Rules Beyond Shape

Zod handles structural validation, but ingestion should also enforce business-level constraints.

Examples:

- reject payloads above size limit
- reject timestamps too far in the future
- reject timestamps too far in the past if needed
- reject unsupported app IDs or invalid ingest keys
- optionally normalize routes before persistence

## Error Handling Strategy

The ingestion API should:

- parse the full request body once
- validate batched payloads using shared schemas
- return clear error responses for invalid requests
- avoid exposing unnecessary internal details

For per-event failures, choose one of these models:

- reject full batch on any invalid event
- accept valid events and count rejected ones

For this project, partial acceptance is acceptable if clearly documented.

## Suggested Export Surface

Useful exports from `packages/shared` later:

- `environmentSchema`
- `baseEventSchema`
- `webVitalEventSchema`
- `routeChangeEventSchema`
- `apiTimingEventSchema`
- `jsErrorEventSchema`
- `longTaskEventSchema`
- `fipEventSchema`
- `ingestRequestSchema`
- `ingestResponseSchema`

## Versioning Guidance

When adding new event types later:

- add a new schema file
- update the discriminated union
- keep old event shapes backward-compatible where possible
- avoid changing existing field meanings

## Recommended Next Step

After this, the next implementation-ready doc should define the exact ingestion handling flow from request receipt to database persistence.
