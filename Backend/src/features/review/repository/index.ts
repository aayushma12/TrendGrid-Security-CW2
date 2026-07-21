import { Prisma } from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { QueryOptions } from '../../../types';
import { Review, ReviewImage, ReviewSummary } from '../types';
import { ReviewStatusValue } from '../constants';

const REVIEW_INCLUDE = {
  images: { orderBy: { position: 'asc' } },
} satisfies Prisma.ReviewInclude;

type PrismaReviewWithIncludes = Prisma.ReviewGetPayload<{ include: typeof REVIEW_INCLUDE }>;

const toImage = (r: PrismaReviewWithIncludes['images'][number]): ReviewImage => ({
  id: r.id,
  reviewId: r.reviewId,
  imageUrl: r.imageUrl,
  imagePublicId: r.imagePublicId,
  position: r.position,
  createdAt: r.createdAt,
});

const toReview = (r: PrismaReviewWithIncludes): Review => ({
  id: r.id,
  productId: r.productId,
  userId: r.userId,
  orderId: r.orderId ?? undefined,
  rating: r.rating,
  title: r.title ?? undefined,
  comment: r.comment ?? undefined,
  status: r.status as ReviewStatusValue,
  adminReply: r.adminReply ?? undefined,
  adminRepliedAt: r.adminRepliedAt ?? undefined,
  images: r.images.map(toImage),
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

export interface CreateReviewRecord {
  productId: string;
  userId: string;
  orderId?: string | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
  status: ReviewStatusValue;
}

export interface UpdateReviewRecord {
  rating?: number;
  title?: string | null;
  comment?: string | null;
  status?: ReviewStatusValue;
  adminReply?: string | null;
  adminRepliedAt?: Date | null;
}

export const create = async (data: CreateReviewRecord): Promise<Review> =>
  toReview(await prisma.review.create({ data, include: REVIEW_INCLUDE }));

export const findById = async (id: string): Promise<Review | null> => {
  const r = await prisma.review.findUnique({ where: { id }, include: REVIEW_INCLUDE });
  return r ? toReview(r) : null;
};

export const findByProductAndUser = async (
  productId: string, userId: string,
): Promise<Review | null> => {
  const r = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId } }, include: REVIEW_INCLUDE,
  });
  return r ? toReview(r) : null;
};

export const update = async (id: string, patch: UpdateReviewRecord): Promise<Review | null> => {
  try {
    const r = await prisma.review.update({
      where: { id }, data: patch, include: REVIEW_INCLUDE,
    });
    return toReview(r);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return null;
    throw err;
  }
};

/** Hard-delete a review (cascades images). */
export const hardDelete = async (id: string): Promise<boolean> => {
  try {
    await prisma.review.delete({ where: { id } });
    return true;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return false;
    throw err;
  }
};

export const findMany = async (
  options: QueryOptions,
): Promise<{ items: Review[]; total: number }> => {
  const where: Prisma.ReviewWhereInput = {};
  if (typeof options.filters.productId === 'string') where.productId = options.filters.productId;
  if (typeof options.filters.userId === 'string') where.userId = options.filters.userId;
  if (typeof options.filters.status === 'string') where.status = options.filters.status as ReviewStatusValue;
  if (typeof options.filters.rating === 'number') where.rating = options.filters.rating;

  const [rows, total] = await prisma.$transaction([
    prisma.review.findMany({
      where, skip: options.skip, take: options.limit,
      orderBy: { [options.sortBy]: options.sortOrder },
      include: REVIEW_INCLUDE,
    }),
    prisma.review.count({ where }),
  ]);
  return { items: rows.map(toReview), total };
};

// ---------- images ----------

export const addImage = async (
  reviewId: string,
  data: { imageUrl: string; imagePublicId: string; position: number },
): Promise<ReviewImage> => {
  const r = await prisma.reviewImage.create({
    data: { reviewId, ...data },
  });
  return {
    id: r.id, reviewId: r.reviewId,
    imageUrl: r.imageUrl, imagePublicId: r.imagePublicId,
    position: r.position, createdAt: r.createdAt,
  };
};

export const findImage = async (reviewId: string, imageId: string): Promise<ReviewImage | null> => {
  const r = await prisma.reviewImage.findFirst({ where: { id: imageId, reviewId } });
  return r ? {
    id: r.id, reviewId: r.reviewId, imageUrl: r.imageUrl,
    imagePublicId: r.imagePublicId, position: r.position, createdAt: r.createdAt,
  } : null;
};

export const removeImage = async (reviewId: string, imageId: string): Promise<boolean> => {
  const existing = await prisma.reviewImage.findFirst({ where: { id: imageId, reviewId } });
  if (!existing) return false;
  await prisma.reviewImage.delete({ where: { id: imageId } });
  return true;
};

export const maxImagePosition = async (reviewId: string): Promise<number> => {
  const r = await prisma.reviewImage.aggregate({
    where: { reviewId }, _max: { position: true },
  });
  return r._max.position ?? -1;
};

// ---------- summary ----------

export const productExists = async (productId: string): Promise<boolean> =>
  Boolean(await prisma.product.findUnique({ where: { id: productId }, select: { id: true } }));

/** Compute a per-product rating summary from APPROVED reviews only. */
export const computeSummary = async (productId: string): Promise<ReviewSummary> => {
  const grouped = await prisma.review.groupBy({
    by: ['rating'],
    where: { productId, status: 'APPROVED' },
    _count: { rating: true },
  });

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as ReviewSummary['breakdown'];
  let sum = 0;
  let total = 0;
  for (const g of grouped) {
    const r = g.rating as 1 | 2 | 3 | 4 | 5;
    const count = g._count.rating;
    breakdown[r] = count;
    sum += r * count;
    total += count;
  }

  return {
    productId,
    averageRating: total ? Math.round((sum / total) * 100) / 100 : 0,
    totalReviews: total,
    breakdown,
  };
};
