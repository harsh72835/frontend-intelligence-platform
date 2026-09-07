import { NextRequest, NextResponse } from "next/server"
import { runAlertChecks } from "@/server/alerts/engine"

const APP_ID = process.env.FIP_APP_ID ?? "sample-app"

// Protected by shared secret — safe to call from cron/CI without dashboard auth
export async function POST(req: NextRequest) {
  const secret = process.env.AUTH_SECRET
  const provided = req.headers.get("x-alert-secret")

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await runAlertChecks(APP_ID)
    return NextResponse.json({ ok: true, ...result }, { status: 200 })
  } catch (err) {
    console.error("[FIP] Alert check error", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
