# Security Module — Documentation

Reference documentation for the security controls implemented in `NDH.Trendgrid.Api`. For the narrative audit (what was found, what changed, migration steps) see [SECURITY-HARDENING-SUMMARY.md](./SECURITY-HARDENING-SUMMARY.md). This doc is the living reference for what exists today.

## Request pipeline

Order matters — each layer can short-circuit the request before it reaches the next:

```
1. trust proxy config      (src/middleware/trustProxy.ts)   → real client IP behind a proxy/tunnel
2. IP allow/block-list     (src/middleware/ipFilter.ts)      → reject before any other work happens
3. Helmet security headers (src/app.ts)                      → CSP, no-sniff, frame-ancestors, etc.
4. CORS                    (src/app.ts)                      → credentialed, origin from env
5. body/cookie parsing
6. CSRF check              (src/middleware/csrf.ts)          → double-submit cookie
7. request logging (morgan) + audit logging (auditLog.ts)
8. route-level: rate limit → auth (JWT) → role check → zod validation → controller
```

## Features implemented

### 1. Authentication — JWT (access + refresh)
- `src/middleware/auth.ts`. Short-lived access token (default 30 min) + long-lived refresh token (default 30 days), **separate signing secrets** for each.
- Token accepted three ways, in priority order: `Authorization: Bearer`, `httpOnly` cookie, `?token=` query param — so both browser (cookie) and API clients (Swagger/Postman/mobile, bearer header) work against the same routes.
- `requireAuth` (hard fail), `optionalAuth` (best-effort — used on public listings that render extra data for logged-in staff), `requireRole(...roles)` for RBAC.

### 2. Session management — refresh token rotation
- `RefreshToken` table (`prisma/schema.prisma`) — every refresh token is a DB row with a `jti`, not just a bare JWT.
- **Rotates on every use**: old token revoked, new one issued. Reusing an already-rotated token is treated as a compromise signal and revokes *every* session for that user (`refresh_token_reuse` alert).
- `POST /auth/logout` revokes one session; `POST /auth/logout-all` revokes all of them.
- Changing your password revokes every other active session automatically.
- Soft device binding: SHA-256 hash of the `User-Agent` is stored per token; a mismatch on reuse is logged/alerted, not hard-blocked (avoids breaking legitimate clients on UA changes).

### 3. Account lockout (brute-force protection)
- `User.failedLoginAttempts` / `User.lockedUntil`. Configurable threshold and duration (`ACCOUNT_LOCKOUT_MAX_ATTEMPTS`, `ACCOUNT_LOCKOUT_DURATION_MIN`; default 5 attempts / 15 min). Counter resets on successful login. Fires `account_locked` alert.
- The 401 response carries a machine-readable `errors[0].code: 'ACCOUNT_LOCKED'` (alongside the human-readable message) specifically so a frontend can render this distinctly from a generic "wrong password" — the storefront/admin login forms do.

