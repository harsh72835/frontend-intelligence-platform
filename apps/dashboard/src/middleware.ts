import { auth } from "@/auth"
import { NextResponse, type NextRequest } from "next/server"
import type { Session } from "next-auth"

// `auth` is typed `any` in "@/auth" (see the comment there for why), which
// drops parameter inference here — annotated explicitly instead.
type AuthedRequest = NextRequest & { auth: Session | null }

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

export default auth((req: AuthedRequest) => {
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
