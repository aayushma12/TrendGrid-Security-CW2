import { Router } from 'express';

import { defineRoutes } from '../../../utils/defineRoute';
import { esewaFailureController, esewaSuccessController, initiateEsewaController } from '../controller';
import { initiateEsewaSchema, esewaCallbackQuerySchema } from '../validator';

const router = Router();

defineRoutes(router, [
  { method: 'post', path: '/esewa/initiate', auth: 'authenticated', schema: { body: initiateEsewaSchema }, handler: initiateEsewaController },
  // eSewa redirects the CUSTOMER'S BROWSER here (not a server-to-server
  // callback) with a query string, so these must stay 'public' — the
  // handler itself verifies the signed payload before trusting anything.
  { method: 'get', path: '/esewa/success', auth: 'public', schema: { query: esewaCallbackQuerySchema }, handler: esewaSuccessController },
  { method: 'get', path: '/esewa/failure', auth: 'public', schema: {}, handler: esewaFailureController },
]);

export default router;
