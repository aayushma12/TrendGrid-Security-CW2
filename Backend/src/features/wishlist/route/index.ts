import { Router } from 'express';

import { defineRoutes } from '../../../utils/defineRoute';

import {
  addWishlistItemController,
  clearWishlistController,
  getWishlistController,
  removeWishlistItemController,
} from '../controller';
import {
  addWishlistItemSchema,
  userIdParamsSchema,
  wishlistItemParamsSchema,
} from '../validator';

const router = Router();

// All wishlist operations require a logged-in user.
// The controller additionally verifies req.user.id === req.params.userId.
defineRoutes(router, [
  { method: 'get',    path: '/:userId',               auth: 'authenticated', schema: { params: userIdParamsSchema },                          handler: getWishlistController },
  { method: 'post',   path: '/:userId/items',          auth: 'authenticated', schema: { params: userIdParamsSchema, body: addWishlistItemSchema }, handler: addWishlistItemController },
  { method: 'delete', path: '/:userId/items/:productId', auth: 'authenticated', schema: { params: wishlistItemParamsSchema },                    handler: removeWishlistItemController },
  { method: 'delete', path: '/:userId',               auth: 'authenticated', schema: { params: userIdParamsSchema },                          handler: clearWishlistController },
]);

export default router;
