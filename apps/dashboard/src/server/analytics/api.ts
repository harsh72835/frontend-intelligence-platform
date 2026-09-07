import { prisma } from "../db"

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)] ?? 0
}

export type ApiEndpointMetrics = {
  endpoint: string
  method: string
  p50Ms: number
  p75Ms: number
  p95Ms: number
  avgMs: number
  errorRate: number
  count: number
}

export async function getApiLatencyMetrics(
  appId: string,
  days = 7,
): Promise<ApiEndpointMetrics[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const events = await prisma.event.findMany({
    where: { appId, type: "api_timing", timestamp: { gte: since } },
    select: { payload: true },
    orderBy: { timestamp: "desc" },
    take: 5000,
  })

  const grouped = new Map<
    string,
    { durations: number[]; errors: number; method: string }
  >()

  for (const e of events) {
    const p = e.payload as {
      endpoint?: string
      method?: string
      durationMs?: number
      ok?: boolean
    }
    if (!p.endpoint || p.durationMs == null) continue

    const key = `${p.method ?? "GET"}::${p.endpoint}`
    const existing = grouped.get(key)

    if (existing) {
      existing.durations.push(p.durationMs)
      if (!p.ok) existing.errors++
    } else {
      grouped.set(key, {
        durations: [p.durationMs],
        errors: p.ok ? 0 : 1,
        method: p.method ?? "GET",
      })
    }
  }

  const results: ApiEndpointMetrics[] = []

  for (const [key, data] of grouped.entries()) {
    const endpoint = key.split("::").slice(1).join("::")
    const sorted = [...data.durations].sort((a, b) => a - b)
    const total = data.durations.reduce((a, b) => a + b, 0)

    results.push({
      endpoint,
      method: data.method,
      p50Ms: Math.round(percentile(sorted, 50)),
      p75Ms: Math.round(percentile(sorted, 75)),
      p95Ms: Math.round(percentile(sorted, 95)),
      avgMs: Math.round(total / data.durations.length),
      errorRate: Math.round((data.errors / data.durations.length) * 100),
      count: data.durations.length,
    })
  }

  return results.sort((a, b) => b.p75Ms - a.p75Ms)
}
