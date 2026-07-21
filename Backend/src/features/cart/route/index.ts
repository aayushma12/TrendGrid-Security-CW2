import { Router } from 'express';

import { defineRoutes } from '../../../utils/defineRoute';

import {
  addCartItemController,
  clearCartController,
  getCartController,
  removeCartItemController,
  updateCartItemController,
} from '../controller';
import {
  addCartItemSchema,
  cartItemIdParamsSchema,
  updateCartItemSchema,
  userIdParamsSchema,
} from '../validator';

const router = Router();

// All cart operations require a logged-in user.
// The controller additionally verifies req.user.id === req.params.userId.
defineRoutes(router, [
  { method: 'get',    path: '/:userId',               auth: 'authenticated', schema: { params: userIdParamsSchema },                                  handler: getCartController },
  { method: 'post',   path: '/:userId/items',         auth: 'authenticated', schema: { params: userIdParamsSchema, body: addCartItemSchema },          handler: addCartItemController },
  { method: 'put',    path: '/:userId/items/:itemId', auth: 'authenticated', schema: { params: cartItemIdParamsSchema, body: updateCartItemSchema },   handler: updateCartItemController },
  { method: 'delete', path: '/:userId/items/:itemId', auth: 'authenticated', schema: { params: cartItemIdParamsSchema },                               handler: removeCartItemController },
  { method: 'delete', path: '/:userId',               auth: 'authenticated', schema: { params: userIdParamsSchema },                                   handler: clearCartController },
]);

export default router;
