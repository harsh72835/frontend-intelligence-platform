# Productionization Gaps

What's still missing to take FIP from a single-org V1 demo to something a real team could sign up for and operate independently. Grounded in a direct code audit (not guesses) — see file/line references below.

---

## 0. Done so far

- ✅ `pnpm app:create --name "..." --slug "..."` (`scripts/create-app.ts`) — registers a new `App` row + ingest key from the CLI instead of hand-editing Prisma. Blocks duplicate slugs. Still no admin UI (see #1), but no longer requires touching Prisma directly.
- ✅ SDK now builds to real `dist/` output — `packages/sdk` has a `tsup.config.ts`, `pnpm --filter @fip/sdk build` emits ESM + CJS + `.d.ts`. Along the way, found and fixed a real bug: `@fip/shared`'s barrel file re-exports its zod schemas, so bundling it for two constants was pulling zod into the browser SDK (132KB). Fixed by inlining `DEFAULT_BATCH_SIZE`/`DEFAULT_FLUSH_INTERVAL_MS` directly in `packages/sdk/src/core/queue.ts` instead — SDK is now purely type-only against `@fip/shared`, bundle dropped to **10.7KB**. `web-vitals` stays external (real published dep, not duplicated). Still not published to npm — package.json is publish-ready (`main`/`module`/`types`/`exports`/`files` all point at `dist`), just needs a registry + version bump flow.
- ✅ Release tag now auto-fills when unset — `apps/sample-app/next.config.mjs` sets `NEXT_PUBLIC_FIP_RELEASE` from `VERCEL_GIT_COMMIT_SHA`/`GITHUB_SHA`/`CI_COMMIT_SHA`, falling back to local `git rev-parse --short HEAD`, before `next build` runs. An explicit env var (as this demo's `.env` sets) still wins. Verified by temporarily unsetting the demo's override and confirming the git SHA got inlined into the built client bundle.
- ✅ Real `email` alert provider — `apps/dashboard/src/server/alerts/providers/email.ts` now sends via the Resend HTTP API (raw `fetch`, same pattern as `slack.ts`/`webhook.ts`, no new dependency) instead of throwing. Needs `FIP_RESEND_API_KEY`, `FIP_EMAIL_TO`, `FIP_EMAIL_FROM` set to use it. `sns` is still a stub.
- ✅ **`pnpm --filter @fip/dashboard build` (i.e. `next build`) now actually succeeds** — it never did before. Found and fixed four real, previously-undiscovered bugs blocking it:
  - `zod` was imported directly in two API routes but never declared in `apps/dashboard/package.json` — silently worked before via accidental hoisting, broke once dependencies were correctly linked. Added as an explicit dependency.
  - `src/auth.ts` — next-auth@5-beta's `auth`/`signIn`/`signOut` exports can't be typed portably through pnpm's nested `node_modules` layout (TS4023, a known upstream limitation with no clean fix as of `5.0.0-beta.31`). Typed those three as `any` at this one boundary; `handlers` and the actual call sites stay fully typed. Documented in the file.
  - `src/server/jobs/aggregate.ts` — the `RouteSummary` upsert used a compound-unique key containing a nullable `releaseId`, which Prisma's generated types (correctly) don't allow `null` for, since SQL treats every `NULL` as distinct in a unique constraint. Events with no release attached couldn't aggregate at all. Fixed with a manual find-then-write path for the null case.
  - `src/server/sourcemap.ts` — was passing the raw JSON *string* of an uploaded source map straight into `source-map-js`'s `SourceMapConsumer`, which requires the *parsed* object. This would have thrown at runtime the first time source map resolution actually ran; never caught because it never compiled. Fixed with `JSON.parse`.
- ✅ **Bigger correctness bug, also found while chasing the build**: 6 of 7 dashboard pages (`/`, `/errors`, `/bundles`, `/releases`, `/trends`, `/api-latency`) had no dynamic-rendering directive, so Next.js was statically prerendering them at build time — meaning a real deploy would have frozen every dashboard page at whatever telemetry existed the moment `next build` ran, and never updated again until the next rebuild. Added `export const dynamic = "force-dynamic"` to all 6. Confirmed via build output: all now show `ƒ` (dynamic) instead of `○` (static).
- ✅ `packages/budget-checker` now builds too — same `tsup` pattern as the SDK (array config: dual ESM/CJS+dts for the importable library, single CJS+shebang for the CLI binary). `bin` now points at `dist/cli.js` instead of raw TS with a `#!/usr/bin/env tsx` shebang, which only ever worked inside this monorepo (no `tsx` on PATH for an actually-installed copy). Found and fixed a duplicate-shebang bug along the way: the source file's own `#!/usr/bin/env tsx` line got bundled in verbatim ahead of the injected `#!/usr/bin/env node` banner, corrupting the output — removed the source shebang (not needed; the `tsx src/cli/index.ts` dev path invokes it as a file argument, not by executing it directly). Verified three ways: `node dist/cli.js`, `./dist/cli.js` (direct exec), and the pre-existing `pnpm check` (tsx) path — all pass against `budget.config.example.json`.
- ✅ **`aggregate.ts` null-releaseId race, fixed and proven under real concurrent load.** The find-then-write path added earlier wasn't atomic — wrapped it in `prisma.$transaction` with `Serializable` isolation plus a retry-on-conflict loop (catches Prisma `P2034`, retries as a plain update once the winning transaction has committed). Verified with an actual concurrency test, not just reasoning about it: deleted a summary row, fired two `runAggregation` calls at the same app truly concurrently (`Promise`/background procs, not sequential awaits) — one transaction hit a real `P2034` write conflict (logged), the retry succeeded, both runs completed without error, and exactly **one** row existed afterward (no duplicate). Also verified the ordinary create-then-update path (uncontended) still works correctly across two sequential runs.
- ✅ **Ingest key rotation** — `pnpm app:rotate-key --slug <slug>` (`scripts/rotate-key.ts`) generates a new key and invalidates the old one immediately (no grace period — that would need a schema change, a separate `IngestKey` table with `active`/`expiresAt`, not done here). Verified end-to-end against a real running dashboard: created a throwaway app, confirmed its key worked (`/api/ingest` returned 422 — auth passed, only empty-body validation failed), rotated it, confirmed the old key now gets `403` and the new key gets `422` (auth passes) — same before/after check as the create-app verification. Cleaned up the test app afterward.
- ✅ **Security bug — auth middleware was failing open in production, not closed.** Found by actually running `next start` (production mode) and hitting it with `curl` rather than trusting the build log — `pnpm --filter @fip/dashboard build` passing says nothing about runtime auth behavior. `next-auth@5-beta` validates the request `Host` header once `NODE_ENV=production`, and without `AUTH_TRUST_HOST` or `AUTH_URL` set, it logged `[auth][error] UntrustedHost` on every request — but instead of blocking, the middleware served the real dashboard (HTTP 200, actual content) to a completely unauthenticated request. Anyone could have reached every protected page without logging in. Fixed by setting `AUTH_TRUST_HOST="true"` in `apps/dashboard/.env.local` (the correct choice for a self-hosted single deployment you fully control; if this ever sits behind a shared reverse proxy, set `AUTH_URL` to the canonical origin instead — more precise, doesn't disable Host validation entirely). Verified the full flow after the fix: unauthenticated request → `307` to `/login` (blocked correctly); real credentials login → session cookie issued; authenticated request → `200` with real content. **Lesson for this project going forward: a clean `next build` is not proof the app is safe to deploy — this bug compiled and typechecked fine the whole time.**

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
