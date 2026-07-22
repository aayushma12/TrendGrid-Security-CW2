import { z } from 'zod';

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  status: z.enum(['SUCCESS', 'FAILURE']).optional(),
});
