/**
 * Every route MUST be registered via defineRoute — this is what makes the
 * "tunnel" invariant. defineRoute forces auth + validate + asyncHandler on
 * every handler; you cannot opt out.
 */
import { Router } from 'express';

import { defineRoutes } from '../../../utils/defineRoute';
import { memoryUploader } from '../../../config/cloudinary';
import {
  createUserController,
  deleteUserController,
  exportMyDataController,
  getUserController,
  getUsersController,
  importMyDataController,
  removeUserAvatarController,
  resetUserMfaController,
  updateOwnProfileController,
  updateUserController,
  uploadUserAvatarController,
} from '../controller';
import {
  createUserSchema,
  importProfileSchema,
  listUsersQuerySchema,
  updateOwnProfileSchema,
  updateUserSchema,
  userIdParamsSchema,
} from '../validator';

const router = Router();

defineRoutes(router, [
  {
    method: 'get',
    path: '/',
    // Listing every user exposes PII (name/email/phone) across accounts —
    // restrict to staff, same as the mutating routes below. Customers have
    // no legitimate use case for this endpoint.
    auth: ['ADMIN', 'EDITOR'],
    schema: { query: listUsersQuerySchema },
    handler: getUsersController,
  },
  {
    method: 'post',
    path: '/',
    auth: 'ADMIN',
    schema: { body: createUserSchema },
    handler: createUserController,
  },
  {
    method: 'patch',
    path: '/me',
    // Self-service profile edit — allowlisted to firstName/lastName/phoneNumber
    // by updateOwnProfileSchema itself (no role/isActive field exists to guard
    // against here), unlike the staff-only PUT /:id below.
    auth: 'authenticated',
    schema: { body: updateOwnProfileSchema },
    handler: updateOwnProfileController,
  },
  {
    method: 'get',
    path: '/me/export',
    auth: 'authenticated',
    schema: {},
    handler: exportMyDataController,
  },
  {
    method: 'post',
    path: '/me/import',
    auth: 'authenticated',
    schema: { body: importProfileSchema },
    handler: importMyDataController,
  },
  {
    method: 'get',
    path: '/:id',
    auth: 'authenticated',
    schema: { params: userIdParamsSchema },
    handler: getUserController,
  },
  {
    method: 'put',
    path: '/:id',
    auth: ['ADMIN', 'EDITOR'],
    schema: { params: userIdParamsSchema, body: updateUserSchema },
    handler: updateUserController,
  },
  {
    method: 'delete',
    path: '/:id',
    auth: 'ADMIN',
    schema: { params: userIdParamsSchema },
    handler: deleteUserController,
  },
  {
    method: 'post',
    path: '/:id/avatar',
    auth: 'authenticated',
    schema: { params: userIdParamsSchema },
    middleware: [memoryUploader().single('avatar')],
    handler: uploadUserAvatarController,
  },
  {
    method: 'delete',
    path: '/:id/avatar',
    auth: 'authenticated',
    schema: { params: userIdParamsSchema },
    handler: removeUserAvatarController,
  },
  {
    method: 'post',
    path: '/:id/mfa/reset',
    // Support/lockout-recovery action — a user with no authenticator access
    // and no backup codes has no self-service path back into their own
    // account, so this has to be admin-initiated. Audited + alerted (see
    // adminResetMfa) since it's a meaningful security boundary change.
    auth: 'ADMIN',
    schema: { params: userIdParamsSchema },
    handler: resetUserMfaController,
  },
]);

export default router;
