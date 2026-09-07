import { readFileSync } from "fs"

export type BundleReport = {
  totalSizeBytes: number
  chunks: { name: string; sizeBytes: number }[]
}

export function parseBundleReport(reportPath: string): BundleReport {
  const raw = readFileSync(reportPath, "utf-8")
  const json = JSON.parse(raw) as Record<string, unknown>

  // Support Next.js build output format
  if (Array.isArray(json["pages"])) {
    const pages = json["pages"] as { name: string; size: number }[]
    const chunks = pages.map((p) => ({ name: p.name, sizeBytes: p.size }))
    return {
      totalSizeBytes: chunks.reduce((acc, c) => acc + c.sizeBytes, 0),
      chunks,
    }
  }

  // Support webpack-bundle-analyzer stats.json format
  if (json["assets"] && Array.isArray(json["assets"])) {
    const assets = json["assets"] as { name: string; size: number }[]
    const chunks = assets.map((a) => ({ name: a.name, sizeBytes: a.size }))
    return {
      totalSizeBytes: chunks.reduce((acc, c) => acc + c.sizeBytes, 0),
      chunks,
    }
  }

  throw new Error(`Unrecognized bundle report format in ${reportPath}`)
}
