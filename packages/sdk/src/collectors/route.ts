import type { RouteChangeEvent } from "@fip/shared"
import type { SdkContext } from "../core/init"
import { generateEventId } from "../core/session"

function getPathname(): string {
  return window.location.pathname
}

export function collectRouteChanges(ctx: SdkContext): void {
  const pushRouteChange = (
    fromRoute: string | null,
    toRoute: string,
    navigationType: RouteChangeEvent["navigationType"],
  ) => {
    ctx.queue.push({
      id: generateEventId(),
      type: "route_change",
      appId: ctx.config.appId,
      environment: ctx.config.environment,
      release: ctx.config.release,
      sessionId: ctx.sessionId,
      route: toRoute,
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      fromRoute,
      toRoute,
      navigationType,
    })
  }

  // Initial page load
  pushRouteChange(null, getPathname(), "initial")

  // Intercept history API
  const originalPushState = history.pushState.bind(history)
  const originalReplaceState = history.replaceState.bind(history)

  history.pushState = (...args) => {
    const from = ctx.getCurrentRoute()
    originalPushState(...args)
    const to = getPathname()
    ctx.setCurrentRoute(to)
    pushRouteChange(from, to, "push")
  }

  history.replaceState = (...args) => {
    const from = ctx.getCurrentRoute()
    originalReplaceState(...args)
    const to = getPathname()
    ctx.setCurrentRoute(to)
    pushRouteChange(from, to, "replace")
  }

  window.addEventListener("popstate", () => {
    const to = getPathname()
    pushRouteChange(ctx.getCurrentRoute(), to, "pop")
    ctx.setCurrentRoute(to)
  })
}
