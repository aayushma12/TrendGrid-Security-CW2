/**
 * JWT auth middleware. Wired into every non-public route by defineRoute.
 */
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { UserRole } from '../features/user/constants';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

const extractToken = (req: Request): string | null => {
  const header = req.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  if (typeof req.query.token === 'string') return req.query.token;
  return null;
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = extractToken(req);
  if (!token) return next(new UnauthorizedError('Missing bearer token'));

  try {
    const payload = jwt.verify(token, env.jwt.secret) as JwtPayload & AuthUser;
    if (!payload?.id || !payload?.role) throw new Error('Malformed token');
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    next(new UnauthorizedError((err as Error).message || 'Invalid token'));
  }
};

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Requires role: ${roles.join(', ')}`));
    }
    next();
  };

export const signAccessToken = (user: AuthUser): string =>
  jwt.sign(user, env.jwt.secret, { expiresIn: env.jwt.expiresIn as any });

/**
 * `jti` is the id of the RefreshToken row backing this token (see
 * features/auth/repository/refreshToken.ts) — it's what makes rotation and
 * server-side revocation possible for an otherwise-stateless JWT.
 */
export const signRefreshToken = (user: Pick<AuthUser, 'id'>, jti: string): string =>
  jwt.sign({ ...user, jti }, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn as any });
