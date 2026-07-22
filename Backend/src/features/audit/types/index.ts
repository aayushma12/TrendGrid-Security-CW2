export type AuditLogStatus = 'SUCCESS' | 'FAILURE';

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  ipAddress?: string;
  status: AuditLogStatus;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
