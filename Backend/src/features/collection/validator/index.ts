import { z } from 'zod';

import {
  COLLECTION_DESCRIPTION_MAX,
  COLLECTION_NAME_MAX,
  COLLECTION_NAME_MIN,
  COLLECTION_PRODUCTS_MAX_IDS,
  COLLECTION_SORT_FIELDS,
} from '../constants';

const nameSchema = z
  .string()
  .trim()
  .min(COLLECTION_NAME_MIN, `Name must be at least ${COLLECTION_NAME_MIN} characters`)
  .max(COLLECTION_NAME_MAX, `Name must be at most ${COLLECTION_NAME_MAX} characters`);

const descriptionSchema = z
  .string()
  .trim()
  .max(COLLECTION_DESCRIPTION_MAX, `Description must be at most ${COLLECTION_DESCRIPTION_MAX} characters`);

const uuidSchema = z.string().uuid('Must be a valid UUID');

/** Image is NOT in body — it is set via POST /:id/image. */
export const createCollectionSchema = z.object({
  name: nameSchema,
  description: descriptionSchema.optional(),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.coerce.number().int().optional().default(0),
});

export const updateCollectionSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.nullable().optional(),
    isActive: z.boolean().optional(),
    displayOrder: z.coerce.number().int().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field must be provided' });

export const updateCollectionStatusSchema = z.object({ isActive: z.boolean() });

export const collectionIdParamsSchema = z.object({ id: uuidSchema });

export const listCollectionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).optional(),
  isActive: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .optional(),
  sortBy: z.enum(COLLECTION_SORT_FIELDS).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const productIdList = z
  .array(uuidSchema)
  .min(1, 'At least one product id is required')
  .max(COLLECTION_PRODUCTS_MAX_IDS, `A single request can include at most ${COLLECTION_PRODUCTS_MAX_IDS} product ids.`);

export const collectionProductIdsSchema = z.object({ productIds: productIdList });
