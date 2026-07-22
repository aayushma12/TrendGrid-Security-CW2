/**
 * AuditLog repository — DATABASE ONLY.
 */
import { Prisma, AuditLog as PrismaAuditLog } from '@prisma/client';

import { prisma } from '../../../config/prisma';
import type { QueryOptions } from '../../../types';
import type { AuditLog, AuditLogStatus } from '../types';

const toAuditLog = (r: PrismaAuditLog): AuditLog => ({
  id: r.id,
  userId: r.userId ?? undefined,
  action: r.action,
  ipAddress: r.ipAddress ?? undefined,
  status: r.status as AuditLogStatus,
  metadata: (r.metadata as Record<string, unknown> | null) ?? undefined,
  createdAt: r.createdAt,
});

export interface CreateAuditLogRecord {
  userId?: string | null;
  action: string;
  ipAddress?: string | null;
  status: AuditLogStatus;
  metadata?: Prisma.InputJsonValue;
}

export const create = async (data: CreateAuditLogRecord): Promise<void> => {
  await prisma.auditLog.create({
    data: {
      userId: data.userId ?? null,
      action: data.action,
      ipAddress: data.ipAddress ?? null,
      status: data.status,
      metadata: data.metadata ?? Prisma.JsonNull,
    },
  });
};

export const findMany = async (
  options: QueryOptions,
): Promise<{ items: AuditLog[]; total: number }> => {
  const where: Prisma.AuditLogWhereInput = {};
  if (typeof options.filters.userId === 'string') where.userId = options.filters.userId;
  if (typeof options.filters.action === 'string') where.action = options.filters.action;
  if (typeof options.filters.status === 'string') where.status = options.filters.status as AuditLogStatus;

  const [rows, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      skip: options.skip,
      take: options.limit,
      orderBy: { [options.sortBy]: options.sortOrder },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items: rows.map(toAuditLog), total };
};
