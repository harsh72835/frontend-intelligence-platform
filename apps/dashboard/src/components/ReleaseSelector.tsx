"use client"

import { useRouter, useSearchParams } from "next/navigation"

type Release = { id: string; version: string; environment: string }

type Props = {
  releases: Release[]
  baselineId: string
  currentId: string
}

const selectStyle: React.CSSProperties = {
  background: "var(--surface-raised)",
  border: "1px solid var(--border-bright)",
  borderRadius: 5,
  color: "var(--text-primary)",
  fontFamily: "var(--font-jetbrains)",
  fontSize: 12,
  padding: "5px 10px",
  cursor: "pointer",
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
  paddingRight: 28,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%235a7a9e'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
}

export function ReleaseSelector({ releases, baselineId, currentId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function update(key: "baseline" | "current", value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.push(`/routes?${params.toString()}`)
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-secondary)",
          fontFamily: "var(--font-bricolage)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Compare
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-jetbrains)" }}>
          baseline
        </span>
        <select
          value={baselineId}
          onChange={(e) => update("baseline", e.target.value)}
          style={selectStyle}
        >
          {releases.map((r) => (
            <option key={r.id} value={r.id}>
              {r.version} ({r.environment})
            </option>
          ))}
        </select>
      </div>

      <span style={{ color: "var(--text-muted)", fontSize: 12 }}>→</span>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-jetbrains)" }}>
          current
        </span>
        <select
          value={currentId}
          onChange={(e) => update("current", e.target.value)}
          style={selectStyle}
        >
          {releases.map((r) => (
            <option key={r.id} value={r.id}>
              {r.version} ({r.environment})
            </option>
          ))}
        </select>
      </div>

      <span
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          fontFamily: "var(--font-jetbrains)",
          marginLeft: "auto",
        }}
      >
        changes reflect below
      </span>
    </div>
  )
}
