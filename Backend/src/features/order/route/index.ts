import { Router } from 'express';

import { defineRoutes } from '../../../utils/defineRoute';

import {
  cancelOrderController,
  deleteOrderController,
  getMyOrdersController,
  getOrderController,
  getOrderInvoiceController,
  getOrdersController,
  refundOrderController,
  restoreOrderController,
  trackOrderController,
  updateOrderController,
  updateOrderStatusController,
  updatePaymentStatusController,
} from '../controller';
import {
  cancelOrderSchema,
  listOrdersQuerySchema,
  orderIdParamsSchema,
  refundOrderSchema,
  trackOrderParamsSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
} from '../validator';

const router = Router();

defineRoutes(router, [
  // Admin: list all orders and full management
  { method: 'get',    path: '/',           auth: 'ADMIN', schema: { query: listOrdersQuerySchema },                            handler: getOrdersController },
  { method: 'put',    path: '/:id',        auth: 'ADMIN', schema: { params: orderIdParamsSchema, body: updateOrderSchema },    handler: updateOrderController },
  { method: 'delete', path: '/:id',        auth: 'ADMIN', schema: { params: orderIdParamsSchema },                            handler: deleteOrderController },
  { method: 'patch',  path: '/:id/status', auth: 'ADMIN', schema: { params: orderIdParamsSchema, body: updateOrderStatusSchema }, handler: updateOrderStatusController },
  { method: 'patch',  path: '/:id/payment',auth: 'ADMIN', schema: { params: orderIdParamsSchema, body: updatePaymentStatusSchema }, handler: updatePaymentStatusController },
  { method: 'patch',  path: '/:id/refund', auth: 'ADMIN', schema: { params: orderIdParamsSchema, body: refundOrderSchema },    handler: refundOrderController },
  { method: 'post',   path: '/:id/restore',auth: 'ADMIN', schema: { params: orderIdParamsSchema },                            handler: restoreOrderController },

  // Authenticated: any logged-in user can view/track/cancel their own order (service enforces ownership)
  { method: 'get',  path: '/me',                auth: 'authenticated', schema: { query: listOrdersQuerySchema },                             handler: getMyOrdersController },
  { method: 'get',  path: '/track/:identifier',  auth: 'authenticated', schema: { params: trackOrderParamsSchema },                           handler: trackOrderController },
  { method: 'get',  path: '/:id',                auth: 'authenticated', schema: { params: orderIdParamsSchema },                             handler: getOrderController },
  { method: 'get',  path: '/:id/invoice',        auth: 'authenticated', schema: { params: orderIdParamsSchema },                             handler: getOrderInvoiceController },
  { method: 'post', path: '/:id/cancel',         auth: 'authenticated', schema: { params: orderIdParamsSchema, body: cancelOrderSchema },     handler: cancelOrderController },
]);

export default router;
