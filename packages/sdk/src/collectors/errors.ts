import type { SdkContext } from "../core/init"
import { generateEventId } from "../core/session"

export function collectErrors(ctx: SdkContext): void {
  window.addEventListener("error", (event) => {
    try {
      ctx.queue.push({
        id: generateEventId(),
        type: "js_error",
        appId: ctx.config.appId,
        environment: ctx.config.environment,
        release: ctx.config.release,
        sessionId: ctx.sessionId,
        route: ctx.getCurrentRoute(),
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        message: event.message ?? "Unknown error",
        source: event.filename ?? null,
        lineno: event.lineno ?? null,
        colno: event.colno ?? null,
        stack: event.error?.stack ?? null,
        kind: "error",
      })
    } catch {
      // ignore
    }
  })

  window.addEventListener("unhandledrejection", (event) => {
    try {
      const reason = event.reason as Error | undefined
      ctx.queue.push({
        id: generateEventId(),
        type: "js_error",
        appId: ctx.config.appId,
        environment: ctx.config.environment,
        release: ctx.config.release,
        sessionId: ctx.sessionId,
        route: ctx.getCurrentRoute(),
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        message: reason?.message ?? String(event.reason),
        source: null,
        lineno: null,
        colno: null,
        stack: reason?.stack ?? null,
        kind: "unhandledrejection",
      })
    } catch {
      // ignore
    }
  })
}
