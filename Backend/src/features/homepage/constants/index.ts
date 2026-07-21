export const HOMEPAGE_MESSAGES = {
  LISTED: 'Homepage sections retrieved successfully.',
  RETRIEVED: 'Homepage section retrieved successfully.',
  CONTENT_UPDATED: 'Section content saved successfully.',
  VISIBILITY_UPDATED: 'Section visibility updated successfully.',
  REORDERED: 'Homepage sections reordered successfully.',
  NOT_FOUND: 'Homepage section not found.',
  REORDER_MISMATCH: 'The reorder list must contain exactly the existing section ids, each exactly once.',
  IMAGE_UPLOADED: 'Image uploaded successfully.',
} as const;

export const HOME_FIELD_TYPES = ['text', 'textarea', 'image'] as const;

export const HOMEPAGE_KEY_MAX = 100;
export const HOMEPAGE_NAME_MAX = 200;
export const HOMEPAGE_DESCRIPTION_MAX = 500;

/**
 * Cloudinary subfolder for homepage CMS assets. Uploads here are NOT tied to
 * a specific section field — a `HomeField`/repeater item of type "image"
 * only stores a `value` URL string (see types/index.ts), so the admin
 * uploads the file, gets back a URL, and pastes it into the field via the
 * normal PUT /:id/content call. No publicId is persisted, so replacing/
 * clearing a field's image does not delete the old Cloudinary asset —
 * mirror the Banner feature's dedicated-column pattern if that's needed later.
 */
export const HOMEPAGE_IMAGE_SUBFOLDER = 'homepage/sections';
