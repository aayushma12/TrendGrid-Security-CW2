/**
 * AES-256-GCM field-level encryption for sensitive data at rest
 * (shipping/billing addresses, MFA secrets).
 *
 * ENCRYPTION_KEY must be a 32+ char secret (distinct from the JWT secrets).
 * Ciphertext is stored as `iv:authTag:ciphertext` (all base64) so it's a
 * plain string column — no schema changes needed beyond that.
 *
 * If ENCRYPTION_KEY is not configured (e.g. local dev), encrypt/decrypt
 * become no-ops and data is stored in plaintext — startup already warns/
 * blocks this in production (see config/env.ts).
 */
import crypto from 'crypto';

import { env } from '../config/env';
import { logger } from './logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

let warned = false;
const getKey = (): Buffer | null => {
  if (!env.security.encryptionKey) {
    if (!warned) {
      logger.warn('ENCRYPTION_KEY not set — sensitive fields are stored in plaintext (dev only).');
      warned = true;
    }
    return null;
  }
  return crypto.createHash('sha256').update(env.security.encryptionKey).digest();
};

/** Encrypt a plaintext string. Returns the plaintext unchanged if no key is configured. */
export const encryptField = (plaintext: string): string => {
  const key = getKey();
  if (!key) return plaintext;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `enc:${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
};

/** Decrypt a string produced by encryptField. Passes through unrecognized/plaintext values untouched. */
export const decryptField = (stored: string): string => {
  if (!stored.startsWith('enc:')) return stored;

  const key = getKey();
  if (!key) return stored;

  const [, ivB64, tagB64, dataB64] = stored.split(':');
  if (!ivB64 || !tagB64 || !dataB64) return stored;

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  } catch (err) {
    logger.error(`Failed to decrypt field: ${(err as Error).message}`);
    return '[decryption failed]';
  }
};

/** Encrypt a JSON-serializable value (e.g. an address object) into a single stored string. */
export const encryptJson = (value: unknown): string => encryptField(JSON.stringify(value));

/** Decrypt back into the original JSON value. */
export const decryptJson = <T>(stored: string): T => JSON.parse(decryptField(stored)) as T;

/**
 * One-way hash of a User-Agent header for soft session-device binding.
 * Not a secret — just a fingerprint, so a plain SHA-256 (no key) is fine.
 */
export const hashUserAgent = (userAgent: string | undefined | null): string | null =>
  userAgent ? crypto.createHash('sha256').update(userAgent).digest('hex') : null;
