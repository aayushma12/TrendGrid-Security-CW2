import { Router } from 'express';

import { defineRoutes } from '../../../utils/defineRoute';
import { getAuditLogsController } from '../controller';
import { listAuditLogsQuerySchema } from '../validator';

const router = Router();

defineRoutes(router, [
  {
    method: 'get',
    path: '/',
    // Audit logs can reveal account activity across the whole user base —
    // admin-only, same reasoning as GET /users.
    auth: 'ADMIN',
    schema: { query: listAuditLogsQuerySchema },
    handler: getAuditLogsController,
  },
]);

export default router;
