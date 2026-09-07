type Status = "healthy" | "warning" | "regressed"

const styles: Record<Status, { bg: string; color: string; label: string }> = {
  healthy: { bg: "var(--good-dim)", color: "var(--good)", label: "healthy" },
  warning: { bg: "var(--warn-dim)", color: "var(--warn)", label: "warning" },
  regressed: { bg: "var(--poor-dim)", color: "var(--poor)", label: "regressed" },
}

export function RegressionBadge({ status }: { status: Status }) {
  const s = styles[status]
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.color}33`,
        borderRadius: 4,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "var(--font-jetbrains)",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {status === "regressed" && (
        <span style={{ fontSize: 9 }}>▲</span>
      )}
      {status === "warning" && (
        <span style={{ fontSize: 9 }}>◆</span>
      )}
      {status === "healthy" && (
        <span style={{ fontSize: 9 }}>●</span>
      )}
      {s.label}
    </span>
  )
}
