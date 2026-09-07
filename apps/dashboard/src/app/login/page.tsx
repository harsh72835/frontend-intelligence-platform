"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/"

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError("Invalid username or password")
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 360,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "36px 32px",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "var(--accent)",
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#060c14", fontWeight: 800, fontSize: 11, fontFamily: "var(--font-bricolage)" }}>
              FIP
            </span>
          </div>
          <div>
            <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 14, fontFamily: "var(--font-bricolage)", letterSpacing: "-0.02em" }}>
              Frontend Intelligence
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: 10, fontFamily: "var(--font-jetbrains)", letterSpacing: "0.06em" }}>
              PLATFORM
            </p>
          </div>
        </div>

        <p style={{ color: "var(--text-secondary)", fontSize: 12, fontFamily: "var(--font-bricolage)", marginBottom: 24 }}>
          Sign in to your dashboard
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-bricolage)", letterSpacing: "0.06em", marginBottom: 6, textTransform: "uppercase" }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              style={{
                width: "100%",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "9px 12px",
                fontSize: 13,
                color: "var(--text-primary)",
                fontFamily: "var(--font-jetbrains)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-bricolage)", letterSpacing: "0.06em", marginBottom: 6, textTransform: "uppercase" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: "100%",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "9px 12px",
                fontSize: 13,
                color: "var(--text-primary)",
                fontFamily: "var(--font-jetbrains)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div style={{ background: "var(--poor-dim)", border: "1px solid var(--poor-border)", borderRadius: 6, padding: "8px 12px" }}>
              <span style={{ fontSize: 12, color: "var(--poor)", fontFamily: "var(--font-jetbrains)" }}>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              background: loading ? "var(--border)" : "var(--accent)",
              color: loading ? "var(--text-muted)" : "#060c14",
              border: "none",
              borderRadius: 6,
              padding: "10px 0",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "var(--font-bricolage)",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.15s",
              letterSpacing: "0.01em",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
