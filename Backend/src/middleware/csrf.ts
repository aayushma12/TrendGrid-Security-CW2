/**
 * CSRF protection — double-submit cookie pattern.
 *
 * Needed because auth now travels in cookies (see utils/cookies.ts): a
 * browser auto-attaches cookies to a request regardless of which site
 * triggered it, so a malicious page could otherwise ride a logged-in user's
 * session for a state-changing request. A plain Bearer-token client (no
 * cookies at all — Swagger, Postman, a mobile app) isn't exposed to this in
 * the first place, since nothing auto-attaches an Authorization header
 * cross-site — so this only enforces when a CSRF cookie is actually present.
 *
 * `setCsrfCookie` (utils/cookies.ts) issues a random, non-httpOnly token
 * alongside the httpOnly auth cookies on login/register/refresh. The
 * frontend must read that cookie and echo it back as `X-CSRF-Token` on every
 * state-changing request; this middleware just checks the two match.
 */
import { Request, Response, NextFunction } from 'express';

import { CSRF_COOKIE } from '../utils/cookies';
import { ForbiddenError } from '../utils/errors';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const verifyCsrf = (req: Request, _res: Response, next: NextFunction): void => {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  // No CSRF cookie yet means there's no cookie-based session to protect —
  // covers login/register (pre-session) and any pure Bearer-token client.
  if (!cookieToken) return next();

  const headerToken = req.get('x-csrf-token');
  if (!headerToken || headerToken !== cookieToken) {
    return next(
      new ForbiddenError('Missing or invalid CSRF token.', [
        { message: 'Missing or invalid CSRF token.', code: 'CSRF_INVALID' },
      ]),
    );
  }
  next();
};
