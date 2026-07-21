import { z } from 'zod';

import {
  BARCODE_MAX,
  BULK_MAX_IDS,
  CHAR_NAME_MAX,
  CHAR_NAME_MIN,
  CHAR_VALUE_MAX,
  CHAR_VALUE_MIN,
  CURRENCY_LEN,
  PRODUCT_DESC_MAX,
  PRODUCT_NAME_MAX,
  PRODUCT_NAME_MIN,
  PRODUCT_SHORT_DESC_MAX,
  PRODUCT_SORT_FIELDS,
  PRODUCT_STATUSES,
  PRODUCT_TOGGLE_FLAGS,
  SKU_MAX,
  SKU_MIN,
} from '../constants';

const uuid = z.string().uuid('Must be a valid UUID');
const stringArray = z.array(z.string().trim().min(1).max(100)).max(50);
const colorArray = z.array(
  z.object({
    name: z.string().trim().min(1).max(100),
    hexCode: z.string().trim().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex code'),
  })
).max(50);

const nameSchema = z.string().trim().min(PRODUCT_NAME_MIN).max(PRODUCT_NAME_MAX);
const shortDescSchema = z.string().trim().max(PRODUCT_SHORT_DESC_MAX);
const descSchema = z.string().trim().max(PRODUCT_DESC_MAX);
const price = z.coerce.number().positive('Price must be greater than 0').max(9_999_999_999.99);
const optionalPrice = z.coerce.number().nonnegative().max(9_999_999_999.99);
const currency = z.string().trim().length(CURRENCY_LEN).toUpperCase();

// ---------- Product ----------

export const createProductSchema = z.object({
  name: nameSchema,
  description: descSchema.optional(),
  shortDescription: shortDescSchema.optional(),
  basePrice: price,
  discountPrice: optionalPrice.optional(),
  currency: currency.optional(),
  categoryId: uuid,
  brand: z.string().trim().max(200).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),

  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isRecommended: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),

  sizes: stringArray.optional(),
  colors: colorArray.optional(),
  tags: stringArray.optional(),
  labels: stringArray.optional(),
  collections: stringArray.optional(),
}).refine(
  (v) => v.discountPrice === undefined || v.discountPrice <= v.basePrice,
  { message: 'Discount price cannot exceed base price', path: ['discountPrice'] },
);

