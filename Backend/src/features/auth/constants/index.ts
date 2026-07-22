import { UserRole } from '../../user/constants';

export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully.',
  REGISTER_SUCCESS: 'Registered successfully.',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  LOGOUT_ALL_SUCCESS: 'Logged out of all sessions successfully.',
  REFRESH_SUCCESS: 'Token refreshed successfully.',
  CHANGE_PASSWORD_SUCCESS: 'Password changed successfully.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_DISABLED: 'Account is disabled.',
  ACCOUNT_LOCKED: 'Account temporarily locked due to too many failed login attempts. Try again later.',
  INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token.',
  REFRESH_TOKEN_REUSE_DETECTED: 'Session invalidated — this refresh token was already used. Please log in again.',
  WRONG_CURRENT_PASSWORD: 'Current password is incorrect.',
  PASSWORD_REUSED: 'You cannot reuse one of your recent passwords.',
  CAPTCHA_FAILED: 'CAPTCHA verification failed. Please try again.',
  MFA_REQUIRED: 'MFA verification required.',
  MFA_SETUP_SUCCESS: 'MFA enrolled. Store your backup codes somewhere safe.',
  MFA_EMAIL_CODE_SENT: 'A verification code has been sent to your email.',
  MFA_DISABLED_SUCCESS: 'MFA disabled.',
  INVALID_MFA_CODE: 'Invalid MFA code.',
  INVALID_MFA_TOKEN: 'Invalid or expired MFA challenge. Please log in again.',
  MFA_ALREADY_ENABLED: 'MFA is already enabled on this account.',
  MFA_NOT_ENABLED: 'MFA is not enabled on this account.',
  FORGOT_PASSWORD_SENT: 'If an account exists for that email, a password reset link has been sent.',
  INVALID_RESET_TOKEN: 'This reset link is invalid or has expired. Please request a new one.',
  RESET_PASSWORD_SUCCESS: 'Password reset successfully. Please log in with your new password.',
  EMAIL_VERIFICATION_SENT: 'Verification email sent. Please check your inbox.',
  EMAIL_VERIFIED_SUCCESS: 'Email verified successfully.',
  EMAIL_ALREADY_VERIFIED: 'This email is already verified.',
  INVALID_VERIFICATION_TOKEN: 'This verification link is invalid or has expired. Please request a new one.',
} as const;

/** Role-based permissions returned on login for client-side UI gating. */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ['*'],
  EDITOR: [
    'users:read',
    'products:read',
    'products:write',
    'categories:read',
    'categories:write',
    'orders:read',
    'orders:write',
    'coupons:read',
    'reviews:read',
    'reviews:moderate',
  ],
  USER: [
    'cart:read',
    'cart:write',
    'checkout:write',
    'orders:read',
    'orders:create',
    'reviews:write',
    'coupons:validate',
  ],
};

export const getPermissionsForRole = (role: UserRole): string[] => ROLE_PERMISSIONS[role];
