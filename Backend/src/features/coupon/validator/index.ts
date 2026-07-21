import { z } from 'zod';

import { COUPON_CODE_MAX, COUPON_CODE_MIN, COUPON_SORT_FIELDS, COUPON_TYPES } from '../constants';

const uuid = z.string().uuid('Must be a valid UUID');
const isoDate = z.string().datetime('Must be an ISO datetime string');
const money = z.coerce.number().nonnegative().max(9_999_999_999.99);

const codeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(COUPON_CODE_MIN)
  .max(COUPON_CODE_MAX)
  .regex(/^[A-Z0-9_-]+$/, 'Only A-Z, 0-9, "_" and "-" allowed');

export const createCouponSchema = z.object({
  code: codeSchema,
  description: z.string().trim().max(500).optional(),
  type: z.enum(COUPON_TYPES),
  value: money,
  minimumPurchase: money.optional(),
  maximumDiscount: money.optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  perUserLimit: z.coerce.number().int().positive().optional(),
  startDate: isoDate,
  endDate: isoDate,
  isActive: z.boolean().optional().default(true),
});

export const updateCouponSchema = z
  .object({
    code: codeSchema.optional(),
    description: z.string().trim().max(500).nullable().optional(),
    type: z.enum(COUPON_TYPES).optional(),
    value: money.optional(),
    minimumPurchase: money.nullable().optional(),
    maximumDiscount: money.nullable().optional(),
    usageLimit: z.coerce.number().int().positive().nullable().optional(),
    perUserLimit: z.coerce.number().int().positive().nullable().optional(),
    startDate: isoDate.optional(),
    endDate: isoDate.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });

export const couponIdParamsSchema = z.object({ id: uuid });

export const listCouponsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).optional(),
  type: z.enum(COUPON_TYPES).optional(),
  isActive: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .optional(),
  sortBy: z.enum(COUPON_SORT_FIELDS).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const validateCouponQuerySchema = z.object({
  code: codeSchema,
  cartTotal: money,
});

export const validateCouponBodySchema = validateCouponQuerySchema;
