import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const APP_ID = "sample-app"
const ROUTES = ["/", "/products", "/products/1", "/checkout", "/reports"]
const RELEASES = ["1.0.0", "1.1.0", "1.2.0"]
const SESSION_COUNT = 20

// Bundle sizes growing across releases — matches the "progressively worse
// LCP" story already told by lcpBase below, so the Bundles tab and the
// Trends/Releases tabs tell a consistent regression narrative.
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

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min)
}

function randFloat(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

async function main() {
  console.log("Seeding FIP demo data...")

  // Ensure app exists
  await prisma.app.upsert({
    where: { id: APP_ID },
    update: {},
    create: {
      id: APP_ID,
      name: "Sample Store",
      slug: "sample-store",
      ingestKey: "dev-key-sample-app",
    },
  })

  for (const version of RELEASES) {
    const release = await prisma.release.upsert({
      where: { appId_version_environment: { appId: APP_ID, version, environment: "development" } },
      update: {},
      create: { appId: APP_ID, version, environment: "development" },
    })

    // Simulate progressively worse LCP from 1.0.0 -> 1.2.0
    const lcpBase = version === "1.0.0" ? 1800 : version === "1.1.0" ? 2200 : 3100

    const bundle = BUNDLE_REPORTS[version]!
    await prisma.bundleReport.create({
      data: {
        appId: APP_ID,
        releaseId: release.id,
        totalSizeKb: bundle.totalSizeKb,
        gzipSizeKb: bundle.gzipSizeKb,
        chunks: bundle.chunks,
      },
    })

    for (let s = 0; s < SESSION_COUNT; s++) {
      const sessionId = generateId()

      for (const route of ROUTES) {
        const isSlowRoute = route === "/reports"

        // Web vitals
        await prisma.event.create({
          data: {
            id: generateId(),
            appId: APP_ID,
            releaseId: release.id,
            type: "web_vital",
            environment: "development",
            sessionId,
            route,
            url: `http://localhost:3001${route}`,
            timestamp: new Date(Date.now() - rand(0, 7 * 24 * 3600 * 1000)),
            userAgent: "Mozilla/5.0 (Macintosh) Chrome/120",
            payload: { type: "web_vital", metric: "LCP", value: rand(lcpBase, lcpBase + (isSlowRoute ? 2000 : 800)) },
          },
        })

        await prisma.event.create({
          data: {
            id: generateId(),
            appId: APP_ID,
            releaseId: release.id,
            type: "web_vital",
            environment: "development",
            sessionId,
            route,
            url: `http://localhost:3001${route}`,
            timestamp: new Date(Date.now() - rand(0, 7 * 24 * 3600 * 1000)),
            userAgent: "Mozilla/5.0 (Macintosh) Chrome/120",
            payload: { type: "web_vital", metric: "INP", value: rand(80, isSlowRoute ? 600 : 250) },
          },
        })

        await prisma.event.create({
          data: {
            id: generateId(),
            appId: APP_ID,
            releaseId: release.id,
            type: "web_vital",
            environment: "development",
            sessionId,
            route,
            url: `http://localhost:3001${route}`,
            timestamp: new Date(Date.now() - rand(0, 7 * 24 * 3600 * 1000)),
            userAgent: "Mozilla/5.0 (Macintosh) Chrome/120",
            payload: { type: "web_vital", metric: "CLS", value: randFloat(0.01, isSlowRoute ? 0.35 : 0.12) },
          },
        })

        // API timing
        await prisma.event.create({
          data: {
            id: generateId(),
            appId: APP_ID,
            releaseId: release.id,
            type: "api_timing",
            environment: "development",
            sessionId,
            route,
            url: `http://localhost:3001${route}`,
            timestamp: new Date(Date.now() - rand(0, 7 * 24 * 3600 * 1000)),
            userAgent: "Mozilla/5.0 (Macintosh) Chrome/120",
            payload: {
              type: "api_timing",
              method: "GET",
              endpoint: `/api${route === "/" ? "/home" : route}`,
              durationMs: rand(isSlowRoute ? 800 : 150, isSlowRoute ? 1800 : 400),
              status: 200,
              ok: true,
            },
          },
        })

        // Long tasks on reports page
        if (isSlowRoute) {
          await prisma.event.create({
            data: {
              id: generateId(),
              appId: APP_ID,
              releaseId: release.id,
              type: "long_task",
              environment: "development",
              sessionId,
              route,
              url: `http://localhost:3001${route}`,
              timestamp: new Date(Date.now() - rand(0, 7 * 24 * 3600 * 1000)),
              userAgent: "Mozilla/5.0 (Macintosh) Chrome/120",
              payload: { type: "long_task", durationMs: rand(80, 600), startTime: rand(100, 3000) },
            },
          })
        }
      }

      // JS errors on checkout (30% chance)
      if (Math.random() < 0.3) {
        await prisma.event.create({
          data: {
            id: generateId(),
            appId: APP_ID,
            releaseId: release.id,
            type: "js_error",
            environment: "development",
            sessionId,
            route: "/checkout",
            url: "http://localhost:3001/checkout",
            timestamp: new Date(Date.now() - rand(0, 7 * 24 * 3600 * 1000)),
            userAgent: "Mozilla/5.0 (Macintosh) Chrome/120",
            payload: {
              type: "js_error",
              message: "Payment processing failed: timeout",
              source: "/checkout",
              lineno: 42,
              colno: 12,
              stack: "Error: Payment processing failed: timeout\n    at handleSubmit (/checkout:42:12)",
              kind: "error",
            },
          },
        })
      }
    }

    console.log(`  Seeded release ${version}`)
  }

  console.log("Done.")
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
