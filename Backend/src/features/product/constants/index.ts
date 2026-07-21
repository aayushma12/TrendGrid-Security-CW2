export const PRODUCT_NAME_MIN = 2;
export const PRODUCT_NAME_MAX = 200;
export const PRODUCT_SHORT_DESC_MAX = 500;
export const PRODUCT_DESC_MAX = 10000;

export const CHAR_NAME_MIN = 1;
export const CHAR_NAME_MAX = 100;
export const CHAR_VALUE_MIN = 1;
export const CHAR_VALUE_MAX = 500;

export const SKU_MIN = 2;
export const SKU_MAX = 100;
export const BARCODE_MAX = 100;

export const CURRENCY_LEN = 3;
export const DEFAULT_CURRENCY = 'NPR';

export const PRODUCT_SORT_FIELDS = [
  'name', 'basePrice', 'createdAt', 'updatedAt',
] as const;

/** Filters coming off the query string. Boolean/string types are already normalized. */
export const PRODUCT_FILTER_FIELDS = [
  'categoryId', 'brand', 'status', 'priceMin', 'priceMax',
  'isActive', 'isFeatured', 'isRecommended',
  'isTrending', 'isBestSeller', 'isNewArrival',
] as const;

export const PRODUCT_THUMBNAIL_SUBFOLDER = 'products/images';
export const PRODUCT_VARIANT_SUBFOLDER = 'products/variants';

export const PRODUCT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type ProductStatusValue = (typeof PRODUCT_STATUSES)[number];

/** Boolean flags exposed through PATCH /:id/flags/:flag */
export const PRODUCT_TOGGLE_FLAGS = [
  'isFeatured', 'isRecommended', 'isTrending', 'isBestSeller', 'isNewArrival', 'isActive',
] as const;
export type ProductToggleFlag = (typeof PRODUCT_TOGGLE_FLAGS)[number];

export const PRODUCT_MESSAGES = {
  CREATED: 'Product created successfully.',
  UPDATED: 'Product updated successfully.',
  DELETED: 'Product deleted successfully.',
  RETRIEVED: 'Product retrieved successfully.',
  LISTED: 'Products retrieved successfully.',

  STATUS_UPDATED: 'Product status updated successfully.',
  FLAG_UPDATED: 'Product flag updated successfully.',
  ASSIGNMENTS_UPDATED: 'Product assignments updated successfully.',

  THUMB_UPLOADED: 'Image uploaded successfully.',
  THUMB_REMOVED: 'Image removed successfully.',
  THUMB_REQUIRED: 'Image file is required (field: "image").',
  THUMB_MISSING: 'This product has no image to remove.',

  CHAR_CREATED: 'Characteristic added successfully.',
  CHAR_UPDATED: 'Characteristic updated successfully.',
  CHAR_DELETED: 'Characteristic removed successfully.',
  CHAR_LISTED: 'Characteristics retrieved successfully.',
  CHAR_NOT_FOUND: 'Characteristic not found on this product.',
  CHAR_DUPLICATE: 'This product already has a characteristic with that name.',

  VARIANT_CREATED: 'Variant created successfully.',
  VARIANT_UPDATED: 'Variant updated successfully.',
  VARIANT_DELETED: 'Variant deleted successfully.',
  VARIANT_LISTED: 'Variants retrieved successfully.',
  VARIANT_RETRIEVED: 'Variant retrieved successfully.',
  VARIANT_NOT_FOUND: 'Variant not found on this product.',
  VARIANT_DUP_COMBO: 'A variant with the same color and size already exists for this product.',
  VARIANT_DUP_SKU: 'A variant with this SKU already exists.',
  VARIANT_DUP_BARCODE: 'A variant with this barcode already exists.',

  VARIANT_IMAGE_UPLOADED: 'Variant image uploaded successfully.',
  VARIANT_IMAGE_REMOVED: 'Variant image removed successfully.',
  VARIANT_IMAGE_REQUIRED: 'At least one image is required (field: "images").',
  VARIANT_IMAGE_NOT_FOUND: 'Variant image not found on this variant.',

  NOT_FOUND: 'Product not found.',
  CATEGORY_NOT_FOUND: 'Category not found.',
  INVALID_FLAG: 'Invalid flag name.',
} as const;

export const VARIANT_IMAGES_MAX_FILES = 10;

// ------------- Computed merchandising windows -------------

/** Sales window for the best-sellers ranking. */
export const BEST_SELLER_WINDOW_DAYS = 90;
/** Short sales-velocity window for trending. */
export const TRENDING_WINDOW_DAYS = 7;
/** How long a product counts as a new arrival. */
export const NEW_ARRIVAL_WINDOW_DAYS = 30;
/** Default number of products in a storefront strip. */
export const STOREFRONT_STRIP_LIMIT = 12;
