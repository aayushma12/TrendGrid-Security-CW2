import type { Request, Response } from 'express';

import { paginated } from '../../../utils/response';
import { parseQueryOptions } from '../../../utils/queryOptions';
import * as auditService from '../service';
import { AUDIT_LOG_FILTER_FIELDS, AUDIT_LOG_SORT_FIELDS } from '../constants';

export const getAuditLogsController = async (req: Request, res: Response): Promise<void> => {
  const options = parseQueryOptions(req, {
    allowedSortFields: [...AUDIT_LOG_SORT_FIELDS],
    allowedFilters: [...AUDIT_LOG_FILTER_FIELDS],
  });
  const { items, meta } = await auditService.getAuditLogs(options);
  paginated(res, items, meta, 'Audit logs retrieved successfully.');
};
