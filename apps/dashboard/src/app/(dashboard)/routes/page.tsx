import { getRouteMetrics, getRouteComparison } from "@/server/analytics/routes"
import { getReleaseMetrics } from "@/server/analytics/releases"
import { ReleaseSelector } from "@/components/ReleaseSelector"
import { Suspense } from "react"

const APP_ID = process.env.FIP_APP_ID ?? "sample-app"

function lcpColor(v: number | null): string {
  if (v === null) return "var(--text-muted)"
  if (v <= 2500) return "var(--good)"
  if (v <= 4000) return "var(--warn)"
  return "var(--poor)"
}

function lcpBg(v: number | null): string {
  if (v === null) return "transparent"
  if (v <= 2500) return "var(--good-dim)"
  if (v <= 4000) return "var(--warn-dim)"
  return "var(--poor-dim)"
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      style={{
        padding: "12px 16px",
        textAlign: right ? "right" : "left",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--text-secondary)",
        fontFamily: "var(--font-bricolage)",
        whiteSpace: "nowrap",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      {children}
    </th>
  )
}

function DeltaCell({ delta, invert = false }: { delta: number | null; invert?: boolean }) {
  if (delta === null) return <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-jetbrains)", fontSize: 12 }}>—</span>
  const worse = invert ? delta < 0 : delta > 0
  const color = Math.abs(delta) < 2 ? "var(--text-secondary)" : worse ? "var(--poor)" : "var(--good)"
  return (
    <span style={{ color, fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 500 }}>
      {delta > 0 ? "+" : ""}{delta}%
    </span>
  )
}

type PageProps = {
  searchParams: { baseline?: string; current?: string }
}

