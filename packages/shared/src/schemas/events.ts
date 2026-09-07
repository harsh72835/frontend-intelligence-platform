import { z } from "zod"

export const environmentSchema = z.enum(["development", "staging", "production"])

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

export const webVitalEventSchema = baseEventSchema.extend({
  type: z.literal("web_vital"),
  metric: z.enum(["LCP", "CLS", "INP", "TTFB"]),
  value: z.number().finite(),
  rating: z.enum(["good", "needs-improvement", "poor"]).optional(),
})

export const routeChangeEventSchema = baseEventSchema.extend({
  type: z.literal("route_change"),
  fromRoute: z.string().nullable(),
  toRoute: z.string().min(1),
  navigationType: z.enum(["push", "replace", "pop", "initial"]),
})

export const apiTimingEventSchema = baseEventSchema.extend({
  type: z.literal("api_timing"),
  method: z.string().min(1),
  endpoint: z.string().min(1),
  durationMs: z.number().finite().nonnegative(),
  status: z.number().int().nullable(),
  ok: z.boolean(),
})

export const jsErrorEventSchema = baseEventSchema.extend({
  type: z.literal("js_error"),
  message: z.string().min(1),
  source: z.string().nullable(),
  lineno: z.number().int().nullable(),
  colno: z.number().int().nullable(),
  stack: z.string().nullable(),
  kind: z.enum(["error", "unhandledrejection"]),
})

export const longTaskEventSchema = baseEventSchema.extend({
  type: z.literal("long_task"),
  durationMs: z.number().finite().nonnegative(),
  startTime: z.number().finite().nonnegative(),
})

export const resourceTimingEventSchema = baseEventSchema.extend({
  type: z.literal("resource_timing"),
  name: z.string().min(1),
  initiatorType: z.string().min(1),
  durationMs: z.number().finite().nonnegative(),
  transferSizeBytes: z.number().int().nonnegative(),
  encodedBodySizeBytes: z.number().int().nonnegative(),
})

export const fipEventSchema = z.discriminatedUnion("type", [
  webVitalEventSchema,
  routeChangeEventSchema,
  apiTimingEventSchema,
  jsErrorEventSchema,
  longTaskEventSchema,
  resourceTimingEventSchema,
])

export const ingestRequestSchema = z.object({
  events: z.array(fipEventSchema).min(1).max(500),
})

export const ingestResponseSchema = z.object({
  accepted: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
})
