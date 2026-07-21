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
  /** Whether MFA is enrolled — not sensitive itself (unlike the secret/backup codes), safe to expose in DTOs. */
  mfaEnabled: boolean;
  /** "totp" | "email" | null — which second factor is active. Safe to expose, same as mfaEnabled. */
  mfaMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  passwordChangedAt: Date;
  mfaSecret?: string;
  mfaBackupCodes: string[];
}
