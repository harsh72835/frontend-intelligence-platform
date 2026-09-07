import type { WebVitalEvent } from "@fip/shared"
import { onCLS, onINP, onLCP, onTTFB } from "web-vitals"
import type { SdkContext } from "../core/init"
import { generateEventId } from "../core/session"

type VitalRating = "good" | "needs-improvement" | "poor"

export function collectVitals(ctx: SdkContext): void {
  const push = (metric: WebVitalEvent["metric"], value: number, rating?: VitalRating) => {
    ctx.queue.push({
      id: generateEventId(),
      type: "web_vital",
      appId: ctx.config.appId,
      environment: ctx.config.environment,
      release: ctx.config.release,
      sessionId: ctx.sessionId,
      route: ctx.getCurrentRoute(),
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      metric,
      value,
      rating,
    })
  }

  onLCP(({ value, rating }) => push("LCP", value, rating as VitalRating))
  onCLS(({ value, rating }) => push("CLS", value, rating as VitalRating))
  onINP(({ value, rating }) => push("INP", value, rating as VitalRating))
  onTTFB(({ value, rating }) => push("TTFB", value, rating as VitalRating))
}
