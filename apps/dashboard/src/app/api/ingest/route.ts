import { NextRequest, NextResponse } from "next/server"
import { ingestRequestSchema } from "@fip/shared"
import { ingestEvents } from "@/server/ingestion"
import { validateIngestKey } from "@/server/ingest-auth"
import { checkRateLimit } from "@/server/ratelimit"
import { runAggregation } from "@/server/jobs/aggregate"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-fip-key",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest) {
  const auth = await validateIngestKey(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: CORS_HEADERS })
  }

  const rl = checkRateLimit(auth.appId)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfterMs: rl.retryAfterMs },
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)),
          "X-RateLimit-Limit": "1000",
          "X-RateLimit-Reset": String(Date.now() + rl.retryAfterMs),
        },
      },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS_HEADERS })
  }

  const parsed = ingestRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422, headers: CORS_HEADERS },
    )
  }

  try {
    const result = await ingestEvents(parsed.data.events)
    // Fire-and-forget — aggregate in background, don't block ingest response
    runAggregation(auth.appId, 2).catch((e) => console.error("[FIP] Aggregation error", e))
    return NextResponse.json(result, {
      status: 200,
      headers: { ...CORS_HEADERS, "X-RateLimit-Remaining": String(rl.remaining) },
    })
  } catch (err) {
    console.error("[FIP] Ingest error", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: CORS_HEADERS })
  }
}
