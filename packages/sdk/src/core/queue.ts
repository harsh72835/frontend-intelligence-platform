import type { FipEvent } from "@fip/shared"

// Inlined rather than imported at runtime from @fip/shared — that package's
// barrel also re-exports its zod schemas, and bundling it would drag zod
// into this browser SDK for the sake of two numbers. Keep these in sync
// with packages/shared/src/constants/index.ts.
const DEFAULT_BATCH_SIZE = 20
const DEFAULT_FLUSH_INTERVAL_MS = 5000

export type FlushFn = (events: FipEvent[]) => Promise<void>

export class EventQueue {
  private queue: FipEvent[] = []
  private timer: ReturnType<typeof setInterval> | null = null
  private readonly batchSize: number
  private readonly flushIntervalMs: number

  constructor(
    private readonly flush: FlushFn,
    batchSize = DEFAULT_BATCH_SIZE,
    flushIntervalMs = DEFAULT_FLUSH_INTERVAL_MS,
  ) {
    this.batchSize = batchSize
    this.flushIntervalMs = flushIntervalMs
  }

  start(): void {
    if (this.timer !== null) return
    this.timer = setInterval(() => {
      void this.drain()
    }, this.flushIntervalMs)

    if (typeof window !== "undefined") {
      window.addEventListener("visibilitychange", this.handleVisibilityChange)
      window.addEventListener("pagehide", this.handlePageHide)
    }
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("visibilitychange", this.handleVisibilityChange)
      window.removeEventListener("pagehide", this.handlePageHide)
    }
  }

  push(event: FipEvent): void {
    this.queue.push(event)
    if (this.queue.length >= this.batchSize) {
      void this.drain()
    }
  }

  async drain(): Promise<void> {
    if (this.queue.length === 0) return
    const batch = this.queue.splice(0, this.batchSize)
    try {
      await this.flush(batch)
    } catch {
      // silently swallow — SDK must never crash host app
    }
  }

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") {
      this.drainWithBeacon()
    }
  }

  private handlePageHide = (): void => {
    this.drainWithBeacon()
  }

  drainWithBeacon(): void {
    if (this.queue.length === 0) return
    const batch = this.queue.splice(0)
    try {
      this.flush(batch)
    } catch {
      // ignore
    }
  }
}
