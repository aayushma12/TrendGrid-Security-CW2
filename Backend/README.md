# NDH.Trendgrid.Api

Backend API for NDH Trendgrid — **Node.js + Express + TypeScript + Prisma + PostgreSQL**.

Every feature MUST follow [`workflowtunelling.md`](./workflowtunelling.md). The scaffold enforces that workflow through four guardrails so it becomes an invariant, not just a convention.

## Setup

```bash
cp .env.example .env         # fill in DATABASE_URL, JWT_SECRET, CLOUDINARY_*
npm install
npm run prisma:generate
npm run prisma:migrate       # creates the User table
npm run dev
```

- Health: <http://localhost:5000/api/v1/health>
- Swagger: <http://localhost:5000/api/v1/docs>

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` / `npm start` | Production build + run |
| `npm run lint` / `lint:fix` | ESLint (enforces the tunnel) |
| `npm run prisma:migrate` | Create + apply DB migration |
| `npm run prisma:deploy` | Apply migrations in prod |
| `npm run prisma:studio` | Prisma DB browser |

## The Four Guardrails

The workflow doc's rules are enforced by concrete mechanisms:

| Guardrail | What it forces | Where |
|---|---|---|
| **1. Env schema** | Missing/malformed `JWT_SECRET`, `DATABASE_URL`, `CLOUDINARY_*` crash the app at boot with a printed reason. | `src/config/env.ts` (zod) |
| **2. `defineRoute()` factory** | Every route MUST specify `auth`, `schema`, and `handler`. Validate + asyncHandler are wired automatically — you cannot register a route without them. | `src/utils/defineRoute.ts` |
| **3. ESLint boundaries** | Controllers can't import repositories (must go through service). `res.json/send/end` is banned outside `utils/response.ts`. | `.eslintrc.cjs` |
| **4. Global error handler** | Every thrown `AppError` / `ZodError` becomes the standard error response. Unknown errors are logged, not leaked. | `src/middleware/errorHandler.ts` |

## Standard Response

Every endpoint returns via `utils/response.ts` — never raw `res.json`.

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User retrieved successfully.",
  "data": { },
  "meta": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 },
  "timestamp": "2026-07-06T10:00:00Z"
}
```

Errors, always via `throw new AppError(...)`:
```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed.",
  "errors": [{ "field": "email", "message": "Invalid email" }],
  "timestamp": "2026-07-06T10:00:00Z"
}
```

## Project Structure

```
src/
├── app.ts                       # express pipeline
├── server.ts                    # boot + graceful shutdown
├── config/                      # env (zod-validated), prisma, swagger, cloudinary, tunnel
├── constants/                   # HTTP_STATUS, MESSAGES, DEFAULT_*
├── controllers/                 # cross-cutting (health)
├── middleware/                  # errorHandler, validate, auth, trustProxy, requestLogger
├── routes/                      # top-level router
├── services/                    # cross-cutting (imageService, httpClient)
├── types/                       # ApiResponse, PaginationMeta, QueryOptions
├── utils/                       # response, errors, queryOptions, asyncHandler, defineRoute, logger
└── features/
    └── <feature>/               # every feature follows this shape
        ├── controller/          # thin: req → service → response builder
        ├── service/             # business logic ONLY
        ├── repository/          # Prisma calls ONLY
        ├── dto/                 # request/response shapes + mappers
        ├── validator/           # zod schemas
        ├── route/               # defineRoutes([...])
        ├── swagger/             # OpenAPI JSDoc blocks
        ├── types/               # domain types
        ├── constants/           # feature constants
        └── utils/               # feature helpers
prisma/
└── schema.prisma
```

`features/user/` is the reference implementation — copy it to start a new feature.

## Auth

`defineRoute` accepts:
- `auth: 'public'` — no auth
- `auth: 'authenticated'` — any valid JWT
- `auth: 'ADMIN'` — role required
- `auth: ['ADMIN', 'EDITOR']` — any listed role

Attach a bearer token: `Authorization: Bearer <jwt>`. `requireAuth` populates `req.user`.

## Adding a New Feature (copy the `user` template)

1. Copy `src/features/user/` → `src/features/<feature>/`
2. Update `types/`, `dto/`, `validator/`, `constants/`, `repository/` (Prisma model + queries).
3. Rewrite `service/` and `controller/` with your logic.
4. Register routes via `defineRoutes(router, [...])` in `route/index.ts`.
5. Add JSDoc to `swagger/index.ts`.
6. Add `router.use('/<feature>', <feature>Routes)` in `src/routes/index.ts`.
7. Add the Prisma model to `prisma/schema.prisma` → `npm run prisma:migrate`.

ESLint will complain if you skip a layer or call `res.json` directly. The env schema will complain if you added a new required var and forgot to declare it.

## Cloudinary — Image Handling

All image storage goes through Cloudinary. Configure in `.env`; use `uploader('subfolder').single('field')` in `middleware` of a `defineRoute` call. See `features/user/route/index.ts` for the avatar upload example.

## Outbound HTTP (Optional Proxy)

`src/services/httpClient.ts` exposes a shared axios client. Set `OUTBOUND_PROXY_*` in `.env` to route egress through a corporate proxy or static-IP gateway — no code changes.

## Environment Variables

Full list in `.env.example`. Boot fails with a printed list if any required value is missing or malformed.

## Security

See [SECURITY.md](./SECURITY.md) for the full reference (auth, MFA — TOTP and email OTP, rate limiting, CSRF, encryption at rest, RBAC/IDOR, audit logging and alerting) and [SECURITY-HARDENING-SUMMARY.md](./SECURITY-HARDENING-SUMMARY.md) for the narrative audit history.

## Testing

```bash
npm test              # Jest + Supertest — 4 suites, 33 tests
```

Tests run against `DATABASE_URL` from `.env.test` (a separate database from dev — don't point it at data you care about; the suite creates and tears down its own rows but a schema mismatch or wrong target will cause confusing failures).

## Docker

```bash
docker build -t ndh-trendgrid-api .
docker run --env-file .env -p 5000:5000 ndh-trendgrid-api
```

Multi-stage build (`deps` → `build` → `runtime`) on `node:20-alpine`; the runtime stage re-runs `prisma generate` against production-only `node_modules` so the shipped query-engine binary matches what's actually installed, runs as a non-root user, and exposes a `/api/v1/health`-based `HEALTHCHECK`. `docker-compose.yml` brings up the full stack (Postgres + this API + the sibling `Frontend` — see the file's header comment for the expected side-by-side directory layout).

## CI/CD

`.github/workflows/ci.yml` runs on every push/PR: install → `prisma generate` → lint → typecheck+build → `prisma db push` against a throwaway Postgres service → test → `npm audit` (blocking on critical, informational on high) → Docker build verification → secret scanning (`gitleaks`). `.github/workflows/codeql.yml` runs CodeQL analysis (javascript-typescript) on push/PR plus a weekly scheduled sweep. `.github/dependabot.yml` keeps npm and GitHub Actions dependencies patched on a weekly cadence.

## Repository

[github.com/projectbyndh/NDH.Trendgrid.Api](https://github.com/projectbyndh/NDH.Trendgrid.Api)
