/**
 * Review service.
 *
 * Enforced rules:
 *   • Only customers with a DELIVERED order for the product may submit a review
 *   • One review per (product, user)
 *   • Rating must be 1..5 (validator enforces; service double-checks)
 *   • Images uploaded via the global Cloudinary service
 *   • Admin moderation: approve / reject / hide / restore / reply / delete
 *   • Summary (average + breakdown) only counts APPROVED reviews
 */
import { PaginationMeta, QueryOptions } from '../../../types';
import { BadRequestError, DuplicateError, ForbiddenError, NotFoundError } from '../../../utils/errors';
import { buildPaginationMeta } from '../../../utils/queryOptions';
import { logger } from '../../../utils/logger';
import { deleteImage, uploadImage } from '../../../services/imageService';

import * as reviewRepo from '../repository';
import { hasDeliveredOrderForProduct } from '../../order/service';
import {
  AdminReplyDto, CreateReviewDto, ReviewResponseDto, ReviewSummaryResponseDto,
  UpdateReviewDto, toReviewResponseDto, toReviewSummaryResponseDto,
} from '../dto';
import {
  RATING_MAX, RATING_MIN, REVIEW_IMAGE_SUBFOLDER, REVIEW_MESSAGES, ReviewStatusValue,
} from '../constants';

export type ReqUser = { id: string; role: string };

// -------- helpers --------

const requireReview = async (id: string, reqUser?: ReqUser) => {
  const r = await reviewRepo.findById(id);
  if (!r || r.status === 'DELETED') throw new NotFoundError(REVIEW_MESSAGES.NOT_FOUND);
  
  if (reqUser && reqUser.role !== 'ADMIN' && r.userId !== reqUser.id) {
    throw new ForbiddenError('You can only access your own reviews.');
  }
  return r;
};

const requireEligibleProduct = async (productId: string): Promise<void> => {
  const exists = await reviewRepo.productExists(productId);
  if (!exists) throw new NotFoundError(REVIEW_MESSAGES.PRODUCT_NOT_FOUND);
};

const requireDeliveredPurchase = async (userId: string, productId: string): Promise<void> => {
  const ok = await hasDeliveredOrderForProduct(userId, productId);
  if (!ok) throw new ForbiddenError(REVIEW_MESSAGES.NOT_ELIGIBLE);
};

const validateRating = (rating: number): void => {
  if (!Number.isInteger(rating) || rating < RATING_MIN || rating > RATING_MAX) {
    throw new BadRequestError(REVIEW_MESSAGES.INVALID_RATING, [
      { field: 'rating', message: REVIEW_MESSAGES.INVALID_RATING },
    ]);
  }
};

// -------- customer actions --------

export const createReview = async (dto: CreateReviewDto): Promise<ReviewResponseDto> => {
  validateRating(dto.rating);
  await requireEligibleProduct(dto.productId);
  await requireDeliveredPurchase(dto.userId, dto.productId);

  const existing = await reviewRepo.findByProductAndUser(dto.productId, dto.userId);
  if (existing && existing.status !== 'DELETED') {
    throw new DuplicateError(REVIEW_MESSAGES.ALREADY_REVIEWED);
  }

  const created = await reviewRepo.create({
    productId: dto.productId,
    userId: dto.userId,
    rating: dto.rating,
    title: dto.title ?? null,
    comment: dto.comment ?? null,
    status: 'PENDING',
  });
  logger.info(`Review submitted id=${created.id} productId=${dto.productId} userId=${dto.userId}`);
  return toReviewResponseDto(created);
};

export const getReviewById = async (id: string): Promise<ReviewResponseDto> => {
  const r = await requireReview(id);
  return toReviewResponseDto(r);
};

export const getReviews = async (
  options: QueryOptions,
): Promise<{ items: ReviewResponseDto[]; meta: PaginationMeta }> => {
  const { items, total } = await reviewRepo.findMany(options);
  return {
    items: items.map(toReviewResponseDto),
    meta: buildPaginationMeta(total, options.page, options.limit),
  };
};

