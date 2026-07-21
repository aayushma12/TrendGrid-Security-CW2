export const COUPON_TYPES = ['PERCENTAGE', 'FIXED'] as const;
export type CouponTypeValue = (typeof COUPON_TYPES)[number];

export const COUPON_CODE_MIN = 3;
export const COUPON_CODE_MAX = 32;

export const COUPON_SORT_FIELDS = ['createdAt', 'updatedAt', 'startDate', 'endDate', 'code'] as const;
export const COUPON_FILTER_FIELDS = ['type', 'isActive'] as const;

export const COUPON_MESSAGES = {
  CREATED: 'Coupon created successfully.',
  UPDATED: 'Coupon updated successfully.',
  DELETED: 'Coupon deleted successfully.',
  RETRIEVED: 'Coupon retrieved successfully.',
  LISTED: 'Coupons retrieved successfully.',
  VALIDATED: 'Coupon is valid.',
  NOT_FOUND: 'Coupon not found.',

  DUPLICATE_CODE: 'A coupon with this code already exists.',
  PERCENT_RANGE: 'Coupon percentage must be between 1 and 100.',
  FIXED_NEGATIVE: 'Coupon amount must be positive.',
  DATES_INVALID: 'Start date cannot be after end date.',

  INACTIVE: 'Coupon is inactive.',
  EXPIRED: 'Coupon is expired.',
  NOT_YET_ACTIVE: 'Coupon is not yet active.',
  DELETED_STATE: 'Coupon has been deleted.',
  USAGE_LIMIT_REACHED: 'Coupon usage limit reached.',
  USER_LIMIT_REACHED: 'You have already reached the usage limit for this coupon.',
  MIN_PURCHASE_NOT_MET: 'Minimum purchase amount not reached.',
} as const;
