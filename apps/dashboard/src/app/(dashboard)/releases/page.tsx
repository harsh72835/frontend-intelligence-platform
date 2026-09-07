import { getReleaseMetrics } from "@/server/analytics/releases"
import { detectRegressions } from "@/server/regression"
import { RegressionBadge } from "@/components/RegressionBadge"

const APP_ID = process.env.FIP_APP_ID ?? "sample-app"

function HealthScore({ score }: { score: number | null }) {
  if (score === null) return <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-jetbrains)", fontSize: 12 }}>—</span>
  const color = score >= 80 ? "var(--good)" : score >= 55 ? "var(--warn)" : "var(--poor)"
  const bg = score >= 80 ? "var(--good-dim)" : score >= 55 ? "var(--warn-dim)" : "var(--poor-dim)"
  const border = score >= 80 ? "var(--good-border)" : score >= 55 ? "var(--warn-border)" : "var(--poor-border)"
  return (
    <span
      style={{
        display: "inline-block",
        background: bg,
        color,
        border: `1px solid ${border}`,
        borderRadius: 4,
        padding: "2px 8px",
        fontSize: 12,
        fontFamily: "var(--font-jetbrains)",
        fontWeight: 600,
        letterSpacing: "-0.02em",
      }}
    >
      {score}
    </span>
  )
}

function DeltaCell({ delta }: { delta: number | null }) {
  if (delta === null) return <span style={{ color: "var(--text-muted)" }}>—</span>
  const isPositive = delta > 0
  const color = isPositive ? "var(--poor)" : "var(--good)"
  return (
    <span
      style={{
        color,
        fontFamily: "var(--font-jetbrains)",
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {isPositive ? "+" : ""}
      {delta.toFixed(1)}%
    </span>
  )
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

export default async function ReleasesPage() {
  const releases = await getReleaseMetrics(APP_ID)
  const [current, baseline] = releases

  const regressions =
    current && baseline ? detectRegressions(current, baseline) : []

  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-up">
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
          Governance
        </p>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
            fontFamily: "var(--font-bricolage)",
          }}
        >
          Releases
        </h1>
      </div>

      {/* Regression comparison */}
      {current && baseline && (
        <section
          className="mb-6 animate-fade-up animate-fade-up-2"
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
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-primary)",
                fontFamily: "var(--font-bricolage)",
              }}
            >
              Regression Analysis
            </span>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-secondary)",
                fontFamily: "var(--font-jetbrains)",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span
                style={{
                  padding: "1px 6px",
                  background: "var(--accent-dim)",
                  color: "var(--accent)",
                  border: "1px solid var(--accent-glow)",
                  borderRadius: 3,
                  fontSize: 10,
                }}
              >
                {current.version}
              </span>
              <span style={{ color: "var(--text-muted)" }}>vs</span>
              <span
                style={{
                  padding: "1px 6px",
                  background: "var(--neutral-dim)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-bright)",
                  borderRadius: 3,
                  fontSize: 10,
                }}
              >
                {baseline.version}
              </span>
            </span>
          </div>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th>Metric</Th>
                <Th right>Baseline</Th>
                <Th right>Current</Th>
                <Th right>Delta</Th>
                <Th right>Status</Th>
              </tr>
            </thead>
            <tbody>
              {regressions.map((r, i) => (
                <tr
                  key={r.metric}
                  className="hover:bg-[var(--surface-raised)]"
                  style={{
                    transition: "background 0.12s",
                    borderBottom: i < regressions.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-bricolage)",
                      fontWeight: 500,
                    }}
                  >
                    {r.metric}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      fontFamily: "var(--font-jetbrains)",
                    }}
                  >
                    {r.baseline !== null ? r.baseline : "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontSize: 12,
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-jetbrains)",
                    }}
                  >
                    {r.current !== null ? r.current : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <DeltaCell delta={r.deltaPercent} />
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <RegressionBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* All releases table */}
      <div
        className="animate-fade-up animate-fade-up-3"
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
            }}
          >
            All Releases
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--text-secondary)",
              fontFamily: "var(--font-jetbrains)",
              letterSpacing: "0.06em",
            }}
          >
            {releases.length} TOTAL
          </span>
        </div>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Version</Th>
              <Th>Environment</Th>
              <Th right>Health</Th>
              <Th right>Events</Th>
              <Th right>P75 LCP</Th>
              <Th right>P75 INP</Th>
              <Th right>Errors</Th>
              <Th right>Long Tasks</Th>
              <Th right>Created</Th>
            </tr>
          </thead>
          <tbody>
            {releases.map((r, i) => (
              <tr
                key={r.releaseId}
                className="hover:bg-[var(--surface-raised)]"
                style={{
                  transition: "background 0.12s",
                  borderBottom: i < releases.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <td style={{ padding: "12px 16px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {i === 0 && (
                      <span
                        style={{
                          fontSize: 9,
                          padding: "1px 5px",
                          background: "var(--accent-dim)",
                          color: "var(--accent)",
                          border: "1px solid var(--accent-glow)",
                          borderRadius: 3,
                          fontFamily: "var(--font-jetbrains)",
                          letterSpacing: "0.04em",
                        }}
                      >
                        LATEST
                      </span>
                    )}
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains)",
                        fontSize: 13,
                        color: "var(--text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      {r.version}
                    </span>
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains)",
                      fontSize: 11,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {r.environment}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <HealthScore score={r.healthScore} />
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontFamily: "var(--font-jetbrains)",
                    fontSize: 12,
                    color: "var(--text-secondary)",
                  }}
                >
                  {r.eventCount}
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontFamily: "var(--font-jetbrains)",
                    fontSize: 12,
                    color: "var(--text-primary)",
                  }}
                >
                  {r.p75Lcp !== null ? `${r.p75Lcp}ms` : "—"}
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontFamily: "var(--font-jetbrains)",
                    fontSize: 12,
                    color: "var(--text-primary)",
                  }}
                >
                  {r.p75Inp !== null ? `${r.p75Inp}ms` : "—"}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains)",
                      fontSize: 12,
                      color: r.jsErrorCount > 0 ? "var(--poor)" : "var(--text-muted)",
                      fontWeight: r.jsErrorCount > 0 ? 500 : 400,
                    }}
                  >
                    {r.jsErrorCount}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains)",
                      fontSize: 12,
                      color: r.longTaskCount > 5 ? "var(--warn)" : "var(--text-secondary)",
                    }}
                  >
                    {r.longTaskCount}
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontFamily: "var(--font-jetbrains)",
                    fontSize: 11,
                    color: "var(--text-muted)",
                  }}
                >
                  {r.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
            {releases.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: "48px 24px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: 13,
                    fontFamily: "var(--font-jetbrains)",
                  }}
                >
                  no releases yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
