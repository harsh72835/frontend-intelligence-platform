import { NextResponse } from "next/server"

/**
 * Server-side proxy so the demo page's "Check for alerts now" button can
 * trigger the dashboard's protected /api/alerts/check without exposing the
 * shared secret to the browser. FIP_ALERT_CHECK_SECRET must match the
 * dashboard deployment's own AUTH_SECRET — that's what /api/alerts/check
 * actually checks against (see apps/dashboard/src/app/api/alerts/check/route.ts).
 *
 * Note: alerts have a 1-hour cooldown per (appId, kind) on the dashboard
 * side — firing the same alert kind twice within an hour will only fire it
 * once. Different scenario buttons trigger different alert kinds, so you
 * can still demo more than one per session.
 */
export async function POST() {
  const secret = process.env.FIP_ALERT_CHECK_SECRET
  const dashboardOrigin = process.env.FIP_DASHBOARD_ORIGIN

  if (!secret || !dashboardOrigin) {
    return NextResponse.json(
      { ok: false, error: "FIP_ALERT_CHECK_SECRET or FIP_DASHBOARD_ORIGIN not configured on this deployment." },
      { status: 500 },
    )
  }

  try {
    const res = await fetch(`${dashboardOrigin}/api/alerts/check`, {
      method: "POST",
      headers: { "x-alert-secret": secret },
    })
    const body = await res.json()

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: body.error ?? `Dashboard returned ${res.status}` }, { status: res.status })
    }

    return NextResponse.json({ ok: true, checked: body.checked, fired: body.fired })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 })
  }
}
