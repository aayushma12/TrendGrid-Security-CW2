/**
 * EmailVerification repository — DATABASE ONLY.
 * The raw verification token is emailed to the user and never persisted;
 * only its SHA-256 hash is stored, mirroring passwordReset.ts.
 */
import { prisma } from '../../../config/prisma';

export const create = async (input: { userId: string; tokenHash: string; expiresAt: Date }) =>
  prisma.emailVerification.create({ data: input });

/** A token is valid iff it exists, hasn't been used, and hasn't expired. */
export const findValidByTokenHash = async (tokenHash: string) => {
  const row = await prisma.emailVerification.findUnique({ where: { tokenHash } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  return row;
};

export const markUsed = async (id: string): Promise<void> => {
  await prisma.emailVerification.update({ where: { id }, data: { usedAt: new Date() } });
};

/** Invalidate any outstanding verification links for a user (called after a successful verify, or before issuing a fresh one). */
export const invalidateAllForUser = async (userId: string): Promise<void> => {
  await prisma.emailVerification.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
};
