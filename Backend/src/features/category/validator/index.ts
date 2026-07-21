import { z } from 'zod';

import {
  CATEGORY_BULK_MAX_IDS,
  CATEGORY_DESCRIPTION_MAX,
  CATEGORY_NAME_MAX,
  CATEGORY_NAME_MIN,
  CATEGORY_SORT_FIELDS,
} from '../constants';

const nameSchema = z
  .string()
  .trim()
  .min(CATEGORY_NAME_MIN, `Name must be at least ${CATEGORY_NAME_MIN} characters`)
  .max(CATEGORY_NAME_MAX, `Name must be at most ${CATEGORY_NAME_MAX} characters`);

const descriptionSchema = z
  .string()
  .trim()
  .max(CATEGORY_DESCRIPTION_MAX, `Description must be at most ${CATEGORY_DESCRIPTION_MAX} characters`);

const uuidSchema = z.string().uuid('Must be a valid UUID');

/** Image is NOT in body — it is set via POST /:id/image. */
export const createCategorySchema = z.object({
  name: nameSchema,
  description: descriptionSchema.optional(),
  parentCategoryId: uuidSchema.optional(),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updateCategorySchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.nullable().optional(),
    parentCategoryId: uuidSchema.nullable().optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field must be provided',
  });

export const updateCategoryStatusSchema = z.object({
  isActive: z.boolean(),
});

export const updateCategoryFeatureSchema = z.object({
  isFeatured: z.boolean(),
});

export const categoryIdParamsSchema = z.object({
  id: uuidSchema,
});

export const listCategoriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).optional(),
  isActive: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .optional(),
  isFeatured: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .optional(),
  parentCategoryId: z
    .union([uuidSchema, z.literal('null'), z.literal('')])
    .optional()
    .transform((v) => (v === 'null' || v === '' ? null : v)),
  sortBy: z.enum(CATEGORY_SORT_FIELDS).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;

// ---------- Bulk operations ----------

const idList = z.array(uuidSchema).min(1, 'At least one id is required').max(CATEGORY_BULK_MAX_IDS, `A single bulk request can include at most ${CATEGORY_BULK_MAX_IDS} ids.`);

export const bulkCategoryActiveSchema = z.object({ ids: idList, isActive: z.boolean() });
export const bulkCategoryDeleteSchema = z.object({ ids: idList });
