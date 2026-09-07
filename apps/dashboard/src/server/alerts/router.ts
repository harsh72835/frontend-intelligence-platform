import type { AlertProvider, AlertPayload } from "./types"
import { logProvider } from "./providers/log"
import { slackProvider } from "./providers/slack"
import { webhookProvider } from "./providers/webhook"
import { snsProvider } from "./providers/sns"
import { emailProvider } from "./providers/email"

const REGISTRY: Record<string, AlertProvider> = {
  log: logProvider,
  slack: slackProvider,
  webhook: webhookProvider,
  sns: snsProvider,
  email: emailProvider,
}

function getActiveProviders(): AlertProvider[] {
  const names = (process.env.FIP_ALERT_PROVIDERS ?? "log")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  return names.map((name) => {
    const p = REGISTRY[name]
    if (!p) throw new Error(`Unknown alert provider: "${name}". Valid: ${Object.keys(REGISTRY).join(", ")}`)
    return p
  })
}

export async function dispatchAlert(alert: AlertPayload): Promise<void> {
  const providers = getActiveProviders()

  await Promise.allSettled(
    providers.map(async (p) => {
      try {
        await p.send(alert)
      } catch (err) {
        console.error(`[FIP:ALERT] Provider "${p.name}" failed:`, err)
      }
    }),
  )
}
