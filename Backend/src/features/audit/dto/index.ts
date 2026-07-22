import type { AuditLog } from '../types';

export interface AuditLogResponseDto {
  id: string;
  userId?: string;
  action: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'FAILURE';
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export const toAuditLogResponseDto = (log: AuditLog): AuditLogResponseDto => ({
  id: log.id,
  userId: log.userId,
  action: log.action,
  ipAddress: log.ipAddress,
  status: log.status,
  metadata: log.metadata,
  createdAt: log.createdAt.toISOString(),
});
