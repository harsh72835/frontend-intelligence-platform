import { prisma } from "../db"

export type TrendPoint = {
  date: string   // "YYYY-MM-DD"
  value: number | null
}

export type TrendSeries = {
  metric: string
  unit: string
  points: TrendPoint[]
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)] ?? 0
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function getVitalTrend(
  appId: string,
  metric: "LCP" | "INP" | "CLS" | "TTFB",
  days = 30,
): Promise<TrendSeries> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const events = await prisma.event.findMany({
    where: { appId, type: "web_vital", timestamp: { gte: since } },
    select: { payload: true, timestamp: true },
    orderBy: { timestamp: "asc" },
  })

  const byDay = new Map<string, number[]>()

  for (const e of events) {
    const p = e.payload as { metric?: string; value?: number }
    if (p.metric !== metric || p.value == null) continue

    const key = toDateKey(e.timestamp)
    const arr = byDay.get(key) ?? []
    arr.push(p.value)
    byDay.set(key, arr)
  }

  // Fill all days in range
  const points: TrendPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = toDateKey(d)
    const vals = byDay.get(key)

    if (vals && vals.length > 0) {
      const sorted = [...vals].sort((a, b) => a - b)
      const p75 = percentile(sorted, 75)
      points.push({ date: key, value: Math.round(metric === "CLS" ? p75 * 1000 : p75) })
    } else {
      points.push({ date: key, value: null })
    }
  }

  const unitMap: Record<string, string> = {
    LCP: "ms", INP: "ms", TTFB: "ms", CLS: "×10⁻³",
  }

  return { metric, unit: unitMap[metric] ?? "ms", points }
}

export async function getErrorTrend(
  appId: string,
  days = 30,
): Promise<TrendSeries> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const events = await prisma.event.findMany({
    where: { appId, type: "js_error", timestamp: { gte: since } },
    select: { timestamp: true },
    orderBy: { timestamp: "asc" },
  })

  const byDay = new Map<string, number>()
  for (const e of events) {
    const key = toDateKey(e.timestamp)
    byDay.set(key, (byDay.get(key) ?? 0) + 1)
  }

  const points: TrendPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = toDateKey(d)
    points.push({ date: key, value: byDay.get(key) ?? 0 })
  }

  return { metric: "JS Errors", unit: "count", points }
}
