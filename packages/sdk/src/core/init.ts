import type { FipEnvironment, FipEvent } from "@fip/shared"
import { EventQueue } from "./queue"
import { getSessionId } from "./session"
import { sendEvents } from "../transport"
import { collectVitals } from "../collectors/vitals"
import { collectRouteChanges } from "../collectors/route"
import { collectApiTimings } from "../collectors/api"
import { collectErrors } from "../collectors/errors"
import { collectLongTasks } from "../collectors/long-tasks"
import { collectResourceTimings } from "../collectors/resources"

export type FipConfig = {
  appId: string
  ingestUrl: string
  ingestKey: string
  release: string
  environment: FipEnvironment
  batchSize?: number
  flushIntervalMs?: number
  collectVitals?: boolean
  collectRouteChanges?: boolean
  collectApiTimings?: boolean
  collectErrors?: boolean
  collectLongTasks?: boolean
  collectResourceTimings?: boolean
}

export type SdkContext = {
  config: FipConfig
  sessionId: string
  queue: {
    push: (event: FipEvent) => void
  }
  getCurrentRoute: () => string
  setCurrentRoute: (route: string) => void
}

let initialized = false

export function initFip(config: FipConfig): void {
  if (initialized) return
  if (typeof window === "undefined") return

  initialized = true

  let currentRoute = window.location.pathname

  const queue = new EventQueue(
    async (events) => {
      await sendEvents(config.ingestUrl, events, config.ingestKey)
    },
    config.batchSize,
    config.flushIntervalMs,
  )

  const ctx: SdkContext = {
    config,
    sessionId: getSessionId(),
    queue,
    getCurrentRoute: () => currentRoute,
    setCurrentRoute: (route) => {
      currentRoute = route
    },
  }

  queue.start()

  if (config.collectVitals !== false) collectVitals(ctx)
  if (config.collectRouteChanges !== false) collectRouteChanges(ctx)
  if (config.collectApiTimings !== false) collectApiTimings(ctx)
  if (config.collectErrors !== false) collectErrors(ctx)
  if (config.collectLongTasks !== false) collectLongTasks(ctx)
  if (config.collectResourceTimings !== false) collectResourceTimings(ctx)
}
