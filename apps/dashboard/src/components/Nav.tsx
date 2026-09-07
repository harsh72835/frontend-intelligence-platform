import Link from "next/link"

const links = [
  { href: "/", label: "Overview" },
  { href: "/routes", label: "Routes" },
  { href: "/releases", label: "Releases" },
  { href: "/errors", label: "Errors" },
  { href: "/api-latency", label: "API Latency" },
  { href: "/trends", label: "Trends" },
  { href: "/bundles", label: "Bundles" },
]

export function Nav() {
  return (
    <nav
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center gap-1 h-14">
        {/* Wordmark */}
        <div className="flex items-center gap-3 mr-8">
          <div
            style={{
              width: 30,
              height: 30,
              background: "var(--accent)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                color: "#060c14",
                fontWeight: 800,
                fontSize: 10,
                letterSpacing: "0.04em",
                fontFamily: "var(--font-bricolage)",
              }}
            >
              FIP
            </span>
          </div>
          <div>
            <p
              style={{
                color: "var(--text-primary)",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                fontFamily: "var(--font-bricolage)",
              }}
            >
              Frontend Intelligence
            </p>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: 10,
                letterSpacing: "0.06em",
                fontFamily: "var(--font-jetbrains)",
                lineHeight: 1.2,
              }}
            >
              PLATFORM
            </p>
          </div>
        </div>

        {/* Nav links */}
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              color: "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 500,
              padding: "0 12px",
              height: 56,
              display: "flex",
              alignItems: "center",
              borderBottom: "2px solid transparent",
              transition: "color 0.15s, border-color 0.15s",
              textDecoration: "none",
              fontFamily: "var(--font-bricolage)",
            }}
            className="hover:text-[var(--text-primary)] hover:border-b-[var(--border-bright)]"
          >
            {l.label}
          </Link>
        ))}

        {/* Live indicator */}
        <div className="ml-auto flex items-center gap-2">
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--accent)",
              boxShadow: "0 0 8px var(--accent)",
              display: "block",
              animation: "pulse-dot 2.4s ease infinite",
            }}
          />
          <span
            style={{
              color: "var(--text-secondary)",
              fontSize: 11,
              fontFamily: "var(--font-jetbrains)",
              letterSpacing: "0.02em",
            }}
          >
            sample-app · live
          </span>
        </div>
      </div>
    </nav>
  )
}
