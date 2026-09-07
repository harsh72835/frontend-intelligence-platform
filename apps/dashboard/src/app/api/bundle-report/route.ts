import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/server/db"
import { validateIngestKey } from "@/server/ingest-auth"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-fip-key",
}

const chunkSchema = z.object({
  name: z.string().min(1),
  sizeKb: z.number().nonnegative(),
})

const bundleReportSchema = z.object({
  appId: z.string().min(1),
  release: z.string().min(1),
  environment: z.enum(["development", "staging", "production"]),
  totalSizeKb: z.number().nonnegative(),
  gzipSizeKb: z.number().nonnegative().optional(),
  chunks: z.array(chunkSchema).min(1).max(500),
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

  const parsed = bundleReportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422, headers: CORS_HEADERS },
    )
  }

  const { appId, release, environment, totalSizeKb, gzipSizeKb, chunks } = parsed.data

  try {
    const rel = await prisma.release.upsert({
      where: { appId_version_environment: { appId, version: release, environment } },
      update: {},
      create: { appId, version: release, environment },
    })

    const report = await prisma.bundleReport.create({
      data: {
        appId,
        releaseId: rel.id,
        totalSizeKb,
        gzipSizeKb: gzipSizeKb ?? null,
        chunks,
      },
    })

    return NextResponse.json({ id: report.id, accepted: true }, { status: 201, headers: CORS_HEADERS })
  } catch (err) {
    console.error("[FIP] Bundle report ingest error", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: CORS_HEADERS })
  }
}
