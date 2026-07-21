import { z } from 'zod';

export const updateStoreSettingsSchema = z
  .object({
    /** Fraction, e.g. 0.13 = 13% VAT. */
    taxRate: z.coerce.number().min(0, 'Tax rate cannot be negative').max(1, 'Tax rate is a fraction (0–1)').optional(),
    shippingFlatRate: z.coerce.number().min(0).max(100000).optional(),
    freeShippingThreshold: z.coerce.number().min(0).max(10000000).optional(),
    codEnabled: z.boolean().optional(),
    currency: z.string().trim().length(3, 'Use a 3-letter currency code').toUpperCase().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' });
