export type AlertKind = "error_spike" | "lcp_regression" | "new_error"
export type AlertSeverity = "info" | "warning" | "critical"

export type AlertPayload = {
  kind: AlertKind
  appId: string
  title: string
  message: string
  severity: AlertSeverity
  metadata: Record<string, unknown>
}

export interface AlertProvider {
  name: string
  send(alert: AlertPayload): Promise<void>
}
