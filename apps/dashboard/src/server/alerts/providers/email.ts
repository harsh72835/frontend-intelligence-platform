import type { AlertProvider, AlertPayload } from "../types"

const SEVERITY_COLOR: Record<AlertPayload["severity"], string> = {
  info: "#2563eb",
  warning: "#d97706",
  critical: "#dc2626",
}

function renderHtml(alert: AlertPayload): string {
  const rows = Object.entries(alert.metadata)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 8px;color:#6b7280;">${k}</td><td style="padding:4px 8px;">${String(v)}</td></tr>`,
    )
    .join("")

  return `
    <div style="font-family:-apple-system,sans-serif;max-width:480px;">
      <div style="border-left:4px solid ${SEVERITY_COLOR[alert.severity]};padding:8px 16px;">
        <h2 style="margin:0 0 4px;font-size:16px;">${alert.title}</h2>
        <p style="margin:0 0 12px;color:#374151;">${alert.message}</p>
        <table style="font-size:13px;border-collapse:collapse;">${rows}</table>
        <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">App: ${alert.appId} · Kind: ${alert.kind}</p>
      </div>
    </div>
  `.trim()
}

export const emailProvider: AlertProvider = {
  name: "email",
  async send(alert: AlertPayload) {
    const apiKey = process.env.FIP_RESEND_API_KEY
    const to = process.env.FIP_EMAIL_TO
    const from = process.env.FIP_EMAIL_FROM

    if (!apiKey || !to || !from) {
      throw new Error(
        "Email provider misconfigured. Set FIP_RESEND_API_KEY, FIP_EMAIL_TO, and FIP_EMAIL_FROM.",
      )
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: to.split(",").map((addr) => addr.trim()),
        subject: `[FIP] ${alert.severity.toUpperCase()}: ${alert.title}`,
        html: renderHtml(alert),
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Resend request failed: ${res.status} ${body}`)
    }
  },
}
