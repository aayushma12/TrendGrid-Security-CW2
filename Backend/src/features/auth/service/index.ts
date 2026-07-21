import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ms from 'ms';

import { env } from '../../../config/env';
import { UnauthorizedError, BadRequestError } from '../../../utils/errors';
import { signAccessToken, signRefreshToken } from '../../../middleware/auth';
import { logger } from '../../../utils/logger';
import { encryptField, decryptField, hashUserAgent } from '../../../utils/crypto';
import { verifyCaptcha } from '../../../utils/captcha';
import { sendSecurityAlert } from '../../../utils/securityAlert';

import { findByEmail, findById, findByIdWithSecurity } from '../../user/repository';
import * as userRepo from '../../user/repository';
import * as userService from '../../user/service';
import { CreateUserDto, UserResponseDto, toUserResponseDto } from '../../user/dto';
import { User, UserWithPassword } from '../../user/types';

import * as refreshTokenRepo from '../repository/refreshToken';
import * as passwordHistoryRepo from '../repository/passwordHistory';
import { buildOtpAuthUrl, generateBackupCodes, generateMfaSecret, matchBackupCode, verifyTotp } from '../utils/mfa';

import { AUTH_MESSAGES, getPermissionsForRole } from '../constants';

export interface RequestContext {
  ip?: string;
  userAgent?: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
  permissions: string[];
  passwordExpired: boolean;
}

export interface MfaChallengeResponse {
  mfaRequired: true;
  mfaToken: string;
}

const MFA_CHALLENGE_EXPIRES_IN = '5m';

const isPasswordExpired = (user: Pick<UserWithPassword, 'passwordChangedAt'>): boolean => {
  if (env.security.passwordMaxAgeDays <= 0) return false;
  const ageMs = Date.now() - user.passwordChangedAt.getTime();
  return ageMs > env.security.passwordMaxAgeDays * 24 * 60 * 60 * 1000;
};

const buildAuthResponse = async (
  user: User | UserWithPassword,
  ctx: RequestContext = {},
  passwordChangedAt?: Date,
): Promise<AuthTokensResponse> => {
  const authUser = { id: user.id, email: user.email, role: user.role };

  const refreshRow = await refreshTokenRepo.issue({
    userId: user.id,
    expiresAt: new Date(Date.now() + ms(env.jwt.refreshExpiresIn)),
    userAgentHash: hashUserAgent(ctx.userAgent),
    ipAddress: ctx.ip ?? null,
  });

  return {
    accessToken: signAccessToken(authUser),
    refreshToken: signRefreshToken(authUser, refreshRow.id),
    user: toUserResponseDto(user),
    permissions: getPermissionsForRole(user.role),
    passwordExpired: isPasswordExpired({
      passwordChangedAt: passwordChangedAt ?? (user as UserWithPassword).passwordChangedAt ?? new Date(),
    }),
  };
};

const signMfaChallengeToken = (userId: string): string =>
  jwt.sign({ id: userId, mfaPending: true }, env.jwt.secret, { expiresIn: MFA_CHALLENGE_EXPIRES_IN });

export const login = async (
  dto: { email: string; password: string; captchaToken?: string },
  ctx: RequestContext = {},
): Promise<AuthTokensResponse | MfaChallengeResponse> => {
  const captchaOk = await verifyCaptcha(dto.captchaToken, ctx.ip);
  if (!captchaOk) throw new BadRequestError(AUTH_MESSAGES.CAPTCHA_FAILED);

  const user = await findByEmail(dto.email.toLowerCase().trim());
  if (!user) {
    // Same generic error as a wrong password — don't leak whether the email exists.
    throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    logger.warn(`Login blocked — account locked email=${user.email} id=${user.id}`);
    throw new UnauthorizedError(AUTH_MESSAGES.ACCOUNT_LOCKED);
  }

  if (!user.isActive) {
    throw new UnauthorizedError(AUTH_MESSAGES.ACCOUNT_DISABLED);
  }

  const isValid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!isValid) {
    const { failedLoginAttempts, lockedUntil } = await userRepo.recordFailedLogin(
      user.id,
      env.security.lockoutMaxAttempts,
      env.security.lockoutDurationMin * 60 * 1000,
    );
    logger.warn(`Login failed email=${user.email} id=${user.id} attempts=${failedLoginAttempts}`);
    sendSecurityAlert('login_failed', { userId: user.id, email: user.email, failedLoginAttempts });
    if (lockedUntil) {
      sendSecurityAlert('account_locked', { userId: user.id, email: user.email, lockedUntil });
    }
    throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
  }

  await userRepo.resetFailedLogins(user.id);

  if (user.mfaEnabled) {
    logger.info(`MFA challenge issued email=${user.email} id=${user.id}`);
    return { mfaRequired: true, mfaToken: signMfaChallengeToken(user.id) };
  }

  logger.info(`User login email=${user.email} id=${user.id}`);
  return buildAuthResponse(user, ctx);
};

