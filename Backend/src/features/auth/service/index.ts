import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ms from 'ms';

import { env } from '../../../config/env';
import { UnauthorizedError, BadRequestError } from '../../../utils/errors';
import { signAccessToken, signRefreshToken } from '../../../middleware/auth';
import { logger } from '../../../utils/logger';
import { encryptField, decryptField, hashUserAgent, hashToken, generateToken } from '../../../utils/crypto';
import { verifyCaptcha } from '../../../utils/captcha';
import { sendSecurityAlert } from '../../../utils/securityAlert';
import { sendEmail } from '../../../utils/email';
import { recordAuditLog } from '../../audit/service';
import { AUDIT_ACTIONS } from '../../audit/constants';

import { findByEmail, findById, findByIdWithSecurity } from '../../user/repository';
import * as userRepo from '../../user/repository';
import * as userService from '../../user/service';
import { CreateUserDto, UserResponseDto, toUserResponseDto } from '../../user/dto';
import { User, UserWithPassword } from '../../user/types';

import * as refreshTokenRepo from '../repository/refreshToken';
import * as passwordHistoryRepo from '../repository/passwordHistory';
import * as passwordResetRepo from '../repository/passwordReset';
import * as emailOtpRepo from '../repository/emailOtp';
import * as emailVerificationRepo from '../repository/emailVerification';
import { buildOtpAuthUrl, generateBackupCodes, generateMfaSecret, matchBackupCode, verifyTotp } from '../utils/mfa';
import { generateEmailOtpCode, hashEmailOtpCode, verifyEmailOtpCode } from '../utils/emailOtp';
import {
  buildResetEmailHtml,
  buildResetEmailText,
  buildMfaOtpEmailHtml,
  buildMfaOtpEmailText,
  buildVerifyEmailHtml,
  buildVerifyEmailText,
} from '../utils/emailTemplates';

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
  /** Tells the frontend whether to prompt for an authenticator-app code or
   *  tell the user a code was emailed (and offer a resend). */
  mfaMethod: 'totp' | 'email';
}

const MFA_CHALLENGE_EXPIRES_IN = '5m';
// Kept equal to MFA_CHALLENGE_EXPIRES_IN on purpose — an email OTP that
// outlives the challenge token it belongs to would just fail at the JWT
// verify step anyway, so there's no reason to give it a separate lifetime.
const MFA_EMAIL_OTP_TTL_MIN = 5;

