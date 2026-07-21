/**
 * PasswordHistory repository — backs reuse prevention.
 * DATABASE ONLY.
 */
import { prisma } from '../../../config/prisma';
import { env } from '../../../config/env';

export const record = async (userId: string, passwordHash: string): Promise<void> => {
  await prisma.passwordHistory.create({ data: { userId, passwordHash } });

  // Trim to the configured retention count so the table doesn't grow unbounded.
  const keep = env.security.passwordHistoryCount;
  const old = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip: keep,
    select: { id: true },
  });
  if (old.length > 0) {
    await prisma.passwordHistory.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
  }
};

/** Most recent N password hashes for reuse checks, newest first. */
export const recentHashes = async (userId: string, limit: number): Promise<string[]> => {
  const rows = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { passwordHash: true },
  });
  return rows.map((r) => r.passwordHash);
};
