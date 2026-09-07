import { prisma } from "../db"
import { dispatchAlert } from "./router"
import type { AlertPayload } from "./types"

const ERROR_SPIKE_THRESHOLD = parseInt(process.env.FIP_ALERT_ERROR_THRESHOLD ?? "10")
const LCP_THRESHOLD_MS = parseInt(process.env.FIP_ALERT_LCP_THRESHOLD_MS ?? "4000")
const COOLDOWN_MS = 60 * 60 * 1000  // 1 hour between same-kind alerts

async function wasRecentlyFired(appId: string, kind: string, fingerprint?: string): Promise<boolean> {
  const since = new Date(Date.now() - COOLDOWN_MS)
  const existing = await prisma.alert.findFirst({
    where: {
      appId,
      kind,
      fingerprint: fingerprint ?? null,
      firedAt: { gte: since },
    },
  })
  return existing != null
}

async function recordAlert(alert: AlertPayload, fingerprint?: string): Promise<void> {
  await prisma.alert.create({
    data: {
      appId: alert.appId,
      kind: alert.kind,
      fingerprint: fingerprint ?? null,
      payload: alert as never,
    },
  })
}

async function checkErrorSpike(appId: string): Promise<void> {
  const since = new Date(Date.now() - 60 * 60 * 1000)
  const count = await prisma.event.count({
    where: { appId, type: "js_error", timestamp: { gte: since } },
  })

  if (count < ERROR_SPIKE_THRESHOLD) return
  if (await wasRecentlyFired(appId, "error_spike")) return

  const alert: AlertPayload = {
    kind: "error_spike",
    appId,
    title: "Error spike detected",
    message: `${count} JS errors in the last hour (threshold: ${ERROR_SPIKE_THRESHOLD})`,
    severity: count >= ERROR_SPIKE_THRESHOLD * 3 ? "critical" : "warning",
    metadata: { errorCount: count, threshold: ERROR_SPIKE_THRESHOLD, windowHours: 1 },
  }

  await dispatchAlert(alert)
  await recordAlert(alert)
}

async function checkLcpRegression(appId: string): Promise<void> {
  const since = new Date(Date.now() - 60 * 60 * 1000)
  const vitals = await prisma.event.findMany({
    where: { appId, type: "web_vital", timestamp: { gte: since } },
    select: { payload: true },
  })

  const lcpValues = vitals
    .map((e) => e.payload as { metric?: string; value?: number })
    .filter((p) => p.metric === "LCP" && typeof p.value === "number")
    .map((p) => p.value as number)
    .sort((a, b) => a - b)

  if (lcpValues.length < 5) return

  const p75 = lcpValues[Math.floor(lcpValues.length * 0.75)]!
  if (p75 <= LCP_THRESHOLD_MS) return
  if (await wasRecentlyFired(appId, "lcp_regression")) return

  const alert: AlertPayload = {
    kind: "lcp_regression",
    appId,
    title: "LCP regression detected",
    message: `P75 LCP is ${Math.round(p75)}ms (threshold: ${LCP_THRESHOLD_MS}ms)`,
    severity: p75 >= LCP_THRESHOLD_MS * 1.5 ? "critical" : "warning",
    metadata: { p75Lcp: Math.round(p75), threshold: LCP_THRESHOLD_MS, sampleCount: lcpValues.length },
  }

  await dispatchAlert(alert)
  await recordAlert(alert)
}

async function checkNewErrors(appId: string): Promise<void> {
  const since = new Date(Date.now() - 60 * 60 * 1000)
  const recentErrors = await prisma.event.findMany({
    where: { appId, type: "js_error", timestamp: { gte: since } },
    select: { payload: true },
  })

  for (const e of recentErrors) {
    const p = e.payload as { fingerprint?: string; message?: string }
    const fp = p.fingerprint
    if (!fp) continue

    const existingBefore = await prisma.event.count({
      where: { appId, type: "js_error", timestamp: { lt: since }, payload: { path: ["fingerprint"], equals: fp } },
    })

    if (existingBefore > 0) continue
    if (await wasRecentlyFired(appId, "new_error", fp)) continue

    const alert: AlertPayload = {
      kind: "new_error",
      appId,
      title: "New error fingerprint detected",
      message: p.message ?? "Unknown error",
      severity: "warning",
      metadata: { fingerprint: fp },
    }

    await dispatchAlert(alert)
    await recordAlert(alert, fp)
  }
}

export async function runAlertChecks(appId: string): Promise<{ checked: string[]; fired: number }> {
  const before = await prisma.alert.count({ where: { appId } })

  await Promise.allSettled([
    checkErrorSpike(appId),
    checkLcpRegression(appId),
    checkNewErrors(appId),
  ])

  const after = await prisma.alert.count({ where: { appId } })

  return {
    checked: ["error_spike", "lcp_regression", "new_error"],
    fired: after - before,
  }
}
