import { Router } from 'express';

import { defineRoutes } from '../../../utils/defineRoute';
import { couponValidateRateLimit } from '../../../middleware/rateLimit';

import {
  createCouponController,
  deleteCouponController,
  getCouponController,
  getCouponsController,
  updateCouponController,
  validateCouponController,
  validateCouponPostController,
} from '../controller';
import {
  couponIdParamsSchema,
  createCouponSchema,
  listCouponsQuerySchema,
  updateCouponSchema,
  validateCouponBodySchema,
  validateCouponQuerySchema,
} from '../validator';

const router = Router();

defineRoutes(router, [
  // Validate is accessible to authenticated users (used during checkout).
  // Rate-limited — coupon codes are a brute-forceable secret.
  { method: 'get', path: '/validate', auth: 'authenticated', preAuth: [couponValidateRateLimit], schema: { query: validateCouponQuerySchema }, handler: validateCouponController },
  { method: 'post', path: '/validate', auth: 'authenticated', preAuth: [couponValidateRateLimit], schema: { body: validateCouponBodySchema }, handler: validateCouponPostController },
  // All coupon management requires ADMIN
  { method: 'get',    path: '/',    auth: 'ADMIN', schema: { query: listCouponsQuerySchema },                             handler: getCouponsController },
  { method: 'post',   path: '/',    auth: 'ADMIN', schema: { body: createCouponSchema },                                  handler: createCouponController },
  { method: 'get',    path: '/:id', auth: 'ADMIN', schema: { params: couponIdParamsSchema },                              handler: getCouponController },
  { method: 'put',    path: '/:id', auth: 'ADMIN', schema: { params: couponIdParamsSchema, body: updateCouponSchema },    handler: updateCouponController },
  { method: 'delete', path: '/:id', auth: 'ADMIN', schema: { params: couponIdParamsSchema },                              handler: deleteCouponController },
]);

export default router;