export const updateReview = async (id: string, dto: UpdateReviewDto, reqUser?: ReqUser): Promise<ReviewResponseDto> => {
  await requireReview(id, reqUser); // "existing" wasn't used, just enforce ownership
  if (dto.rating !== undefined) validateRating(dto.rating);

  const updated = await reviewRepo.update(id, {
    rating: dto.rating,
    title: dto.title,
    comment: dto.comment,
    status: 'PENDING',
  });
  if (!updated) throw new NotFoundError(REVIEW_MESSAGES.NOT_FOUND);
  logger.info(`Review updated id=${id}`);
  return toReviewResponseDto(updated);
};

export const deleteReview = async (id: string, reqUser?: ReqUser): Promise<void> => {
  const r = await requireReview(id, reqUser);
  await Promise.all(r.images.map((i) => deleteImage(i.imagePublicId)));
  const removed = await reviewRepo.hardDelete(id);
  if (!removed) throw new NotFoundError(REVIEW_MESSAGES.NOT_FOUND);
  logger.info(`Review deleted id=${id}`);
};

// -------- images --------

export const addReviewImages = async (
  id: string, files: Express.Multer.File[], reqUser?: ReqUser
): Promise<ReviewResponseDto> => {
  const existing = await requireReview(id, reqUser);
  let nextPos = (await reviewRepo.maxImagePosition(existing.id)) + 1;

  for (const file of files) {
    const stored = await uploadImage(file.buffer, REVIEW_IMAGE_SUBFOLDER);
    await reviewRepo.addImage(existing.id, {
      imageUrl: stored.secureUrl, imagePublicId: stored.publicId, position: nextPos++,
    });
  }
  logger.info(`Review images added id=${id} count=${files.length}`);
  const refreshed = await requireReview(id);
  return toReviewResponseDto(refreshed);
};

export const removeReviewImage = async (id: string, imageId: string, reqUser?: ReqUser): Promise<ReviewResponseDto> => {
  await requireReview(id, reqUser);
  const image = await reviewRepo.findImage(id, imageId);
  if (!image) throw new NotFoundError(REVIEW_MESSAGES.IMAGE_NOT_FOUND);
  await deleteImage(image.imagePublicId);
  const removed = await reviewRepo.removeImage(id, imageId);
  if (!removed) throw new NotFoundError(REVIEW_MESSAGES.IMAGE_NOT_FOUND);
  logger.info(`Review image removed id=${id} imageId=${imageId}`);
  const refreshed = await requireReview(id);
  return toReviewResponseDto(refreshed);
};

// -------- admin moderation --------

const setStatus = async (
  id: string, status: ReviewStatusValue, actionLabel: string,
): Promise<ReviewResponseDto> => {
  await requireReview(id);
  const updated = await reviewRepo.update(id, { status });
  if (!updated) throw new NotFoundError(REVIEW_MESSAGES.NOT_FOUND);
  logger.info(`Review ${actionLabel} id=${id}`);
  return toReviewResponseDto(updated);
};

export const approveReview = (id: string) => setStatus(id, 'APPROVED', 'approved');
export const rejectReview = (id: string) => setStatus(id, 'REJECTED', 'rejected');
export const hideReview = (id: string) => setStatus(id, 'HIDDEN', 'hidden');
export const restoreReview = async (id: string): Promise<ReviewResponseDto> => {
  const r = await reviewRepo.findById(id);
  if (!r) throw new NotFoundError(REVIEW_MESSAGES.NOT_FOUND);
  const updated = await reviewRepo.update(id, { status: 'APPROVED' });
  logger.info(`Review restored id=${id}`);
  return toReviewResponseDto(updated!);
};


export const replyToReview = async (id: string, dto: AdminReplyDto): Promise<ReviewResponseDto> => {
  await requireReview(id);
  const updated = await reviewRepo.update(id, {
    adminReply: dto.reply, adminRepliedAt: new Date(),
  });
  if (!updated) throw new NotFoundError(REVIEW_MESSAGES.NOT_FOUND);
  logger.info(`Review reply saved id=${id}`);
  return toReviewResponseDto(updated);
};

// -------- summary --------

export const getSummary = async (productId: string): Promise<ReviewSummaryResponseDto> => {
  await requireEligibleProduct(productId);
  const s = await reviewRepo.computeSummary(productId);
  return toReviewSummaryResponseDto(s);
};
