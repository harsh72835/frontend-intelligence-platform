type Status = "good" | "warning" | "poor" | "neutral"

type Props = {
  label: string
  value: string | number | null
  unit?: string
  status?: Status
  index?: number
}

const statusVars: Record<Status, { color: string; dim: string; border: string }> = {
  good: { color: "var(--good)", dim: "var(--good-dim)", border: "var(--good-border)" },
  warning: { color: "var(--warn)", dim: "var(--warn-dim)", border: "var(--warn-border)" },
  poor: { color: "var(--poor)", dim: "var(--poor-dim)", border: "var(--poor-border)" },
  neutral: { color: "var(--text-primary)", dim: "var(--neutral-dim)", border: "var(--neutral-border)" },
}

export function MetricCard({ label, value, unit, status = "neutral", index = 0 }: Props) {
  const s = statusVars[status]
  const delayClass = `animate-fade-up-${Math.min(index + 1, 7)}`

  return (
    <div
      className={`animate-fade-up ${delayClass}`}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${s.border}`,
        borderRadius: 8,
        padding: "16px 18px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* subtle bg tint from status */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: s.dim,
          pointerEvents: "none",
        }}
      />

      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: 10,
          letterSpacing: "0.08em",
          fontWeight: 600,
          textTransform: "uppercase",
          marginBottom: 10,
          fontFamily: "var(--font-bricolage)",
          position: "relative",
        }}
      >
        {label}
      </p>

      <div className="flex items-baseline gap-1.5" style={{ position: "relative" }}>
        <span
          style={{
            color: value === null ? "var(--text-muted)" : s.color,
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1,
            fontFamily: "var(--font-jetbrains)",
            letterSpacing: "-0.03em",
          }}
        >
          {value === null ? "—" : value}
        </span>
        {value !== null && unit && (
          <span
            style={{
              color: "var(--text-secondary)",
              fontSize: 12,
              fontFamily: "var(--font-jetbrains)",
            }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}
