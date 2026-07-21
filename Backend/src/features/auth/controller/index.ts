import { Request, Response } from 'express';

import { success, created } from '../../../utils/response';

import * as authService from '../service';
import { AUTH_MESSAGES } from '../constants';

const contextOf = (req: Request) => ({ ip: req.ip, userAgent: req.get('user-agent') ?? undefined });

export const loginController = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.login(req.body, contextOf(req));
  if ('mfaRequired' in result) {
    success(res, result, AUTH_MESSAGES.MFA_REQUIRED);
    return;
  }
  success(res, result, AUTH_MESSAGES.LOGIN_SUCCESS);
};

export const mfaVerifyLoginController = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.verifyMfaLogin(req.body.mfaToken, req.body.code, contextOf(req));
  success(res, result, AUTH_MESSAGES.LOGIN_SUCCESS);
};

export const registerController = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.register(req.body, contextOf(req));
  created(res, result, AUTH_MESSAGES.REGISTER_SUCCESS);
};

export const refreshController = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.refresh(req.body.refreshToken, contextOf(req));
  success(res, result, AUTH_MESSAGES.REFRESH_SUCCESS);
};

export const logoutController = async (req: Request, res: Response): Promise<void> => {
  await authService.logout(req.user!.id, req.body?.refreshToken);
  success(res, null, AUTH_MESSAGES.LOGOUT_SUCCESS);
};

export const logoutAllController = async (req: Request, res: Response): Promise<void> => {
  await authService.logoutAll(req.user!.id);
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

export const mfaDisableController = async (req: Request, res: Response): Promise<void> => {
  await authService.disableMfa(req.user!.id, req.body.currentPassword);
  success(res, null, AUTH_MESSAGES.MFA_DISABLED_SUCCESS);
};
