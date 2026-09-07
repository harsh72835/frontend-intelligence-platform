import { prisma } from "../db"

export type ResourceEntry = {
  name: string
  initiatorType: string
  avgDurationMs: number
  p75DurationMs: number
  avgTransferKb: number
  count: number
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)] ?? 0
}

// Strip query strings and normalize URLs to resource name
function resourceName(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname.split("/").pop() || u.pathname
  } catch {
    return url.split("?")[0]?.split("/").pop() ?? url
  }
}

export async function getResourceMetrics(
  appId: string,
  days = 7,
  limit = 15,
): Promise<ResourceEntry[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const events = await prisma.event.findMany({
    where: { appId, type: "resource_timing", timestamp: { gte: since } },
    select: { payload: true },
    orderBy: { timestamp: "desc" },
    take: 2000,
  })

  const grouped = new Map<
    string,
    { durations: number[]; transfers: number[]; initiatorType: string }
  >()

  for (const e of events) {
    const p = e.payload as {
      name?: string
      initiatorType?: string
      durationMs?: number
      transferSizeBytes?: number
    }
    if (!p.name || !p.durationMs) continue

    const name = resourceName(p.name)
    const key = `${name}::${p.initiatorType ?? "other"}`
    const existing = grouped.get(key)

    if (existing) {
      existing.durations.push(p.durationMs)
      existing.transfers.push(p.transferSizeBytes ?? 0)
    } else {
      grouped.set(key, {
        durations: [p.durationMs],
        transfers: [p.transferSizeBytes ?? 0],
        initiatorType: p.initiatorType ?? "other",
      })
    }
  }

  const results: ResourceEntry[] = []

  for (const [key, data] of grouped.entries()) {
    const name = key.split("::")[0] ?? key
    const sorted = [...data.durations].sort((a, b) => a - b)
    const avgDuration = data.durations.reduce((a, b) => a + b, 0) / data.durations.length
    const avgTransfer = data.transfers.reduce((a, b) => a + b, 0) / data.transfers.length

    results.push({
      name,
      initiatorType: data.initiatorType,
      avgDurationMs: Math.round(avgDuration),
      p75DurationMs: Math.round(percentile(sorted, 75)),
      avgTransferKb: Math.round(avgTransfer / 1024),
      count: data.durations.length,
    })
  }

  return results
    .sort((a, b) => b.p75DurationMs - a.p75DurationMs)
    .slice(0, limit)
}
