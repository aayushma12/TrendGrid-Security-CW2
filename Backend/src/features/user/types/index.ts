import { UserRole } from '../constants';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  avatarUrl?: string;
  avatarPublicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  passwordChangedAt: Date;
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes: string[];
}
