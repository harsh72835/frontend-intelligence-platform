import { NextRequest } from "next/server"
import { prisma } from "./db"

export type KeyValidationResult =
  | { ok: true; appId: string }
  | { ok: false; status: 401 | 403; error: string }

export async function validateIngestKey(req: NextRequest): Promise<KeyValidationResult> {
  const key = req.headers.get("x-fip-key")

  if (!key) {
    return { ok: false, status: 401, error: "Missing x-fip-key header" }
  }

  const app = await prisma.app.findUnique({
    where: { ingestKey: key },
    select: { id: true },
  })

  if (!app) {
    return { ok: false, status: 403, error: "Invalid ingest key" }
  }

  return { ok: true, appId: app.id }
}
