/**
 * Rate limiting for brute-force / abuse-prone endpoints.
 *
 * Each limiter is keyed by IP (via express-rate-limit's default key
 * generator, which respects `app.set('trust proxy', ...)` configured in
 * middleware/trustProxy.ts) and returns the standard API error envelope on
 * 429 instead of express-rate-limit's plain-text default.
 */
import rateLimit from 'express-rate-limit';

import { isTest } from '../config/env';
import { HTTP_STATUS } from '../constants';
import { error } from '../utils/response';
import { logger } from '../utils/logger';
import { sendSecurityAlert } from '../utils/securityAlert';

/** Pure builder — deliberately does NOT know about test env, so a test can
 *  construct one with an explicit, genuinely-low `max` to exercise the real
 *  429 behavior (see tests/rateLimit.test.ts). */
export const createRateLimit = (message: string, opts: Partial<Parameters<typeof rateLimit>[0]>) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded ip=${req.ip} path=${req.originalUrl}`);
      sendSecurityAlert('rate_limit_exceeded', {
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
      });
      error(res, message, HTTP_STATUS.TOO_MANY_REQUESTS);
    },
    ...opts,
  });

/**
 * The app's real routes wire in these pre-built instances, with their `max`
 * inflated 1000x in test env — otherwise the test suite's own traffic (many
 * requests against one shared in-memory counter, since tests share one
 * process/app instance) would trip limits meant for actual abuse. Real
 * dev/production thresholds are exactly the numbers below, unchanged.
 */
const appLimit = (message: string, opts: Partial<Parameters<typeof rateLimit>[0]> & { max: number }) =>
  createRateLimit(message, { ...opts, max: isTest ? opts.max * 1000 : opts.max });

export const loginRateLimit = appLimit('Too many login attempts. Please try again later.', {
  windowMs: 15 * 60 * 1000,
  max: 10,
});

export const registerRateLimit = appLimit('Too many registration attempts. Please try again later.', {
  windowMs: 60 * 60 * 1000,
  max: 5,
});

export const refreshRateLimit = appLimit('Too many refresh requests. Please try again later.', {
  windowMs: 15 * 60 * 1000,
  max: 30,
});

export const mfaRateLimit = appLimit('Too many MFA attempts. Please try again later.', {
  windowMs: 15 * 60 * 1000,
  max: 10,
});

export const forgotPasswordRateLimit = appLimit('Too many password reset requests. Please try again later.', {
  windowMs: 60 * 60 * 1000,
  max: 5,
});

export const resetPasswordRateLimit = appLimit('Too many password reset attempts. Please try again later.', {
  windowMs: 15 * 60 * 1000,
  max: 10,
});

export const verifyEmailRateLimit = appLimit('Too many verification requests. Please try again later.', {
  windowMs: 60 * 60 * 1000,
  max: 10,
});

export const couponValidateRateLimit = appLimit('Too many coupon validation requests. Please try again later.', {
  windowMs: 60 * 1000,
  max: 20,
});
