/**
 * Rate limiting for brute-force / abuse-prone endpoints.
 *
 * Each limiter is keyed by IP (via express-rate-limit's default key
 * generator, which respects `app.set('trust proxy', ...)` configured in
 * middleware/trustProxy.ts) and returns the standard API error envelope on
 * 429 instead of express-rate-limit's plain-text default.
 */
import rateLimit from 'express-rate-limit';

import { HTTP_STATUS } from '../constants';
import { error } from '../utils/response';
import { logger } from '../utils/logger';
import { sendSecurityAlert } from '../utils/securityAlert';

const createRateLimit = (message: string, opts: Partial<Parameters<typeof rateLimit>[0]>) =>
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

export const loginRateLimit = createRateLimit('Too many login attempts. Please try again later.', {
  windowMs: 15 * 60 * 1000,
  max: 10,
});

export const registerRateLimit = createRateLimit(
  'Too many registration attempts. Please try again later.',
  {
    windowMs: 60 * 60 * 1000,
    max: 5,
  },
);

export const refreshRateLimit = createRateLimit('Too many refresh requests. Please try again later.', {
  windowMs: 15 * 60 * 1000,
  max: 30,
});

export const mfaRateLimit = createRateLimit('Too many MFA attempts. Please try again later.', {
  windowMs: 15 * 60 * 1000,
  max: 10,
});

export const couponValidateRateLimit = createRateLimit(
  'Too many coupon validation requests. Please try again later.',
  {
    windowMs: 60 * 1000,
    max: 20,
  },
);
