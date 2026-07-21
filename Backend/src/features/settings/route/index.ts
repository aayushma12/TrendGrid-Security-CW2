/**
 * Store settings routes — everything wired through defineRoutes so the tunnel
 * (auth + validate + asyncHandler) is applied to every handler.
 *
 * Auth matrix:
 *   public → GET (storefront needs currency / free-shipping threshold)
 *   ADMIN  → PUT (edit commerce settings)
 */
import { Router } from 'express';

import { defineRoutes } from '../../../utils/defineRoute';

import { getSettingsController, updateSettingsController } from '../controller';
import { updateStoreSettingsSchema } from '../validator';

const router = Router();

defineRoutes(router, [
  { method: 'get', path: '/', auth: 'public', schema: {}, handler: getSettingsController },
  { method: 'put', path: '/', auth: 'ADMIN', schema: { body: updateStoreSettingsSchema }, handler: updateSettingsController },
]);

export default router;
