import { prisma } from "../db"

function p75(sorted: number[]): number | null {
  if (sorted.length === 0) return null
  const idx = Math.ceil(0.75 * sorted.length) - 1
  return sorted[Math.max(0, idx)] ?? null
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

function hourBucket(date: Date): Date {
  const d = new Date(date)
  d.setMinutes(0, 0, 0)
  return d
}

type EventRow = {
  route: string
  releaseId: string | null
  type: string
  timestamp: Date
  payload: unknown
}

type BucketKey = string
type BucketGroup = {
  appId: string
  releaseId: string | null
  route: string
  bucketStart: Date
  lcpValues: number[]
  inpValues: number[]
  clsValues: number[]
  apiLatencies: number[]
  jsErrorCount: number
  longTaskCount: number
  sampleCount: number
}

export type AggregateResult = {
  routeSummariesUpserted: number
  releaseSummariesUpserted: number
  windowHours: number
}

export async function runAggregation(appId: string, windowHours = 48): Promise<AggregateResult> {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000)

  // Fetch all relevant events in window
  const events = await prisma.event.findMany({
    where: {
      appId,
      type: { in: ["web_vital", "api_timing", "js_error", "long_task"] },
      timestamp: { gte: since },
    },
    select: { route: true, releaseId: true, type: true, timestamp: true, payload: true },
  }) as EventRow[]

  // Group into hourly buckets per (route, releaseId)
  const buckets = new Map<BucketKey, BucketGroup>()

  for (const e of events) {
    const bucket = hourBucket(e.timestamp)
    const key = `${e.releaseId ?? "null"}::${e.route}::${bucket.toISOString()}`

    if (!buckets.has(key)) {
      buckets.set(key, {
        appId,
        releaseId: e.releaseId,
        route: e.route,
        bucketStart: bucket,
        lcpValues: [],
        inpValues: [],
        clsValues: [],
        apiLatencies: [],
        jsErrorCount: 0,
        longTaskCount: 0,
        sampleCount: 0,
      })
    }

    const g = buckets.get(key)!
    g.sampleCount++

    if (e.type === "web_vital") {
      const p = e.payload as { metric?: string; value?: number }
      if (p.metric === "LCP" && typeof p.value === "number") g.lcpValues.push(p.value)
      if (p.metric === "INP" && typeof p.value === "number") g.inpValues.push(p.value)
      if (p.metric === "CLS" && typeof p.value === "number") g.clsValues.push(p.value)
    } else if (e.type === "api_timing") {
      const p = e.payload as { durationMs?: number }
      if (typeof p.durationMs === "number") g.apiLatencies.push(p.durationMs)
    } else if (e.type === "js_error") {
      g.jsErrorCount++
    } else if (e.type === "long_task") {
      g.longTaskCount++
    }
  }

  // Upsert RouteSummary rows
  const upsertOps = [...buckets.values()].map((g) => {
    g.lcpValues.sort((a, b) => a - b)
    g.inpValues.sort((a, b) => a - b)

    return prisma.routeSummary.upsert({
      where: {
        appId_releaseId_route_bucketStart_granularity: {
          appId: g.appId,
          releaseId: g.releaseId ?? null,
          route: g.route,
          bucketStart: g.bucketStart,
          granularity: "hour",
        },
      },
      update: {
        p75Lcp: p75(g.lcpValues),
        p75Inp: p75(g.inpValues),
        avgCls: avg(g.clsValues),
        avgApiLatency: avg(g.apiLatencies),
        jsErrorCount: g.jsErrorCount,
        longTaskCount: g.longTaskCount,
        sampleCount: g.sampleCount,
      },
      create: {
        appId: g.appId,
        releaseId: g.releaseId,
        route: g.route,
        bucketStart: g.bucketStart,
        granularity: "hour",
        p75Lcp: p75(g.lcpValues),
        p75Inp: p75(g.inpValues),
        avgCls: avg(g.clsValues),
        avgApiLatency: avg(g.apiLatencies),
        jsErrorCount: g.jsErrorCount,
        longTaskCount: g.longTaskCount,
        sampleCount: g.sampleCount,
      },
    })
  })

  // Run in batches of 50 to avoid overwhelming Postgres
  let routeSummariesUpserted = 0
  for (let i = 0; i < upsertOps.length; i += 50) {
    await Promise.all(upsertOps.slice(i, i + 50))
    routeSummariesUpserted += Math.min(50, upsertOps.length - i)
  }

  // Aggregate ReleaseSummary — one row per release from the buckets
  const releaseSummariesUpserted = await aggregateReleaseSummaries(appId)

  return { routeSummariesUpserted, releaseSummariesUpserted, windowHours }
}

async function aggregateReleaseSummaries(appId: string): Promise<number> {
  const releases = await prisma.release.findMany({
    where: { appId },
    select: { id: true },
  })

  let count = 0
  for (const rel of releases) {
    const rows = await prisma.routeSummary.findMany({
      where: { appId, releaseId: rel.id },
      select: {
        p75Lcp: true,
        p75Inp: true,
        avgCls: true,
        avgApiLatency: true,
        jsErrorCount: true,
        longTaskCount: true,
        sampleCount: true,
      },
    })

    if (rows.length === 0) continue

    const lcpValues = rows.flatMap((r) => r.p75Lcp != null ? [r.p75Lcp] : []).sort((a, b) => a - b)
    const inpValues = rows.flatMap((r) => r.p75Inp != null ? [r.p75Inp] : []).sort((a, b) => a - b)
    const clsValues = rows.flatMap((r) => r.avgCls != null ? [r.avgCls] : [])
    const apiValues = rows.flatMap((r) => r.avgApiLatency != null ? [r.avgApiLatency] : [])

    await prisma.releaseSummary.upsert({
      where: { releaseId: rel.id },
      update: {
        p75Lcp: p75(lcpValues),
        p75Inp: p75(inpValues),
        avgCls: avg(clsValues),
        avgApiLatency: avg(apiValues),
        jsErrorCount: rows.reduce((s, r) => s + r.jsErrorCount, 0),
        longTaskCount: rows.reduce((s, r) => s + r.longTaskCount, 0),
        sampleCount: rows.reduce((s, r) => s + r.sampleCount, 0),
      },
      create: {
        appId,
        releaseId: rel.id,
        p75Lcp: p75(lcpValues),
        p75Inp: p75(inpValues),
        avgCls: avg(clsValues),
        avgApiLatency: avg(apiValues),
        jsErrorCount: rows.reduce((s, r) => s + r.jsErrorCount, 0),
        longTaskCount: rows.reduce((s, r) => s + r.longTaskCount, 0),
        sampleCount: rows.reduce((s, r) => s + r.sampleCount, 0),
      },
    })
    count++
  }

  return count
}
