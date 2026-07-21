# Security Hardening — Summary

Audit + implementation pass against the security checklist, run against `NDH.Trendgrid.Api`. This document is the record of what changed, what still needs a decision from you, and how to verify it.

## What was found

- **Rate limiting was missing entirely.** `express-rate-limit` wasn't even a dependency in `package.json`, despite a stale `dist/middleware/rateLimit.js` proving it existed at some point and was later dropped. Login, register, refresh, and coupon-validate had no throttling.
- **Helmet's CSP was left at Express defaults**, not explicitly configured — fine for an API with no HTML, but Swagger UI is mounted at `/docs` on the same origin, so a real policy is worth setting rather than leaving it implicit.
- **IDOR on avatar upload.** `POST /users/:id/avatar` only required *any* authenticated user — nothing checked that `:id` was the caller's own account or that the caller was staff. Any logged-in user could overwrite another account's avatar.
- **Privilege escalation on user update.** `PUT /users/:id` is reachable by `ADMIN` or `EDITOR`, and the body accepts a `role` field. Nothing stopped an `EDITOR` from setting `role: "ADMIN"` on any account, including their own.
- **No account lockout, no MFA, no password history/expiry, no CAPTCHA, no IP allow/block-listing, no refresh-token revocation, no security-event audit trail, no real-time alerting.** Auth was bare JWT (access + refresh, dual secrets — that part was already solid) with bcrypt hashing and DTO-level password stripping, but nothing beyond that.
- **Addresses stored as plain Prisma `Json`.** Shipping/billing addresses were not encrypted at rest.
- **Live secrets sitting in plaintext `.env`** (DB password, Cloudinary secret, JWT secrets). `.env` is correctly gitignored, so this isn't a repo leak, but the values are weak/guessable and worth rotating regardless — see "Rotate these" below.

## What was implemented

**Brute-force / rate limiting**
- `src/middleware/rateLimit.ts` — restored, with limiters for login, register, refresh, MFA verification, and coupon validation. Wired in via a new `preAuth` hook on `defineRoute` (runs before auth/validation, so abuse is throttled before it touches the DB).

**Account lockout**
- `User.failedLoginAttempts` / `User.lockedUntil` (new columns). Failed logins increment a counter; hitting the threshold (env-configurable, default 5 attempts / 15 min) locks the account. Resets on success.

**MFA (TOTP)**
- `otplib`-based, no external provider needed. New endpoints: `POST /auth/mfa/setup`, `/mfa/setup/confirm`, `/mfa/disable`, `/mfa/verify`. Login returns `{ mfaRequired: true, mfaToken }` for enrolled accounts instead of tokens; a short-lived challenge JWT gates the second factor. Includes one-time bcrypt-hashed backup codes.

**Password policy**
- Reuse prevention against the last N password hashes (new `PasswordHistory` table, env-configurable count) plus the current password. Expiry flag (`passwordExpired`) returned on login/register based on `passwordChangedAt` (env-configurable max age) — not a hard block, but there for the frontend to act on.

**Session management**
- New `RefreshToken` table. Refresh tokens now carry a `jti` and rotate on every use (old one revoked, new one issued). Reuse of an already-rotated token is treated as compromise and revokes every session for that user. Logout revokes the specific token; new `POST /auth/logout-all` revokes everything ("log out everywhere"). Soft device binding via a hashed User-Agent, logged/alerted on mismatch rather than hard-blocking (to avoid breaking legitimate clients).
- A password change now revokes every other active session.

**RBAC / IDOR**
- Avatar upload now enforces self-or-staff, same as the existing profile-view check.
- Role changes on `PUT /users/:id` are now ADMIN-only, with a security alert fired on a blocked attempt.

**Encryption at rest**
- `shippingAddress` / `billingAddress` on `Order` switched from `Json` to AES-256-GCM–encrypted text (`src/utils/crypto.ts`), keyed by a new `ENCRYPTION_KEY` env var. MFA secrets are encrypted the same way. Production boot refuses to start without `ENCRYPTION_KEY` set.

**CAPTCHA**
- Pluggable hCaptcha/reCAPTCHA verification (`src/utils/captcha.ts`), gated by `CAPTCHA_PROVIDER`/`CAPTCHA_SECRET`. No-ops when unset (default) so local dev isn't blocked — **you'll need to supply provider keys to actually enforce this in production** (see below).

**IP allow/block-listing**
- `src/middleware/ipFilter.ts`, static env-configured lists (`IP_ALLOWLIST`/`IP_BLOCKLIST`), supports individual IPs and CIDR ranges, runs first in the middleware chain.

