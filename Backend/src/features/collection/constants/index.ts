export const COLLECTION_NAME_MIN = 2;
export const COLLECTION_NAME_MAX = 100;
export const COLLECTION_DESCRIPTION_MAX = 500;

export const COLLECTION_SORT_FIELDS = ['createdAt', 'updatedAt', 'name', 'displayOrder'] as const;
export type CollectionSortField = (typeof COLLECTION_SORT_FIELDS)[number];

export const COLLECTION_FILTER_FIELDS = ['isActive'] as const;

/** Cloudinary sub-folder (appended to `env.cloudinary.folder`). */
export const COLLECTION_IMAGE_SUBFOLDER = 'collections';

export const COLLECTION_PRODUCTS_MAX_IDS = 500;

export const COLLECTION_MESSAGES = {
  CREATED: 'Collection created successfully.',
  UPDATED: 'Collection updated successfully.',
  DELETED: 'Collection deleted successfully.',
  RETRIEVED: 'Collection retrieved successfully.',
  LISTED: 'Collections retrieved successfully.',
  STATUS_UPDATED: 'Collection status updated successfully.',
  IMAGE_UPLOADED: 'Collection image uploaded successfully.',
  IMAGE_REMOVED: 'Collection image removed successfully.',
  IMAGE_REQUIRED: 'Image file is required (field: "image").',
  NO_IMAGE: 'This collection has no image to remove.',
  NOT_FOUND: 'Collection not found.',
  DUPLICATE_NAME: 'A collection with this name already exists.',
  PRODUCTS_ADDED: 'Products added to collection successfully.',
  PRODUCTS_REMOVED: 'Products removed from collection successfully.',
} as const;
