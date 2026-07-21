import { Category } from '../types';

/** Convenience helper for logs / UI. */
export const getCategoryLabel = (c: Pick<Category, 'name'>): string => c.name;
