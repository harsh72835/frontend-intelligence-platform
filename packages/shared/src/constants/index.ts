export const FIP_VERSION = "0.1.0"

export const EVENT_TYPES = {
  WEB_VITAL: "web_vital",
  ROUTE_CHANGE: "route_change",
  API_TIMING: "api_timing",
  JS_ERROR: "js_error",
  LONG_TASK: "long_task",
  RESOURCE_TIMING: "resource_timing",
} as const

export const WEB_VITAL_METRICS = {
  LCP: "LCP",
  CLS: "CLS",
  INP: "INP",
  TTFB: "TTFB",
} as const

export const VITAL_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  TTFB: { good: 800, poor: 1800 },
} as const

export const DEFAULT_BATCH_SIZE = 20
export const DEFAULT_FLUSH_INTERVAL_MS = 5000
export const MAX_EVENTS_PER_REQUEST = 500
