/**
 * Security-event audit trail for authenticated write operations.
 *
 * requestLogger (morgan) already logs every HTTP request; this adds a
 * second, purpose-built line for state-changing calls made by an
 * authenticated principal — who did what, to which resource, with what
 * result — which is what an incident review actually needs. Emitted after
 * the response is sent so the final status code is known.
 *
 * Never logs request/response bodies, so tokens/passwords/MFA codes can't
 * leak through here even by accident.
 */
import { Request, Response, NextFunction } from 'express';

import { logger } from '../utils/logger';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const auditLog = (req: Request, res: Response, next: NextFunction): void => {
  if (!WRITE_METHODS.has(req.method)) return next();

  res.on('finish', () => {
    if (!req.user) return; // unauthenticated writes (login/register) are logged by the auth service itself
    const outcome = res.statusCode < 400 ? 'success' : 'failure';
    logger.info(
      `AUDIT actor=${req.user.id} role=${req.user.role} action=${req.method} path=${req.originalUrl} status=${res.statusCode} outcome=${outcome} ip=${req.ip}`,
    );
  });

  next();
};
