import { readFileSync } from "fs"

export type LighthouseReport = {
  lcp: number | null
  cls: number | null
  inp: number | null
  ttfb: number | null
  performanceScore: number | null
}

export function parseLighthouseReport(reportPath: string): LighthouseReport {
  const raw = readFileSync(reportPath, "utf-8")
  const json = JSON.parse(raw) as Record<string, unknown>

  const audits = json["audits"] as Record<string, { numericValue?: number }> | undefined
  const categories = json["categories"] as Record<string, { score?: number }> | undefined

  return {
    lcp: audits?.["largest-contentful-paint"]?.numericValue ?? null,
    cls: audits?.["cumulative-layout-shift"]?.numericValue ?? null,
    inp: audits?.["interaction-to-next-paint"]?.numericValue ?? null,
    ttfb: audits?.["server-response-time"]?.numericValue ?? null,
    performanceScore: categories?.["performance"]?.score != null
      ? Math.round((categories["performance"].score ?? 0) * 100)
      : null,
  }
}
