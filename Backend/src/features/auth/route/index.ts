import { Router } from 'express';

import { defineRoutes } from '../../../utils/defineRoute';
import { loginRateLimit, mfaRateLimit, refreshRateLimit, registerRateLimit } from '../../../middleware/rateLimit';

import {
  changePasswordController,
  loginController,
  logoutAllController,
  logoutController,
  mfaConfirmSetupController,
  mfaDisableController,
  mfaSetupController,
  mfaVerifyLoginController,
  refreshController,
  registerController,
} from '../controller';
import {
  changePasswordSchema,
  loginSchema,
  logoutSchema,
  mfaDisableSchema,
  mfaVerifyLoginSchema,
  mfaVerifySetupSchema,
  refreshSchema,
  registerSchema,
} from '../validator';

const router = Router();

defineRoutes(router, [
  {
    method: 'post',
    path: '/login',
    auth: 'public',
    preAuth: [loginRateLimit],
    schema: { body: loginSchema },
    handler: loginController,
  },
  {
    method: 'post',
    path: '/mfa/verify',
    auth: 'public',
    preAuth: [mfaRateLimit],
    schema: { body: mfaVerifyLoginSchema },
    handler: mfaVerifyLoginController,
  },
  {
    method: 'post',
    path: '/register',
    auth: 'public',
    preAuth: [registerRateLimit],
    schema: { body: registerSchema },
    handler: registerController,
  },
  {
    method: 'post',
    path: '/refresh',
    auth: 'public',
    preAuth: [refreshRateLimit],
    schema: { body: refreshSchema },
    handler: refreshController,
  },
  {
    method: 'post',
    path: '/logout',
    auth: 'authenticated',
    schema: { body: logoutSchema },
    handler: logoutController,
  },
  {
    method: 'post',
    path: '/logout-all',
    auth: 'authenticated',
    schema: {},
    handler: logoutAllController,
  },
  {
    method: 'post',
    path: '/change-password',
    auth: 'authenticated',
    schema: { body: changePasswordSchema },
    handler: changePasswordController,
  },
  {
    method: 'post',
    path: '/mfa/setup',
    auth: 'authenticated',
    schema: {},
    handler: mfaSetupController,
  },
  {
    method: 'post',
    path: '/mfa/setup/confirm',
    auth: 'authenticated',
    preAuth: [mfaRateLimit],
    schema: { body: mfaVerifySetupSchema },
    handler: mfaConfirmSetupController,
  },
  {
    method: 'post',
    path: '/mfa/disable',
    auth: 'authenticated',
    schema: { body: mfaDisableSchema },
    handler: mfaDisableController,
  },
]);

export default router;
