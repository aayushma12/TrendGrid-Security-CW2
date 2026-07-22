export const AUDIT_LOG_SORT_FIELDS = ['createdAt'] as const;
export const AUDIT_LOG_FILTER_FIELDS = ['userId', 'action', 'status'] as const;

/** Canonical action strings — kept centralized so call sites can't typo a value some other part of the app filters on. */
export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  REGISTER: 'REGISTER',
  LOGOUT: 'LOGOUT',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
} as const;
