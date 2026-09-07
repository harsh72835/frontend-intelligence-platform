import { prisma } from "../db"

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)] ?? 0
}

export type RouteMetrics = {
  route: string
  eventCount: number
  p75Lcp: number | null
  p75Inp: number | null
  avgCls: number | null
  avgApiLatency: number | null
  jsErrorCount: number
  longTaskCount: number
}

export async function getRouteMetrics(appId: string, days = 7): Promise<RouteMetrics[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // Use pre-aggregated summaries when available — much faster than scanning raw events
  const summaries = await prisma.routeSummary.findMany({
    where: { appId, bucketStart: { gte: since }, granularity: "hour" },
    select: {
      route: true,
      p75Lcp: true,
      p75Inp: true,
      avgCls: true,
      avgApiLatency: true,
      jsErrorCount: true,
      longTaskCount: true,
      sampleCount: true,
    },
  })

  if (summaries.length > 0) {
    // Roll up hourly buckets per route
    const byRoute = new Map<string, typeof summaries>()
    for (const s of summaries) {
      const existing = byRoute.get(s.route) ?? []
      existing.push(s)
      byRoute.set(s.route, existing)
    }

    return [...byRoute.entries()]
      .map(([route, rows]) => {
        const lcpVals = rows.flatMap((r) => r.p75Lcp != null ? [r.p75Lcp] : []).sort((a, b) => a - b)
        const inpVals = rows.flatMap((r) => r.p75Inp != null ? [r.p75Inp] : []).sort((a, b) => a - b)
        const clsVals = rows.flatMap((r) => r.avgCls != null ? [r.avgCls] : [])
        const apiVals = rows.flatMap((r) => r.avgApiLatency != null ? [r.avgApiLatency] : [])
        return {
          route,
          eventCount: rows.reduce((s, r) => s + r.sampleCount, 0),
          p75Lcp: lcpVals.length > 0 ? Math.round(percentile(lcpVals, 75)) : null,
          p75Inp: inpVals.length > 0 ? Math.round(percentile(inpVals, 75)) : null,
          avgCls: clsVals.length > 0 ? Number((clsVals.reduce((a, b) => a + b, 0) / clsVals.length).toFixed(3)) : null,
          avgApiLatency: apiVals.length > 0 ? Math.round(apiVals.reduce((a, b) => a + b, 0) / apiVals.length) : null,
          jsErrorCount: rows.reduce((s, r) => s + r.jsErrorCount, 0),
          longTaskCount: rows.reduce((s, r) => s + r.longTaskCount, 0),
        }
      })
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 50)
  }

  // Fallback: scan raw events (pre-aggregation not run yet)
  const routes = await prisma.event.groupBy({
    by: ["route"],
    where: { appId, timestamp: { gte: since } },
    _count: { route: true },
    orderBy: { _count: { route: "desc" } },
    take: 50,
  })

  return Promise.all(
    routes.map(async (r) => {
      const [vitalEvents, apiEvents, jsErrorCount, longTaskCount] = await Promise.all([
        prisma.event.findMany({
          where: { appId, route: r.route, type: "web_vital", timestamp: { gte: since } },
          select: { payload: true },
        }),
        prisma.event.findMany({
          where: { appId, route: r.route, type: "api_timing", timestamp: { gte: since } },
          select: { payload: true },
        }),
        prisma.event.count({ where: { appId, route: r.route, type: "js_error", timestamp: { gte: since } } }),
        prisma.event.count({ where: { appId, route: r.route, type: "long_task", timestamp: { gte: since } } }),
      ])

      const lcpValues = vitalEvents.map((e) => e.payload as { metric?: string; value?: number }).filter((p) => p.metric === "LCP").map((p) => p.value as number).sort((a, b) => a - b)
      const inpValues = vitalEvents.map((e) => e.payload as { metric?: string; value?: number }).filter((p) => p.metric === "INP").map((p) => p.value as number).sort((a, b) => a - b)
      const clsValues = vitalEvents.map((e) => e.payload as { metric?: string; value?: number }).filter((p) => p.metric === "CLS").map((p) => p.value as number)
      const apiLatencies = apiEvents.map((e) => (e.payload as { durationMs?: number }).durationMs).filter((v): v is number => typeof v === "number")

      return {
        route: r.route,
        eventCount: r._count.route,
        p75Lcp: lcpValues.length > 0 ? Math.round(percentile(lcpValues, 75)) : null,
        p75Inp: inpValues.length > 0 ? Math.round(percentile(inpValues, 75)) : null,
        avgCls: clsValues.length > 0 ? Number((clsValues.reduce((a, b) => a + b, 0) / clsValues.length).toFixed(3)) : null,
        avgApiLatency: apiLatencies.length > 0 ? Math.round(apiLatencies.reduce((a, b) => a + b, 0) / apiLatencies.length) : null,
        jsErrorCount,
        longTaskCount,
      }
    }),
  )
}

