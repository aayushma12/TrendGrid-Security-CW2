import { Router } from 'express';

import { defineRoutes } from '../../../utils/defineRoute';
import { memoryUploader } from '../../../config/cloudinary';

import {
  addReviewImagesController,
  approveReviewController,
  createReviewController,
  deleteReviewController,
  getReviewController,
  getReviewsController,
  getSummaryController,
  hideReviewController,
  rejectReviewController,
  removeReviewImageController,
  replyReviewController,
  restoreReviewController,
  updateReviewController,
} from '../controller';
import {
  adminReplySchema,
  createReviewSchema,
  listReviewsQuerySchema,
  productIdParamsSchema,
  reviewIdParamsSchema,
  reviewImageIdParamsSchema,
  updateReviewSchema,
} from '../validator';
import { REVIEW_IMAGES_MAX_FILES } from '../constants';

const router = Router();

defineRoutes(router, [
  // ── Public reads ────────────────────────────────────────────────────────
  { method: 'get', path: '/',      auth: 'public', schema: { query: listReviewsQuerySchema }, handler: getReviewsController },
  { method: 'get', path: '/:id',   auth: 'public', schema: { params: reviewIdParamsSchema },  handler: getReviewController },
  { method: 'get', path: '/summary/:productId', auth: 'public', schema: { params: productIdParamsSchema }, handler: getSummaryController },

  // ── Authenticated: customer creates / edits / deletes their own review ──
  { method: 'post',   path: '/',    auth: 'authenticated', schema: { body: createReviewSchema },                           handler: createReviewController },
  { method: 'put',    path: '/:id', auth: 'authenticated', schema: { params: reviewIdParamsSchema, body: updateReviewSchema }, handler: updateReviewController },
  { method: 'delete', path: '/:id', auth: 'authenticated', schema: { params: reviewIdParamsSchema },                      handler: deleteReviewController },

  // Review images (authenticated — own review)
  {
    method: 'post', path: '/:id/images', auth: 'authenticated',
    schema: { params: reviewIdParamsSchema },
    middleware: [memoryUploader(REVIEW_IMAGES_MAX_FILES).array('images', REVIEW_IMAGES_MAX_FILES)],
    handler: addReviewImagesController,
  },
  { method: 'delete', path: '/:id/images/:imageId', auth: 'authenticated',
    schema: { params: reviewImageIdParamsSchema }, handler: removeReviewImageController },

  // ── Admin moderation ─────────────────────────────────────────────────────
  { method: 'patch', path: '/:id/approve',  auth: 'ADMIN', schema: { params: reviewIdParamsSchema }, handler: approveReviewController },
  { method: 'patch', path: '/:id/reject',   auth: 'ADMIN', schema: { params: reviewIdParamsSchema }, handler: rejectReviewController },
  { method: 'patch', path: '/:id/hide',     auth: 'ADMIN', schema: { params: reviewIdParamsSchema }, handler: hideReviewController },
  { method: 'patch', path: '/:id/restore',  auth: 'ADMIN', schema: { params: reviewIdParamsSchema }, handler: restoreReviewController },
  { method: 'post',  path: '/:id/reply',    auth: 'ADMIN', schema: { params: reviewIdParamsSchema, body: adminReplySchema }, handler: replyReviewController },
]);

export default router;
