/**
 * Service — the ONLY place with business logic for the user feature.
 */
import bcrypt from 'bcrypt';

import type { QueryOptions, PaginationMeta } from '../../../types';
import { DuplicateError, NotFoundError, BadRequestError } from '../../../utils/errors';
import { deleteImage, replaceImage } from '../../../services/imageService';
import { buildPaginationMeta } from '../../../utils/queryOptions';
import { logger } from '../../../utils/logger';
import { sendSecurityAlert } from '../../../utils/securityAlert';
import * as userRepo from '../repository';
import type { CreateUserDto, UpdateUserDto, UserResponseDto} from '../dto';
import { toUserResponseDto } from '../dto';
import type { UserRole } from '../constants';
import { USER_AVATAR_SUBFOLDER } from '../constants';
import { env } from '../../../config/env';

import * as orderRepo from '../../order/repository';
import { toOrderResponseDto, type OrderResponseDto } from '../../order/dto';
import * as reviewRepo from '../../review/repository';
import { toReviewResponseDto, type ReviewResponseDto } from '../../review/dto';
import * as wishlistRepo from '../../wishlist/repository';
import { toWishlistResponseDto, type WishlistResponseDto } from '../../wishlist/dto';

const SALT_ROUNDS = env.jwt.saltRounds;

export const createUser = async (dto: CreateUserDto): Promise<UserResponseDto> => {
  const existing = await userRepo.findByEmail(dto.email);
  if (existing) {
    throw new DuplicateError('Email already registered', [
      { field: 'email', message: 'Email already in use' },
    ]);
  }

  if (dto.phoneNumber) {
    const phoneTaken = await userRepo.findByPhone(dto.phoneNumber);
    if (phoneTaken) {
      throw new DuplicateError('Phone number already registered', [
        { field: 'phoneNumber', message: 'Phone number already in use' },
      ]);
    }
  }

  const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
  const created = await userRepo.create({
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email,
    phoneNumber: dto.phoneNumber,
    passwordHash,
    role: (dto.role as UserRole) ?? 'USER',
    termsAcceptedAt: dto.termsAcceptedAt,
  });

  return toUserResponseDto(created);
};

export const getUserById = async (id: string): Promise<UserResponseDto> => {
  const user = await userRepo.findById(id);
  if (!user) throw new NotFoundError('User not found');
  return toUserResponseDto(user);
};

/**
 * Support-initiated MFA reset — for a user locked out of their own second
 * factor (lost authenticator, no backup codes) with no other way back in,
 * since the normal self-service disableMfa requires an authenticated
 * session + current password, which is exactly what they don't have.
 * ADMIN-only; clears whichever method (TOTP or email) was enrolled.
 */
export const adminResetMfa = async (targetUserId: string, actorId: string): Promise<UserResponseDto> => {
  const user = await userRepo.findById(targetUserId);
  if (!user) throw new NotFoundError('User not found');
  if (!user.mfaEnabled) throw new BadRequestError('This user does not have MFA enabled.');

  await userRepo.disableMfa(targetUserId);
  logger.warn(`MFA reset by admin actorId=${actorId} targetUserId=${targetUserId}`);
  sendSecurityAlert('admin_mfa_reset', { actorId, targetUserId, targetEmail: user.email });

  const updated = await userRepo.findById(targetUserId);
  return toUserResponseDto(updated!);
};

export const getUsers = async (
  options: QueryOptions,
): Promise<{ items: UserResponseDto[]; meta: PaginationMeta }> => {
  const { items, total } = await userRepo.findMany(options);
  return {
    items: items.map(toUserResponseDto),
    meta: buildPaginationMeta(total, options.page, options.limit),
  };
};

export const updateUser = async (id: string, dto: UpdateUserDto): Promise<UserResponseDto> => {
  if (dto.firstName !== undefined && dto.firstName.trim() === '') {
    throw new BadRequestError('First name cannot be empty', [
      { field: 'firstName', message: 'First name cannot be empty' },
    ]);
  }
  if (dto.lastName !== undefined && dto.lastName.trim() === '') {
    throw new BadRequestError('Last name cannot be empty', [
      { field: 'lastName', message: 'Last name cannot be empty' },
    ]);
  }

  const updated = await userRepo.update(id, dto);
  if (!updated) throw new NotFoundError('User not found');
  return toUserResponseDto(updated);
};

export const updatePassword = async (id: string, passwordHash: string): Promise<void> => {
  const ok = await userRepo.updatePassword(id, passwordHash);
  if (!ok) throw new NotFoundError('User not found');
};

export const deleteUser = async (id: string, deletedBy?: string): Promise<void> => {
  const user = await userRepo.findById(id);
  if (!user) throw new NotFoundError('User not found');
  if (user.avatarPublicId) await deleteImage(user.avatarPublicId);
  const removed = await userRepo.remove(id, deletedBy);
  if (!removed) throw new NotFoundError('User not found');
};

export const setUserAvatar = async (id: string, buffer: Buffer): Promise<UserResponseDto> => {
  const user = await userRepo.findById(id);
  if (!user) throw new NotFoundError('User not found');

  const stored = await replaceImage(user.avatarPublicId, buffer, USER_AVATAR_SUBFOLDER);
  const updated = await userRepo.update(id, {
    avatarUrl: stored.secureUrl,
    avatarPublicId: stored.publicId,
  });
  return toUserResponseDto(updated!);
};

export const removeUserAvatar = async (id: string): Promise<UserResponseDto> => {
  const user = await userRepo.findById(id);
  if (!user) throw new NotFoundError('User not found');
  if (!user.avatarPublicId) throw new BadRequestError('This user has no avatar to remove.');

  await deleteImage(user.avatarPublicId);
  const updated = await userRepo.update(id, { avatarUrl: null, avatarPublicId: null });
  return toUserResponseDto(updated!);
};

export interface UserDataExport {
  exportedAt: string;
  profile: UserResponseDto;
  orders: OrderResponseDto[];
  reviews: ReviewResponseDto[];
  wishlist: WishlistResponseDto;
}

/**
 * "Download my data" — a privacy export of everything the account owns.
 * Deliberately excludes anything not safe to hand back to the browser as
 * plain JSON: passwordHash, MFA secret/backup codes, refresh tokens.
 * UserResponseDto already omits those (see user/dto), so this is safe by
 * construction rather than by remembering to strip fields here.
 */
export const exportUserData = async (userId: string): Promise<UserDataExport> => {
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  const bigPage = { page: 1, limit: 1000, skip: 0, sortBy: 'createdAt', sortOrder: 'desc' as const, filters: {} };

  const [{ items: orders }, { items: reviews }, wishlist] = await Promise.all([
    orderRepo.findMany({ ...bigPage, sortBy: 'placedAt', filters: { userId } }),
    reviewRepo.findMany({ ...bigPage, filters: { userId } }),
    wishlistRepo.getOrCreate(userId),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    profile: toUserResponseDto(user),
    orders: orders.map(toOrderResponseDto),
    reviews: reviews.map(toReviewResponseDto),
    wishlist: toWishlistResponseDto(wishlist),
  };
};

/**
 * "Restore profile backup" — applies only the safe, self-service profile
 * fields (firstName/lastName/phoneNumber). The validator (importProfileSchema,
 * `.strict()`) already rejects a backup containing any other field before
 * this ever runs, so this is a thin wrapper over the same safe update path
 * as PATCH /users/me.
 */
export const importUserData = async (
  userId: string,
  dto: { profile: { firstName?: string; lastName?: string; phoneNumber?: string } },
): Promise<UserResponseDto> => updateUser(userId, dto.profile);
