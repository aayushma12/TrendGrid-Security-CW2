/**
 * Service — the ONLY place with business logic for the user feature.
 */
import bcrypt from 'bcrypt';

import { QueryOptions, PaginationMeta } from '../../../types';
import { DuplicateError, NotFoundError, BadRequestError } from '../../../utils/errors';
import { deleteImage, replaceImage } from '../../../services/imageService';
import { buildPaginationMeta } from '../../../utils/queryOptions';

import * as userRepo from '../repository';
import { CreateUserDto, UpdateUserDto, UserResponseDto, toUserResponseDto } from '../dto';
import { USER_AVATAR_SUBFOLDER, UserRole } from '../constants';

import { env } from '../../../config/env';

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
  });

  return toUserResponseDto(created);
};

export const getUserById = async (id: string): Promise<UserResponseDto> => {
  const user = await userRepo.findById(id);
  if (!user) throw new NotFoundError('User not found');
  return toUserResponseDto(user);
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