export const verifyMfaLogin = async (
  mfaToken: string,
  code: string,
  ctx: RequestContext = {},
): Promise<AuthTokensResponse> => {
  let userId: string;
  try {
    const payload = jwt.verify(mfaToken, env.jwt.secret) as { id?: string; mfaPending?: boolean };
    if (!payload?.id || !payload.mfaPending) throw new Error('Not an MFA challenge token');
    userId = payload.id;
  } catch {
    throw new UnauthorizedError(AUTH_MESSAGES.INVALID_MFA_TOKEN);
  }

  const user = await findByIdWithSecurity(userId);
  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    throw new UnauthorizedError(AUTH_MESSAGES.INVALID_MFA_TOKEN);
  }

  const secret = decryptField(user.mfaSecret);
  let ok = verifyTotp(code, secret);

  if (!ok) {
    const matchedHash = await matchBackupCode(code, user.mfaBackupCodes);
    if (matchedHash) {
      await userRepo.consumeMfaBackupCode(user.id, matchedHash);
      ok = true;
      logger.warn(`MFA backup code consumed id=${user.id}`);
    }
  }

  if (!ok) {
    logger.warn(`MFA verification failed id=${user.id}`);
    sendSecurityAlert('mfa_failed', { userId: user.id });
    throw new UnauthorizedError(AUTH_MESSAGES.INVALID_MFA_CODE);
  }

  logger.info(`MFA verified, login completed id=${user.id}`);
  return buildAuthResponse(user, ctx);
};

export const setupMfa = async (
  userId: string,
): Promise<{ secret: string; otpauthUrl: string }> => {
  const user = await findByIdWithSecurity(userId);
  if (!user) throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
  if (user.mfaEnabled) throw new BadRequestError(AUTH_MESSAGES.MFA_ALREADY_ENABLED);

  const secret = generateMfaSecret();
  await userRepo.setPendingMfaSecret(user.id, encryptField(secret));

  return { secret, otpauthUrl: buildOtpAuthUrl(user.email, secret) };
};

export const confirmMfaSetup = async (
  userId: string,
  code: string,
): Promise<{ backupCodes: string[] }> => {
  const user = await findByIdWithSecurity(userId);
  if (!user) throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
  if (user.mfaEnabled) throw new BadRequestError(AUTH_MESSAGES.MFA_ALREADY_ENABLED);
  if (!user.mfaSecret) throw new BadRequestError('Call MFA setup first.');

  const secret = decryptField(user.mfaSecret);
  if (!verifyTotp(code, secret)) throw new BadRequestError(AUTH_MESSAGES.INVALID_MFA_CODE);

  const { plaintext, hashes } = await generateBackupCodes();
  await userRepo.enableMfa(user.id, hashes);
  logger.info(`MFA enabled id=${user.id}`);
  return { backupCodes: plaintext };
};

export const disableMfa = async (userId: string, currentPassword: string): Promise<void> => {
  const user = await findByIdWithSecurity(userId);
  if (!user) throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
  if (!user.mfaEnabled) throw new BadRequestError(AUTH_MESSAGES.MFA_NOT_ENABLED);

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) throw new BadRequestError(AUTH_MESSAGES.WRONG_CURRENT_PASSWORD);

  await userRepo.disableMfa(user.id);
  logger.warn(`MFA disabled id=${user.id}`);
};

export const register = async (
  dto: CreateUserDto & { captchaToken?: string },
  ctx: RequestContext = {},
): Promise<AuthTokensResponse> => {
  const captchaOk = await verifyCaptcha(dto.captchaToken, ctx.ip);
  if (!captchaOk) throw new BadRequestError(AUTH_MESSAGES.CAPTCHA_FAILED);

  const user = await userService.createUser({ ...dto, role: 'USER' });
  logger.info(`User registered email=${user.email} id=${user.id}`);
  const full = await findById(user.id);
  if (!full) throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
  return buildAuthResponse(full, ctx, new Date());
};