**Audit logging / real-time alerting**
- `src/middleware/auditLog.ts` logs every authenticated write request (actor, role, method, path, status, IP) as a structured `AUDIT` log line, independent of the existing morgan request log.
- `src/utils/securityAlert.ts` fires on lockouts, repeated failures, rate-limit breaches, MFA failures, IP blocks, and role-escalation attempts. Always logs at `warn`/`error`; also POSTs to `SECURITY_ALERT_WEBHOOK_URL` if you set one (Slack-compatible payload — Slack, Discord, Teams, or a custom webhook receiver all work).
- Verified no request/response bodies are logged anywhere (so passwords/tokens/MFA codes can't leak into logs).

## What's out of scope / needs your input

- **CAPTCHA provider keys.** The verification code is live but disabled until you set `CAPTCHA_PROVIDER` + `CAPTCHA_SECRET` (and add the matching site key to the frontend).
- **Alert webhook destination.** Same story — set `SECURITY_ALERT_WEBHOOK_URL` to a Slack/Teams/Discord incoming webhook once you have one; alerts already default to structured logs regardless.
- **IP allow/block-listing is app-level.** Fine for a moderate scale; if abuse gets heavy, push the same lists to a WAF/CDN instead.
- **RBAC test matrix.** Below is the full route → auth-level map, generated directly from the route definitions, for you to turn into an integration test suite or manual pass.

## Rotate these

The dev `.env` has live-looking credentials sitting in plaintext (not committed — `.env` is gitignored — but still worth doing):
- `DATABASE_URL` password
- `CLOUDINARY_API_SECRET`
- `JWT_SECRET` / `JWT_REFRESH_SECRET` (currently short, guessable strings)

## Required before this runs

1. **`npm install`** — added `express-rate-limit`, `otplib`, `ms` (+ `@types/ms`).
2. **`npx prisma migrate dev`** (or `db push` for a quick local sync) — new columns on `User` (`failedLoginAttempts`, `lockedUntil`, `passwordChangedAt`, `mfaEnabled`, `mfaSecret`, `mfaBackupCodes`), new `RefreshToken` and `PasswordHistory` tables, and `Order.shippingAddress`/`billingAddress` changed from `Json` to `String`. **This last one is a breaking column-type change — if you have existing orders, write a one-off migration script to encrypt the existing plaintext JSON into the new format before applying, or the column swap will need a manual `USING` cast in the generated SQL.**
3. **`npx prisma generate && npm run build`** — I could not run either of these in this sandbox (outbound network to `binaries.prisma.sh`, which the Prisma CLI needs to fetch its query engine, is blocked here). I verified the code by hand-constructing a full local copy from the actual files on disk and type-checking it — `tsc` comes back with zero errors outside the ones caused by the missing generated Prisma client (expected, since `prisma generate` never ran). Please run these two commands locally as the final check before deploying.
4. Set `ENCRYPTION_KEY` to a real random 32+ byte value in every real environment (the checked-in dev value is a placeholder and will not pass the production boot check).

## RBAC matrix (as implemented)

| Route | Method | Auth |
|---|---|---|
| `/auth/login` | POST | public (rate-limited) |
| `/auth/mfa/verify` | POST | public (rate-limited) |
| `/auth/register` | POST | public (rate-limited) |
| `/auth/refresh` | POST | public (rate-limited) |
| `/auth/logout` | POST | authenticated |
| `/auth/logout-all` | POST | authenticated |
| `/auth/change-password` | POST | authenticated |
| `/auth/mfa/setup` | POST | authenticated |
| `/auth/mfa/setup/confirm` | POST | authenticated (rate-limited) |
| `/auth/mfa/disable` | POST | authenticated |
| `/users` | GET | ADMIN, EDITOR |
| `/users` | POST | ADMIN |
| `/users/:id` | GET | authenticated (self or staff, enforced in controller) |
| `/users/:id` | PUT | ADMIN, EDITOR (role field is ADMIN-only, enforced in controller) |
| `/users/:id` | DELETE | ADMIN |
| `/users/:id/avatar` | POST | authenticated (self or staff, enforced in controller) |
| `/coupons/validate` | GET/POST | authenticated (rate-limited) |
| `/coupons` | GET/POST | ADMIN |
| `/coupons/:id` | GET/PUT/DELETE | ADMIN |
| `/cart/:userId*` | ALL | authenticated (self, enforced in controller) |
| `/checkout/preview`, `/checkout/place-order` | POST | authenticated |
| `/orders` | GET | ADMIN |
| `/orders/:id` | PUT/DELETE | ADMIN |
| `/orders/:id/status`, `/payment`, `/refund`, `/restore` | PATCH/POST | ADMIN |
| `/orders/me`, `/orders/track/:id`, `/orders/:id`, `/orders/:id/cancel` | GET/POST | authenticated (own orders only, enforced in service) |
| `/reviews` | GET | public |
| `/reviews`, `/reviews/:id` (write) | POST/PUT/DELETE | authenticated (own review) |
| `/reviews/:id/approve`, `/reject`, `/hide`, `/restore`, `/reply` | PATCH/POST | ADMIN |
