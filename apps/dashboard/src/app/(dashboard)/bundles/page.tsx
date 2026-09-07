import { getBundleReports } from "@/server/analytics/bundles"

const APP_ID = process.env.FIP_APP_ID ?? "sample-app"

const BUDGET_KB = 500

function sizeColor(kb: number): string {
  if (kb <= BUDGET_KB * 0.7) return "var(--good)"
  if (kb <= BUDGET_KB) return "var(--warn)"
  return "var(--poor)"
}

function sizeBg(kb: number): string {
  if (kb <= BUDGET_KB * 0.7) return "var(--good-dim)"
  if (kb <= BUDGET_KB) return "var(--warn-dim)"
  return "var(--poor-dim)"
}

function sizeBorder(kb: number): string {
  if (kb <= BUDGET_KB * 0.7) return "var(--good-border)"
  if (kb <= BUDGET_KB) return "var(--warn-border)"
  return "var(--poor-border)"
}

// Map chunk names to colors for stacked bar
const CHUNK_COLORS = [
  "#0df2c8", "#38bdf8", "#a78bfa", "#fb923c", "#f43f5e",
  "#34d399", "#fbbf24", "#60a5fa", "#e879f9", "#94a3b8",
]

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

function StackedBar({ chunks, totalKb }: { chunks: { name: string; sizeKb: number }[]; totalKb: number }) {
  return (
    <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", gap: 1, minWidth: 120 }}>
      {chunks.map((c, i) => (
        <div
          key={c.name}
          title={`${c.name}: ${c.sizeKb}KB`}
          style={{
            flex: c.sizeKb / totalKb,
            background: CHUNK_COLORS[i % CHUNK_COLORS.length],
            opacity: 0.8,
            minWidth: 2,
          }}
        />
      ))}
    </div>
  )
}