export const updateProductSchema = z
  .object({
    name: nameSchema.optional(),
    description: descSchema.nullable().optional(),
    shortDescription: shortDescSchema.nullable().optional(),
    basePrice: price.optional(),
    discountPrice: optionalPrice.nullable().optional(),
    currency: currency.optional(),
    categoryId: uuid.optional(),
    brand: z.string().trim().max(200).nullable().optional(),
    status: z.enum(PRODUCT_STATUSES).optional(),

    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isRecommended: z.boolean().optional(),
    isTrending: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' })
  .refine(
    (v) => v.discountPrice === undefined || v.discountPrice === null || v.basePrice === undefined || v.discountPrice <= v.basePrice,
    { message: 'Discount price cannot exceed base price', path: ['discountPrice'] },
  );

export const updateProductStatusSchema = z.object({ status: z.enum(PRODUCT_STATUSES) });

/** PATCH /:id/flags/:flag body */
export const updateProductFlagSchema = z.object({ value: z.boolean() });
export const productFlagParamsSchema = z.object({
  id: uuid,
  flag: z.enum(PRODUCT_TOGGLE_FLAGS),
});

export const updateAssignmentsSchema = z
  .object({
    sizes: stringArray.optional(),
    colors: colorArray.optional(),
    tags: stringArray.optional(),
    labels: stringArray.optional(),
    collections: stringArray.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one array required' });

export const productIdParamsSchema = z.object({ id: uuid });

const boolQueryParam = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((v) => (typeof v === 'boolean' ? v : v === 'true'));

/** A filter that accepts either one value (?color=Red) or several via a repeated key (?color=Red&color=Blue). */
const multiValueQueryParam = z.union([
  z.string().trim().min(1),
  z.array(z.string().trim().min(1).max(100)).min(1).max(50),
]);

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).optional(),
  categoryId: uuid.optional(),
  brand: multiValueQueryParam.optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().positive().optional(),
  isActive: boolQueryParam.optional(),
  isFeatured: boolQueryParam.optional(),
  isRecommended: boolQueryParam.optional(),
  isTrending: boolQueryParam.optional(),
  isBestSeller: boolQueryParam.optional(),
  isNewArrival: boolQueryParam.optional(),
  onSale: boolQueryParam.optional(),
  inStock: boolQueryParam.optional(),
  // Multi-value filters against the tags/labels/collections/sizes arrays and
  // the variant color relation — see repository/product.ts findMany. `label`
  // also doubles as the gender filter (see PRODUCT_FILTER_FIELDS).
  tag: multiValueQueryParam.optional(),
  label: multiValueQueryParam.optional(),
  collection: multiValueQueryParam.optional(),
  color: multiValueQueryParam.optional(),
  size: multiValueQueryParam.optional(),
  curatedCollectionId: z.string().uuid().optional(),
  sortBy: z.enum(PRODUCT_SORT_FIELDS).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});


/** Params for slot-based product image upload: /products/:id/images/:slot */
export const IMAGE_SLOTS = ['thumbnail', 'extra1', 'extra2', 'extra3'] as const;
export type ImageSlot = typeof IMAGE_SLOTS[number];
export const imageSlotParamsSchema = z.object({
  id: uuid,
  slot: z.enum(IMAGE_SLOTS),
});

// ---------- Characteristic ----------

export const createCharacteristicSchema = z.object({
  name: z.string().trim().min(CHAR_NAME_MIN).max(CHAR_NAME_MAX),
  value: z.string().trim().min(CHAR_VALUE_MIN).max(CHAR_VALUE_MAX),
  position: z.coerce.number().int().nonnegative().optional(),
});

export const updateCharacteristicSchema = z
  .object({
    name: z.string().trim().min(CHAR_NAME_MIN).max(CHAR_NAME_MAX).optional(),
    value: z.string().trim().min(CHAR_VALUE_MIN).max(CHAR_VALUE_MAX).optional(),
    position: z.coerce.number().int().nonnegative().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });

export const characteristicParamsSchema = z.object({ id: uuid, charId: uuid });

// ---------- Variant ----------

const skuSchema = z.string().trim().min(SKU_MIN).max(SKU_MAX);
const barcodeSchema = z.string().trim().max(BARCODE_MAX);
const colorSchema = z.string().trim().max(100);
const sizeSchema = z.string().trim().max(50);

export const createVariantSchema = z.object({
  color: colorSchema.optional(),
  size: sizeSchema.optional(),
  sku: skuSchema,
  barcode: barcodeSchema.optional(),
  price: price,
  discountPrice: optionalPrice.optional(),
  stock: z.coerce.number().int().nonnegative().optional(),
  lowStockThreshold: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
}).refine(
  (v) => v.discountPrice === undefined || v.discountPrice <= v.price,
  { message: 'Discount price cannot exceed price', path: ['discountPrice'] },
);

export const updateVariantSchema = z
  .object({
    color: colorSchema.nullable().optional(),
    size: sizeSchema.nullable().optional(),
    sku: skuSchema.optional(),
    barcode: barcodeSchema.nullable().optional(),
    price: price.optional(),
    discountPrice: optionalPrice.nullable().optional(),
    stock: z.coerce.number().int().nonnegative().optional(),
    lowStockThreshold: z.coerce.number().int().nonnegative().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' })
  .refine(
    (v) => v.discountPrice === undefined || v.discountPrice === null || v.price === undefined || v.discountPrice <= v.price,
    { message: 'Discount price cannot exceed price', path: ['discountPrice'] },
  );

export const variantParamsSchema = z.object({ id: uuid, variantId: uuid });
export const variantImageParamsSchema = z.object({ id: uuid, variantId: uuid, imageId: uuid });

// ---------- Bulk operations ----------

const idList = z.array(uuid).min(1, 'At least one id is required').max(BULK_MAX_IDS, `A single bulk request can include at most ${BULK_MAX_IDS} ids.`);

export const bulkStatusSchema = z.object({ ids: idList, status: z.enum(PRODUCT_STATUSES) });
export const bulkActiveSchema = z.object({ ids: idList, isActive: z.boolean() });
export const bulkDeleteSchema = z.object({ ids: idList });

// ---------- CSV import ----------

export const importProductsQuerySchema = z.object({
  // Dry run validates + reports without writing anything — lets an admin
  // preview what a file would do before committing to it.
  dryRun: z.union([z.boolean(), z.enum(['true', 'false'])]).transform((v) => (typeof v === 'boolean' ? v : v === 'true')).optional(),
});

/** One row of a parsed CSV import, before it's turned into a CreateProductDto. */
export const importRowSchema = z.object({
  name: nameSchema,
  description: descSchema.optional().or(z.literal('')),
  shortDescription: shortDescSchema.optional().or(z.literal('')),
  basePrice: price,
  discountPrice: optionalPrice.optional().or(z.literal('')),
  currency: currency.optional().or(z.literal('')),
  categoryName: z.string().trim().min(1, 'categoryName is required'),
  brand: z.string().trim().max(200).optional().or(z.literal('')),
  sizes: z.string().optional().or(z.literal('')), // "S,M,L" — split + trimmed by the importer
  tags: z.string().optional().or(z.literal('')),
  labels: z.string().optional().or(z.literal('')),
  collections: z.string().optional().or(z.literal('')),
});

// ---------- Stats ----------

export const catalogStatsQuerySchema = z.object({
  recentDays: z.coerce.number().int().positive().max(365).optional(),
  lowStockThreshold: z.coerce.number().int().nonnegative().optional(),
});
