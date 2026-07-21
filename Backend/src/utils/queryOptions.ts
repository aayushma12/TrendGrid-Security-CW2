/**
 * Parses ?page ?limit ?sortBy ?sortOrder ?search &<filters> into a normalized shape.
 * Every listing API MUST use parseQueryOptions to stay consistent.
 */
import { Request } from 'express';

import { QueryOptions, PaginationMeta } from '../types';
import { env } from '../config/env';
import { DEFAULT_PAGE, DEFAULT_SORT_BY, DEFAULT_SORT_ORDER } from '../constants';

const RESERVED_KEYS = new Set(['page', 'limit', 'sortBy', 'sortOrder', 'search']);

const parseBool = (v: string): boolean | undefined => {
  if (/^(true|1|yes)$/i.test(v)) return true;
  if (/^(false|0|no)$/i.test(v)) return false;
  return undefined;
};

export const parseQueryOptions = (
  req: Request,
  opts: { allowedSortFields?: string[]; allowedFilters?: string[] } = {},
): QueryOptions => {
  const q = req.query as Record<string, string>;

  const page = Math.max(Number(q.page) || DEFAULT_PAGE, 1);
  const rawLimit = Number(q.limit) || env.pagination.defaultPageSize;
  const limit = Math.min(Math.max(rawLimit, 1), env.pagination.maxPageSize);
  const skip = (page - 1) * limit;

  const sortBy =
    opts.allowedSortFields && q.sortBy && !opts.allowedSortFields.includes(q.sortBy)
      ? DEFAULT_SORT_BY
      : q.sortBy || DEFAULT_SORT_BY;
  const sortOrder: 'asc' | 'desc' =
    q.sortOrder?.toLowerCase() === 'asc'
      ? 'asc'
      : q.sortOrder?.toLowerCase() === 'desc'
        ? 'desc'
        : DEFAULT_SORT_ORDER;

  const filters: Record<string, string | boolean | number> = {};
  for (const [key, value] of Object.entries(q)) {
    if (RESERVED_KEYS.has(key)) continue;
    if (opts.allowedFilters && !opts.allowedFilters.includes(key)) continue;
    if (value === undefined || value === '') continue;

    const asBool = parseBool(value);
    if (asBool !== undefined) {
      filters[key] = asBool;
      continue;
    }
    const asNum = Number(value);
    filters[key] = !Number.isNaN(asNum) && value.trim() !== '' ? asNum : value;
  }

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
    search: q.search?.trim() || undefined,
    filters,
  };
};

export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number,
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});
