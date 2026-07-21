/**
 * PasswordReset repository — DATABASE ONLY.
 * The raw reset token is emailed to the user and never persisted; only its
 * SHA-256 hash is stored, mirroring how refresh tokens/backup codes are handled.
 */
import { prisma } from '../../../config/prisma';

export const create = async (input: { userId: string; tokenHash: string; expiresAt: Date }) =>
  prisma.passwordReset.create({ data: input });

/** A token is valid iff it exists, hasn't been used, and hasn't expired. */
export const findValidByTokenHash = async (tokenHash: string) => {
  const row = await prisma.passwordReset.findUnique({ where: { tokenHash } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  return row;
};

export const markUsed = async (id: string): Promise<void> => {
  await prisma.passwordReset.update({ where: { id }, data: { usedAt: new Date() } });
};

/** Invalidate any outstanding reset requests for a user (called after a successful reset/login). */
export const invalidateAllForUser = async (userId: string): Promise<void> => {
  await prisma.passwordReset.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
};
