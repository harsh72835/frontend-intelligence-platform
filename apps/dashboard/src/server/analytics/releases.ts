import { prisma } from "../db"

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)] ?? 0
}

export type ReleaseMetrics = {
  releaseId: string
  version: string
  environment: string
  createdAt: Date
  eventCount: number
  p75Lcp: number | null
  p75Inp: number | null
  avgCls: number | null
  avgApiLatency: number | null
  jsErrorCount: number
  longTaskCount: number
  healthScore: number | null
}

function computeHealthScore(
  p75Lcp: number | null,
  p75Inp: number | null,
  avgCls: number | null,
  jsErrorCount: number,
  longTaskCount: number,
  eventCount: number,
): number | null {
  if (eventCount === 0) return null

  let score = 0
  let weight = 0

  if (p75Lcp !== null) {
    const s = p75Lcp <= 2500 ? 100 : p75Lcp <= 4000 ? 50 : 0
    score += s * 0.35
    weight += 0.35
  }
  if (p75Inp !== null) {
    const s = p75Inp <= 200 ? 100 : p75Inp <= 500 ? 50 : 0
    score += s * 0.25
    weight += 0.25
  }
  if (avgCls !== null) {
    const s = avgCls <= 0.1 ? 100 : avgCls <= 0.25 ? 50 : 0
    score += s * 0.15
    weight += 0.15
  }

  // Error rate: 0 errors = 100pts, degrades per error per 100 events
  const errorRate = (jsErrorCount / Math.max(eventCount, 1)) * 100
  const errorScore = Math.max(0, 100 - errorRate * 5)
  score += errorScore * 0.15
  weight += 0.15

  // Long task rate
  const ltRate = (longTaskCount / Math.max(eventCount, 1)) * 100
  const ltScore = Math.max(0, 100 - ltRate * 3)
  score += ltScore * 0.1
  weight += 0.1

  return weight > 0 ? Math.round(score / weight) : null
}

export async function getReleaseMetrics(appId: string, limit = 10): Promise<ReleaseMetrics[]> {
  const releases = await prisma.release.findMany({
    where: { appId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      _count: { select: { events: true } },
    },
  })

  const results = await Promise.all(
    releases.map(async (rel) => {
      const [vitalEvents, apiEvents, jsErrorCount, longTaskCount] = await Promise.all([
        prisma.event.findMany({
          where: { appId, releaseId: rel.id, type: "web_vital" },
          select: { payload: true },
        }),
        prisma.event.findMany({
          where: { appId, releaseId: rel.id, type: "api_timing" },
          select: { payload: true },
        }),
        prisma.event.count({ where: { appId, releaseId: rel.id, type: "js_error" } }),
        prisma.event.count({ where: { appId, releaseId: rel.id, type: "long_task" } }),
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

      const p75Lcp = lcpValues.length > 0 ? Math.round(percentile(lcpValues, 75)) : null
      const p75Inp = inpValues.length > 0 ? Math.round(percentile(inpValues, 75)) : null
      const avgCls = clsValues.length > 0 ? Number((clsValues.reduce((a, b) => a + b, 0) / clsValues.length).toFixed(3)) : null

      return {
        releaseId: rel.id,
        version: rel.version,
        environment: rel.environment,
        createdAt: rel.createdAt,
        eventCount: rel._count.events,
        p75Lcp,
        p75Inp,
        avgCls,
        avgApiLatency: apiLatencies.length > 0 ? Math.round(apiLatencies.reduce((a, b) => a + b, 0) / apiLatencies.length) : null,
        jsErrorCount,
        longTaskCount,
        healthScore: computeHealthScore(p75Lcp, p75Inp, avgCls, jsErrorCount, longTaskCount, rel._count.events),
      }
    }),
  )

  return results
}
