"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import type { TrendPoint } from "@/server/analytics/trends"

type Props = {
  points: TrendPoint[]
  metric: string
  unit: string
  color?: string
  threshold?: number
  height?: number
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function CustomTooltip({ active, payload, label, unit }: {
  active?: boolean
  payload?: { value: number | null }[]
  label?: string
  unit: string
}) {
  if (!active || !payload?.length || payload[0]?.value == null) return null
  return (
    <div
      style={{
        background: "#0f1c30",
        border: "1px solid #1e3050",
        borderRadius: 6,
        padding: "8px 12px",
        fontFamily: "var(--font-jetbrains)",
        fontSize: 12,
      }}
    >
      <p style={{ color: "#5a7a9e", marginBottom: 4, fontSize: 10 }}>
        {label ? formatDate(label) : ""}
      </p>
      <p style={{ color: "#d8e8f8", fontWeight: 500 }}>
        {payload[0].value}
        <span style={{ color: "#5a7a9e", marginLeft: 4 }}>{unit}</span>
      </p>
    </div>
  )
}

export function TrendChart({
  points,
  metric,
  unit,
  color = "#0df2c8",
  threshold,
  height = 120,
}: Props) {
  // Only show every ~5th label to avoid crowding
  const tickInterval = Math.max(1, Math.floor(points.length / 6))

  const hasData = points.some((p) => p.value !== null)

  if (!hasData) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-jetbrains)" }}>
          no data for this period
        </span>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          interval={tickInterval}
          tick={{ fontSize: 10, fill: "#3d5470", fontFamily: "var(--font-jetbrains)" }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis
          tick={{ fontSize: 10, fill: "#3d5470", fontFamily: "var(--font-jetbrains)" }}
          axisLine={false}
          tickLine={false}
          width={40}
          tickFormatter={(v: number) => `${v}`}
        />

        <Tooltip content={<CustomTooltip unit={unit} />} />

        {threshold && (
          <ReferenceLine
            y={threshold}
            stroke={color}
            strokeDasharray="4 4"
            strokeOpacity={0.4}
          />
        )}

        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#grad-${metric})`}
          dot={false}
          activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
