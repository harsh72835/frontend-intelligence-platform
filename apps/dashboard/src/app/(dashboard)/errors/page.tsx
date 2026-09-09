import { getErrorMetrics } from "@/server/analytics/errors"
import type { ResolvedFrame } from "@/server/sourcemap"

// See (dashboard)/page.tsx for why this is required.
export const dynamic = "force-dynamic"

const APP_ID = process.env.FIP_APP_ID ?? "sample-app"

const kindColors: Record<string, { bg: string; color: string }> = {
  error: { bg: "var(--poor-dim)", color: "var(--poor)" },
  unhandledrejection: { bg: "var(--warn-dim)", color: "var(--warn)" },
}

function KindBadge({ kind }: { kind: string }) {
  const style = kindColors[kind] ?? { bg: "var(--neutral-dim)", color: "var(--text-secondary)" }
  return (
    <span
      style={{
        display: "inline-block",
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.color}33`,
        borderRadius: 4,
        padding: "2px 7px",
        fontSize: 10,
        fontWeight: 600,
        fontFamily: "var(--font-jetbrains)",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {kind === "unhandledrejection" ? "rejection" : kind}
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

function StackFrames({ frames, stack }: { frames: ResolvedFrame[]; stack: string | null }) {
  const hasResolved = frames.some((f) => f.resolved)

  if (hasResolved) {
    return (
      <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span
            style={{
              fontSize: 9,
              fontFamily: "var(--font-jetbrains)",
              color: "var(--accent)",
              background: "var(--accent-dim)",
              border: "1px solid var(--accent-glow)",
              borderRadius: 3,
              padding: "1px 5px",
              letterSpacing: "0.06em",
              fontWeight: 600,
            }}
          >
            SOURCE MAPPED
          </span>
        </div>
        {frames.slice(0, 4).map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            {f.resolved ? (
              <>
                <span style={{ fontSize: 10, fontFamily: "var(--font-jetbrains)", color: "var(--accent)", opacity: 0.8, minWidth: 8 }}>›</span>
                <span style={{ fontSize: 10, fontFamily: "var(--font-jetbrains)", color: "var(--text-secondary)" }}>
                  {f.name && <span style={{ color: "var(--text-primary)" }}>{f.name}</span>}
                  {f.name && " "}
                  <span style={{ color: "var(--text-muted)" }}>
                    {f.source?.split("/").slice(-2).join("/")}:{f.line}:{f.column}
                  </span>
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 10, fontFamily: "var(--font-jetbrains)", color: "var(--text-muted)", minWidth: 8 }}>·</span>
                <span style={{ fontSize: 10, fontFamily: "var(--font-jetbrains)", color: "var(--text-muted)", opacity: 0.6 }} title={f.raw}>
                  {f.raw.length > 60 ? f.raw.slice(0, 60) + "…" : f.raw}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Fall back to raw stack preview
  if (!stack) return null
  const firstFrame = stack.split("\n").find((l) => l.trim().startsWith("at "))?.trim()
  if (!firstFrame) return null

  return (
    <span
      style={{
        display: "block",
        fontFamily: "var(--font-jetbrains)",
        fontSize: 10,
        color: "var(--text-muted)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        marginTop: 3,
      }}
      title={firstFrame}
    >
      {firstFrame}
    </span>
  )
}

export default async function ErrorsPage() {
  const errors = await getErrorMetrics(APP_ID)
  const totalErrors = errors.reduce((sum, e) => sum + e.count, 0)
  const mappedCount = errors.filter((e) => e.resolvedFrames.some((f) => f.resolved)).length

  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-up" style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-bricolage)", marginBottom: 4 }}>
            Diagnostics
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-primary)", fontFamily: "var(--font-bricolage)" }}>
            Errors
          </h1>
        </div>
        {totalErrors > 0 && (
          <div style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--poor-dim)", border: "1px solid var(--poor-border)", borderRadius: 6, padding: "4px 10px" }}>
              <span style={{ color: "var(--poor)", fontSize: 11, fontFamily: "var(--font-jetbrains)", fontWeight: 500 }}>
                {totalErrors} total · {errors.length} groups
              </span>
            </div>
            {mappedCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--accent-dim)", border: "1px solid var(--accent-glow)", borderRadius: 6, padding: "4px 10px" }}>
                <span style={{ color: "var(--accent)", fontSize: 11, fontFamily: "var(--font-jetbrains)", fontWeight: 500 }}>
                  {mappedCount} source mapped
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="animate-fade-up animate-fade-up-2" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-bricolage)" }}>
            Error Groups
          </span>
          <span style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-jetbrains)", letterSpacing: "0.06em" }}>
            FINGERPRINTED · LAST 7 DAYS
          </span>
        </div>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Fingerprint</Th>
              <Th>Message</Th>
              <Th>Kind</Th>
              <Th>Route</Th>
              <Th right>Count</Th>
              <Th right>Last Seen</Th>
            </tr>
          </thead>
          <tbody>
            {errors.map((e, i) => (
              <tr
                key={e.fingerprint}
                className="hover:bg-[var(--surface-raised)]"
                style={{ transition: "background 0.12s", borderBottom: i < errors.length - 1 ? "1px solid var(--border)" : "none" }}
              >
                {/* Fingerprint */}
                <td style={{ padding: "14px 16px", whiteSpace: "nowrap", verticalAlign: "top" }}>
                  <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, color: "var(--text-muted)", background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 3, padding: "1px 6px", letterSpacing: "0.06em" }}>
                    {e.fingerprint}
                  </span>
                </td>

                {/* Message + resolved frames */}
                <td style={{ padding: "14px 16px", maxWidth: 0, width: "45%", verticalAlign: "top" }}>
                  <span
                    style={{ display: "block", fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--poor)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={e.message}
                  >
                    {e.message}
                  </span>
                  <StackFrames frames={e.resolvedFrames} stack={e.stack} />
                </td>

                <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                  <KindBadge kind={e.kind} />
                </td>

                <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                  <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, color: "var(--text-secondary)" }}>
                    {e.route}
                  </span>
                  {e.release && (
                    <span style={{ display: "block", fontFamily: "var(--font-jetbrains)", fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                      v{e.release}
                    </span>
                  )}
                </td>

                <td style={{ padding: "14px 16px", textAlign: "right", verticalAlign: "top" }}>
                  <span style={{ display: "inline-block", background: "var(--poor-dim)", color: "var(--poor)", border: "1px solid var(--poor-border)", borderRadius: 4, padding: "2px 8px", fontSize: 12, fontFamily: "var(--font-jetbrains)", fontWeight: 600 }}>
                    {e.count}
                  </span>
                </td>

                <td style={{ padding: "14px 16px", textAlign: "right", fontFamily: "var(--font-jetbrains)", fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", verticalAlign: "top" }}>
                  {e.lastSeen.toLocaleString()}
                </td>
              </tr>
            ))}
            {errors.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "48px 24px", textAlign: "center", fontFamily: "var(--font-jetbrains)", fontSize: 13 }}>
                  <span style={{ color: "var(--good)", marginRight: 8 }}>●</span>
                  <span style={{ color: "var(--text-muted)" }}>no errors recorded</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
