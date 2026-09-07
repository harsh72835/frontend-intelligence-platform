# Productionization Gaps

What's still missing to take FIP from a single-org V1 demo to something a real team could sign up for and operate independently. Grounded in a direct code audit (not guesses) — see file/line references below.

---

## 0. Done so far

- ✅ `pnpm app:create --name "..." --slug "..."` (`scripts/create-app.ts`) — registers a new `App` row + ingest key from the CLI instead of hand-editing Prisma. Blocks duplicate slugs. Still no admin UI (see #1), but no longer requires touching Prisma directly.
- ✅ SDK now builds to real `dist/` output — `packages/sdk` has a `tsup.config.ts`, `pnpm --filter @fip/sdk build` emits ESM + CJS + `.d.ts`. Along the way, found and fixed a real bug: `@fip/shared`'s barrel file re-exports its zod schemas, so bundling it for two constants was pulling zod into the browser SDK (132KB). Fixed by inlining `DEFAULT_BATCH_SIZE`/`DEFAULT_FLUSH_INTERVAL_MS` directly in `packages/sdk/src/core/queue.ts` instead — SDK is now purely type-only against `@fip/shared`, bundle dropped to **10.7KB**. `web-vitals` stays external (real published dep, not duplicated). Still not published to npm — package.json is publish-ready (`main`/`module`/`types`/`exports`/`files` all point at `dist`), just needs a registry + version bump flow.

## 1. Accounts & multi-tenancy — the biggest gap

- **No `User`/`Organization`/`Membership` model in the DB at all.** `prisma/schema.prisma` only has `App`, `Release`, `Event`, etc. Auth is one hardcoded `AUTH_USER`/`AUTH_PASSWORD` pair in env, checked by a NextAuth credentials provider (`apps/dashboard/src/auth.ts`). No signup, no per-user login, no password reset.
- **Good news**: the `App` model is already multi-tenant-shaped (many apps, each with its own unique `ingestKey`) — the data layer supports multiple apps/teams already. The gap is entirely in the auth/UI layer, not the schema.
- **Needed**:
  - `User` / `Organization` / `Membership` tables
  - Real signup + login (or OAuth), each org scoped to its own `App` rows
  - Session middleware enforcing tenant scope on every dashboard query and API route — currently every page does `const APP_ID = process.env.FIP_APP_ID ?? "sample-app"` (no per-request tenant resolution at all)
  - Dashboard app-switcher UI to pick which `App` you're viewing, since multiple would exist per org

## 2. Ingest path — already in decent shape

- `apps/dashboard/src/app/api/ingest/route.ts` already has `validateIngestKey` (per-app key check) and `checkRateLimit` (1000/window) — real, not stubbed.
- Still pending: key rotation/revocation UI, per-plan rate-limit tiers (currently one flat limit for everyone), abuse/anomaly detection, payload size caps.

## 3. Alerting — half real, half stub

- Real, functional: `log`, `slack`, `webhook` providers (`apps/dashboard/src/server/alerts/providers/`) — slack/webhook make real HTTP calls.
- Stub, throws on use:
  - `providers/email.ts` → `"Email provider not implemented. Install resend and set FIP_EMAIL_TO and FIP_EMAIL_FROM."`
  - `providers/sns.ts` → `"SNS provider not implemented. Install @aws-sdk/client-sns and set FIP_SNS_TOPIC_ARN."`
- No per-org alert config UI — thresholds (`FIP_ALERT_ERROR_THRESHOLD`, `FIP_ALERT_LCP_THRESHOLD_MS`) are global env vars, not per-app/per-org settings a customer could tune themselves.

## 4. SDK distribution — not installable by an outside team yet

- `packages/sdk/package.json` points `main`/`types` straight at `./src/index.ts` — no build step, no `dist/`, ships raw TypeScript.
- Not published to npm; package name `@fip/sdk` is generic/unscoped — would need a real npm org scope to publish safely.
- Needed: a bundler step (tsup/tsc build), versioning/changelog, actual `npm publish`, public docs for `initFip()` beyond the monorepo README.

## 5. Zero automated tests

- No `.test.ts` / `.spec.ts` files anywhere in the project. No CI pipeline (no `.github/workflows`). Nothing gates a bad deploy.

## 6. Release tagging — manual, not auto-fetched

- `apps/sample-app/src/lib/fip.ts:15` — `release: process.env.NEXT_PUBLIC_FIP_RELEASE ?? "1.0.0"`. No git-SHA lookup, no package.json version read, no deploy-platform API call. Baked in at `next build` time (Next.js inlines `NEXT_PUBLIC_*`). Real deploys need CI to set this (e.g. `git rev-parse --short HEAD`, or map Vercel's `VERCEL_GIT_COMMIT_SHA`).

## 7. Deployment/infra — nothing set up

- No `vercel.json`, no Dockerfile for the dashboard, no git repo yet for this project.
- Postgres is currently a local Docker container (`fip-postgres`, remapped to host port 5434 to avoid colliding with a native Postgres 14 install already using 5432) — nowhere near a managed prod DB (Neon/Supabase/RDS).
- No env-var validation at boot — a missing `DATABASE_URL` or `AUTH_SECRET` in prod fails silently/late instead of a clear startup error.
- No backup/retention policy for the `Event` table — this grows unbounded with real traffic; no data-retention job exists despite the hourly aggregation job already existing.

## 8. Billing — doesn't exist

- If this becomes a real multi-customer product: no plans, no usage metering tied to ingest volume, no Stripe integration anywhere in this codebase (that's `saas-boilerplate`'s job, not built here).

---

## Suggested build order (highest leverage first)

1. `User`/`Organization` model + real auth + per-tenant scoping on ingest & dashboard queries — unlocks everything else being "real"
2. SDK build/publish step — unlocks external teams actually installing it
3. Wire real `email` alert provider — cheap, unblocks a common ask
4. Basic test suite + CI — protects you once real users exist
5. Deploy to git + Vercel + managed Postgres
6. Billing — only once you have actual users to charge

---

## Related

- Other places where behavior looks wired up but isn't (dashboard hardcoded single-app via `FIP_APP_ID`, etc.) — see project memory `fip-not-what-it-seems`.