export const refresh = async (
  refreshToken: string,
  ctx: RequestContext = {},
): Promise<AuthTokensResponse> => {
  let payload: { id?: string; jti?: string };
  try {
    payload = jwt.verify(refreshToken, env.jwt.refreshSecret) as { id?: string; jti?: string };
    if (!payload?.id || !payload.jti) throw new Error('Malformed refresh token');
  } catch {
    throw new UnauthorizedError(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
  }

  const tokenRow = await refreshTokenRepo.findById(payload.jti);
  if (!tokenRow || tokenRow.userId !== payload.id) {
    throw new UnauthorizedError(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
  }

  // Reuse detection: a token that's already revoked-and-replaced being presented
  // again means it either leaked or a prior rotation response was lost/stolen.
  // Treat as compromise: kill every session for this user.
  if (tokenRow.revokedAt) {
    logger.error(`Refresh token reuse detected userId=${payload.id} jti=${payload.jti}`);
    sendSecurityAlert('refresh_token_reuse', { userId: payload.id, jti: payload.jti });
    await refreshTokenRepo.revokeAllForUser(payload.id);
    throw new UnauthorizedError(AUTH_MESSAGES.REFRESH_TOKEN_REUSE_DETECTED);
  }

  if (tokenRow.expiresAt.getTime() < Date.now()) {
    throw new UnauthorizedError(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
  }

  const incomingUaHash = hashUserAgent(ctx.userAgent);
  if (tokenRow.userAgentHash && incomingUaHash && tokenRow.userAgentHash !== incomingUaHash) {
    // Soft binding: don't hard-fail (mobile clients / proxies legitimately vary
    // their UA string), but this is a meaningful signal worth surfacing.
    logger.warn(`Refresh token used from a different device/user-agent userId=${payload.id}`);
    sendSecurityAlert('refresh_token_reuse', {
      userId: payload.id,
      reason: 'user_agent_mismatch',
      jti: payload.jti,
    });
  }

  const user = await findById(payload.id);
  if (!user || !user.isActive) {
    throw new UnauthorizedError(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
  }

  const newRow = await refreshTokenRepo.issue({
    userId: user.id,
    expiresAt: new Date(Date.now() + ms(env.jwt.refreshExpiresIn)),
    userAgentHash: incomingUaHash,
    ipAddress: ctx.ip ?? null,
  });
  await refreshTokenRepo.rotate(tokenRow.id, newRow.id);

  logger.info(`Token refreshed id=${user.id}`);

  const authUser = { id: user.id, email: user.email, role: user.role };
  return {
    accessToken: signAccessToken(authUser),
    refreshToken: signRefreshToken(authUser, newRow.id),
    user: toUserResponseDto(user),
    permissions: getPermissionsForRole(user.role),
    passwordExpired: false,
  };
};

export const logout = async (userId: string, refreshToken?: string): Promise<void> => {
  if (refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, env.jwt.refreshSecret) as { id?: string; jti?: string };
      if (payload?.jti && payload.id === userId) {
        await refreshTokenRepo.revoke(payload.jti);
      }
    } catch {
      // Token already invalid/expired — nothing to revoke, not an error for logout.
    }
  }
  logger.info(`User logout id=${userId}`);
};

/** Forced invalidation of every active session for this user — "log out everywhere". */
export const logoutAll = async (userId: string): Promise<void> => {
  await refreshTokenRepo.revokeAllForUser(userId);
  logger.warn(`All sessions revoked id=${userId}`);
};

export const changePassword = async (
  userId: string,
  dto: { currentPassword: string; newPassword: string },
): Promise<void> => {
  const profile = await findById(userId);
  if (!profile) throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);

  const user = await findByEmail(profile.email);
  if (!user) throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);

  const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
  if (!isValid) {
    throw new BadRequestError(AUTH_MESSAGES.WRONG_CURRENT_PASSWORD, [
      { field: 'currentPassword', message: AUTH_MESSAGES.WRONG_CURRENT_PASSWORD },
    ]);
  }

  const matchesCurrent = await bcrypt.compare(dto.newPassword, user.passwordHash);
  if (matchesCurrent) {
    throw new BadRequestError(AUTH_MESSAGES.PASSWORD_REUSED, [
      { field: 'newPassword', message: AUTH_MESSAGES.PASSWORD_REUSED },
    ]);
  }

  if (env.security.passwordHistoryCount > 0) {
    const recent = await passwordHistoryRepo.recentHashes(userId, env.security.passwordHistoryCount);
    for (const oldHash of recent) {
      // eslint-disable-next-line no-await-in-loop
      if (await bcrypt.compare(dto.newPassword, oldHash)) {
        throw new BadRequestError(AUTH_MESSAGES.PASSWORD_REUSED, [
          { field: 'newPassword', message: AUTH_MESSAGES.PASSWORD_REUSED },
        ]);
      }
    }
  }

  const passwordHash = await bcrypt.hash(dto.newPassword, env.jwt.saltRounds);
  await passwordHistoryRepo.record(userId, user.passwordHash);
  await userService.updatePassword(userId, passwordHash);

  // A password change is a trust boundary — kill every other active session.
  await refreshTokenRepo.revokeAllForUser(userId);

  logger.warn(`Password changed id=${userId}`);
};