const sendVerificationEmail = async (user: Pick<User, 'id' | 'email' | 'firstName'>) => {
  await emailVerificationRepo.invalidateAllForUser(user.id);

  const rawToken = generateToken();
  await emailVerificationRepo.create({
    userId: user.id,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + env.security.emailVerificationTokenTtlMin * 60 * 1000),
  });

  const verifyUrl = `${env.frontendUrl}/verify-email?token=${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your TrendGrid email address',
    text: buildVerifyEmailText(user.firstName, verifyUrl, env.security.emailVerificationTokenTtlMin),
    html: buildVerifyEmailHtml(user.firstName, verifyUrl, env.security.emailVerificationTokenTtlMin),
  });
};

const sendMfaOtpEmail = async (user: Pick<User, 'id' | 'email' | 'firstName'>, purpose: emailOtpRepo.EmailOtpPurpose) => {
  await emailOtpRepo.invalidateAllForUser(user.id, purpose);

  const code = generateEmailOtpCode();
  await emailOtpRepo.create({
    userId: user.id,
    codeHash: await hashEmailOtpCode(code),
    purpose,
    expiresAt: new Date(Date.now() + MFA_EMAIL_OTP_TTL_MIN * 60 * 1000),
  });

  await sendEmail({
    to: user.email,
    subject: 'Your TrendGrid verification code',
    text: buildMfaOtpEmailText(user.firstName, code, MFA_EMAIL_OTP_TTL_MIN),
    html: buildMfaOtpEmailHtml(user.firstName, code, MFA_EMAIL_OTP_TTL_MIN),
  });
};

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
    void recordAuditLog({
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      status: 'FAILURE',
      ipAddress: ctx.ip,
      metadata: { reason: 'unknown_email' },
    });
    throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    logger.warn(`Login blocked — account locked email=${user.email} id=${user.id}`);
    void recordAuditLog({
      userId: user.id, action: AUDIT_ACTIONS.LOGIN_FAILED, status: 'FAILURE', ipAddress: ctx.ip,
      metadata: { reason: 'account_locked' },
    });
    throw new UnauthorizedError(AUTH_MESSAGES.ACCOUNT_LOCKED, [
      { field: 'email', message: AUTH_MESSAGES.ACCOUNT_LOCKED, code: 'ACCOUNT_LOCKED' },
    ]);
  }

  if (!user.isActive) {
    void recordAuditLog({
      userId: user.id, action: AUDIT_ACTIONS.LOGIN_FAILED, status: 'FAILURE', ipAddress: ctx.ip,
      metadata: { reason: 'account_disabled' },
    });
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
    void recordAuditLog({
      userId: user.id, action: AUDIT_ACTIONS.LOGIN_FAILED, status: 'FAILURE', ipAddress: ctx.ip,
      metadata: { reason: 'invalid_password', failedLoginAttempts },
    });
    if (lockedUntil) {
      sendSecurityAlert('account_locked', { userId: user.id, email: user.email, lockedUntil });
    }
    throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
  }

  await userRepo.resetFailedLogins(user.id);

  if (user.mfaEnabled) {
    const method = user.mfaMethod === 'email' ? 'email' : 'totp';
    if (method === 'email') {
      await sendMfaOtpEmail(user, 'mfa_login');
    }
    logger.info(`MFA challenge issued email=${user.email} id=${user.id} method=${method}`);
    return { mfaRequired: true, mfaToken: signMfaChallengeToken(user.id), mfaMethod: method };
  }

  logger.info(`User login email=${user.email} id=${user.id}`);
  void recordAuditLog({ userId: user.id, action: AUDIT_ACTIONS.LOGIN, status: 'SUCCESS', ipAddress: ctx.ip });
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
  if (!user || !user.mfaEnabled) {
    throw new UnauthorizedError(AUTH_MESSAGES.INVALID_MFA_TOKEN);
  }

  let ok: boolean;
  if (user.mfaMethod === 'email') {
    const activeOtp = await emailOtpRepo.findActive(user.id, 'mfa_login');
    ok = Boolean(activeOtp) && (await verifyEmailOtpCode(code, activeOtp!.codeHash));
    if (ok) await emailOtpRepo.consume(activeOtp!.id);
  } else {
    if (!user.mfaSecret) throw new UnauthorizedError(AUTH_MESSAGES.INVALID_MFA_TOKEN);
    ok = verifyTotp(code, decryptField(user.mfaSecret));
  }

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
    void recordAuditLog({
      userId: user.id, action: AUDIT_ACTIONS.LOGIN_FAILED, status: 'FAILURE', ipAddress: ctx.ip,
      metadata: { reason: 'invalid_mfa_code' },
    });
    throw new UnauthorizedError(AUTH_MESSAGES.INVALID_MFA_CODE);
  }

  logger.info(`MFA verified, login completed id=${user.id}`);
  void recordAuditLog({
    userId: user.id, action: AUDIT_ACTIONS.LOGIN, status: 'SUCCESS', ipAddress: ctx.ip, metadata: { mfa: true },
  });
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
  await userRepo.enableMfa(user.id, 'totp', hashes);
  logger.info(`MFA enabled (totp) id=${user.id}`);
  return { backupCodes: plaintext };
};

/** Email MFA has no persistent secret to stage — enrollment just proves the
 *  user can read their own inbox, so setup and send happen in one step. */
export const setupMfaEmail = async (userId: string): Promise<void> => {
  const user = await findByIdWithSecurity(userId);
  if (!user) throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
  if (user.mfaEnabled) throw new BadRequestError(AUTH_MESSAGES.MFA_ALREADY_ENABLED);

  await sendMfaOtpEmail(user, 'mfa_enroll');
  logger.info(`Email MFA enrollment code sent id=${user.id}`);
};

export const confirmMfaEmailSetup = async (
  userId: string,
  code: string,
): Promise<{ backupCodes: string[] }> => {
  const user = await findByIdWithSecurity(userId);
  if (!user) throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
  if (user.mfaEnabled) throw new BadRequestError(AUTH_MESSAGES.MFA_ALREADY_ENABLED);

  const activeOtp = await emailOtpRepo.findActive(user.id, 'mfa_enroll');
  if (!activeOtp || !(await verifyEmailOtpCode(code, activeOtp.codeHash))) {
    throw new BadRequestError(AUTH_MESSAGES.INVALID_MFA_CODE);
  }
  await emailOtpRepo.consume(activeOtp.id);

  const { plaintext, hashes } = await generateBackupCodes();
  await userRepo.enableMfa(user.id, 'email', hashes);
  logger.info(`MFA enabled (email) id=${user.id}`);
  return { backupCodes: plaintext };
};

/** Re-send the login-challenge OTP — the mfaToken alone identifies the user,
 *  so this stays public/rate-limited like mfa/verify rather than requiring auth
 *  (the user isn't logged in yet, that's the whole point of the challenge). */
export const resendMfaLoginOtp = async (mfaToken: string): Promise<void> => {
  let userId: string;
  try {
    const payload = jwt.verify(mfaToken, env.jwt.secret) as { id?: string; mfaPending?: boolean };
    if (!payload?.id || !payload.mfaPending) throw new Error('Not an MFA challenge token');
    userId = payload.id;
  } catch {
    throw new UnauthorizedError(AUTH_MESSAGES.INVALID_MFA_TOKEN);
  }

  const user = await findByIdWithSecurity(userId);
  if (!user || !user.mfaEnabled || user.mfaMethod !== 'email') {
    throw new UnauthorizedError(AUTH_MESSAGES.INVALID_MFA_TOKEN);
  }

  await sendMfaOtpEmail(user, 'mfa_login');
  logger.info(`Email MFA login code resent id=${user.id}`);
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
  dto: CreateUserDto & { captchaToken?: string; acceptTerms?: boolean },
  ctx: RequestContext = {},
): Promise<AuthTokensResponse> => {
  const captchaOk = await verifyCaptcha(dto.captchaToken, ctx.ip);
  if (!captchaOk) throw new BadRequestError(AUTH_MESSAGES.CAPTCHA_FAILED);

  const user = await userService.createUser({ ...dto, role: 'USER', termsAcceptedAt: new Date() });
  logger.info(`User registered email=${user.email} id=${user.id}`);
  void recordAuditLog({ userId: user.id, action: AUDIT_ACTIONS.REGISTER, status: 'SUCCESS', ipAddress: ctx.ip });
  const full = await findById(user.id);
  if (!full) throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);

  await sendVerificationEmail(full);

  return buildAuthResponse(full, ctx, new Date());
};

export const verifyEmail = async (token: string): Promise<void> => {
  const row = await emailVerificationRepo.findValidByTokenHash(hashToken(token));
  if (!row) throw new BadRequestError(AUTH_MESSAGES.INVALID_VERIFICATION_TOKEN);

  await userRepo.markEmailVerified(row.userId);
  await emailVerificationRepo.markUsed(row.id);
  await emailVerificationRepo.invalidateAllForUser(row.userId);
  logger.info(`Email verified id=${row.userId}`);
};

export const resendVerificationEmail = async (userId: string): Promise<void> => {
  const user = await findById(userId);
  if (!user) throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
  if (user.isEmailVerified) throw new BadRequestError(AUTH_MESSAGES.EMAIL_ALREADY_VERIFIED);

  await sendVerificationEmail(user);
  logger.info(`Verification email resent id=${user.id}`);
};

export const refresh = async (
  refreshToken: string | undefined,
  ctx: RequestContext = {},
): Promise<AuthTokensResponse> => {
  if (!refreshToken) throw new UnauthorizedError(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);

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
  void recordAuditLog({ userId, action: AUDIT_ACTIONS.LOGOUT, status: 'SUCCESS' });
};

/** Forced invalidation of every active session for this user — "log out everywhere". */
export const logoutAll = async (userId: string): Promise<void> => {
  await refreshTokenRepo.revokeAllForUser(userId);
  logger.warn(`All sessions revoked id=${userId}`);
  void recordAuditLog({ userId, action: AUDIT_ACTIONS.LOGOUT, status: 'SUCCESS', metadata: { allSessions: true } });
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

/**
 * Forgot password — always resolves the same way whether or not the email
 * matches an account, so a caller can never use this endpoint to discover
 * which emails are registered (the same anti-enumeration principle as login).
 */
export const requestPasswordReset = async (
  dto: { email: string; captchaToken?: string },
  ctx: RequestContext = {},
): Promise<void> => {
  const captchaOk = await verifyCaptcha(dto.captchaToken, ctx.ip);
  if (!captchaOk) throw new BadRequestError(AUTH_MESSAGES.CAPTCHA_FAILED);

  const normalizedEmail = dto.email.toLowerCase().trim();
  const user = await findByEmail(normalizedEmail);

  if (user) {
    // Only one active reset link per account — a stale token from an
    // earlier request (possibly seen by someone else, e.g. a shared inbox)
    // should stop working the moment a fresh one is issued.
    await passwordResetRepo.invalidateAllForUser(user.id);

    const rawToken = generateToken();
    await passwordResetRepo.create({
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + env.security.passwordResetTokenTtlMin * 60 * 1000),
    });

    const resetUrl = `${env.frontendUrl}/reset-password?token=${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your TrendGrid password',
      text: buildResetEmailText(user.firstName, resetUrl, env.security.passwordResetTokenTtlMin),
      html: buildResetEmailHtml(user.firstName, resetUrl, env.security.passwordResetTokenTtlMin),
    });

    logger.info(`Password reset requested id=${user.id} ip=${ctx.ip ?? 'unknown'}`);
    sendSecurityAlert('password_reset_requested', {
      userId: user.id,
      email: user.email,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
  } else {
    // Same log level either way — an attacker timing/log-diffing this
    // endpoint shouldn't be able to tell a real email from a fake one.
    logger.info(`Password reset requested for unknown email ip=${ctx.ip ?? 'unknown'} (no-op)`);
  }
};

