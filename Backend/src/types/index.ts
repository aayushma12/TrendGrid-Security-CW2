/**
 * Standardized shapes. Every API MUST use these — see workflowtunelling.md
 * "API Response Standard".
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors: Array<{ field?: string; message: string; code?: string }>;
  timestamp: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  timestamp: string;
  environment: string;
  version: string;
}

export interface QueryOptions {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  /** A repeated query key (e.g. `?color=Red&color=Blue`) comes through as `string[]`;
   *  a zod-validated `?x=null` (e.g. parentCategoryId) comes through as `null` — see parseQueryOptions. */
  filters: Record<string, string | string[] | boolean | number | null>;
}
