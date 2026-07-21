/**
 * EmailOtp repository — DATABASE ONLY. Mirrors passwordReset.ts's shape:
 * only a hash is ever persisted, never the raw code.
 */
import { prisma } from '../../../config/prisma';

export type EmailOtpPurpose = 'mfa_enroll' | 'mfa_login';

export const create = async (input: {
  userId: string;
  codeHash: string;
  purpose: EmailOtpPurpose;
  expiresAt: Date;
}) => prisma.emailOtp.create({ data: input });

/** Most recent unconsumed, unexpired code for this user + purpose, if any. */
export const findActive = async (userId: string, purpose: EmailOtpPurpose) => {
  const row = await prisma.emailOtp.findFirst({
    where: { userId, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  return row;
};

export const consume = async (id: string): Promise<void> => {
  await prisma.emailOtp.update({ where: { id }, data: { consumedAt: new Date() } });
};

/** Invalidate any outstanding codes for this user + purpose — only the most
 *  recently sent code should ever be usable (same principle as password resets). */
export const invalidateAllForUser = async (userId: string, purpose: EmailOtpPurpose): Promise<void> => {
  await prisma.emailOtp.updateMany({
    where: { userId, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });
};
