import { execSync } from "node:child_process"

// Auto-fill NEXT_PUBLIC_FIP_RELEASE if nothing set it explicitly. Checks
// common CI-provided commit-SHA vars first, then falls back to local git.
// A real deploy can still override with an explicit semver tag by setting
// NEXT_PUBLIC_FIP_RELEASE itself (as this demo's .env currently does) —
// this only fills the gap for apps that never wire it up at all, which
// otherwise silently fall back to a hardcoded "1.0.0" in src/lib/fip.ts.
if (!process.env.NEXT_PUBLIC_FIP_RELEASE) {
  const ciSha =
    process.env.VERCEL_GIT_COMMIT_SHA || // Vercel
    process.env.GITHUB_SHA || // GitHub Actions
    process.env.CI_COMMIT_SHA // GitLab CI

  if (ciSha) {
    process.env.NEXT_PUBLIC_FIP_RELEASE = ciSha.slice(0, 7)
  } else {
    try {
      process.env.NEXT_PUBLIC_FIP_RELEASE = execSync("git rev-parse --short HEAD").toString().trim()
    } catch {
      process.env.NEXT_PUBLIC_FIP_RELEASE = "unknown"
    }
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@fip/sdk", "@fip/shared"],
}

export default nextConfig
