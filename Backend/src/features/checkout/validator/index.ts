import { z } from 'zod';

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

export const previewCheckoutSchema = z.object({
  couponCode: z.string().trim().min(1).max(32).optional(),
});

export const placeOrderSchema = z.object({
  couponCode: z.string().trim().min(1).max(32).optional(),
  /** COD is the only supported method today; extend the enum when a gateway lands. */
  paymentMethod: z.enum(['COD']).default('COD'),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  customerNote: z.string().trim().max(1000).optional(),
});
