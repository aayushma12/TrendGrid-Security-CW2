import { Request, Response } from 'express';

import { success, created } from '../../../utils/response';
import { setAuthCookies, setCsrfCookie, clearAuthCookies, REFRESH_TOKEN_COOKIE } from '../../../utils/cookies';

import * as authService from '../service';
import { AUTH_MESSAGES } from '../constants';

const contextOf = (req: Request) => ({ ip: req.ip, userAgent: req.get('user-agent') ?? undefined });

/** Refresh token: cookie takes priority once a session exists; body is the
 *  fallback for non-browser clients (Swagger/Postman/mobile) that don't hold cookies. */
const refreshTokenOf = (req: Request): string | undefined =>
  req.cookies?.[REFRESH_TOKEN_COOKIE] ?? req.body?.refreshToken;

export const loginController = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.login(req.body, contextOf(req));
  if ('mfaRequired' in result) {
    success(res, result, AUTH_MESSAGES.MFA_REQUIRED);
    return;
  }
  setAuthCookies(res, result);
  setCsrfCookie(res);
  success(res, result, AUTH_MESSAGES.LOGIN_SUCCESS);
};

export const mfaVerifyLoginController = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.verifyMfaLogin(req.body.mfaToken, req.body.code, contextOf(req));
  setAuthCookies(res, result);
  setCsrfCookie(res);
  success(res, result, AUTH_MESSAGES.LOGIN_SUCCESS);
};

export const registerController = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.register(req.body, contextOf(req));
  setAuthCookies(res, result);
  setCsrfCookie(res);
  created(res, result, AUTH_MESSAGES.REGISTER_SUCCESS);
};

export const refreshController = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.refresh(refreshTokenOf(req), contextOf(req));
  setAuthCookies(res, result);
  setCsrfCookie(res);
  success(res, result, AUTH_MESSAGES.REFRESH_SUCCESS);
};

/**
 * Lightweight "who am I" check — echoes the verified JWT payload, no DB hit.
 * Used by the Next.js frontend's edge middleware to make server-side
 * role-routing decisions (e.g. keep an ADMIN session out of the customer
 * area) without duplicating JWT verification/secrets into that app.
 */
export const meController = async (req: Request, res: Response): Promise<void> => {
  success(res, req.user, 'Current session.');
};

export const logoutController = async (req: Request, res: Response): Promise<void> => {
  await authService.logout(req.user!.id, refreshTokenOf(req));
  clearAuthCookies(res);
  success(res, null, AUTH_MESSAGES.LOGOUT_SUCCESS);
};

export const logoutAllController = async (req: Request, res: Response): Promise<void> => {
  await authService.logoutAll(req.user!.id);
  clearAuthCookies(res);
  success(res, null, AUTH_MESSAGES.LOGOUT_ALL_SUCCESS);
};

export const changePasswordController = async (req: Request, res: Response): Promise<void> => {
  await authService.changePassword(req.user!.id, req.body);
  success(res, null, AUTH_MESSAGES.CHANGE_PASSWORD_SUCCESS);
};

export const mfaSetupController = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.setupMfa(req.user!.id);
  success(res, result, 'Scan the QR code (or enter the secret) in your authenticator app, then confirm with a code.');
};

export const mfaConfirmSetupController = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.confirmMfaSetup(req.user!.id, req.body.code);
  success(res, result, AUTH_MESSAGES.MFA_SETUP_SUCCESS);
};

export const mfaSetupEmailController = async (req: Request, res: Response): Promise<void> => {
  await authService.setupMfaEmail(req.user!.id);
  success(res, null, AUTH_MESSAGES.MFA_EMAIL_CODE_SENT);
};

export const mfaConfirmEmailSetupController = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.confirmMfaEmailSetup(req.user!.id, req.body.code);
  success(res, result, AUTH_MESSAGES.MFA_SETUP_SUCCESS);
};

export const mfaResendController = async (req: Request, res: Response): Promise<void> => {
  await authService.resendMfaLoginOtp(req.body.mfaToken);
  success(res, null, AUTH_MESSAGES.MFA_EMAIL_CODE_SENT);
};

export const mfaDisableController = async (req: Request, res: Response): Promise<void> => {
  await authService.disableMfa(req.user!.id, req.body.currentPassword);
  success(res, null, AUTH_MESSAGES.MFA_DISABLED_SUCCESS);
};

export const forgotPasswordController = async (req: Request, res: Response): Promise<void> => {
  await authService.requestPasswordReset(req.body, contextOf(req));
  // Generic response regardless of outcome — see requestPasswordReset for why.
  success(res, null, AUTH_MESSAGES.FORGOT_PASSWORD_SENT);
};

/** GET check the reset-password page calls before rendering the form —
 *  read-only, never consumes the token. */
export const validateResetTokenController = async (req: Request, res: Response): Promise<void> => {
  const valid = await authService.checkResetToken(req.query.token as string);
  if (!valid) {
    success(res, { valid: false }, AUTH_MESSAGES.INVALID_RESET_TOKEN);
    return;
  }
  success(res, { valid: true }, 'Reset token is valid.');
};

export const resetPasswordController = async (req: Request, res: Response): Promise<void> => {
  await authService.resetPassword(req.body.token, req.body.newPassword, contextOf(req));
  success(res, null, AUTH_MESSAGES.RESET_PASSWORD_SUCCESS);
};

export const verifyEmailController = async (req: Request, res: Response): Promise<void> => {
  await authService.verifyEmail(req.body.token);
  success(res, null, AUTH_MESSAGES.EMAIL_VERIFIED_SUCCESS);
};

export const resendVerificationEmailController = async (req: Request, res: Response): Promise<void> => {
  await authService.resendVerificationEmail(req.user!.id);
  success(res, null, AUTH_MESSAGES.EMAIL_VERIFICATION_SENT);
};
