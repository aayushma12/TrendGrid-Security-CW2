/**
 * IP allow / block-listing. Runs before everything else in app.ts (right
 * after trust-proxy is configured, so req.ip is already the real client IP).
 *
 * IP_BLOCKLIST / IP_ALLOWLIST accept comma-separated IPv4 addresses or
 * CIDR ranges (e.g. "203.0.113.5,198.51.100.0/24"). Rules:
 *   - If IP_BLOCKLIST matches → always 403, regardless of allowlist.
 *   - If IP_ALLOWLIST is non-empty and the IP does NOT match it → 403.
 *   - If both are empty (default) → everything passes through untouched.
 *
 * This is an app-level primitive for small-scale blocking; for high-volume
 * abuse, push the same lists to an upstream WAF/CDN instead.
 */
import { Request, Response, NextFunction } from 'express';

import { env } from '../config/env';
import { HTTP_STATUS } from '../constants';
import { error } from '../utils/response';
import { logger } from '../utils/logger';
import { sendSecurityAlert } from '../utils/securityAlert';

const ipToLong = (ip: string): number | null => {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return null;
  return parts.reduce((acc, p) => acc * 256 + p, 0);
};

const matchesRule = (ip: string, rule: string): boolean => {
  if (!rule.includes('/')) return ip === rule;

  const [range, bitsStr] = rule.split('/');
  const bits = Number(bitsStr);
  const ipLong = ipToLong(ip);
  const rangeLong = ipToLong(range);
  if (ipLong === null || rangeLong === null || Number.isNaN(bits)) return false;

  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipLong & mask) === (rangeLong & mask);
};

const matchesAny = (ip: string, rules: string[]): boolean => rules.some((rule) => matchesRule(ip, rule));

/** Strip the ::ffff: prefix Node adds for IPv4-mapped IPv6 addresses. */
const normalizeIp = (ip: string): string => ip.replace(/^::ffff:/, '');

export const ipFilter = (req: Request, res: Response, next: NextFunction): void => {
  const { ipAllowlist, ipBlocklist } = env.security;
  if (ipAllowlist.length === 0 && ipBlocklist.length === 0) return next();

  const ip = normalizeIp(req.ip || '');

  if (ipBlocklist.length > 0 && matchesAny(ip, ipBlocklist)) {
    logger.warn(`Blocked request from blocklisted IP=${ip} path=${req.originalUrl}`);
    sendSecurityAlert('ip_blocked', { ip, path: req.originalUrl, reason: 'blocklist' });
    error(res, 'Access denied.', HTTP_STATUS.FORBIDDEN);
    return;
  }

  if (ipAllowlist.length > 0 && !matchesAny(ip, ipAllowlist)) {
    logger.warn(`Blocked request from non-allowlisted IP=${ip} path=${req.originalUrl}`);
    sendSecurityAlert('ip_blocked', { ip, path: req.originalUrl, reason: 'not_in_allowlist' });
    error(res, 'Access denied.', HTTP_STATUS.FORBIDDEN);
    return;
  }

  next();
};