export type RouteComparisonRow = {
  route: string
  baseline: RouteMetrics | null
  current: RouteMetrics | null
  lcpDelta: number | null
  inpDelta: number | null
  errorDelta: number | null
}

async function getRouteMetricsByRelease(
  appId: string,
  releaseId: string,
): Promise<RouteMetrics[]> {
  const routes = await prisma.event.groupBy({
    by: ["route"],
    where: { appId, releaseId },
    _count: { route: true },
    orderBy: { _count: { route: "desc" } },
    take: 50,
  })

  return Promise.all(
    routes.map(async (r) => {
      const [vitalEvents, apiEvents, jsErrorCount, longTaskCount] = await Promise.all([
        prisma.event.findMany({
          where: { appId, releaseId, route: r.route, type: "web_vital" },
          select: { payload: true },
        }),
        prisma.event.findMany({
          where: { appId, releaseId, route: r.route, type: "api_timing" },
          select: { payload: true },
        }),
        prisma.event.count({ where: { appId, releaseId, route: r.route, type: "js_error" } }),
        prisma.event.count({ where: { appId, releaseId, route: r.route, type: "long_task" } }),
      ])

      const lcpValues = vitalEvents
        .map((e) => e.payload as { metric?: string; value?: number })
        .filter((p) => p.metric === "LCP")
        .map((p) => p.value as number)
        .sort((a, b) => a - b)

      const inpValues = vitalEvents
        .map((e) => e.payload as { metric?: string; value?: number })
        .filter((p) => p.metric === "INP")
        .map((p) => p.value as number)
        .sort((a, b) => a - b)

      const clsValues = vitalEvents
        .map((e) => e.payload as { metric?: string; value?: number })
        .filter((p) => p.metric === "CLS")
        .map((p) => p.value as number)

      const apiLatencies = apiEvents
        .map((e) => (e.payload as { durationMs?: number }).durationMs)
        .filter((v): v is number => typeof v === "number")

      return {
        route: r.route,
        eventCount: r._count.route,
        p75Lcp: lcpValues.length > 0 ? Math.round(percentile(lcpValues, 75)) : null,
        p75Inp: inpValues.length > 0 ? Math.round(percentile(inpValues, 75)) : null,
        avgCls: clsValues.length > 0 ? Number((clsValues.reduce((a, b) => a + b, 0) / clsValues.length).toFixed(3)) : null,
        avgApiLatency: apiLatencies.length > 0 ? Math.round(apiLatencies.reduce((a, b) => a + b, 0) / apiLatencies.length) : null,
        jsErrorCount,
        longTaskCount,
      }
    }),
  )
}

function pctDelta(baseline: number | null, current: number | null): number | null {
  if (baseline === null || current === null || baseline === 0) return null
  return Number((((current - baseline) / baseline) * 100).toFixed(1))
}

export async function getRouteComparison(
  appId: string,
  baselineReleaseId: string,
  currentReleaseId: string,
): Promise<RouteComparisonRow[]> {
  const [baselineRoutes, currentRoutes] = await Promise.all([
    getRouteMetricsByRelease(appId, baselineReleaseId),
    getRouteMetricsByRelease(appId, currentReleaseId),
  ])

  const allRoutes = new Set([
    ...baselineRoutes.map((r) => r.route),
    ...currentRoutes.map((r) => r.route),
  ])

  const baselineMap = new Map(baselineRoutes.map((r) => [r.route, r]))
  const currentMap = new Map(currentRoutes.map((r) => [r.route, r]))

  return [...allRoutes].map((route) => {
    const b = baselineMap.get(route) ?? null
    const c = currentMap.get(route) ?? null
    return {
      route,
      baseline: b,
      current: c,
      lcpDelta: pctDelta(b?.p75Lcp ?? null, c?.p75Lcp ?? null),
      inpDelta: pctDelta(b?.p75Inp ?? null, c?.p75Inp ?? null),
      errorDelta: pctDelta(b?.jsErrorCount ?? null, c?.jsErrorCount ?? null),
    }
  }).sort((a, b) => {
    // Sort by worst LCP delta first
    const aWorst = a.lcpDelta ?? -Infinity
    const bWorst = b.lcpDelta ?? -Infinity
    return bWorst - aWorst
  })
}
