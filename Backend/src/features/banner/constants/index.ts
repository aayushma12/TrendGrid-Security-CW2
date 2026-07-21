export const BANNER_PLACEMENTS = ['ANNOUNCEMENT', 'HERO', 'PROMO'] as const;
export type BannerPlacementValue = (typeof BANNER_PLACEMENTS)[number];

export const BANNER_TITLE_MAX = 200;
export const BANNER_SUBTEXT_MAX = 300;
export const BANNER_CTA_TEXT_MAX = 60;
export const BANNER_CTA_LINK_MAX = 300;

export const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const BANNER_SORT_FIELDS = ['createdAt', 'updatedAt', 'startsAt', 'expiresAt', 'sortOrder'] as const;
export const BANNER_FILTER_FIELDS = ['placement', 'isActive'] as const;

export const BANNER_IMAGE_SUBFOLDER = 'banners/images';

export const BANNER_MESSAGES = {
  CREATED: 'Banner created successfully.',
  UPDATED: 'Banner updated successfully.',
  DELETED: 'Banner deleted successfully.',
  RETRIEVED: 'Banner retrieved successfully.',
  LISTED: 'Banners retrieved successfully.',
  ACTIVE_LISTED: 'Active banners retrieved successfully.',
  NOT_FOUND: 'Banner not found.',
  DATES_INVALID: 'Start date cannot be after expiry date.',
  IMAGE_UPLOADED: 'Banner image uploaded successfully.',
  IMAGE_REMOVED: 'Banner image removed successfully.',
  NO_IMAGE: 'This banner has no image to remove.',
} as const;
