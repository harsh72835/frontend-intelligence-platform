/**
 * Seeds a fake source map for sample-app release 1.2.0.
 * Updates existing checkout errors to use a minified stack that the map can resolve.
 */
import { PrismaClient } from "@prisma/client"
import { SourceMapGenerator } from "source-map-js"

const prisma = new PrismaClient()
const APP_ID = "sample-app"
const RELEASE = "1.2.0"
const FILENAME = "main.js"

async function main() {
  // Build a source map that maps main.js:1:col -> original src
  const gen = new SourceMapGenerator({ file: FILENAME })

  // Simulate bundled code at line 1 with various column offsets
  // Each mapping: generated(1, col) -> original(file, line, col, name)
  const mappings: Array<{ col: number; src: string; srcLine: number; srcCol: number; name: string }> = [
    { col: 0,    src: "src/app/checkout/page.tsx",  srcLine: 1,  srcCol: 0,  name: "CheckoutPage" },
    { col: 200,  src: "src/app/checkout/page.tsx",  srcLine: 38, srcCol: 2,  name: "handleSubmit" },
    { col: 248,  src: "src/app/checkout/page.tsx",  srcLine: 42, srcCol: 12, name: "processPayment" },
    { col: 512,  src: "src/lib/api.ts",              srcLine: 15, srcCol: 4,  name: "post" },
    { col: 800,  src: "src/lib/api.ts",              srcLine: 22, srcCol: 8,  name: "fetchWithTimeout" },
    { col: 1200, src: "src/components/Button.tsx",   srcLine: 8,  srcCol: 2,  name: "Button" },
  ]

  for (const m of mappings) {
    gen.addMapping({
      generated: { line: 1, column: m.col },
      original: { line: m.srcLine, column: m.srcCol },
      source: m.src,
      name: m.name,
    })
  }

  const content = gen.toString()

  // Upsert source map
  await prisma.sourceMap.upsert({
    where: { appId_release_filename: { appId: APP_ID, release: RELEASE, filename: FILENAME } },
    update: { content },
    create: { appId: APP_ID, release: RELEASE, filename: FILENAME, content },
  })
  console.log(`Seeded source map: ${FILENAME} for ${APP_ID}@${RELEASE}`)

  // Update existing checkout js_error events in 1.2.0 to use a minified stack
  // that references main.js:1:248 -> processPayment in checkout/page.tsx:42:12
  const release = await prisma.release.findUnique({
    where: { appId_version_environment: { appId: APP_ID, version: RELEASE, environment: "development" } },
  })
  if (!release) {
    console.log("Release 1.2.0 not found, skipping event update")
    return
  }

  const minifiedStack = [
    `Error: Payment processing failed: timeout`,
    `    at t (http://localhost:3001/_next/static/chunks/main.js:1:248)`,
    `    at r (http://localhost:3001/_next/static/chunks/main.js:1:200)`,
    `    at n (http://localhost:3001/_next/static/chunks/main.js:1:512)`,
  ].join("\n")

  const result = await prisma.event.updateMany({
    where: { releaseId: release.id, type: "js_error" },
    data: {
      payload: {
        type: "js_error",
        message: "Payment processing failed: timeout",
        source: "http://localhost:3001/_next/static/chunks/main.js",
        lineno: 1,
        colno: 248,
        stack: minifiedStack,
        kind: "error",
      },
    },
  })

  console.log(`Updated ${result.count} error events with minified stack`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
