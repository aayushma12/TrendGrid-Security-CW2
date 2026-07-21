import { z } from 'zod';

import { ORDER_SORT_FIELDS, ORDER_STATUSES, PAYMENT_STATUSES } from '../constants';

const uuid = z.string().uuid('Must be a valid UUID');

const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30),
  addressLine1: z.string().trim().min(2).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().min(2).max(20),
  country: z.string().trim().min(2).max(100),
});

export const orderIdParamsSchema = z.object({ id: uuid });

/** Admin-editable fields only: items/totals/coupon are locked post-placement. */
export const updateOrderSchema = z
  .object({
    shippingAddress: addressSchema.optional(),
    billingAddress: addressSchema.optional(),
    customerNote: z.string().trim().max(1000).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });

/** Body accepted by PATCH /orders/:id/status — { status, note }. */
export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(PAYMENT_STATUSES),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const refundOrderSchema = z.object({
  note: z.string().trim().max(500).optional(),
  amount: z.coerce.number().positive('Refund amount must be positive').optional(),
  restock: z.boolean().optional(),
});

export const trackOrderParamsSchema = z.object({
  identifier: z.string().trim().min(4, 'Provide a valid tracking or order number').max(60),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).optional(),
  userId: uuid.optional(),
  productId: uuid.optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sortBy: z.enum(ORDER_SORT_FIELDS).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
