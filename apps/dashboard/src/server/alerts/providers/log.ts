import type { AlertProvider, AlertPayload } from "../types"

export const logProvider: AlertProvider = {
  name: "log",
  async send(alert: AlertPayload) {
    console.log(`[FIP:ALERT] [${alert.severity.toUpperCase()}] ${alert.title} — ${alert.message}`, alert.metadata)
  },
}