export default async function BundlesPage() {
  const reports = await getBundleReports(APP_ID)

  // Delta vs previous report
  function delta(current: number, prev: number | undefined): string | null {
    if (prev == null) return null
    const d = current - prev
    return `${d >= 0 ? "+" : ""}${d.toFixed(1)}KB`
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <p style={{ color: "var(--text-secondary)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-bricolage)", marginBottom: 4 }}>
          Governance
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-primary)", fontFamily: "var(--font-bricolage)" }}>
          Bundle Sizes
        </h1>
      </div>

      {/* Budget summary cards */}
      {reports.length > 0 && (() => {
        const latest = reports[0]!
        const prev = reports[1]
        const d = prev ? latest.totalSizeKb - prev.totalSizeKb : null
        return (
          <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-up animate-fade-up-1">
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${sizeBorder(latest.totalSizeKb)}`, borderRadius: 8, padding: "16px 18px" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-bricolage)", marginBottom: 8 }}>Total Size</p>
              <p style={{ color: sizeColor(latest.totalSizeKb), fontSize: 26, fontWeight: 500, fontFamily: "var(--font-jetbrains)", letterSpacing: "-0.03em" }}>
                {latest.totalSizeKb}
                <span style={{ fontSize: 13, color: "var(--text-secondary)", marginLeft: 4 }}>KB</span>
              </p>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: "3px solid var(--border-bright)", borderRadius: 8, padding: "16px 18px" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-bricolage)", marginBottom: 8 }}>Gzip Size</p>
              <p style={{ color: "var(--text-primary)", fontSize: 26, fontWeight: 500, fontFamily: "var(--font-jetbrains)", letterSpacing: "-0.03em" }}>
                {latest.gzipSizeKb ?? "—"}
                {latest.gzipSizeKb && <span style={{ fontSize: 13, color: "var(--text-secondary)", marginLeft: 4 }}>KB</span>}
              </p>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${d != null && d > 0 ? "var(--poor-border)" : d != null && d < 0 ? "var(--good-border)" : "var(--border-bright)"}`, borderRadius: 8, padding: "16px 18px" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-bricolage)", marginBottom: 8 }}>vs Prev Release</p>
              <p style={{ color: d == null ? "var(--text-muted)" : d > 0 ? "var(--poor)" : d < 0 ? "var(--good)" : "var(--text-secondary)", fontSize: 26, fontWeight: 500, fontFamily: "var(--font-jetbrains)", letterSpacing: "-0.03em" }}>
                {d == null ? "—" : `${d >= 0 ? "+" : ""}${d.toFixed(1)}`}
                {d != null && <span style={{ fontSize: 13, color: "var(--text-secondary)", marginLeft: 4 }}>KB</span>}
              </p>
            </div>
          </div>
        )
      })()}

      {/* Per-release breakdown */}
      <div className="animate-fade-up animate-fade-up-2" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-bricolage)" }}>Release History</span>
          <span style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains)", letterSpacing: "0.06em" }}>
            BUDGET {BUDGET_KB}KB
          </span>
        </div>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Release</Th>
              <Th>Composition</Th>
              <Th right>Total</Th>
              <Th right>Gzip</Th>
              <Th right>Delta</Th>
              <Th right>Chunks</Th>
              <Th right>Reported</Th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r, i) => {
              const prev = reports[i + 1]
              const d = prev ? r.totalSizeKb - prev.totalSizeKb : null
              const dColor = d == null ? "var(--text-muted)" : d > 5 ? "var(--poor)" : d < -5 ? "var(--good)" : "var(--text-secondary)"
              return (
                <tr
                  key={r.reportId}
                  className="hover:bg-[var(--surface-raised)]"
                  style={{ transition: "background 0.12s", borderBottom: i < reports.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  {/* Release */}
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {i === 0 && (
                        <span style={{ fontSize: 9, padding: "1px 5px", background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-glow)", borderRadius: 3, fontFamily: "var(--font-jetbrains)", letterSpacing: "0.04em" }}>
                          LATEST
                        </span>
                      )}
                      <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                        {r.version}
                      </span>
                    </span>
                  </td>

                  {/* Stacked bar */}
                  <td style={{ padding: "14px 16px", minWidth: 140 }}>
                    <StackedBar chunks={r.chunks} totalKb={r.totalSizeKb} />
                  </td>

                  {/* Total */}
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <span style={{ display: "inline-block", background: sizeBg(r.totalSizeKb), color: sizeColor(r.totalSizeKb), border: `1px solid ${sizeBorder(r.totalSizeKb)}`, borderRadius: 4, padding: "2px 8px", fontSize: 12, fontFamily: "var(--font-jetbrains)", fontWeight: 500 }}>
                      {r.totalSizeKb}KB
                    </span>
                  </td>

                  {/* Gzip */}
                  <td style={{ padding: "14px 16px", textAlign: "right", fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--text-secondary)" }}>
                    {r.gzipSizeKb != null ? `${r.gzipSizeKb}KB` : "—"}
                  </td>

                  {/* Delta */}
                  <td style={{ padding: "14px 16px", textAlign: "right", fontFamily: "var(--font-jetbrains)", fontSize: 12, color: dColor, fontWeight: d != null && Math.abs(d) > 5 ? 500 : 400 }}>
                    {d == null ? "—" : `${d >= 0 ? "+" : ""}${d.toFixed(1)}KB`}
                  </td>

                  {/* Chunk count + top chunk */}
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, color: "var(--text-secondary)" }}>
                      {r.chunks.length} chunks
                    </span>
                  </td>

                  {/* Date */}
                  <td style={{ padding: "14px 16px", textAlign: "right", fontFamily: "var(--font-jetbrains)", fontSize: 11, color: "var(--text-muted)" }}>
                    {r.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
            {reports.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13, fontFamily: "var(--font-jetbrains)" }}>
                  no bundle reports yet — POST to /api/bundle-report from CI
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Chunk legend for latest */}
      {reports[0] && reports[0].chunks.length > 0 && (
        <div className="mt-4 animate-fade-up animate-fade-up-3" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "16px 18px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-bricolage)", marginBottom: 12 }}>
            Latest Chunk Breakdown — {reports[0].version}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reports[0].chunks.map((c, i) => {
              const pct = (c.sizeKb / reports[0]!.totalSizeKb) * 100
              const color = CHUNK_COLORS[i % CHUNK_COLORS.length]!
              return (
                <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--text-primary)", width: 120, flexShrink: 0 }}>
                    {c.name}
                  </span>
                  <div style={{ flex: 1, background: "var(--border)", borderRadius: 4, height: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color, opacity: 0.7, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--text-secondary)", width: 60, textAlign: "right", flexShrink: 0 }}>
                    {c.sizeKb}KB
                  </span>
                  <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, color: "var(--text-muted)", width: 40, textAlign: "right", flexShrink: 0 }}>
                    {pct.toFixed(1)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
