import type { AlertProvider, AlertPayload } from "../types"

const SEVERITY_EMOJI: Record<string, string> = {
  info: "ℹ️",
  warning: "⚠️",
  critical: "🔴",
}

export const slackProvider: AlertProvider = {
  name: "slack",
  async send(alert: AlertPayload) {
    const webhookUrl = process.env.FIP_SLACK_WEBHOOK_URL
    if (!webhookUrl) throw new Error("FIP_SLACK_WEBHOOK_URL not set")

    const emoji = SEVERITY_EMOJI[alert.severity] ?? "•"
    const fields = Object.entries(alert.metadata).map(([k, v]) => ({
      type: "mrkdwn",
      text: `*${k}:* ${v}`,
    }))

    const body = {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${emoji} *${alert.title}*\n${alert.message}`,
          },
        },
        ...(fields.length > 0
          ? [{ type: "section", fields }]
          : []),
        {
          type: "context",
          elements: [{ type: "mrkdwn", text: `App: \`${alert.appId}\` · Kind: \`${alert.kind}\`` }],
        },
      ],
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error(`Slack webhook failed: ${res.status}`)
  },
}
