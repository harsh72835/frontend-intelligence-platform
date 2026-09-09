"use client"

/**
 * Demo scenario triggers for the /demo page.
 *
 * The SDK's own collectors only ever emit ONE real sample per page load
 * (one LCP, one INP, etc.) — that's correct behavior for a real app, but
 * useless for a live demo where you need to cross an alert threshold
 * (e.g. 5+ bad LCP samples, or 10+ errors) with a single button click.
 *
 * So most scenarios here construct a small BATCH of synthetic events, in
 * the exact shape the SDK itself would send, and POST them straight to
 * /api/ingest using the same public ingest key the SDK already uses (this
 * is not a new trust boundary — it's the same endpoint + same key, just
 * called directly instead of going through the SDK's queue). The one
 * exception is "trigger one real error," which throws a genuine error so
 * it's caught by the SDK's own window.onerror listener — a more honest,
 * organic demo moment for that one case.
 */

type BaseFields = {
  appId: string
  environment: "development" | "staging" | "production"
  release: string
  route: string
  url: string
  userAgent: string
}

function getConfig(): BaseFields & { ingestUrl: string; ingestKey: string } {
  return {
    appId: process.env.NEXT_PUBLIC_FIP_APP_ID ?? "sample-app",
    ingestUrl: process.env.NEXT_PUBLIC_FIP_INGEST_URL ?? "http://localhost:3000/api/ingest",
    ingestKey: process.env.NEXT_PUBLIC_FIP_INGEST_KEY ?? "",
    environment: (process.env.NEXT_PUBLIC_FIP_ENV as BaseFields["environment"]) ?? "development",
    release: process.env.NEXT_PUBLIC_FIP_RELEASE ?? "1.0.0",
    route: "/demo",
    url: typeof window !== "undefined" ? window.location.href : "http://localhost:3001/demo",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "demo-scenario",
  }
}

function fakeSessionId(): string {
  return `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function eventId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

async function postEvents(events: Record<string, unknown>[]): Promise<{ accepted: number; rejected: number }> {
  const { ingestUrl, ingestKey } = getConfig()
  const res = await fetch(ingestUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-fip-key": ingestKey },
    body: JSON.stringify({ events }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Ingest failed: ${res.status} ${body}`)
  }
  return res.json()
}

/** Scenario 1: one real, genuine JS error — caught by the SDK's own listener. */
export function triggerRealError(): void {
  // Thrown async so it reaches window.onerror instead of being caught by
  // React's render-time error boundary (which would swallow it silently
  // instead of letting the SDK's collector see it).
  setTimeout(() => {
    throw new Error("[FIP demo] Simulated checkout failure: payment gateway timeout")
  }, 0)
}

/** Scenario 2: a burst of bad LCP samples — crosses the LCP-regression alert threshold (needs 5+ samples > 4000ms by default). */
export async function simulateSlowPage(): Promise<{ accepted: number; rejected: number }> {
  const cfg = getConfig()
  const events = Array.from({ length: 6 }, () => ({
    id: eventId(),
    type: "web_vital",
    appId: cfg.appId,
    environment: cfg.environment,
    release: cfg.release,
    sessionId: fakeSessionId(),
    route: "/reports",
    url: cfg.url.replace("/demo", "/reports"),
    timestamp: Date.now(),
    userAgent: cfg.userAgent,
    metric: "LCP",
    value: 4500 + Math.random() * 2500,
    rating: "poor",
  }))
  return postEvents(events)
}

/** Scenario 3: a burst of slow/failing API calls. */
export async function simulateSlowApi(): Promise<{ accepted: number; rejected: number }> {
  const cfg = getConfig()
  const events = Array.from({ length: 5 }, (_, i) => ({
    id: eventId(),
    type: "api_timing",
    appId: cfg.appId,
    environment: cfg.environment,
    release: cfg.release,
    sessionId: fakeSessionId(),
    route: "/checkout",
    url: cfg.url.replace("/demo", "/checkout"),
    timestamp: Date.now(),
    userAgent: cfg.userAgent,
    method: "POST",
    endpoint: "/api/payment/charge",
    durationMs: 3500 + Math.random() * 4000,
    status: i === 4 ? 504 : 200, // last one times out
    ok: i !== 4,
  }))
  return postEvents(events)
}

/** Scenario 4: an error burst — crosses the error-spike alert threshold (default 10/hour). */
export async function simulateErrorSpike(): Promise<{ accepted: number; rejected: number }> {
  const cfg = getConfig()
  const messages = [
    "Payment processing failed: timeout",
    "Cannot read properties of undefined (reading 'total')",
    "NetworkError: failed to fetch /api/cart",
  ]
  const events = Array.from({ length: 12 }, (_, i) => ({
    id: eventId(),
    type: "js_error",
    appId: cfg.appId,
    environment: cfg.environment,
    release: cfg.release,
    sessionId: fakeSessionId(),
    route: "/checkout",
    url: cfg.url.replace("/demo", "/checkout"),
    timestamp: Date.now(),
    userAgent: cfg.userAgent,
    message: messages[i % messages.length],
    source: "/checkout",
    lineno: 42,
    colno: 12,
    stack: `Error: ${messages[i % messages.length]}\n    at handleSubmit (/checkout:42:12)`,
    kind: "error",
  }))
  return postEvents(events)
}

/** Ask the dashboard to evaluate alert rules right now, via the sample-app's own server-side proxy (keeps the shared secret off the client). */
export async function checkAlertsNow(): Promise<{ ok: boolean; checked?: string[]; fired?: number; error?: string }> {
  const res = await fetch("/api/check-alerts", { method: "POST" })
  return res.json()
}
