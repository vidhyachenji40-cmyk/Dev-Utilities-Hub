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

A personal job-search companion web app with three workspaces: Job Tracker, Resume Match, and Interview Prep. Job Tracker and Interview Prep are fully built. Resume Match is still a placeholder.

### Artifacts
- `artifacts/job-hunt` — React + Vite web app (preview path `/`)
- `artifacts/api-server` — Express 5 API server (preview path `/api`)
- `artifacts/mockup-sandbox` — design canvas (preview path `/__mockup`)

### Auth
Replit-managed Clerk via `@clerk/express` (server) and `@clerk/react` + `@clerk/themes` (client). The Clerk Frontend API proxy is mounted at `/api/__clerk` (production only). Auth UI is themed via custom `appearance` and tokens in `artifacts/job-hunt/src/index.css`.

### Database
Single shared Postgres database. Schema lives in `lib/db/src/schema/`. Tables:
- `users` — keyed by Clerk user id (`text` PK), upserted by `GET /api/me` on first authenticated call.
- `job_applications` — user-scoped (FK to `users.id`, cascade delete). Stages: Saved, Applied, Interviewing, Offer, Rejected.
- `application_notes` — user-scoped, FK to `job_applications.id` (cascade delete). Free-form note bodies with timestamps.
- `interview_sessions` — user-scoped, optional FK to `job_applications.id` (set null on delete). Stores role/level/focus/company/notes plus generated `questions` JSONB array.
- `interview_answers` — user-scoped, FK to `interview_sessions.id` (cascade delete). One row per (session, questionId) with answer text and AI `feedback` JSONB.

### API Endpoints
- `GET /api/healthz` — health check
- `GET /api/me` — returns the current authenticated user (creates the local row on first call)
- `GET /api/applications` — list current user's applications (most recently updated first)
- `POST /api/applications` — create an application
- `GET /api/applications/{id}` — fetch one application with its notes
- `PATCH /api/applications/{id}` — partial update (including stage transitions)
- `DELETE /api/applications/{id}` — delete an application (cascades to notes)
- `POST /api/applications/{id}/notes` — add a note (touches parent `updatedAt`)
- `DELETE /api/applications/{id}/notes/{noteId}` — delete a note
- `GET /api/pipeline-summary` — counts per stage + 5 most recent activity entries
- `GET /api/interview/sessions` — list current user's interview prep sessions
- `POST /api/interview/sessions` — create a session and AI-generate the question set
- `GET /api/interview/sessions/{id}` — fetch one session with questions and saved answers
- `DELETE /api/interview/sessions/{id}` — delete a session (cascades to answers)
- `POST /api/interview/sessions/{id}/answers` — submit/update an answer to a question and get AI feedback (clarity, structure, specificity, strengths, improvements)

### Key Files
- `lib/api-spec/openapi.yaml` — API contract; re-run `pnpm --filter @workspace/api-spec run codegen` after edits
- `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` — Clerk FAPI proxy
- `artifacts/api-server/src/middlewares/requireAuth.ts` — auth guard
- `artifacts/api-server/src/routes/me.ts` — `/me` endpoint with first-call upsert
- `artifacts/api-server/src/routes/applications.ts` — applications + notes + pipeline-summary endpoints
- `artifacts/job-hunt/src/App.tsx` — ClerkProvider, routes, and HomeRedirect logic
- `artifacts/job-hunt/src/pages/job-tracker.tsx` — Job Tracker page (list grouped by stage, inline stage select, edit/delete)
- `artifacts/job-hunt/src/components/job-tracker/` — application form dialog, detail sheet (with notes timeline), pipeline overview, shared utils
- `artifacts/api-server/src/routes/interview.ts` — Interview Prep endpoints (sessions + answers)
- `artifacts/api-server/src/lib/interviewAi.ts` — OpenAI helpers for question generation and answer feedback (gpt-5.4, JSON mode, `max_completion_tokens`)
- `artifacts/job-hunt/src/pages/interview-prep.tsx` — page shell that switches between history, new session, and runner views
- `artifacts/job-hunt/src/components/interview-prep/` — `session-form.tsx` (create), `session-runner.tsx` (per-question answer + feedback UI), `sessions-history.tsx` (saved sessions list)

### AI integration
OpenAI is wired through the Replit AI Integrations proxy. The API server uses the `openai` SDK directly with `AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY` env vars. The client is **lazily** initialized inside `interviewAi.ts` (`getOpenAIClient()`), so the API server still boots cleanly when those env vars are missing — only the interview endpoints respond with 503 in that case. Model: `gpt-5.4`, `response_format: json_object`, `max_completion_tokens` — never `temperature` or `max_tokens`.
