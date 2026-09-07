"use client"

import { initFip } from "@fip/sdk"

let initialized = false

export function initializeFip(): void {
  if (initialized || typeof window === "undefined") return
  initialized = true

  initFip({
    appId: process.env.NEXT_PUBLIC_FIP_APP_ID ?? "sample-app",
    ingestUrl: process.env.NEXT_PUBLIC_FIP_INGEST_URL ?? "http://localhost:3000/api/ingest",
    ingestKey: process.env.NEXT_PUBLIC_FIP_INGEST_KEY ?? "",
    release: process.env.NEXT_PUBLIC_FIP_RELEASE ?? "1.0.0",
    environment: (process.env.NEXT_PUBLIC_FIP_ENV as "development" | "staging" | "production") ?? "development",
  })
}
