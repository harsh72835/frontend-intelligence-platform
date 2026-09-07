import type { SdkContext } from "../core/init"
import { generateEventId } from "../core/session"

export function collectApiTimings(ctx: SdkContext): void {
  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input, init) => {
    const method = (init?.method ?? "GET").toUpperCase()
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
    const startTime = performance.now()

    let response: Response
    let ok = false
    let status: number | null = null

    try {
      response = await originalFetch(input, init)
      ok = response.ok
      status = response.status
      return response
    } catch (err) {
      throw err
    } finally {
      const durationMs = performance.now() - startTime

      try {
        const endpoint = new URL(url, window.location.href).pathname
        ctx.queue.push({
          id: generateEventId(),
          type: "api_timing",
          appId: ctx.config.appId,
          environment: ctx.config.environment,
          release: ctx.config.release,
          sessionId: ctx.sessionId,
          route: ctx.getCurrentRoute(),
          url: window.location.href,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          method,
          endpoint,
          durationMs: Math.round(durationMs),
          status,
          ok,
        })
      } catch {
        // never crash host app
      }
    }
  }
}
