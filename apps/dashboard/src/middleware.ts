import { auth } from "@/auth"
import { NextResponse } from "next/server"

// Public routes — no auth required
const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/api/ingest",
  "/api/bundle-report",
  "/api/source-maps",
  "/api/alerts",
  "/api/jobs",
]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (!isPublic && !req.auth) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
