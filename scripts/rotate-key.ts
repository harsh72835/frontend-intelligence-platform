/**
 * Rotate an App's ingest key.
 *
 * Usage:
 *   pnpm app:rotate-key --slug my-real-app
 *   pnpm app:rotate-key --id cmtreg59q0000eh02ao08b603
 *
 * Invalidation is immediate — the old key stops working the moment this
 * runs, since `validateIngestKey` (apps/dashboard/src/server/ingest-auth.ts)
 * does a flat unique lookup on `ingestKey`, not a "currently active key" set.
 * There is no grace-period/dual-key window: any in-flight SDK still using
 * the old key will start getting 403s from /api/ingest right after this
 * completes. If you need zero-downtime rotation (both keys valid briefly),
 * that needs a schema change — a separate `IngestKey` table with an
 * `active`/`expiresAt` column instead of a single column on `App` — not
 * done here; flagged in PRODUCTIONIZATION.md.
 */
import { randomUUID } from "crypto"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function parseArgs() {
  const args = process.argv.slice(2)
  const out: Record<string, string> = {}
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, "")
    const val = args[i + 1]
    if (key && val) out[key] = val
  }
  return out
}

async function main() {
  const { slug, id } = parseArgs()

  if (!slug && !id) {
    console.error('Usage: pnpm app:rotate-key --slug my-real-app   (or --id <app-id>)')
    process.exit(1)
  }

  const app = await prisma.app.findUnique({
    where: slug ? { slug } : { id: id! },
  })

  if (!app) {
    console.error(`No app found for ${slug ? `slug "${slug}"` : `id "${id}"`}.`)
    process.exit(1)
  }

  const newKey = randomUUID()
  const updated = await prisma.app.update({
    where: { id: app.id },
    data: { ingestKey: newKey },
  })

  console.log("\nIngest key rotated. The old key stops working immediately.\n")
  console.log(`  id:            ${updated.id}`)
  console.log(`  slug:          ${updated.slug}`)
  console.log(`  new ingestKey: ${updated.ingestKey}\n`)
  console.log("Update every SDK init using this app's old key now — they will")
  console.log("start getting 403s from /api/ingest until they're updated.\n")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
