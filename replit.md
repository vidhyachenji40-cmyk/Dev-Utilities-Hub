# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Active Project: Job Hunt Toolkit

A personal job-search companion web app with three workspaces: Job Tracker, Resume Match, and Interview Prep. Currently the **shell** is complete — landing page, branded sign-in/sign-up, authenticated portal nav, and placeholder pages for the three workspaces. Real workspace functionality is not yet built.

### Artifacts
- `artifacts/job-hunt` — React + Vite web app (preview path `/`)
- `artifacts/api-server` — Express 5 API server (preview path `/api`)
- `artifacts/mockup-sandbox` — design canvas (preview path `/__mockup`)

### Auth
Replit-managed Clerk via `@clerk/express` (server) and `@clerk/react` + `@clerk/themes` (client). The Clerk Frontend API proxy is mounted at `/api/__clerk` (production only). Auth UI is themed via custom `appearance` and tokens in `artifacts/job-hunt/src/index.css`.

### Database
Single shared Postgres database. Schema lives in `lib/db/src/schema/`. Currently one table:
- `users` — keyed by Clerk user id (`text` PK), upserted by `GET /api/me` on first authenticated call.

### API Endpoints
- `GET /api/healthz` — health check
- `GET /api/me` — returns the current authenticated user (creates the local row on first call)

### Key Files
- `lib/api-spec/openapi.yaml` — API contract; re-run `pnpm --filter @workspace/api-spec run codegen` after edits
- `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` — Clerk FAPI proxy
- `artifacts/api-server/src/middlewares/requireAuth.ts` — auth guard
- `artifacts/api-server/src/routes/me.ts` — `/me` endpoint with first-call upsert
- `artifacts/job-hunt/src/App.tsx` — ClerkProvider, routes, and HomeRedirect logic
