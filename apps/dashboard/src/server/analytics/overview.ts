import { prisma } from "../db"

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)] ?? 0
}

export type OverviewMetrics = {
  totalEvents: number
  p75Lcp: number | null
  p75Inp: number | null
  avgCls: number | null
  avgApiLatency: number | null
  jsErrorCount: number
  longTaskCount: number
  topRoutes: { route: string; count: number }[]
  topErrors: { message: string; count: number }[]
}

export async function getOverviewMetrics(appId: string, days = 7): Promise<OverviewMetrics> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [totalEvents, jsErrorCount, longTaskCount] = await Promise.all([
    prisma.event.count({ where: { appId, timestamp: { gte: since } } }),
    prisma.event.count({ where: { appId, type: "js_error", timestamp: { gte: since } } }),
    prisma.event.count({ where: { appId, type: "long_task", timestamp: { gte: since } } }),
  ])

  // Web vitals
  const lcpEvents = await prisma.event.findMany({
    where: { appId, type: "web_vital", timestamp: { gte: since } },
    select: { payload: true },
  })

  const lcpValues = lcpEvents
    .map((e) => (e.payload as { metric?: string; value?: number }))
    .filter((p) => p.metric === "LCP" && typeof p.value === "number")
    .map((p) => p.value as number)
    .sort((a, b) => a - b)

  const inpValues = lcpEvents
    .map((e) => (e.payload as { metric?: string; value?: number }))
    .filter((p) => p.metric === "INP" && typeof p.value === "number")
    .map((p) => p.value as number)
    .sort((a, b) => a - b)

  const clsValues = lcpEvents
    .map((e) => (e.payload as { metric?: string; value?: number }))
    .filter((p) => p.metric === "CLS" && typeof p.value === "number")
    .map((p) => p.value as number)

  // API latency
  const apiEvents = await prisma.event.findMany({
    where: { appId, type: "api_timing", timestamp: { gte: since } },
    select: { payload: true },
  })

  const apiLatencies = apiEvents
    .map((e) => (e.payload as { durationMs?: number }).durationMs)
    .filter((v): v is number => typeof v === "number")

  // Top routes
  const routeGroups = await prisma.event.groupBy({
    by: ["route"],
    where: { appId, timestamp: { gte: since } },
    _count: { route: true },
    orderBy: { _count: { route: "desc" } },
    take: 10,
  })

  // Top errors
  const errorEvents = await prisma.event.findMany({
    where: { appId, type: "js_error", timestamp: { gte: since } },
    select: { payload: true },
  })

  const errorMessageCounts = new Map<string, number>()
  for (const e of errorEvents) {
    const msg = (e.payload as { message?: string }).message ?? "Unknown"
    errorMessageCounts.set(msg, (errorMessageCounts.get(msg) ?? 0) + 1)
  }

  const topErrors = [...errorMessageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([message, count]) => ({ message, count }))

  return {
    totalEvents,
    p75Lcp: lcpValues.length > 0 ? Math.round(percentile(lcpValues, 75)) : null,
    p75Inp: inpValues.length > 0 ? Math.round(percentile(inpValues, 75)) : null,
    avgCls: clsValues.length > 0 ? Number((clsValues.reduce((a, b) => a + b, 0) / clsValues.length).toFixed(3)) : null,
    avgApiLatency: apiLatencies.length > 0 ? Math.round(apiLatencies.reduce((a, b) => a + b, 0) / apiLatencies.length) : null,
    jsErrorCount,
    longTaskCount,
    topRoutes: routeGroups.map((g) => ({ route: g.route, count: g._count.route })),
    topErrors,
  }
}
