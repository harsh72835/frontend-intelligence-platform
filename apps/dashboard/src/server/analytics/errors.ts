import { prisma } from "../db"
import { resolveStack, type ResolvedFrame } from "../sourcemap"

// djb2 hash for fingerprint — fast, no deps
function djb2(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
    hash = hash & hash // keep 32-bit signed
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}

function normalizeMessage(message: string): string {
  return message
    .replace(/https?:\/\/[^\s"')]+/g, "<url>")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "<uuid>")
    .replace(/\b\d{4,}\b/g, "<N>")
    .replace(/"[^"]{0,80}"/g, '"<str>"')
    .replace(/'[^']{0,80}'/g, "'<str>'")
    .trim()
}

export type ErrorEntry = {
  fingerprint: string
  message: string
  normalizedMessage: string
  kind: string
  route: string
  count: number
  lastSeen: Date
  stack: string | null
  resolvedFrames: ResolvedFrame[]
  release: string | null
}

export async function getErrorMetrics(appId: string, days = 7): Promise<ErrorEntry[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const events = await prisma.event.findMany({
    where: { appId, type: "js_error", timestamp: { gte: since } },
    select: {
      payload: true,
      route: true,
      timestamp: true,
      release: { select: { version: true } },
    },
    orderBy: { timestamp: "desc" },
  })

  const grouped = new Map<string, ErrorEntry>()

  for (const e of events) {
    const p = e.payload as { message?: string; kind?: string; stack?: string }
    const message = p.message ?? "Unknown"
    const kind = p.kind ?? "error"
    const normalized = normalizeMessage(message)
    const fingerprint = djb2(`${normalized}::${kind}`)

    const existing = grouped.get(fingerprint)
    if (existing) {
      existing.count++
      if (e.timestamp > existing.lastSeen) existing.lastSeen = e.timestamp
    } else {
      grouped.set(fingerprint, {
        fingerprint,
        message,
        normalizedMessage: normalized,
        kind,
        route: e.route,
        count: 1,
        lastSeen: e.timestamp,
        stack: p.stack ?? null,
        resolvedFrames: [],
        release: e.release?.version ?? null,
      })
    }
  }

  const entries = [...grouped.values()].sort((a, b) => b.count - a.count).slice(0, 50)

  // Resolve stack frames for each error group
  await Promise.all(
    entries.map(async (entry) => {
      if (entry.stack && entry.release) {
        entry.resolvedFrames = await resolveStack(entry.stack, appId, entry.release)
      }
    }),
  )

  return entries
}
