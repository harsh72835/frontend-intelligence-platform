import type { SdkContext } from "../core/init"
import { generateEventId } from "../core/session"

// Only capture these initiator types — skip browser-internal noise
const TRACKED_INITIATOR_TYPES = new Set([
  "fetch",
  "xmlhttprequest",
  "script",
  "css",
  "img",
  "link",
])

// Skip requests to the ingest endpoint itself to avoid infinite loops
function shouldCapture(entry: PerformanceResourceTiming, ingestUrl: string): boolean {
  if (!TRACKED_INITIATOR_TYPES.has(entry.initiatorType)) return false
  if (entry.name.includes(ingestUrl)) return false
  if (entry.duration < 10) return false // skip sub-10ms (likely cached with no network)
  return true
}

export function collectResourceTimings(ctx: SdkContext): void {
  if (typeof PerformanceObserver === "undefined") return

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming
        if (!shouldCapture(resource, ctx.config.ingestUrl)) continue

        try {
          ctx.queue.push({
            id: generateEventId(),
            type: "resource_timing",
            appId: ctx.config.appId,
            environment: ctx.config.environment,
            release: ctx.config.release,
            sessionId: ctx.sessionId,
            route: ctx.getCurrentRoute(),
            url: window.location.href,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            name: resource.name,
            initiatorType: resource.initiatorType,
            durationMs: Math.round(resource.duration),
            transferSizeBytes: resource.transferSize ?? 0,
            encodedBodySizeBytes: resource.encodedBodySize ?? 0,
          })
        } catch {
          // never crash host app
        }
      }
    })

    observer.observe({ type: "resource", buffered: true })
  } catch {
    // PerformanceObserver not supported or observe failed
  }
}
