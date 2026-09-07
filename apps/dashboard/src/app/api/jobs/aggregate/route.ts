import { NextRequest, NextResponse } from "next/server"
import { runAggregation } from "@/server/jobs/aggregate"

const APP_ID = process.env.FIP_APP_ID ?? "sample-app"

export async function POST(req: NextRequest) {
  const secret = process.env.AUTH_SECRET
  const provided = req.headers.get("x-job-secret")

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { windowHours?: number }
  const windowHours = body.windowHours ?? 48

  try {
    const result = await runAggregation(APP_ID, windowHours)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error("[FIP] Aggregation job error", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
