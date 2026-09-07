import type { SdkContext } from "../core/init"
import { generateEventId } from "../core/session"

export function collectLongTasks(ctx: SdkContext): void {
  if (typeof PerformanceObserver === "undefined") return

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        try {
          ctx.queue.push({
            id: generateEventId(),
            type: "long_task",
            appId: ctx.config.appId,
            environment: ctx.config.environment,
            release: ctx.config.release,
            sessionId: ctx.sessionId,
            route: ctx.getCurrentRoute(),
            url: window.location.href,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            durationMs: Math.round(entry.duration),
            startTime: Math.round(entry.startTime),
          })
        } catch {
          // ignore
        }
      }
    })

    observer.observe({ type: "longtask", buffered: true })
  } catch {
    // browser may not support longtask
  }
}
