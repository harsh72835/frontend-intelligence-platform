import { getVitalTrend, getErrorTrend } from "@/server/analytics/trends"
import { TrendChart } from "@/components/TrendChart"

// See (dashboard)/page.tsx for why this is required.
export const dynamic = "force-dynamic"

const APP_ID = process.env.FIP_APP_ID ?? "sample-app"

const DAYS = 30

type ChartConfig = {
  metric: string
  unit: string
  color: string
  threshold?: number
  description: string
}

const CHARTS: ChartConfig[] = [
  {
    metric: "LCP",
    unit: "ms",
    color: "#0df2c8",
    threshold: 2500,
    description: "P75 Largest Contentful Paint — good ≤ 2500ms",
  },
  {
    metric: "INP",
    unit: "ms",
    color: "#38bdf8",
    threshold: 200,
    description: "P75 Interaction to Next Paint — good ≤ 200ms",
  },
  {
    metric: "CLS",
    unit: "×10⁻³",
    color: "#a78bfa",
    threshold: 100,
    description: "P75 Cumulative Layout Shift (×10⁻³) — good ≤ 0.1",
  },
  {
    metric: "TTFB",
    unit: "ms",
    color: "#fb923c",
    threshold: 800,
    description: "P75 Time to First Byte — good ≤ 800ms",
  },
]

export default async function TrendsPage() {
  const [lcpTrend, inpTrend, clsTrend, ttfbTrend, errorTrend] = await Promise.all([
    getVitalTrend(APP_ID, "LCP", DAYS),
    getVitalTrend(APP_ID, "INP", DAYS),
    getVitalTrend(APP_ID, "CLS", DAYS),
    getVitalTrend(APP_ID, "TTFB", DAYS),
    getErrorTrend(APP_ID, DAYS),
  ])

  const trends = [lcpTrend, inpTrend, clsTrend, ttfbTrend]

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
          Observability
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
          Trends
        </h1>
      </div>

      {/* Time range label */}
      <div className="mb-6 animate-fade-up animate-fade-up-1">
        <span
          style={{
            fontSize: 11,
            fontFamily: "var(--font-jetbrains)",
            color: "var(--text-secondary)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "3px 10px",
            letterSpacing: "0.04em",
          }}
        >
          LAST {DAYS} DAYS · P75
        </span>
      </div>

      {/* Vitals grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {trends.map((trend, i) => {
          const cfg = CHARTS[i]!
          return (
            <section
              key={trend.metric}
              className={`animate-fade-up animate-fade-up-${i + 2}`}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "18px 20px 14px",
              }}
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: cfg.color,
                      fontFamily: "var(--font-jetbrains)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {trend.metric}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-jetbrains)",
                      marginLeft: 6,
                    }}
                  >
                    {trend.unit}
                  </span>
                </div>
                {cfg.threshold && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-jetbrains)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span style={{ color: cfg.color, opacity: 0.5 }}>— —</span> budget {cfg.threshold}{trend.unit}
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-bricolage)",
                  marginBottom: 12,
                  letterSpacing: "0.01em",
                }}
              >
                {cfg.description}
              </p>
              <TrendChart
                points={trend.points}
                metric={trend.metric}
                unit={trend.unit}
                color={cfg.color}
                threshold={cfg.threshold}
                height={130}
              />
            </section>
          )
        })}
      </div>

      {/* Error trend */}
      <section
        className="animate-fade-up animate-fade-up-6"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "18px 20px 14px",
        }}
      >
        <div className="flex items-start justify-between mb-1">
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--poor)",
              fontFamily: "var(--font-jetbrains)",
            }}
          >
            JS Errors
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              fontFamily: "var(--font-jetbrains)",
            }}
          >
            daily count
          </span>
        </div>
        <p
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            fontFamily: "var(--font-bricolage)",
            marginBottom: 12,
          }}
        >
          Total JS errors and unhandled rejections per day
        </p>
        <TrendChart
          points={errorTrend.points}
          metric="JS Errors"
          unit="errors"
          color="var(--poor)"
          height={110}
        />
      </section>
    </div>
  )
}
