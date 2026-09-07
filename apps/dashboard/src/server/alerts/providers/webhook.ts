import type { AlertProvider, AlertPayload } from "../types"

export const webhookProvider: AlertProvider = {
  name: "webhook",
  async send(alert: AlertPayload) {
    const url = process.env.FIP_WEBHOOK_URL
    if (!url) throw new Error("FIP_WEBHOOK_URL not set")

    const secret = process.env.FIP_WEBHOOK_SECRET
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (secret) headers["Authorization"] = `Bearer ${secret}`

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...alert, firedAt: new Date().toISOString() }),
    })

    if (!res.ok) throw new Error(`Webhook failed: ${res.status}`)
  },
}
