/**
 * RefreshToken repository — backs rotation + server-side revocation.
 * DATABASE ONLY. The raw JWT is never persisted; the row id IS the `jti`
 * embedded in the token, so a lookup is a single indexed PK read.
 */
import { prisma } from '../../../config/prisma';

export interface IssueRefreshTokenInput {
  userId: string;
  expiresAt: Date;
  userAgentHash?: string | null;
  ipAddress?: string | null;
}

export const issue = async (input: IssueRefreshTokenInput) =>
  prisma.refreshToken.create({
    data: {
      userId: input.userId,
      expiresAt: input.expiresAt,
      userAgentHash: input.userAgentHash ?? null,
      ipAddress: input.ipAddress ?? null,
    },
  });

export const findValidById = async (id: string) => {
  const token = await prisma.refreshToken.findUnique({ where: { id } });
  if (!token) return null;
  if (token.revokedAt) return null;
  if (token.expiresAt.getTime() < Date.now()) return null;
  return token;
};

export const findById = async (id: string) => prisma.refreshToken.findUnique({ where: { id } });

/** Revoke a single token (used on logout, or when reuse of a rotated token is detected). */
export const revoke = async (id: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

/** Rotation: revoke the old token and record which token replaced it (for reuse detection). */
export const rotate = async (oldId: string, newId: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { id: oldId, revokedAt: null },
    data: { revokedAt: new Date(), replacedById: newId },
  });
};

/** Revoke every active session for a user — "log out everywhere" / forced invalidation. */
export const revokeAllForUser = async (userId: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};
