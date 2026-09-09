import { getApiLatencyMetrics } from "@/server/analytics/api"

// See (dashboard)/page.tsx for why this is required.
export const dynamic = "force-dynamic"

const APP_ID = process.env.FIP_APP_ID ?? "sample-app"

function latencyColor(ms: number): string {
  if (ms <= 200) return "var(--good)"
  if (ms <= 800) return "var(--warn)"
  return "var(--poor)"
}

function latencyBg(ms: number): string {
  if (ms <= 200) return "var(--good-dim)"
  if (ms <= 800) return "var(--warn-dim)"
  return "var(--poor-dim)"
}

function latencyBorder(ms: number): string {
  if (ms <= 200) return "var(--good-border)"
  if (ms <= 800) return "var(--warn-border)"
  return "var(--poor-border)"
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, { color: string; bg: string }> = {
    GET: { color: "var(--good)", bg: "var(--good-dim)" },
    POST: { color: "var(--accent)", bg: "var(--accent-dim)" },
    PUT: { color: "var(--warn)", bg: "var(--warn-dim)" },
    PATCH: { color: "var(--warn)", bg: "var(--warn-dim)" },
    DELETE: { color: "var(--poor)", bg: "var(--poor-dim)" },
  }
  const s = colors[method.toUpperCase()] ?? { color: "var(--text-secondary)", bg: "var(--neutral-dim)" }
  return (
    <span
      style={{
        display: "inline-block",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.color}33`,
        borderRadius: 3,
        padding: "1px 6px",
        fontSize: 10,
        fontWeight: 700,
        fontFamily: "var(--font-jetbrains)",
        letterSpacing: "0.05em",
      }}
    >
      {method.toUpperCase()}
    </span>
  )
}

function LatencyCell({ ms }: { ms: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: latencyBg(ms),
        color: latencyColor(ms),
        border: `1px solid ${latencyBorder(ms)}`,
        borderRadius: 4,
        padding: "2px 7px",
        fontSize: 12,
        fontFamily: "var(--font-jetbrains)",
        fontWeight: 500,
      }}
    >
      {ms}ms
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

export default async function ApiLatencyPage() {
  const endpoints = await getApiLatencyMetrics(APP_ID)

  const slowCount = endpoints.filter((e) => e.p75Ms > 800).length
  const totalCalls = endpoints.reduce((s, e) => s + e.count, 0)

  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-up" style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
        <div>
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
            Performance
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
            API Latency
          </h1>
        </div>

        <div className="flex gap-3 mb-1">
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "4px 12px",
            }}
          >
            <span style={{ color: "var(--text-secondary)", fontSize: 11, fontFamily: "var(--font-jetbrains)" }}>
              {endpoints.length} endpoints · {totalCalls.toLocaleString()} calls
            </span>
          </div>
          {slowCount > 0 && (
            <div
              style={{
                background: "var(--poor-dim)",
                border: "1px solid var(--poor-border)",
                borderRadius: 6,
                padding: "4px 12px",
              }}
            >
              <span style={{ color: "var(--poor)", fontSize: 11, fontFamily: "var(--font-jetbrains)", fontWeight: 500 }}>
                {slowCount} slow (P75 &gt; 800ms)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      {endpoints.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-up animate-fade-up-2">
          {[
            {
              label: "Median P75",
              value: `${Math.round(endpoints.reduce((s, e) => s + e.p75Ms, 0) / endpoints.length)}ms`,
              ms: Math.round(endpoints.reduce((s, e) => s + e.p75Ms, 0) / endpoints.length),
            },
            {
              label: "Slowest Endpoint P95",
              value: endpoints[0] ? `${endpoints[0].p95Ms}ms` : "—",
              ms: endpoints[0]?.p95Ms ?? 0,
            },
            {
              label: "Avg Error Rate",
              value: `${Math.round(endpoints.reduce((s, e) => s + e.errorRate, 0) / endpoints.length)}%`,
              ms: -1,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "16px 18px",
              }}
            >
              <p style={{ color: "var(--text-secondary)", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-bricolage)", marginBottom: 8 }}>
                {stat.label}
              </p>
              <p style={{ color: stat.ms >= 0 ? latencyColor(stat.ms) : "var(--text-primary)", fontSize: 26, fontWeight: 500, fontFamily: "var(--font-jetbrains)", letterSpacing: "-0.03em" }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
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
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-bricolage)" }}>
            Endpoint Breakdown
          </span>
          <span style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains)", letterSpacing: "0.06em" }}>
            SORTED BY P75 · LAST 7 DAYS
          </span>
        </div>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Endpoint</Th>
              <Th>Method</Th>
              <Th right>P50</Th>
              <Th right>P75</Th>
              <Th right>P95</Th>
              <Th right>Avg</Th>
              <Th right>Error %</Th>
              <Th right>Calls</Th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((e, i) => (
              <tr
                key={`${e.method}::${e.endpoint}`}
                className="hover:bg-[var(--surface-raised)]"
                style={{
                  transition: "background 0.12s",
                  borderBottom: i < endpoints.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <td style={{ padding: "12px 16px", maxWidth: 0, width: "40%" }}>
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
                    title={e.endpoint}
                  >
                    {e.endpoint}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <MethodBadge method={e.method} />
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--text-secondary)" }}>
                    {e.p50Ms}ms
                  </span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <LatencyCell ms={e.p75Ms} />
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: latencyColor(e.p95Ms), fontWeight: 500 }}>
                    {e.p95Ms}ms
                  </span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--text-secondary)" }}>
                    {e.avgMs}ms
                  </span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains)",
                      fontSize: 12,
                      color: e.errorRate > 10 ? "var(--poor)" : e.errorRate > 0 ? "var(--warn)" : "var(--text-muted)",
                      fontWeight: e.errorRate > 0 ? 500 : 400,
                    }}
                  >
                    {e.errorRate}%
                  </span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--text-muted)" }}>
                    {e.count.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
            {endpoints.length === 0 && (
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
                  no api_timing events yet — instrument fetch calls with the SDK
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
