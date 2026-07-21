/**
 * Email-delivered one-time codes — the email-MFA counterpart to utils/mfa.ts's
 * TOTP helpers. A 6-digit numeric code, bcrypt-hashed for storage (like
 * mfaBackupCodes, not SHA-256 like password-reset tokens — see the comment
 * on the EmailOtp Prisma model for why: low entropy needs slow hashing +
 * rate limiting, not just a big keyspace).
 */
import crypto from 'crypto';

import bcrypt from 'bcrypt';

import { env } from '../../../config/env';

/** Cryptographically random 6-digit code, zero-padded (e.g. "004821"). */
export const generateEmailOtpCode = (): string =>
  crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

export const hashEmailOtpCode = (code: string): Promise<string> => bcrypt.hash(code, env.jwt.saltRounds);

export const verifyEmailOtpCode = (code: string, hash: string): Promise<boolean> => bcrypt.compare(code, hash);
