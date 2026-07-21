/**
 * defineRoute — the ONLY way to attach a handler.
 *
 * This wrapper makes the workflow doc's mandatory pipeline invariant:
 *
 *   [ authenticate ] → validate(schema) → asyncHandler(controller)
 *
 * A developer cannot register a route WITHOUT going through this factory
 * (ESLint import boundaries block direct express router usage in features).
 * `validate` and `asyncHandler` are required — you cannot opt out.
 *
 * Usage:
 *   defineRoute(router, {
 *     method: 'post',
 *     path: '/',
 *     schema: { body: createUserSchema },
 *     auth: 'user',                       // 'public' | 'user' | 'admin' | Role[]
 *     handler: createUserController,
 *     middleware: [uploader('users/avatars').single('avatar')],  // optional extras
 *   });
 */
import { Router, RequestHandler } from 'express';

import { validate, ValidationSchema } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { UserRole } from '../features/user/constants';

import { asyncHandler } from './asyncHandler';

export type AuthLevel = 'public' | 'authenticated' | UserRole | UserRole[];

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  /** zod schemas for body / query / params. Required — pass {} to accept anything (discouraged). */
  schema: ValidationSchema;
  /** 'public' skips auth; 'authenticated' requires a valid JWT; a role or role[] requires that role. */
  auth: AuthLevel;
  /**
   * Extra middleware inserted BEFORE auth/validation (e.g. rate limiters).
   * Runs first so abuse is throttled before touching the DB or even parsing
   * the request body.
   */
  preAuth?: RequestHandler[];
  /** Extra middleware (e.g. multer uploader) inserted BEFORE the handler. */
  middleware?: RequestHandler[];
  handler: (
    req: Parameters<RequestHandler>[0],
    res: Parameters<RequestHandler>[1],
    next: Parameters<RequestHandler>[2],
  ) => Promise<unknown>;
}

const authMiddleware = (auth: AuthLevel): RequestHandler[] => {
  if (auth === 'public') return [];
  if (auth === 'authenticated') return [requireAuth];
  const roles = Array.isArray(auth) ? auth : [auth];
  return [requireAuth, requireRole(...roles)];
};

export const defineRoute = (router: Router, def: RouteDefinition): void => {
  const chain: RequestHandler[] = [
    ...(def.preAuth ?? []),
    ...authMiddleware(def.auth),
    validate(def.schema),
    ...(def.middleware ?? []),
    asyncHandler(def.handler),
  ];
  router[def.method](def.path, ...chain);
};

/** Convenience: register many routes on the same router. */
export const defineRoutes = (router: Router, defs: RouteDefinition[]): void => {
  for (const d of defs) defineRoute(router, d);
};
