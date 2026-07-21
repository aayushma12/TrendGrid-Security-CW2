import { Request, Response } from 'express';

import { created, noContent, paginated, success } from '../../../utils/response';
import { parseQueryOptions } from '../../../utils/queryOptions';
import { BadRequestError } from '../../../utils/errors';

import * as reviewService from '../service';
import { REVIEW_FILTER_FIELDS, REVIEW_MESSAGES, REVIEW_SORT_FIELDS } from '../constants';

export const createReviewController = async (req: Request, res: Response): Promise<void> => {
  // The request body carries `userId` for schema/back-compat reasons, but it
  // must never be trusted — otherwise any authenticated user could submit a
  // review recorded under someone else's account. Always attribute the
  // review to the authenticated caller.
  const r = await reviewService.createReview({ ...req.body, userId: req.user!.id });
  created(res, r, REVIEW_MESSAGES.CREATED);
};

export const getReviewController = async (req: Request, res: Response): Promise<void> => {
  const r = await reviewService.getReviewById(req.params.id);
  success(res, r, REVIEW_MESSAGES.RETRIEVED);
};

export const getReviewsController = async (req: Request, res: Response): Promise<void> => {
  const options = parseQueryOptions(req, {
    allowedSortFields: [...REVIEW_SORT_FIELDS],
    allowedFilters: [...REVIEW_FILTER_FIELDS],
  });
  const { items, meta } = await reviewService.getReviews(options);
  paginated(res, items, meta, REVIEW_MESSAGES.LISTED);
};

export const updateReviewController = async (req: Request, res: Response): Promise<void> => {
  const r = await reviewService.updateReview(req.params.id, req.body, req.user);
  success(res, r, REVIEW_MESSAGES.UPDATED);
};

export const deleteReviewController = async (req: Request, res: Response): Promise<void> => {
  await reviewService.deleteReview(req.params.id, req.user);
  noContent(res);
};

// ---- images ----

export const addReviewImagesController = async (req: Request, res: Response): Promise<void> => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) throw new BadRequestError(REVIEW_MESSAGES.IMAGES_REQUIRED);
  const r = await reviewService.addReviewImages(req.params.id, files, req.user);
  success(res, r, REVIEW_MESSAGES.UPDATED);
};

export const removeReviewImageController = async (req: Request, res: Response): Promise<void> => {
  const r = await reviewService.removeReviewImage(req.params.id, req.params.imageId, req.user);
  success(res, r, REVIEW_MESSAGES.UPDATED);
};

// ---- admin moderation ----

export const approveReviewController = async (req: Request, res: Response): Promise<void> => {
  const r = await reviewService.approveReview(req.params.id);
  success(res, r, REVIEW_MESSAGES.APPROVED);
};
export const rejectReviewController = async (req: Request, res: Response): Promise<void> => {
  const r = await reviewService.rejectReview(req.params.id);
  success(res, r, REVIEW_MESSAGES.REJECTED);
};
export const hideReviewController = async (req: Request, res: Response): Promise<void> => {
  const r = await reviewService.hideReview(req.params.id);
  success(res, r, REVIEW_MESSAGES.HIDDEN);
};
export const restoreReviewController = async (req: Request, res: Response): Promise<void> => {
  const r = await reviewService.restoreReview(req.params.id);
  success(res, r, REVIEW_MESSAGES.RESTORED);
};
export const replyReviewController = async (req: Request, res: Response): Promise<void> => {
  const r = await reviewService.replyToReview(req.params.id, req.body);
  success(res, r, REVIEW_MESSAGES.REPLIED);
};

// ---- summary ----

export const getSummaryController = async (req: Request, res: Response): Promise<void> => {
  const s = await reviewService.getSummary(req.params.productId);
  success(res, s, REVIEW_MESSAGES.SUMMARY);
};
