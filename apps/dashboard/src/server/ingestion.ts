import type { FipEvent } from "@fip/shared"
import { prisma } from "./db"

type IngestResult = {
  accepted: number
  rejected: number
}

export async function ingestEvents(events: FipEvent[]): Promise<IngestResult> {
  let accepted = 0
  let rejected = 0

  for (const event of events) {
    try {
      // Resolve or create release record
      const release = await prisma.release.upsert({
        where: {
          appId_version_environment: {
            appId: event.appId,
            version: event.release,
            environment: event.environment,
          },
        },
        update: {},
        create: {
          appId: event.appId,
          version: event.release,
          environment: event.environment,
        },
      })

      // Extract event-specific payload fields (everything except base fields)
      const {
        id,
        type,
        appId,
        environment,
        release: _release,
        sessionId,
        route,
        url,
        timestamp,
        userAgent,
        ...payload
      } = event

      await prisma.event.create({
        data: {
          id,
          appId,
          releaseId: release.id,
          type: type as never,
          environment: environment as never,
          sessionId,
          route,
          url,
          timestamp: new Date(timestamp),
          userAgent,
          payload: payload as never,
        },
      })

      accepted++
    } catch (err) {
      console.error("[FIP] Failed to ingest event", event.id, err)
      rejected++
    }
  }

  return { accepted, rejected }
}
