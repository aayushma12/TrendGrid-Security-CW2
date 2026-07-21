/**
 * User repository — DATABASE ONLY (Prisma).
 * No business logic, no validation.
 */
import { Prisma, User as PrismaUser } from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { QueryOptions } from '../../../types';
import { User, UserWithPassword } from '../types';
import { UserRole } from '../constants';

export interface CreateUserRecord {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  passwordHash: string;
  role: UserRole;
}

export interface UpdateUserRecord {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: UserRole;
  isActive?: boolean;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
}

const toUser = (r: PrismaUser): User => ({
  id: r.id,
  firstName: r.firstName,
  lastName: r.lastName,
  email: r.email,
  phoneNumber: r.phoneNumber ?? undefined,
  role: r.role as UserRole,
  isActive: r.isActive,
  isDeleted: r.isDeleted,
  deletedAt: r.deletedAt ?? undefined,
  deletedBy: r.deletedBy ?? undefined,
  avatarUrl: r.avatarUrl ?? undefined,
  avatarPublicId: r.avatarPublicId ?? undefined,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const toUserWithPassword = (r: PrismaUser): UserWithPassword => ({
  ...toUser(r),
  passwordHash: r.passwordHash,
  failedLoginAttempts: r.failedLoginAttempts,
  lockedUntil: r.lockedUntil ?? undefined,
  passwordChangedAt: r.passwordChangedAt,
  mfaEnabled: r.mfaEnabled,
  mfaSecret: r.mfaSecret ?? undefined,
  mfaBackupCodes: r.mfaBackupCodes,
});

export const create = async (data: CreateUserRecord): Promise<User> =>
  toUser(await prisma.user.create({ data }));

export const findById = async (id: string): Promise<User | null> => {
  const r = await prisma.user.findFirst({ where: { id, isDeleted: false } });
  return r ? toUser(r) : null;
};

export const findByEmail = async (email: string): Promise<UserWithPassword | null> => {
  const r = await prisma.user.findFirst({
    where: { email, isDeleted: false },
  });
  return r ? toUserWithPassword(r) : null;
};

export const findByIdWithSecurity = async (id: string): Promise<UserWithPassword | null> => {
  const r = await prisma.user.findFirst({ where: { id, isDeleted: false } });
  return r ? toUserWithPassword(r) : null;
};

export const findByPhone = async (phoneNumber: string): Promise<User | null> => {
  const r = await prisma.user.findFirst({
    where: { phoneNumber, isDeleted: false },
  });
  return r ? toUser(r) : null;
};

export const update = async (id: string, patch: UpdateUserRecord): Promise<User | null> => {
  try {
    const r = await prisma.user.update({ where: { id }, data: patch });
    return toUser(r);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return null;
    throw err;
  }
};

export const remove = async (id: string, deletedBy?: string): Promise<boolean> => {
  try {
    await prisma.user.update({
      where: { id, isDeleted: false },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: deletedBy ?? null,
        isActive: false,
      },
    });
    return true;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return false;
    throw err;
  }
};

export const updatePassword = async (id: string, passwordHash: string): Promise<boolean> => {
  try {
    await prisma.user.update({
      where: { id, isDeleted: false },
      data: { passwordHash, passwordChangedAt: new Date() },
    });
    return true;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return false;
    throw err;
  }
};

// ---------------------------------------------------------------------------
// Account lockout (brute-force protection)
// ---------------------------------------------------------------------------

/** Increment the failed-attempt counter; lock the account once the threshold is hit. Returns the new state. */
export const recordFailedLogin = async (
  id: string,
  maxAttempts: number,
  lockoutDurationMs: number,
): Promise<{ failedLoginAttempts: number; lockedUntil: Date | null }> => {
  const user = await prisma.user.update({
    where: { id },
    data: { failedLoginAttempts: { increment: 1 } },
    select: { failedLoginAttempts: true },
  });

  if (user.failedLoginAttempts >= maxAttempts) {
    const lockedUntil = new Date(Date.now() + lockoutDurationMs);
    await prisma.user.update({ where: { id }, data: { lockedUntil } });
    return { failedLoginAttempts: user.failedLoginAttempts, lockedUntil };
  }

  return { failedLoginAttempts: user.failedLoginAttempts, lockedUntil: null };
};

/** Reset the lockout state — called on every successful login. */
export const resetFailedLogins = async (id: string): Promise<void> => {
  await prisma.user.update({
    where: { id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
};

// ---------------------------------------------------------------------------
// MFA (TOTP)
// ---------------------------------------------------------------------------

/** Stage a pending MFA secret (not yet enabled — enabled only after the setup code is verified). */
export const setPendingMfaSecret = async (id: string, encryptedSecret: string): Promise<void> => {
  await prisma.user.update({ where: { id }, data: { mfaSecret: encryptedSecret, mfaEnabled: false } });
};

export const enableMfa = async (id: string, backupCodeHashes: string[]): Promise<void> => {
  await prisma.user.update({
    where: { id },
    data: { mfaEnabled: true, mfaBackupCodes: backupCodeHashes },
  });
};

export const disableMfa = async (id: string): Promise<void> => {
  await prisma.user.update({
    where: { id },
    data: { mfaEnabled: false, mfaSecret: null, mfaBackupCodes: [] },
  });
};

/** Remove one consumed backup code, leaving the rest intact. */
export const consumeMfaBackupCode = async (id: string, usedHash: string): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id }, select: { mfaBackupCodes: true } });
  if (!user) return;
  await prisma.user.update({
    where: { id },
    data: { mfaBackupCodes: user.mfaBackupCodes.filter((h) => h !== usedHash) },
  });
};

const SEARCHABLE_FIELDS: Array<keyof PrismaUser> = ['firstName', 'lastName', 'email'];

export const findMany = async (
  options: QueryOptions,
): Promise<{ items: User[]; total: number }> => {
  const where: Prisma.UserWhereInput = { isDeleted: false };

  // filters (typed keys only)
  if (typeof options.filters.role === 'string') where.role = options.filters.role as UserRole;
  if (typeof options.filters.isActive === 'boolean') where.isActive = options.filters.isActive;

  // search
  if (options.search) {
    where.OR = SEARCHABLE_FIELDS.map((f) => ({
      [f]: { contains: options.search, mode: 'insensitive' },
    })) as Prisma.UserWhereInput['OR'];
  }

  const [rows, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip: options.skip,
      take: options.limit,
      orderBy: { [options.sortBy]: options.sortOrder },
    }),
    prisma.user.count({ where }),
  ]);

  return { items: rows.map(toUser), total };
};
