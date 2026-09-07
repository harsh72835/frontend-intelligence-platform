import { getOverviewMetrics } from "@/server/analytics/overview"
import { getResourceMetrics } from "@/server/analytics/resources"
import { MetricCard } from "@/components/MetricCard"

const APP_ID = process.env.FIP_APP_ID ?? "sample-app"

function lcpStatus(v: number | null) {
  if (v === null) return "neutral"
  if (v <= 2500) return "good"
  if (v <= 4000) return "warning"
  return "poor"
}

function inpStatus(v: number | null) {
  if (v === null) return "neutral"
  if (v <= 200) return "good"
  if (v <= 500) return "warning"
  return "poor"
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        color: "var(--text-secondary)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontFamily: "var(--font-bricolage)",
        marginBottom: 4,
      }}
    >
      {children}
    </p>
  )
}

const initiatorColors: Record<string, string> = {
  fetch: "var(--accent)",
  xmlhttprequest: "var(--accent)",
  script: "var(--warn)",
  css: "#a78bfa",
  img: "#34d399",
  link: "#94a3b8",
}

export default async function OverviewPage() {
  const [metrics, resources] = await Promise.all([
    getOverviewMetrics(APP_ID),
    getResourceMetrics(APP_ID),
  ])

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 animate-fade-up">
        <SectionLabel>Dashboard</SectionLabel>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
            fontFamily: "var(--font-bricolage)",
          }}
        >
          Overview
        </h1>
      </div>

      {/* Metric cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
        <MetricCard index={0} label="Total Events (7d)" value={metrics.totalEvents} />
        <MetricCard
          index={1}
          label="P75 LCP"
          value={metrics.p75Lcp}
          unit="ms"
          status={lcpStatus(metrics.p75Lcp)}
        />
        <MetricCard
          index={2}
          label="P75 INP"
          value={metrics.p75Inp}
          unit="ms"
          status={inpStatus(metrics.p75Inp)}
        />
        <MetricCard index={3} label="Avg CLS" value={metrics.avgCls} />
        <MetricCard index={4} label="Avg API Latency" value={metrics.avgApiLatency} unit="ms" />
        <MetricCard index={5} label="JS Errors (7d)" value={metrics.jsErrorCount} status={metrics.jsErrorCount > 0 ? "poor" : "good"} />
        <MetricCard index={6} label="Long Tasks (7d)" value={metrics.longTaskCount} status={metrics.longTaskCount > 10 ? "warning" : "neutral"} />
      </section>

      {/* Bottom panels */}
      <div className="grid md:grid-cols-2 gap-4 animate-fade-up animate-fade-up-4">
        {/* Top routes */}
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-primary)",
                fontFamily: "var(--font-bricolage)",
                letterSpacing: "-0.01em",
              }}
            >
              Top Routes
            </span>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-secondary)",
                fontFamily: "var(--font-jetbrains)",
                letterSpacing: "0.06em",
              }}
            >
              BY EVENTS
            </span>
          </div>
          <table className="w-full">
            <tbody>
              {metrics.topRoutes.map((r, i) => (
                <tr
                  key={r.route}
                  style={{
                    borderBottom: i < metrics.topRoutes.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <td style={{ padding: "11px 18px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains)",
                        fontSize: 12,
                        color: "var(--text-primary)",
                      }}
                    >
                      {r.route}
                    </span>
                  </td>
                  <td style={{ padding: "11px 18px", textAlign: "right" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains)",
                        fontSize: 12,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {r.count}
                    </span>
                  </td>
                </tr>
              ))}
              {metrics.topRoutes.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      padding: "32px 18px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: 12,
                      fontFamily: "var(--font-jetbrains)",
                    }}
                  >
                    no data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Top errors */}
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-primary)",
                fontFamily: "var(--font-bricolage)",
                letterSpacing: "-0.01em",
              }}
            >
              Top Errors
            </span>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-secondary)",
                fontFamily: "var(--font-jetbrains)",
                letterSpacing: "0.06em",
              }}
            >
              BY FREQUENCY
            </span>
          </div>
          <table className="w-full">
            <tbody>
              {metrics.topErrors.map((e, i) => (
                <tr
                  key={e.message}
                  style={{
                    borderBottom: i < metrics.topErrors.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <td style={{ padding: "11px 18px", maxWidth: 0, width: "100%" }}>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--poor)",
                        fontFamily: "var(--font-jetbrains)",
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {e.message}
                    </span>
                  </td>
                  <td style={{ padding: "11px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        background: "var(--poor-dim)",
                        color: "var(--poor)",
                        border: "1px solid var(--poor-border)",
                        borderRadius: 4,
                        padding: "1px 6px",
                        fontSize: 11,
                        fontFamily: "var(--font-jetbrains)",
                        fontWeight: 500,
                      }}
                    >
                      {e.count}
                    </span>
                  </td>
                </tr>
              ))}
              {metrics.topErrors.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      padding: "32px 18px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: 12,
                      fontFamily: "var(--font-jetbrains)",
                    }}
                  >
                    no errors recorded
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
      {/* Resource timing panel */}
      {resources.length > 0 && (
        <section
          className="mt-4 animate-fade-up animate-fade-up-5"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-bricolage)" }}>
              Slowest Resources
            </span>
            <span style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains)", letterSpacing: "0.06em" }}>
              BY P75 DURATION · 7D
            </span>
          </div>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Resource", "Type", "P75", "Avg", "Avg Size", "Hits"].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 16px",
                      textAlign: i > 1 ? "right" : "left",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--text-secondary)",
                      fontFamily: "var(--font-bricolage)",
                      borderBottom: "1px solid var(--border)",
                      background: "var(--surface)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resources.slice(0, 8).map((r, i) => (
                <tr
                  key={`${r.name}-${i}`}
                  className="hover:bg-[var(--surface-raised)]"
                  style={{
                    transition: "background 0.12s",
                    borderBottom: i < Math.min(resources.length, 8) - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <td style={{ padding: "10px 16px", maxWidth: 0, width: "40%" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains)",
                        fontSize: 12,
                        color: "var(--text-primary)",
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.name}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains)",
                        fontSize: 10,
                        color: initiatorColors[r.initiatorType] ?? "var(--text-secondary)",
                        background: "var(--neutral-dim)",
                        border: "1px solid var(--border-bright)",
                        borderRadius: 3,
                        padding: "1px 5px",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      {r.initiatorType}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains)",
                        fontSize: 12,
                        color: r.p75DurationMs > 500 ? "var(--poor)" : r.p75DurationMs > 200 ? "var(--warn)" : "var(--good)",
                        fontWeight: 500,
                      }}
                    >
                      {r.p75DurationMs}ms
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--text-secondary)" }}>
                    {r.avgDurationMs}ms
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--text-secondary)" }}>
                    {r.avgTransferKb > 0 ? `${r.avgTransferKb}KB` : "—"}
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--text-muted)" }}>
                    {r.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
