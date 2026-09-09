import NextAuth, { type NextAuthResult } from "next-auth"
import Credentials from "next-auth/providers/credentials"

const result: NextAuthResult = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { username, password } = credentials as { username: string; password: string }

        if (
          username === process.env.AUTH_USER &&
          password === process.env.AUTH_PASSWORD
        ) {
          return { id: "1", name: username }
        }

        return null
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
})

export const handlers = result.handlers

// auth/signIn/signOut are typed `any` here on purpose. This is a known
// upstream limitation of next-auth@5-beta under pnpm: their inferred types
// live at paths inside pnpm's nested node_modules store that TS can't name
// as portable type references (TS4023), regardless of `noEmit`/
// `skipLibCheck` — it fails `next build`'s type-check step even though it
// never blocks plain `tsc --noEmit`. No next-auth version as of
// 5.0.0-beta.31 avoids it; the only real fix is to loosen the type at this
// boundary. In practice this costs nothing: the only actual caller of
// `auth` (apps/dashboard/src/middleware.ts) only uses the
// `auth((req) => ...)` middleware-wrapping overload, and neither `signIn`
// nor `signOut` is imported from this file anywhere — the login page uses
// the client-side `signIn` from "next-auth/react" instead. Kept exported
// for API completeness in case a server-side caller is added later.
/* eslint-disable @typescript-eslint/no-explicit-any */
export const auth = result.auth as any
export const signIn = result.signIn as any
export const signOut = result.signOut as any
/* eslint-enable @typescript-eslint/no-explicit-any */
