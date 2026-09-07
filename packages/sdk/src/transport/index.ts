import type { FipEvent } from "@fip/shared"

export async function sendEvents(endpoint: string, events: FipEvent[], ingestKey: string): Promise<void> {
  const body = JSON.stringify({ events })

  // sendBeacon can't set custom headers — falls back to fetch with keepalive
  // text/plain avoids preflight for the beacon path, but we need the key header so fetch is preferred
  await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-fip-key": ingestKey,
    },
    body,
    keepalive: true,
  })
}
