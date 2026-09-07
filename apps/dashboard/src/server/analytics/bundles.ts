import { prisma } from "../db"

export type ChunkEntry = {
  name: string
  sizeKb: number
}

export type BundleEntry = {
  reportId: string
  releaseId: string
  version: string
  totalSizeKb: number
  gzipSizeKb: number | null
  chunks: ChunkEntry[]
  createdAt: Date
}

export async function getBundleReports(appId: string, limit = 10): Promise<BundleEntry[]> {
  const reports = await prisma.bundleReport.findMany({
    where: { appId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { release: { select: { version: true } } },
  })

  return reports.map((r) => ({
    reportId: r.id,
    releaseId: r.releaseId,
    version: r.release.version,
    totalSizeKb: r.totalSizeKb,
    gzipSizeKb: r.gzipSizeKb,
    chunks: (r.chunks as ChunkEntry[]).sort((a, b) => b.sizeKb - a.sizeKb),
    createdAt: r.createdAt,
  }))
}
