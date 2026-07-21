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
  getUserController,
  getUsersController,
  removeUserAvatarController,
  updateUserController,
  uploadUserAvatarController,
} from '../controller';
import {
  createUserSchema,
  listUsersQuerySchema,
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
]);

export default router;
