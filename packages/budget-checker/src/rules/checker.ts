import type { LighthouseReport } from "../parsers/lighthouse"
import type { BundleReport } from "../parsers/bundle"

export type BudgetConfig = {
  lighthouse?: {
    lcp?: number
    cls?: number
    inp?: number
    ttfb?: number
    performanceScore?: number
  }
  bundle?: {
    totalSizeKb?: number
    maxChunkSizeKb?: number
  }
}

export type CheckResult = {
  passed: boolean
  failures: { metric: string; budget: number; actual: number; message: string }[]
  warnings: string[]
}

export function checkBudgets(
  config: BudgetConfig,
  lighthouse: LighthouseReport | null,
  bundle: BundleReport | null,
): CheckResult {
  const failures: CheckResult["failures"] = []
  const warnings: string[] = []

  if (config.lighthouse && lighthouse) {
    const checks: [keyof typeof config.lighthouse, number | null, string][] = [
      ["lcp", lighthouse.lcp, "LCP (ms)"],
      ["cls", lighthouse.cls, "CLS"],
      ["inp", lighthouse.inp, "INP (ms)"],
      ["ttfb", lighthouse.ttfb, "TTFB (ms)"],
    ]

    for (const [key, actual, label] of checks) {
      const budget = config.lighthouse[key]
      if (budget !== undefined && actual !== null && actual > budget) {
        failures.push({
          metric: label,
          budget,
          actual: Math.round(actual),
          message: `${label} ${Math.round(actual)} exceeds budget ${budget}`,
        })
      }
    }

    if (config.lighthouse.performanceScore !== undefined && lighthouse.performanceScore !== null) {
      if (lighthouse.performanceScore < config.lighthouse.performanceScore) {
        failures.push({
          metric: "Performance Score",
          budget: config.lighthouse.performanceScore,
          actual: lighthouse.performanceScore,
          message: `Performance score ${lighthouse.performanceScore} is below budget ${config.lighthouse.performanceScore}`,
        })
      }
    }
  }

  if (config.bundle && bundle) {
    const totalKb = bundle.totalSizeBytes / 1024
    if (config.bundle.totalSizeKb !== undefined && totalKb > config.bundle.totalSizeKb) {
      failures.push({
        metric: "Total Bundle Size (KB)",
        budget: config.bundle.totalSizeKb,
        actual: Math.round(totalKb),
        message: `Total bundle size ${Math.round(totalKb)}KB exceeds budget ${config.bundle.totalSizeKb}KB`,
      })
    }

    if (config.bundle.maxChunkSizeKb !== undefined) {
      for (const chunk of bundle.chunks) {
        const chunkKb = chunk.sizeBytes / 1024
        if (chunkKb > config.bundle.maxChunkSizeKb) {
          failures.push({
            metric: `Chunk: ${chunk.name}`,
            budget: config.bundle.maxChunkSizeKb,
            actual: Math.round(chunkKb),
            message: `Chunk "${chunk.name}" ${Math.round(chunkKb)}KB exceeds budget ${config.bundle.maxChunkSizeKb}KB`,
          })
        }
      }
    }
  }

  return { passed: failures.length === 0, failures, warnings }
}
