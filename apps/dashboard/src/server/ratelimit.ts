type WindowEntry = {
  timestamps: number[]
  lastPurge: number
}

const windows = new Map<string, WindowEntry>()

const WINDOW_MS = 60_000       // 1 minute sliding window
const PURGE_INTERVAL_MS = 60_000

function purgeStale(entry: WindowEntry, now: number): void {
  if (now - entry.lastPurge < PURGE_INTERVAL_MS) return
  const cutoff = now - WINDOW_MS
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff)
  entry.lastPurge = now
}

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterMs: number }

export function checkRateLimit(key: string, limit = 1000): RateLimitResult {
  const now = Date.now()
  const cutoff = now - WINDOW_MS

  let entry = windows.get(key)
  if (!entry) {
    entry = { timestamps: [], lastPurge: now }
    windows.set(key, entry)
  }

  purgeStale(entry, now)

  // Count requests in current window
  const count = entry.timestamps.filter((t) => t > cutoff).length

  if (count >= limit) {
    // Oldest timestamp in window tells us when a slot frees up
    const oldest = entry.timestamps.find((t) => t > cutoff) ?? now
    return { allowed: false, retryAfterMs: oldest + WINDOW_MS - now }
  }

  entry.timestamps.push(now)
  return { allowed: true, remaining: limit - count - 1 }
}
