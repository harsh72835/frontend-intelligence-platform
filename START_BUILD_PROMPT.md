# Start Build Prompt

Use this prompt when starting a new agent/session to build Frontend Intelligence Platform from the existing planning docs.

---

You are helping me build `Frontend Intelligence Platform (FIP)` inside this folder:

`/Users/harsh/Documents/Projects/resume-projects/frontend-intelligence-platform`

This is a frontend observability and performance governance platform. It should evolve from a strong V1 MVP into a production-oriented internal platform.

Before writing code, read these docs in order:

1. `README.md`
2. `docs/v1-scope.md`
3. `docs/architecture.md`
4. `docs/monorepo-structure.md`
5. `docs/event-schema.md`
6. `docs/zod-schema-draft.md`
7. `docs/prisma-schema-draft.md`
8. `docs/ingestion-flow.md`
9. `docs/sample-app-plan.md`
10. `docs/product-roadmap.md`
11. `docs/production-readiness-checklist.md`
12. `docs/implementation-plan.md`

## Project Goal

Build a frontend intelligence platform that provides:

- browser SDK telemetry capture
- real user performance monitoring
- JS error and long-task capture
- API latency tracking
- ingestion API
- Postgres persistence
- route and release analytics
- dashboard views
- regression detection
- CI performance budget checker

The main portfolio story is:

`I can build systems that measure, monitor, analyze, and enforce frontend performance quality at scale.`

## Important Build Rules

- Start with V1 only.
- Do not overbuild V2/V3 features yet.
- Keep the architecture simple and credible.
- Use the smallest correct implementation.
- Prefer clear typed contracts over clever abstractions.
- Do not add queues, auth, RBAC, alerts, or multi-tenancy in V1 unless explicitly asked.
- Keep all shared event schemas in `packages/shared`.
- Keep SDK browser logic in `packages/sdk`.
- Keep dashboard UI and V1 API routes in `apps/dashboard`.
- Keep budget checking in `packages/budget-checker`.
- Add a small `apps/sample-app` if needed to validate telemetry end to end.

## Recommended Tech Stack

- TypeScript
- pnpm workspace
- Next.js for dashboard
- Postgres
- Prisma
- Zod
- Tailwind CSS
- Recharts or a similar charting library
- Vitest where useful

## Target Monorepo Structure

```txt
frontend-intelligence-platform/
  apps/
    dashboard/
    sample-app/
  packages/
    sdk/
    shared/
    budget-checker/
    config/
  prisma/
  docs/
  scripts/
  .env.example
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
```

## V1 Build Order

Build in this order:

1. scaffold monorepo and package structure
2. add base TypeScript/workspace config
3. create `packages/shared` event types and Zod schemas
4. create Prisma schema from `docs/prisma-schema-draft.md`
5. create `packages/sdk` skeleton with `initFip(config)`
6. add SDK queue, session ID, batching, and transport
7. add SDK collectors for vitals, route changes, API timings, JS errors, and long tasks
8. create dashboard app with ingestion endpoint `POST /api/ingest`
9. validate ingestion payloads using shared Zod schemas
10. persist raw events to Postgres
11. add overview analytics queries
12. build dashboard overview page
13. add routes, releases, and errors pages
14. add regression detection logic
15. create `packages/budget-checker` CLI
16. add sample app telemetry flow if not already done
17. polish docs, seed/demo data, and README setup instructions

## V1 Acceptance Criteria

The V1 build is complete when:

1. a sample app can initialize the SDK
2. SDK emits web vitals, route changes, API timings, JS errors, and long-task events
3. `POST /api/ingest` validates and stores events
4. Postgres contains raw telemetry
5. dashboard shows useful route and release metrics
6. regressions are visibly flagged
7. budget checker can fail with a non-zero exit code when budgets are violated
8. local setup instructions are documented

## First Task To Do

Start by scaffolding the repository structure only.

Do not immediately build all features.

First deliverable should be:

- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `apps/dashboard/`
- `apps/sample-app/`
- `packages/shared/`
- `packages/sdk/`
- `packages/budget-checker/`
- `packages/config/`
- `prisma/`
- `scripts/`
- `.env.example`

Then implement `packages/shared` schemas before building SDK or API logic.

## Do Not Do Yet

Do not add these in the first implementation pass:

- auth
- RBAC
- Slack alerts
- queue workers
- Kafka or streaming infra
- anomaly detection
- session replay
- billing
- multi-tenant org model
- advanced source map processing

These belong to later roadmap versions.

## Production Readiness Note

V1 is not production-ready. V3 is the first version that should be described as production-ready for internal use.

For now, build a strong V1 MVP that is clean, typed, demoable, and easy to extend.

## Agent Behavior Expected

- Read the docs first.
- Make a short implementation plan.
- Implement in small phases.
- Verify each phase before moving on.
- Preserve existing docs unless explicitly asked to change them.
- Keep changes minimal and aligned with the docs.
- If a design choice conflicts with the docs, ask before changing direction.

Start with the monorepo scaffold and shared contract package.
