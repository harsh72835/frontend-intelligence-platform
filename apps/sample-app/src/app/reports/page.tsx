"use client"

import { useEffect, useState } from "react"
import { fetchReports } from "@/lib/mock-api"

type Report = { id: string; title: string; value: number }

function heavyComputation() {
  // Simulates a CPU-heavy render to generate long tasks for demo telemetry
  let sum = 0
  for (let i = 0; i < 5_000_000; i++) sum += Math.sqrt(i)
  return sum
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Trigger long task on mount for demo purposes
    heavyComputation()

    fetchReports(1200)
      .then(setReports)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Reports</h1>
      <p className="text-xs text-gray-400 mb-4">This page intentionally runs heavy computation to generate long-task telemetry.</p>
      {loading ? (
        <p className="text-gray-400 text-sm">Generating reports...</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
              <span className="text-sm font-medium">{r.title}</span>
              <span className="text-sm text-blue-600 font-bold">{r.value}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
