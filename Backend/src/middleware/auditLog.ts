/**
 * Security-event audit trail for authenticated write operations.
 *
 * requestLogger (morgan) already logs every HTTP request; this adds a
 * second, purpose-built line for state-changing calls made by an
 * authenticated principal — who did what, to which resource, with what
 * result — which is what an incident review actually needs. Emitted after
 * the response is sent so the final status code is known. Also persists a
 * row to the AuditLog table (via recordAuditLog) so this is queryable, not
 * just console output — see features/audit.
 *
 * Never logs request/response bodies, so tokens/passwords/MFA codes can't
 * leak through here even by accident.
 */
import { Request, Response, NextFunction } from 'express';

import { logger } from '../utils/logger';
import { recordAuditLog } from '../features/audit/service';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const auditLog = (req: Request, res: Response, next: NextFunction): void => {
  if (!WRITE_METHODS.has(req.method)) return next();

  res.on('finish', () => {
    if (!req.user) return; // unauthenticated writes (login/register) are logged by the auth service itself
    const outcome = res.statusCode < 400 ? 'success' : 'failure';
    logger.info(
      `AUDIT actor=${req.user.id} role=${req.user.role} action=${req.method} path=${req.originalUrl} status=${res.statusCode} outcome=${outcome} ip=${req.ip}`,
    );
    void recordAuditLog({
      userId: req.user.id,
      action: `${req.method} ${req.route?.path ? req.baseUrl + req.route.path : req.originalUrl}`,
      ipAddress: req.ip,
      status: res.statusCode < 400 ? 'SUCCESS' : 'FAILURE',
      metadata: { statusCode: res.statusCode, role: req.user.role },
    });
  });

  next();
};
