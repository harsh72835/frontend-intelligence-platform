"use client"

import { useState } from "react"
import {
  triggerRealError,
  simulateSlowPage,
  simulateSlowApi,
  simulateErrorSpike,
  checkAlertsNow,
} from "@/lib/demo-scenarios"

type ScenarioKey = "error" | "slowPage" | "slowApi" | "errorSpike" | "checkAlerts"

type ScenarioDef = {
  key: ScenarioKey
  title: string
  description: string
  seesIn: string
  run: () => void | Promise<unknown>
}

const SCENARIOS: ScenarioDef[] = [
  {
    key: "error",
    title: "Trigger a real JS error",
    description: "Throws a genuine error, caught by the SDK's own error listener — no synthetic data.",
    seesIn: "Errors tab",
    run: triggerRealError,
  },
  {
    key: "slowPage",
    title: "Simulate a slow page (bad LCP)",
    description: "Sends 6 LCP samples in the 4.5–7s range — enough to cross the LCP-regression alert threshold.",
    seesIn: "Trends tab, Routes tab, and an alert if you Check for alerts",
    run: simulateSlowPage,
  },
  {
    key: "slowApi",
    title: "Simulate a slow/failing API",
    description: "Sends 5 payment-API calls, most slow, one timing out with a 504.",
    seesIn: "API Latency tab",
    run: simulateSlowApi,
  },
  {
    key: "errorSpike",
    title: "Simulate an error spike",
    description: "Sends 12 errors at once — enough to cross the error-spike alert threshold (default: 10/hour).",
    seesIn: "Errors tab, and an alert if you Check for alerts",
    run: simulateErrorSpike,
  },
]

export default function DemoPage() {
  const [status, setStatus] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  async function run(key: ScenarioKey, fn: () => void | Promise<unknown>) {
    setBusy(key)
    setStatus((s) => ({ ...s, [key]: "" }))
    try {
      const result = await fn()
      setStatus((s) => ({
        ...s,
        [key]: result ? `Sent — ${JSON.stringify(result)}` : "Sent",
      }))
    } catch (err) {
      setStatus((s) => ({ ...s, [key]: `Failed: ${err instanceof Error ? err.message : String(err)}` }))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Demo scenarios</h1>
      <p className="text-sm text-gray-500 mb-6">
        Trigger real telemetry on demand, then switch to the FIP dashboard to watch it land — no need to
        wait for organic traffic during a live demo.
      </p>

      <div className="space-y-3 mb-8">
        {SCENARIOS.map((s) => (
          <div key={s.key} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-medium">{s.title}</h2>
                <p className="text-xs text-gray-500 mt-1">{s.description}</p>
                <p className="text-xs text-gray-400 mt-1">Shows up in: {s.seesIn}</p>
              </div>
              <button
                onClick={() => run(s.key, s.run)}
                disabled={busy === s.key}
                className="shrink-0 text-sm font-medium bg-gray-900 text-white rounded-md px-4 py-2 disabled:opacity-50"
              >
                {busy === s.key ? "Sending..." : "Run"}
              </button>
            </div>
            {status[s.key] && <p className="text-xs mt-2 text-gray-600">{status[s.key]}</p>}
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium">Check for alerts now</h2>
            <p className="text-xs text-gray-600 mt-1">
              Alerts don&apos;t evaluate automatically on this deployment (no cron wired up yet) — run a
              scenario above first, then click this to make the dashboard actually evaluate its alert
              rules and fire.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Note: each alert kind has a 1-hour cooldown per app — firing the same kind twice in an hour
              only alerts once. Different scenarios use different alert kinds, so you can still demo more
              than one.
            </p>
          </div>
          <button
            onClick={() => run("checkAlerts", checkAlertsNow)}
            disabled={busy === "checkAlerts"}
            className="shrink-0 text-sm font-medium bg-amber-600 text-white rounded-md px-4 py-2 disabled:opacity-50"
          >
            {busy === "checkAlerts" ? "Checking..." : "Check now"}
          </button>
        </div>
        {status.checkAlerts && <p className="text-xs mt-2 text-gray-700">{status.checkAlerts}</p>}
      </div>
    </div>
  )
}
