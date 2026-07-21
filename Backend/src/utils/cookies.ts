/**
 * httpOnly cookie-based token delivery.
 *
 * Tokens are STILL also returned in the JSON response body (see the auth
 * controller) for API-client/Swagger convenience, but a browser frontend
 * should ignore that and rely on these cookies exclusively — that's what
 * actually keeps the tokens out of reach of any injected JavaScript (XSS).
 *
 * The refresh-token cookie is scoped to the auth path only, so it isn't
 * attached to every single API request — just the handful of endpoints
 * that need it.
 */
import { Response } from 'express';
import ms from 'ms';

import { env, isProduction } from '../config/env';
import { generateToken } from './crypto';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const CSRF_COOKIE = 'csrf_token';

const REFRESH_COOKIE_PATH = `${env.apiPrefix}/auth`;

const baseCookieOpts = {
  httpOnly: true as const,
  secure: isProduction,
  // 'lax' (not 'strict') so a link/redirect into the app from elsewhere
  // still carries the session — cross-site POSTs still don't send it,
  // which is what actually matters for CSRF.
  sameSite: 'lax' as const,
};

export const setAuthCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
): void => {
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseCookieOpts,
    path: '/',
    maxAge: ms(env.jwt.expiresIn),
  });
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...baseCookieOpts,
    path: REFRESH_COOKIE_PATH,
    maxAge: ms(env.jwt.refreshExpiresIn),
  });
};

/**
 * Double-submit CSRF token: readable by frontend JS (NOT httpOnly) so it can
 * be echoed back as the `X-CSRF-Token` header on state-changing requests —
 * see middleware/csrf.ts for the verification side.
 */
export const setCsrfCookie = (res: Response): string => {
  const token = generateToken(24);
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: ms(env.jwt.refreshExpiresIn),
  });
  return token;
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...baseCookieOpts, path: '/' });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { ...baseCookieOpts, path: REFRESH_COOKIE_PATH });
  res.clearCookie(CSRF_COOKIE, { httpOnly: false, secure: isProduction, sameSite: 'lax', path: '/' });
};
