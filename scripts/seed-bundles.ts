/**
 * Backfill BundleReport rows for the existing seeded "sample-app" releases,
 * without re-running the full db:seed (which would duplicate all events —
 * only App/Release there are upserts, Event/BundleReport are plain creates).
 *
 * Usage:
 *   DATABASE_URL="..." pnpm tsx scripts/seed-bundles.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const APP_ID = "sample-app"
const ENVIRONMENT = "development"

const BUNDLE_REPORTS: Record<string, { totalSizeKb: number; gzipSizeKb: number; chunks: { name: string; sizeKb: number }[] }> = {
  "1.0.0": {
    totalSizeKb: 376,
    gzipSizeKb: 118,
    chunks: [
      { name: "vendor", sizeKb: 200 },
      { name: "main", sizeKb: 105 },
      { name: "runtime", sizeKb: 43 },
      { name: "styles", sizeKb: 28 },
    ],
  },
  "1.1.0": {
    totalSizeKb: 411,
    gzipSizeKb: 126,
    chunks: [
      { name: "vendor", sizeKb: 220 },
      { name: "main", sizeKb: 118 },
      { name: "runtime", sizeKb: 43 },
      { name: "styles", sizeKb: 30 },
    ],
  },
  "1.2.0": {
    totalSizeKb: 438,
    gzipSizeKb: 134,
    chunks: [
      { name: "vendor", sizeKb: 220 },
      { name: "main", sizeKb: 142 },
      { name: "runtime", sizeKb: 43 },
      { name: "styles", sizeKb: 33 },
    ],
  },
}

async function main() {
  for (const [version, bundle] of Object.entries(BUNDLE_REPORTS)) {
    const release = await prisma.release.findUnique({
      where: { appId_version_environment: { appId: APP_ID, version, environment: ENVIRONMENT } },
    })
    if (!release) {
      console.log(`  Skipping ${version} — no matching Release row found (run db:seed first)`)
      continue
    }

    const existing = await prisma.bundleReport.findFirst({ where: { releaseId: release.id } })
    if (existing) {
      console.log(`  Skipping ${version} — BundleReport already exists`)
      continue
    }

    await prisma.bundleReport.create({
      data: {
        appId: APP_ID,
        releaseId: release.id,
        totalSizeKb: bundle.totalSizeKb,
        gzipSizeKb: bundle.gzipSizeKb,
        chunks: bundle.chunks,
      },
    })
    console.log(`  Seeded bundle report for ${version}`)
  }
  console.log("Done.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
