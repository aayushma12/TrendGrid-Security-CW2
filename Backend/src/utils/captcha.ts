/**
 * CAPTCHA verification for login/register — pluggable across hCaptcha and
 * reCAPTCHA (v2/v3), both of which expose a compatible "verify this token
 * server-side" REST endpoint.
 *
 * Disabled (no-op, returns true) when CAPTCHA_PROVIDER=none — the default —
 * so local dev isn't blocked. Set CAPTCHA_PROVIDER + CAPTCHA_SECRET to
 * enforce it; the corresponding site key belongs on the frontend, not here.
 */
import axios from 'axios';

import { env } from '../config/env';
import { logger } from './logger';

const VERIFY_URLS: Record<'hcaptcha' | 'recaptcha', string> = {
  hcaptcha: 'https://hcaptcha.com/siteverify',
  recaptcha: 'https://www.google.com/recaptcha/api/siteverify',
};

export const isCaptchaEnabled = (): boolean => env.security.captchaProvider !== 'none';

export const verifyCaptcha = async (token: string | undefined, remoteIp?: string): Promise<boolean> => {
  if (!isCaptchaEnabled()) return true;

  const provider = env.security.captchaProvider as 'hcaptcha' | 'recaptcha';
  if (!env.security.captchaSecret) {
    logger.error(`CAPTCHA_PROVIDER=${provider} but CAPTCHA_SECRET is unset — failing closed.`);
    return false;
  }
  if (!token) return false;

  try {
    const { data } = await axios.post(
      VERIFY_URLS[provider],
      new URLSearchParams({
        secret: env.security.captchaSecret,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 5000 },
    );
    return Boolean(data?.success);
  } catch (err) {
    logger.error(`CAPTCHA verification request failed: ${(err as Error).message}`);
    return false;
  }
};
