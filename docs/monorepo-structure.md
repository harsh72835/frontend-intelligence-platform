# Monorepo Structure

## Purpose

This document defines the recommended repository layout for Frontend Intelligence Platform (FIP).

The structure should support:

- clear separation of concerns
- shared contracts across SDK and server
- independent package evolution
- simple local development in V1
- scalable extension in later versions

## Recommended Layout

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

## Top-Level Directories

### `apps/`

Contains executable applications.

#### `apps/dashboard`

Primary Next.js app.

Responsibilities:

- dashboard UI
- ingestion API routes
- analytics API routes
- admin and management views

Why it exists:

- keeps the product surface in one deployable app for V1
- reduces operational complexity early

#### `apps/sample-app`

Small demo frontend app instrumented with the SDK.

Responsibilities:

- validate SDK integration
- generate telemetry for local testing
- serve as a demo and portfolio artifact

Why it exists:

- makes the telemetry pipeline testable end to end
- helps with screenshots and demos

### `packages/`

Contains reusable internal packages.

#### `packages/sdk`

Browser instrumentation package.

Responsibilities:

- SDK initialization
- event collection
- queueing and batching
- transport logic

Should export:

- public `initFip` API
- type-safe SDK config

#### `packages/shared`

Shared types and validation.

Responsibilities:

- shared event types
- Zod schemas
- constants and enums
- shared request/response contracts

Why it is important:

- prevents contract drift between browser and server
- keeps validation centralized

#### `packages/budget-checker`

CLI package for CI performance enforcement.

Responsibilities:

- parse reports
- read budget config
- compare current values to thresholds
- exit non-zero on failure

Should export:

- CLI entry point
- core comparison utilities

#### `packages/config`

Shared config package for tooling.

Responsibilities:

- shared TypeScript configs if desired
- ESLint config
- Prettier config
- reusable package-level settings

This package is optional, but useful if the repo grows.

### `prisma/`

Contains database schema and migration assets.

Responsibilities:

- Prisma schema
- migrations
- seed utilities or references

Why top-level:

- easier to discover
- keeps the database model visible as a first-class part of the platform

### `docs/`

Contains project planning and system design docs.

Responsibilities:

- architecture
- scope
- roadmap
- schema references
- production readiness notes

### `scripts/`

Contains helper scripts for development and demos.

Possible uses:

- seed demo data
- run local report generation
- import sample telemetry
- maintenance scripts

## Package Boundaries

### `apps/dashboard`

Can depend on:

- `packages/shared`
- `packages/sdk` only if needed for demo/testing cases
- `packages/config`

Should not become the place where shared contracts are defined.

### `packages/sdk`

Can depend on:

- `packages/shared`

Should not depend on dashboard code.

### `packages/budget-checker`

Can depend on:

- `packages/shared` if shared config or result contracts are introduced

Should remain independent from the dashboard runtime.

### `packages/shared`

Should be lightweight and stable.

It should not depend on app-specific code.

## V1 Folder Expansion Suggestion

### `apps/dashboard`

Suggested structure:

```txt
apps/dashboard/
  src/
    app/
    components/
    lib/
    server/
  public/
  package.json
```

Suggested responsibilities:

- `src/app`: Next.js routes and pages
- `src/components`: UI pieces
- `src/lib`: utility functions and shared app helpers
- `src/server`: database access, analytics queries, ingestion handlers

### `packages/sdk`

Suggested structure:

```txt
packages/sdk/
  src/
    core/
    collectors/
    transport/
    types/
  package.json
```

Suggested responsibilities:

- `core`: init flow, queue, session, lifecycle
- `collectors`: vitals, routes, API timings, errors, long tasks
- `transport`: sendBeacon/fetch logic
- `types`: local SDK-specific types if needed

### `packages/shared`

Suggested structure:

```txt
packages/shared/
  src/
    events/
    schemas/
    constants/
    api/
  package.json
```

Suggested responsibilities:

- `events`: shared TypeScript event definitions
- `schemas`: Zod validators
- `constants`: enums and static config values
- `api`: request/response contracts

### `packages/budget-checker`

Suggested structure:

```txt
packages/budget-checker/
  src/
    cli/
    parsers/
    rules/
    reporters/
  package.json
```

Suggested responsibilities:

- `cli`: command entry
- `parsers`: Lighthouse and bundle report parsing
- `rules`: threshold comparison logic
- `reporters`: console output formatting

## Why This Structure Fits The Product

This structure maps well to the real system boundaries:

- SDK is its own product surface
- shared contracts matter across runtime boundaries
- dashboard is both UI and server entry point in V1
- budget checking is a separate developer tooling concern

That makes the repo easier to explain in interviews and easier to scale over time.

## Version Evolution Notes

### V1

- dashboard hosts ingestion and analytics routes
- Postgres and Prisma stay simple
- sample app is optional but strongly recommended

### V2

- add stronger demo/support scripts
- possibly add source map processing helpers

### V3

- add auth-related modules in dashboard
- add job or worker layer if aggregation complexity grows

### V4+

- potential separate ingestion service
- potential worker app for async processing
- potential multi-tenant admin services

## Recommended Rule

If logic is shared across package or runtime boundaries, place it in `packages/`.

If logic is specific to a runnable product surface, keep it inside `apps/`.
