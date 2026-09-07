import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/server/db"
import { validateIngestKey } from "@/server/ingest-auth"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-fip-key",
}

const schema = z.object({
  appId: z.string().min(1),
  release: z.string().min(1),
  filename: z.string().min(1),
  content: z.string().min(1),
})

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  const auth = await validateIngestKey(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: CORS_HEADERS })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS_HEADERS })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422, headers: CORS_HEADERS },
    )
  }

  const { appId, release, filename, content } = parsed.data

  // Validate it's actually a source map
  try {
    const map = JSON.parse(content)
    if (!map.version || !map.mappings) {
      return NextResponse.json({ error: "Invalid source map format" }, { status: 422, headers: CORS_HEADERS })
    }
  } catch {
    return NextResponse.json({ error: "content must be valid source map JSON" }, { status: 422, headers: CORS_HEADERS })
  }

  try {
    await prisma.sourceMap.upsert({
      where: { appId_release_filename: { appId, release, filename } },
      update: { content },
      create: { appId, release, filename, content },
    })
    return NextResponse.json({ accepted: true }, { status: 201, headers: CORS_HEADERS })
  } catch (err) {
    console.error("[FIP] Source map upload error", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: CORS_HEADERS })
  }
}
