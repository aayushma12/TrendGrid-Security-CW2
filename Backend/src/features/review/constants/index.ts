export const RATING_MIN = 1;
export const RATING_MAX = 5;

export const REVIEW_TITLE_MAX = 150;
export const REVIEW_COMMENT_MAX = 2000;
export const ADMIN_REPLY_MAX = 2000;

export const REVIEW_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN', 'DELETED'] as const;
export type ReviewStatusValue = (typeof REVIEW_STATUSES)[number];

export const REVIEW_SORT_FIELDS = ['createdAt', 'updatedAt', 'rating'] as const;
export const REVIEW_FILTER_FIELDS = ['productId', 'userId', 'status', 'rating'] as const;

export const REVIEW_IMAGE_SUBFOLDER = 'reviews';
export const REVIEW_IMAGES_MAX_FILES = 5;

export const REVIEW_MESSAGES = {
  CREATED: 'Review submitted successfully.',
  UPDATED: 'Review updated successfully.',
  DELETED: 'Review deleted successfully.',
  RETRIEVED: 'Review retrieved successfully.',
  LISTED: 'Reviews retrieved successfully.',
  SUMMARY: 'Review summary calculated successfully.',
  APPROVED: 'Review approved.',
  REJECTED: 'Review rejected.',
  HIDDEN: 'Review hidden.',
  RESTORED: 'Review restored.',
  REPLIED: 'Reply saved.',
  ANALYTICS_RETRIEVED: 'Review analytics retrieved successfully.',

  NOT_FOUND: 'Review not found.',
  NOT_ELIGIBLE: 'You can only review products from delivered orders.',
  ALREADY_REVIEWED: 'You have already reviewed this product.',
  INVALID_RATING: `Rating must be between ${RATING_MIN} and ${RATING_MAX}.`,
  IMAGES_REQUIRED: 'At least one image is required (field: "images").',
  IMAGE_NOT_FOUND: 'Image not found on this review.',
  PRODUCT_NOT_FOUND: 'Product not found.',
} as const;
