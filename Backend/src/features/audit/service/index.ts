import type { Prisma } from '@prisma/client';

import type { PaginationMeta, QueryOptions } from '../../../types';
import { buildPaginationMeta } from '../../../utils/queryOptions';
import { logger } from '../../../utils/logger';
import * as auditRepo from '../repository';
import type { AuditLogResponseDto } from '../dto';
import { toAuditLogResponseDto } from '../dto';
import type { AuditLogStatus } from '../types';

export interface RecordAuditLogInput {
  userId?: string | null;
  action: string;
  ipAddress?: string | null;
  status: AuditLogStatus;
  /** Only non-sensitive identifiers/context (ids, emails, amounts, reasons).
   *  NEVER pass passwords, OTPs, access/refresh tokens, or card data here. */
  metadata?: Record<string, unknown>;
}

/**
 * Best-effort audit write — deliberately never throws. Recording an audit
 * row is a side effect of the action it describes (a login, a payment); a
 * transient DB hiccup while writing the audit row must not fail that action.
 */
export const recordAuditLog = async (input: RecordAuditLogInput): Promise<void> => {
  try {
    await auditRepo.create({
      userId: input.userId ?? null,
      action: input.action,
      ipAddress: input.ipAddress ?? null,
      status: input.status,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    });
  } catch (err) {
    logger.error(`Failed to record audit log action=${input.action}: ${(err as Error).message}`);
  }
};

export const getAuditLogs = async (
  options: QueryOptions,
): Promise<{ items: AuditLogResponseDto[]; meta: PaginationMeta }> => {
  const { items, total } = await auditRepo.findMany(options);
  return {
    items: items.map(toAuditLogResponseDto),
    meta: buildPaginationMeta(total, options.page, options.limit),
  };
};