export default async function RoutesPage({ searchParams }: PageProps) {
  const [routes, releases] = await Promise.all([
    getRouteMetrics(APP_ID),
    getReleaseMetrics(APP_ID),
  ])

  const releaseList = releases.map((r) => ({
    id: r.releaseId,
    version: r.version,
    environment: r.environment,
  }))

  // Default: latest = current, second = baseline
  const defaultCurrentId = releaseList[0]?.id ?? ""
  const defaultBaselineId = releaseList[1]?.id ?? releaseList[0]?.id ?? ""

  const currentId = searchParams.current ?? defaultCurrentId
  const baselineId = searchParams.baseline ?? defaultBaselineId

  const comparison =
    releaseList.length >= 1 && baselineId && currentId && baselineId !== currentId
      ? await getRouteComparison(APP_ID, baselineId, currentId)
      : []

  const baselineVersion = releaseList.find((r) => r.id === baselineId)?.version ?? "—"
  const currentVersion = releaseList.find((r) => r.id === currentId)?.version ?? "—"

  return (
    <div>
      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <p style={{ color: "var(--text-secondary)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-bricolage)", marginBottom: 4 }}>
          Analytics
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-primary)", fontFamily: "var(--font-bricolage)" }}>
          Routes
        </h1>
      </div>

      {/* Release selector */}
      {releaseList.length >= 2 && (
        <div className="mb-4 animate-fade-up animate-fade-up-1">
          <Suspense>
            <ReleaseSelector
              releases={releaseList}
              baselineId={baselineId}
              currentId={currentId}
            />
          </Suspense>
        </div>
      )}

      {/* Route comparison table */}
      {comparison.length > 0 && (
        <section
          className="mb-4 animate-fade-up animate-fade-up-2"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}
        >
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-bricolage)" }}>
              Route Comparison
            </span>
            <span style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ padding: "1px 6px", background: "var(--neutral-dim)", color: "var(--text-secondary)", border: "1px solid var(--border-bright)", borderRadius: 3, fontSize: 10 }}>
                {baselineVersion}
              </span>
              <span style={{ color: "var(--text-muted)" }}>→</span>
              <span style={{ padding: "1px 6px", background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-glow)", borderRadius: 3, fontSize: 10 }}>
                {currentVersion}
              </span>
            </span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-jetbrains)", letterSpacing: "0.06em" }}>
              SORTED BY LCP DELTA
            </span>
          </div>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th>Route</Th>
                <Th right>LCP Δ</Th>
                <Th right>Baseline LCP</Th>
                <Th right>Current LCP</Th>
                <Th right>INP Δ</Th>
                <Th right>Error Δ</Th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, i) => (
                <tr
                  key={row.route}
                  className="hover:bg-[var(--surface-raised)]"
                  style={{ transition: "background 0.12s", borderBottom: i < comparison.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--text-primary)" }}>
                      {row.route}
                    </span>
                  </td>
                  <td style={{ padding: "11px 16px", textAlign: "right" }}>
                    <DeltaCell delta={row.lcpDelta} />
                  </td>
                  <td style={{ padding: "11px 16px", textAlign: "right", fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--text-secondary)" }}>
                    {row.baseline?.p75Lcp != null ? `${row.baseline.p75Lcp}ms` : "—"}
                  </td>
                  <td style={{ padding: "11px 16px", textAlign: "right" }}>
                    {row.current?.p75Lcp != null ? (
                      <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: lcpColor(row.current.p75Lcp), background: lcpBg(row.current.p75Lcp), border: `1px solid ${lcpColor(row.current.p75Lcp)}33`, borderRadius: 4, padding: "1px 6px" }}>
                        {row.current.p75Lcp}ms
                      </span>
                    ) : <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-jetbrains)", fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: "11px 16px", textAlign: "right" }}>
                    <DeltaCell delta={row.inpDelta} />
                  </td>
                  <td style={{ padding: "11px 16px", textAlign: "right" }}>
                    <DeltaCell delta={row.errorDelta} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* All routes table */}
      <div
        className="animate-fade-up animate-fade-up-3"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}
      >
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-bricolage)" }}>All Routes</span>
          <span style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains)", letterSpacing: "0.06em" }}>LAST 7 DAYS</span>
        </div>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Route</Th>
              <Th right>Events</Th>
              <Th right>P75 LCP</Th>
              <Th right>P75 INP</Th>
              <Th right>Avg CLS</Th>
              <Th right>API Latency</Th>
              <Th right>Errors</Th>
              <Th right>Long Tasks</Th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.route} style={{ transition: "background 0.12s" }} className="hover:bg-[var(--surface-raised)]">
                <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: lcpColor(r.p75Lcp), flexShrink: 0, display: "inline-block" }} />
                    <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12 }}>{r.route}</span>
                  </span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--text-secondary)" }}>{r.eventCount}</td>
                <td style={{ padding: "12px 16px", textAlign: "right", borderBottom: "1px solid var(--border)" }}>
                  {r.p75Lcp !== null ? (
                    <span style={{ color: lcpColor(r.p75Lcp), background: lcpBg(r.p75Lcp), border: `1px solid ${lcpColor(r.p75Lcp)}33`, borderRadius: 4, padding: "2px 7px", fontFamily: "var(--font-jetbrains)", fontSize: 12, fontWeight: 500 }}>
                      {r.p75Lcp}ms
                    </span>
                  ) : <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-jetbrains)", fontSize: 12 }}>—</span>}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-jetbrains)", fontSize: 12, color: r.p75Inp !== null ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {r.p75Inp !== null ? `${r.p75Inp}ms` : "—"}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--text-secondary)" }}>
                  {r.avgCls !== null ? r.avgCls.toFixed(3) : "—"}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--text-secondary)" }}>
                  {r.avgApiLatency !== null ? `${r.avgApiLatency}ms` : "—"}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-jetbrains)", fontSize: 12, color: r.jsErrorCount > 0 ? "var(--poor)" : "var(--text-muted)", fontWeight: r.jsErrorCount > 0 ? 500 : 400 }}>
                  {r.jsErrorCount}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-jetbrains)", fontSize: 12, color: r.longTaskCount > 5 ? "var(--warn)" : "var(--text-secondary)" }}>
                  {r.longTaskCount}
                </td>
              </tr>
            ))}
            {routes.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13, fontFamily: "var(--font-jetbrains)" }}>
                  no route data yet — instrument an app with the SDK to start collecting telemetry
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
