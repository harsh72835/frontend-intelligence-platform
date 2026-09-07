/**
 * Register a new App in FIP and print its ingest key.
 *
 * Usage:
 *   pnpm app:create --name "My Real App" --slug my-real-app
 *   pnpm app:create --name "My Real App" --slug my-real-app --key <existing-key>   # re-print/rotate to a known key
 *
 * There's no admin UI for this yet (see PRODUCTIONIZATION.md #1) — this script
 * is the stand-in until real org/user accounts exist.
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

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function main() {
  const { name, slug: slugArg, key } = parseArgs()

  if (!name) {
    console.error("Usage: pnpm app:create --name \"My Real App\" [--slug my-real-app] [--key <ingest-key>]")
    process.exit(1)
  }

  const slug = slugArg ?? slugify(name)
  const ingestKey = key ?? randomUUID()

  const existing = await prisma.app.findUnique({ where: { slug } })
  if (existing) {
    console.error(`App with slug "${slug}" already exists (id: ${existing.id}). Ingest key is not re-printed for security — check where it was first issued, or delete the row to reissue.`)
    process.exit(1)
  }

  const app = await prisma.app.create({
    data: { name, slug, ingestKey },
  })

  console.log("\nApp registered.\n")
  console.log(`  id:         ${app.id}`)
  console.log(`  name:       ${app.name}`)
  console.log(`  slug:       ${app.slug}`)
  console.log(`  ingestKey:  ${app.ingestKey}\n`)
  console.log("Save the ingest key now — it won't be printed again by this script.\n")
  console.log("Next steps:")
  console.log(`  1. In your real app's SDK init, set: appId: "${app.id}", ingestKey: "${app.ingestKey}"`)
  console.log(`  2. On the FIP dashboard, set env: FIP_APP_ID="${app.id}"\n`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