/**
 * Non-destructive check used by the reset-password page to show a "this
 * link is no longer valid" state *before* rendering the form, instead of
 * only discovering that on submit. Deliberately does not consume/mark the
 * token — only the actual reset (below) does that.
 */
export const checkResetToken = async (token: string): Promise<boolean> => {
  const resetRow = await passwordResetRepo.findValidByTokenHash(hashToken(token));
  return Boolean(resetRow);
};

export const resetPassword = async (
  token: string,
  newPassword: string,
  ctx: RequestContext = {},
): Promise<void> => {
  const resetRow = await passwordResetRepo.findValidByTokenHash(hashToken(token));
  if (!resetRow) {
    logger.warn(`Password reset attempted with invalid/expired token ip=${ctx.ip ?? 'unknown'}`);
    sendSecurityAlert('password_reset_invalid_token', { ip: ctx.ip, userAgent: ctx.userAgent });
    throw new BadRequestError(AUTH_MESSAGES.INVALID_RESET_TOKEN);
  }

  const user = await findByIdWithSecurity(resetRow.userId);
  if (!user) throw new BadRequestError(AUTH_MESSAGES.INVALID_RESET_TOKEN);

  const matchesCurrent = await bcrypt.compare(newPassword, user.passwordHash);
  if (matchesCurrent) {
    throw new BadRequestError(AUTH_MESSAGES.PASSWORD_REUSED, [
      { field: 'newPassword', message: AUTH_MESSAGES.PASSWORD_REUSED },
    ]);
  }

  if (env.security.passwordHistoryCount > 0) {
    const recent = await passwordHistoryRepo.recentHashes(user.id, env.security.passwordHistoryCount);
    for (const oldHash of recent) {
      // eslint-disable-next-line no-await-in-loop
      if (await bcrypt.compare(newPassword, oldHash)) {
        throw new BadRequestError(AUTH_MESSAGES.PASSWORD_REUSED, [
          { field: 'newPassword', message: AUTH_MESSAGES.PASSWORD_REUSED },
        ]);
      }
    }
  }

  // MFA (mfaEnabled/mfaSecret/mfaBackupCodes) is never touched here — a
  // password reset changes the password only; a user with MFA enrolled
  // still has to complete it on their next login.
  const passwordHash = await bcrypt.hash(newPassword, env.jwt.saltRounds);
  await passwordHistoryRepo.record(user.id, user.passwordHash);
  await userService.updatePassword(user.id, passwordHash);

  await passwordResetRepo.markUsed(resetRow.id);
  await passwordResetRepo.invalidateAllForUser(user.id);

  // Same trust-boundary logic as a normal password change — a reset means
  // any existing session (including one an attacker may hold) is killed.
  await refreshTokenRepo.revokeAllForUser(user.id);
  await userRepo.resetFailedLogins(user.id);

  logger.warn(`Password reset completed id=${user.id} ip=${ctx.ip ?? 'unknown'}`);
  sendSecurityAlert('password_reset_completed', { userId: user.id, ip: ctx.ip, userAgent: ctx.userAgent });
};
