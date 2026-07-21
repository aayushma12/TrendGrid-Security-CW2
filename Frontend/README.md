# NDH.TrendGrid

Storefront + admin console for TrendGrid — **Next.js 16 (App Router, Turbopack) + React 19 + TypeScript**, talking to the [`Backend`](../Backend) e-commerce API. Also owns its own Prisma schema (a separate database) for CMS-style concerns — theme tokens, page-builder sections, homepage layout — distinct from the Backend's commerce data model.

## Setup

```bash
cp .env.example .env.development   # fill in DATABASE_URL, NEXT_PUBLIC_API_URL
npm install
npm run db:generate
npm run db:migrate                 # applies this app's own Prisma migrations
npm run dev
```

- App: <http://localhost:3000>
- Admin console: <http://localhost:3000/admin/login>

The `Backend` API should be running separately (default `http://localhost:5000/api/v1`, configured via `NEXT_PUBLIC_API_URL`) — this app has no commerce logic of its own; it's a client of that API for everything except CMS/theme data.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` / `npm start` | Production build + run |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate this app's own Prisma client |
| `npm run db:migrate` | Apply this app's own Prisma migrations |
| `npm run db:seed` | Seed CMS/theme data |
| `npm run db:verify` | Verify seeded data (multi-tenant isolation, theme tokens, page sections) |

## Structure

```
src/
├── app/
│   ├── (shop)/           # storefront — login, register, cart, checkout, orders, profile, ...
│   ├── admin/             # admin console — products, categories, orders, reviews, settings, ...
│   └── api/v1/             # this app's own route handlers (CMS pages/themes) — NOT the commerce API
├── components/
│   ├── auth/               # login/MFA/password UI shared across storefront + admin
│   ├── admin/               # admin-only UI
│   ├── home-nexa/, storefront/, theme/   # storefront presentation layer
├── lib/
│   ├── api/                 # typed client for the Backend API (auth.ts, products.ts, orders.ts, ...)
│   ├── auth-context.tsx     # session state, login/MFA/logout flows
│   └── store-context.tsx    # cart/wishlist/toast client state
└── proxy.ts                  # edge-level RBAC gate (Next 16's renamed `middleware.ts`) — keeps
                               # staff sessions out of the customer area and gates the CMS API
                               # routes server-side, ahead of any page render
prisma/
└── schema.prisma             # this app's own schema — CMS/theme/page-builder, NOT commerce data
```

## Authentication & security

Session handling, login, registration, and MFA (both TOTP and email-OTP) all proxy to the Backend API — see [`Backend/SECURITY.md`](../Backend/SECURITY.md) for the full reference. On this side:

- `src/proxy.ts` is the server-side RBAC gate — runs at the edge before any page renders, asking the API's `GET /auth/me` (never verifies the JWT locally, so the signing secret never needs to live in this app) to decide whether a request should be redirected or rejected. Customer-only routes (`/cart`, `/checkout`, `/orders`, `/profile`) reject staff sessions; the CMS API routes under `/api/v1/admin/*` and `/api/v1/themes/*` (which have no authorization of their own beyond this gate) reject non-staff outright.
- A shared `PasswordStrengthMeter` component (`components/auth/`) is the single source of truth for password-complexity feedback across register, change-password, and reset-password — previously each had its own independently drifted copy of the rule.
- Security headers (CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS) are set via `headers()` in `next.config.ts`, mirroring the Backend's own Helmet configuration.

## Testing

No frontend test suite exists yet (Jest/Playwright or similar) — this is a known gap, not an oversight. Verification for this app has so far been live smoke-testing (curl against real endpoints, manual UI walkthroughs) plus `tsc --noEmit` and `eslint` in CI. The Backend has 33 Jest/Supertest tests; extending equivalent coverage here (component tests for the auth flows at minimum, given their security sensitivity) is the natural next step.

## Docker

```bash
docker build -t ndh-trendgrid-web --build-arg NEXT_PUBLIC_API_URL=https://api.example.com/api/v1 .
docker run --env-file .env -p 3000:3000 ndh-trendgrid-web
```

Multi-stage build on `node:20-alpine`, Next's `output: "standalone"` mode so the runtime image ships only the traced dependency subset (not full `node_modules`), plus this app's own Prisma query-engine binary copied in explicitly (Next's file tracer doesn't reliably pick it up on its own). `NEXT_PUBLIC_API_URL` is a **build** arg, not a runtime env var — it's inlined into the client bundle at build time, since the browser (not the container) is what needs to reach it. `docker-compose.yml` brings up the full stack (Postgres with two databases, the sibling `Backend` API, and this app) — see the file's header comment for the expected side-by-side directory layout.

## CI/CD

`.github/workflows/ci.yml` runs on every push/PR: install → `prisma generate` → lint → typecheck → migrate + seed + verify against a throwaway Postgres service → build → `npm audit` (blocking on critical, informational on high) → Docker build verification → secret scanning (`gitleaks`). `.github/workflows/codeql.yml` runs CodeQL analysis (javascript-typescript) on push/PR plus a weekly scheduled sweep. `.github/dependabot.yml` keeps npm and GitHub Actions dependencies patched weekly.

## Known limitations

- No frontend automated test suite yet (see Testing above).
- `output: "standalone"` + the CSP's `'unsafe-inline'` on `script-src`/`style-src` is a pragmatic trade-off (App Router hydration bootstrap and the theme `<style>` tag both need it) rather than a nonce-based strict CSP, which would require threading a per-request nonce through every script/style boundary.

## Repository

[github.com/projectbyndh/NDH.TrendGrid](https://github.com/projectbyndh/NDH.TrendGrid)
