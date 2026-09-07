import type { ReleaseMetrics } from "./analytics/releases"

export type RegressionResult = {
  metric: string
  baseline: number | null
  current: number | null
  deltaPercent: number | null
  status: "healthy" | "warning" | "regressed"
}

const THRESHOLDS = {
  p75Lcp: { warning: 10, regressed: 25 },
  p75Inp: { warning: 10, regressed: 25 },
  avgCls: { warning: 20, regressed: 50 },
  avgApiLatency: { warning: 15, regressed: 30 },
  jsErrorCount: { warning: 20, regressed: 50 },
}

export function detectRegressions(
  current: ReleaseMetrics,
  baseline: ReleaseMetrics,
): RegressionResult[] {
  const metrics = [
    { key: "p75Lcp" as const, label: "P75 LCP (ms)" },
    { key: "p75Inp" as const, label: "P75 INP (ms)" },
    { key: "avgCls" as const, label: "Avg CLS" },
    { key: "avgApiLatency" as const, label: "Avg API Latency (ms)" },
    { key: "jsErrorCount" as const, label: "JS Error Count" },
  ]

  return metrics.map(({ key, label }) => {
    const curr = current[key]
    const base = baseline[key]

    if (curr === null || base === null || base === 0) {
      return { metric: label, baseline: base, current: curr, deltaPercent: null, status: "healthy" }
    }

    const deltaPercent = ((curr - base) / base) * 100
    const thresholds = THRESHOLDS[key]

    let status: "healthy" | "warning" | "regressed" = "healthy"
    if (deltaPercent > thresholds.regressed) status = "regressed"
    else if (deltaPercent > thresholds.warning) status = "warning"

    return { metric: label, baseline: base, current: curr, deltaPercent, status }
  })
}
