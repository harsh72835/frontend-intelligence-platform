export type FipEnvironment = "development" | "staging" | "production"

export type BaseEvent = {
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

export type WebVitalEvent = BaseEvent & {
  type: "web_vital"
  metric: "LCP" | "CLS" | "INP" | "TTFB"
  value: number
  rating?: "good" | "needs-improvement" | "poor"
}

export type RouteChangeEvent = BaseEvent & {
  type: "route_change"
  fromRoute: string | null
  toRoute: string
  navigationType: "push" | "replace" | "pop" | "initial"
}

export type ApiTimingEvent = BaseEvent & {
  type: "api_timing"
  method: string
  endpoint: string
  durationMs: number
  status: number | null
  ok: boolean
}

export type JsErrorEvent = BaseEvent & {
  type: "js_error"
  message: string
  source: string | null
  lineno: number | null
  colno: number | null
  stack: string | null
  kind: "error" | "unhandledrejection"
}

export type LongTaskEvent = BaseEvent & {
  type: "long_task"
  durationMs: number
  startTime: number
}

export type ResourceTimingEvent = BaseEvent & {
  type: "resource_timing"
  name: string
  initiatorType: string
  durationMs: number
  transferSizeBytes: number
  encodedBodySizeBytes: number
}

export type FipEvent =
  | WebVitalEvent
  | RouteChangeEvent
  | ApiTimingEvent
  | JsErrorEvent
  | LongTaskEvent
  | ResourceTimingEvent

export type IngestRequest = {
  events: FipEvent[]
}

export type IngestResponse = {
  accepted: number
  rejected: number
}