### 4. MFA — TOTP (RFC 6238) or email OTP
Two second-factor methods, chosen at enrollment and recorded on `User.mfaMethod` ("totp" | "email"):
- **TOTP** — `src/features/auth/utils/mfa.ts`, via `otplib`. Endpoints: `POST /auth/mfa/setup` → `/mfa/setup/confirm` → enrolled. Secret is AES-256-GCM encrypted at rest (§6), decrypted only in-memory to verify.
- **Email OTP** — `src/features/auth/utils/emailOtp.ts`. Endpoints: `POST /auth/mfa/setup/email` (sends a 6-digit code to the account's own inbox) → `/mfa/setup/email/confirm` → enrolled. No persistent secret — each code is a fresh, bcrypt-hashed, 5-minute-lived `EmailOtp` row (`purpose: mfa_enroll | mfa_login`), consumed on use. A **fresh code is emailed on every login attempt**, not just once — `login()` re-sends automatically when `mfaMethod === 'email'`; `POST /auth/mfa/resend` covers "I didn't get it."
- Both methods share: `POST /auth/mfa/disable`; `POST /auth/mfa/verify` (second factor at login, checks TOTP or the active EmailOtp depending on `mfaMethod`, with backup-code fallback either way); login for an MFA-enrolled account returns `{ mfaRequired: true, mfaToken, mfaMethod }` instead of tokens — a short-lived (5 min) challenge JWT gates the actual code check; 8 one-time backup codes generated on enrollment, shown once, stored as bcrypt hashes.
- **Support recovery**: `POST /users/:id/mfa/reset` (ADMIN-only) clears a user's MFA entirely for the case where they're locked out with no authenticator access and no saved backup codes — the normal self-service `disableMfa` requires an authenticated session + current password, which is exactly what a locked-out user doesn't have. Audited (`logger.warn`) and alerted (`admin_mfa_reset`).

### 5. Password policy
- **Complexity**: 8+ characters, requiring an uppercase letter, a lowercase letter, a number, **and a special character** (`src/features/auth/validator/index.ts`, `user/validator/index.ts`). Enforced identically client-side via a shared `PasswordStrengthMeter` component (live strength bar + checklist) on register, change-password, and reset-password — previously each of those had its own independently drifted copy of the rule, some missing the lowercase/special-character checks entirely.
- **History**: last N password hashes (`PasswordHistory` table, `PASSWORD_HISTORY_COUNT`, default 5) plus the current password are checked on change — no reuse.
- **Expiry**: `passwordChangedAt` + `PASSWORD_MAX_AGE_DAYS` (default 90) drives a `passwordExpired` flag returned on login/register. Soft signal only — the frontend decides whether to force a change.
- **Forgot/reset flow**: `POST /auth/forgot-password` → emails a random 32-byte token (only its SHA-256 hash is stored, `PasswordReset` table, TTL via `PASSWORD_RESET_TOKEN_TTL_MIN`) → `GET /auth/reset-password/validate` → `POST /auth/reset-password`. Rate-limited at every step. No-ops to logs when `SMTP_HOST` is unset (local dev).

### 6. Encryption at rest — AES-256-GCM
- `src/utils/crypto.ts`. Applies to `Order.shippingAddress` / `billingAddress` and the MFA TOTP secret.
- Stored as `enc:<iv>:<authTag>:<ciphertext>` (all base64) in a plain string column.
- Key derived from `ENCRYPTION_KEY` (32+ chars) via SHA-256. **Production refuses to boot without it.** Falls back to plaintext with a logged warning in dev only.
- Also provides: one-way UA hashing (device binding) and one-way token hashing (password-reset tokens) — SHA-256 is deliberately used there instead of bcrypt, since a 256-bit random token can't be brute-forced regardless of hash speed.
- `passwordHash` is additionally excluded at the **Prisma client level** (`omit: { user: { passwordHash: true } }` in `src/config/prisma.ts`, `previewFeatures = ["omitApi"]` in `schema.prisma`) — an ORM-enforced guarantee that no ordinary query can return it, rather than relying on every repository caller remembering to route through the DTO mapper. The two call sites that legitimately need it (`findByEmail`, `findByIdWithSecurity` — login and MFA/session flows) opt back in explicitly per-query via `omit: { passwordHash: false }`.

### 7. RBAC / IDOR fixes
- Route-level role gates via `requireRole(...)`, plus controller-level ownership checks (self-or-staff) where a route is shared between an owner and admins (e.g. `GET/POST /users/:id/avatar`, `GET /orders/:id`).
- `PUT /users/:id` accepts a `role` field but changing it is **ADMIN-only**, enforced in the controller (previously any `EDITOR` could self-promote) — blocked attempts fire a `role_escalation_attempt` alert.
- Avatar upload requires the caller to be the target user or staff (previously any authenticated user could overwrite anyone's avatar).
- `ROLE_PERMISSIONS` (`auth/constants/index.ts`) is an **informational** list returned to the frontend for UI gating only — the real enforcement is the `auth:` role gate on each route. Verified these agree in the conservative direction: EDITOR's actual write access (product/category management) is narrower than what the permission strings imply, never broader.

### 8. CAPTCHA
- `src/utils/captcha.ts`. Pluggable hCaptcha / reCAPTCHA v2/v3 via `CAPTCHA_PROVIDER` + `CAPTCHA_SECRET`.
- No-op (always passes) when `CAPTCHA_PROVIDER=none` (the default), so local dev isn't blocked. Fails **closed** (rejects) if a provider is set but the secret is missing.

### 9. IP allow/block-listing
- `src/middleware/ipFilter.ts`. Comma-separated IPv4 addresses or CIDR ranges in `IP_ALLOWLIST` / `IP_BLOCKLIST`. Blocklist wins over allowlist; empty lists (default) pass everything through. App-level — fine at moderate scale, push to a WAF/CDN if abuse gets heavy.

### 10. Rate limiting
- `src/middleware/rateLimit.ts`, via `express-rate-limit`, keyed by IP. Per-endpoint limiters: login (10/15min), register (5/hr), refresh (30/15min), MFA verify (10/15min), forgot-password (5/hr), reset-password (10/15min), coupon-validate (20/min). Standard `429` via the app's normal error envelope, plus a `rate_limit_exceeded` alert.

### 11. CSRF protection
- `src/middleware/csrf.ts` — double-submit cookie pattern. A non-`httpOnly` `csrf_token` cookie is set alongside the auth cookies; the frontend must echo it back as `X-CSRF-Token` on state-changing requests. Only enforced when a CSRF cookie is actually present, so pure Bearer-token clients (Swagger, mobile) are unaffected.

### 12. Cookie-based token delivery
- `src/utils/cookies.ts`. `httpOnly`, `secure` in production, `sameSite=lax`. Access-token cookie is scoped to `/`; refresh-token cookie is scoped to `{API_PREFIX}/auth` only, so it isn't replayed on every request. Tokens are also returned in the JSON body for API-client convenience, but a browser frontend should rely on the cookies alone to keep tokens out of reach of XSS.

### 13. Security headers (Helmet + CSP)
- `src/app.ts`. `default-src 'none'` baseline (this is a JSON API), explicit allowances only for what Swagger UI at `/docs` needs (`script-src`/`style-src 'self' 'unsafe-inline'`). `frameAncestors: 'none'`, `objectSrc: 'none'`, `crossOriginResourcePolicy: same-site`.

### 14. Input validation
- `src/middleware/validate.ts` + per-feature `zod` schemas. Every route with a body/query/params schema rejects malformed input before it reaches a service — closes off injection-style and type-confusion bugs at the boundary.

### 15. Audit logging & real-time alerting
- `src/middleware/auditLog.ts` — one structured `AUDIT` log line per authenticated write request (actor, role, method, path, status, outcome, IP), independent of the normal morgan access log. Never logs request/response bodies (so credentials/tokens/MFA codes can't leak into logs).
- `src/utils/securityAlert.ts` — fires on: `account_locked`, `login_failed`, `rate_limit_exceeded`, `mfa_failed`, `ip_blocked`, `role_escalation_attempt`, `refresh_token_reuse`, `password_reset_requested/completed/invalid_token`. Always logged at `warn`/`error`; also POSTed to `SECURITY_ALERT_WEBHOOK_URL` if set (Slack-compatible payload — works with Slack, Discord, Teams, or a custom receiver).

## Configuration reference

| Env var | Default | Purpose |
|---|---|---|
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | — (required, 16+ chars) | Token signing, kept separate |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | `30m` / `30d` | Token lifetimes |
| `BCRYPT_SALT_ROUNDS` | `10` | Password/backup-code hashing cost |
| `ACCOUNT_LOCKOUT_MAX_ATTEMPTS` / `_DURATION_MIN` | `5` / `15` | Lockout threshold |
| `PASSWORD_MAX_AGE_DAYS` | `90` | Password expiry flag |
| `PASSWORD_HISTORY_COUNT` | `5` | Reuse-prevention window |
| `PASSWORD_RESET_TOKEN_TTL_MIN` | `30` | Forgot-password link lifetime |
| `MFA_ISSUER` | `NDH Trendgrid` | Name shown in authenticator apps |
| `ENCRYPTION_KEY` | — (required in prod, 32+ chars) | AES-256-GCM field encryption |
| `CAPTCHA_PROVIDER` / `CAPTCHA_SECRET` | `none` | hCaptcha/reCAPTCHA gate on login/register |
| `IP_ALLOWLIST` / `IP_BLOCKLIST` | empty | CSV of IPs/CIDRs |
| `SECURITY_ALERT_WEBHOOK_URL` | unset | Slack-compatible incoming webhook |
| `CORS_ORIGIN` | `*` → falls back to `FRONTEND_URL` | Credentialed CORS can't use a literal wildcard |
| `SMTP_HOST` etc. | unset | Password-reset email delivery; no-ops to logs when unset |

## RBAC matrix

| Route | Method | Auth |
|---|---|---|
| `/auth/login`, `/auth/register`, `/auth/refresh` | POST | public (rate-limited) |
| `/auth/mfa/verify` | POST | public (rate-limited) |
| `/auth/forgot-password`, `/auth/reset-password`, `/auth/reset-password/validate` | POST/GET | public (rate-limited) |
| `/auth/me` | GET | authenticated (echoes verified JWT payload; used by the Next.js frontend's edge middleware for server-side role routing) |
| `/auth/logout`, `/auth/logout-all`, `/auth/change-password` | POST | authenticated |
| `/auth/mfa/setup`, `/mfa/disable` | POST | authenticated |
| `/auth/mfa/setup/confirm` | POST | authenticated (rate-limited) |
| `/users` | GET | ADMIN, EDITOR |
| `/users` | POST | ADMIN |
| `/users/:id` | GET | authenticated (self or staff) |
| `/users/:id` | PUT | ADMIN, EDITOR (`role` field ADMIN-only) |
| `/users/:id` | DELETE | ADMIN |
| `/users/:id/avatar` | POST | authenticated (self or staff) |
| `/coupons/validate` | GET/POST | authenticated (rate-limited) |
| `/coupons`, `/coupons/:id` | * | ADMIN |
| `/cart/:userId*` | ALL | authenticated (self) |
| `/checkout/preview`, `/checkout/place-order` | POST | authenticated |
| `/orders`, `/orders/:id` (admin ops) | GET/PUT/DELETE/PATCH | ADMIN |
| `/orders/me`, `/orders/track/:id`, `/orders/:id`, `/orders/:id/cancel` | GET/POST | authenticated (own orders only) |
| `/reviews` | GET | public |
| `/reviews`, `/reviews/:id` (write) | POST/PUT/DELETE | authenticated (own review) |
| `/reviews/:id/approve` etc. | PATCH/POST | ADMIN |
| `/users/:id/mfa/reset` | POST | ADMIN (support/lockout recovery — see §4) |

## Testing

`tests/` (Jest + Supertest, 4 suites / 33 tests, `npm test`):
- `auth.test.ts` — login/register/refresh/lockout/MFA flows (both TOTP and email OTP)
- `rbac.test.ts` — role/ownership matrix across `/users`, `/orders` (IDOR + admin listing), and `/coupons` (admin-only management)
- `rateLimit.test.ts` — real 429 behavior with genuinely low `max` values
- `catalog.test.ts` — product/category CRUD and bulk operations

Additionally verified live against the running dev stack (not just the automated suite): full email-MFA round trip with real delivered email and two independent login challenges, account lockout with 5 real failed attempts, refresh-token reuse detection, admin-initiated MFA reset, and a QA sweep across cart/checkout/coupons/orders/reviews/product-admin/payment plus OWASP spot-checks (JWT tampering, SQL injection probes, IDOR, unauthorized access, XSS/header checks) — see the implementation report for the full results.

## Known gaps / needs operator input

- **Rotate the Cloudinary secret.** `.env.development`/`.env.production` were previously committed to git history on the GitHub remote with a live `CLOUDINARY_API_SECRET` (the `.gitignore` gap that allowed this — `.env.*.local` doesn't match `.env.development`/`.env.production` — is fixed, and both files are now untracked, but that alone doesn't invalidate the already-exposed value or purge it from past commits). Regenerate the secret in the Cloudinary dashboard regardless of whether git history itself gets rewritten.
- CAPTCHA and alert-webhook are wired but inert until you supply `CAPTCHA_PROVIDER`/`CAPTCHA_SECRET` and `SECURITY_ALERT_WEBHOOK_URL`.
- IP allow/block-listing is app-level only — move to a WAF/CDN if traffic volume makes that necessary.
- Dev `.env` secrets (`DATABASE_URL`, `JWT_*`) are placeholders — rotate before any real deployment.
- CodeQL, Dependabot, `npm audit` (blocking on critical, informational on high), a Docker build-verification job, and `gitleaks` secret scanning are now wired into CI (`.github/workflows/`) — previously absent.
