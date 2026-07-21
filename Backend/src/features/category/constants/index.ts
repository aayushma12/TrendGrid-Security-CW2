export const CATEGORY_NAME_MIN = 2;
export const CATEGORY_NAME_MAX = 100;
export const CATEGORY_DESCRIPTION_MAX = 500;

export const CATEGORY_SORT_FIELDS = ['createdAt', 'updatedAt', 'name'] as const;
export type CategorySortField = (typeof CATEGORY_SORT_FIELDS)[number];

export const CATEGORY_FILTER_FIELDS = ['isActive', 'isFeatured', 'parentCategoryId'] as const;

/** Cloudinary sub-folder (appended to `env.cloudinary.folder`, e.g. `fashion-store/categories`). */
export const CATEGORY_IMAGE_SUBFOLDER = 'categories';

export const CATEGORY_MESSAGES = {
  CREATED: 'Category created successfully.',
  UPDATED: 'Category updated successfully.',
  DELETED: 'Category deleted successfully.',
  RETRIEVED: 'Category retrieved successfully.',
  LISTED: 'Categories retrieved successfully.',
  STATUS_UPDATED: 'Category status updated successfully.',
  FEATURED_UPDATED: 'Category feature flag updated successfully.',
  IMAGE_UPLOADED: 'Category image uploaded successfully.',
  IMAGE_REMOVED: 'Category image removed successfully.',
  IMAGE_REQUIRED: 'Image file is required (field: "image").',
  NO_IMAGE: 'This category has no image to remove.',
  NOT_FOUND: 'Category not found.',
  DUPLICATE_NAME: 'A category with this name already exists.',
  PARENT_NOT_FOUND: 'Parent category not found.',
  SELF_PARENT: 'A category cannot be its own parent.',
  CYCLE: 'This would create a circular parent-child relationship.',
  HAS_CHILDREN: 'Cannot delete a category that has sub-categories.',
  HAS_PRODUCTS: 'Cannot delete a category that still has products assigned to it.',

  BULK_STATUS_UPDATED: 'Categories updated successfully.',
  BULK_DELETED: 'Bulk delete complete.',
} as const;

/** Max ids accepted in one bulk request — mirrors product/constants.ts's BULK_MAX_IDS. */
export const CATEGORY_BULK_MAX_IDS = 500;
