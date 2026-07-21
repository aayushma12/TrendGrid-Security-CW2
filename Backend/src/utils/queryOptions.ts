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

  // A repeated key (?color=Red&color=Blue) comes through req.query as a real
  // string[] at runtime — `q` above is cast to Record<string,string> for the
  // pagination/sort fields (which are never repeated), so this loop reads
  // straight from req.query instead to see arrays as arrays rather than
  // coercing them into a single joined/garbled string.
  //
  // A route with a zod query schema (validate middleware) has ALREADY run by
  // the time this executes, and it replaces req.query with its parsed
  // output — z.coerce.number()/boolean unions turn "1000"/"true" into real
  // number/boolean values before we ever see them. Routes with no query
  // schema leave everything as strings. Both cases have to be handled here.
  const filters: Record<string, string | string[] | boolean | number | null> = {};
  for (const [key, rawValue] of Object.entries(req.query)) {
    if (RESERVED_KEYS.has(key)) continue;
    if (opts.allowedFilters && !opts.allowedFilters.includes(key)) continue;
    if (rawValue === undefined) continue;

    // A zod schema can validate+transform a query value to `null` (e.g.
    // parentCategoryId: "null"/"" -> null, meaning "top-level only"). Must be
    // preserved as real `null`, not dropped or coerced — Number(null) is 0,
    // which would silently misfilter rather than error.
    if (rawValue === null) {
      filters[key] = null;
      continue;
    }

    if (Array.isArray(rawValue)) {
      const values = rawValue.filter((v): v is string => typeof v === 'string' && v !== '');
      if (values.length > 0) filters[key] = values;
      continue;
    }

    if (typeof rawValue === 'boolean' || typeof rawValue === 'number') {
      filters[key] = rawValue;
      continue;
    }

    if (typeof rawValue !== 'string' || rawValue === '') continue;

    const asBool = parseBool(rawValue);
    if (asBool !== undefined) {
      filters[key] = asBool;
      continue;
    }
    const asNum = Number(rawValue);
    filters[key] = !Number.isNaN(asNum) && rawValue.trim() !== '' ? asNum : rawValue;
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
