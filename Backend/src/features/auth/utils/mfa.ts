/**
 * TOTP-based MFA (RFC 6238) — no external provider/SMS/email dependency.
 * Secrets are encrypted at rest (utils/crypto.ts) and only ever decrypted
 * in-memory to verify a code. Backup codes are one-time, bcrypt-hashed.
 */
import crypto from 'crypto';

import bcrypt from 'bcrypt';
import { authenticator } from 'otplib';

import { env } from '../../../config/env';

authenticator.options = { window: 1 }; // allow ±1 step (~30s) of clock drift

export const generateMfaSecret = (): string => authenticator.generateSecret();

export const buildOtpAuthUrl = (email: string, secret: string): string =>
  authenticator.keyuri(email, env.security.mfaIssuer, secret);

export const verifyTotp = (token: string, secret: string): boolean => {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
};

const BACKUP_CODE_COUNT = 8;

/** Generate fresh backup codes. Returns both the plaintext (show once) and bcrypt hashes (to store). */
export const generateBackupCodes = async (): Promise<{ plaintext: string[]; hashes: string[] }> => {
  const plaintext = Array.from({ length: BACKUP_CODE_COUNT }, () =>
    crypto.randomBytes(5).toString('hex').toUpperCase(),
  );
  const hashes = await Promise.all(plaintext.map((code) => bcrypt.hash(code, env.jwt.saltRounds)));
  return { plaintext, hashes };
};

/** Returns the matching stored hash if `code` matches one of the unused backup codes, else null. */
export const matchBackupCode = async (code: string, hashes: string[]): Promise<string | null> => {
  for (const hash of hashes) {
    // eslint-disable-next-line no-await-in-loop
    if (await bcrypt.compare(code, hash)) return hash;
  }
  return null;
};
