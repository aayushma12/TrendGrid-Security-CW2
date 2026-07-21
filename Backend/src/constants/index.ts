/**
 * Global constants used across all features.
 * Feature-specific constants live in `features/<feature>/constants/`.
 * Env-driven values (page sizes, file limits) live in `config/env.ts`.
 */

export const DEFAULT_PAGE = 1;
export const DEFAULT_SORT_ORDER: 'asc' | 'desc' = 'desc';
export const DEFAULT_SORT_BY = 'createdAt';

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const MESSAGES = {
  CREATED: 'Resource created successfully.',
  UPDATED: 'Resource updated successfully.',
  DELETED: 'Resource deleted successfully.',
  RETRIEVED: 'Resource retrieved successfully.',
  NOT_FOUND: 'Resource not found.',
  UNAUTHORIZED: 'Authentication required.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  VALIDATION_FAILED: 'Validation failed.',
  DUPLICATE: 'Resource already exists.',
  INTERNAL_ERROR: 'Internal server error.',
} as const;
