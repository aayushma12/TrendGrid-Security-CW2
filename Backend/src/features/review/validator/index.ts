import { z } from 'zod';

import {
  ADMIN_REPLY_MAX,
  RATING_MAX,
  RATING_MIN,
  REVIEW_COMMENT_MAX,
  REVIEW_SORT_FIELDS,
  REVIEW_STATUSES,
  REVIEW_TITLE_MAX,
} from '../constants';

const uuid = z.string().uuid('Must be a valid UUID');
const rating = z.coerce.number().int().min(RATING_MIN).max(RATING_MAX);

export const createReviewSchema = z.object({
  productId: uuid,
  userId: uuid,
  rating,
  title: z.string().trim().max(REVIEW_TITLE_MAX).optional(),
  comment: z.string().trim().max(REVIEW_COMMENT_MAX).optional(),
});

export const updateReviewSchema = z
  .object({
    rating: rating.optional(),
    title: z.string().trim().max(REVIEW_TITLE_MAX).nullable().optional(),
    comment: z.string().trim().max(REVIEW_COMMENT_MAX).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });

export const adminReplySchema = z.object({
  reply: z.string().trim().min(1).max(ADMIN_REPLY_MAX),
});

export const reviewIdParamsSchema = z.object({ id: uuid });
export const reviewImageIdParamsSchema = z.object({ id: uuid, imageId: uuid });
export const productIdParamsSchema = z.object({ productId: uuid });

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  productId: uuid.optional(),
  userId: uuid.optional(),
  status: z.enum(REVIEW_STATUSES).optional(),
  rating: rating.optional(),
  sortBy: z.enum(REVIEW_SORT_FIELDS).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
