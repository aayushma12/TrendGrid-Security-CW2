/**
 * DTOs — the ONLY shapes the outside world sees.
 * Never leak the raw User (which may include passwordHash) out of the service.
 */
import { UserRole } from '../constants';
import { User } from '../types';

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  mfaEnabled: boolean;
  mfaMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export const toUserResponseDto = (user: User): UserResponseDto => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  role: user.role,
  isActive: user.isActive,
  avatarUrl: user.avatarUrl,
  mfaEnabled: user.mfaEnabled,
  mfaMethod: user.mfaMethod,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});
