/**
 * Product routes — everything wired through defineRoutes so the tunnel
 * (auth + validate + asyncHandler) is applied to every handler.
 *
 * Auth matrix:
 *   public        → GET reads (storefront)
 *   ADMIN         → all write operations
 *   authenticated → N/A (products are managed by admins only)
 */
import { Router } from 'express';

import { defineRoutes } from '../../../utils/defineRoute';
import { memoryUploader } from '../../../config/cloudinary';
import { optionalAuth } from '../../../middleware/auth';

import { listReviewsQuerySchema } from '../../review/validator';
import { listOrdersQuerySchema } from '../../order/validator';

import {
  addVariantImagesController,
  bulkDeleteController,
  bulkUpdateActiveController,
  bulkUpdateStatusController,
  createCharacteristicController,
  createProductController,
  createVariantController,
  deleteCharacteristicController,
  deleteProductController,
  deleteVariantController,
  getBestSellerProductsController,
  getCatalogStatsController,
  getFeaturedProductsController,
  getNewProductsController,
  getTrendingProductsController,
  getProductController,
  getProductReviewSummaryController,
  getProductsController,
  getVariantController,
  importProductsController,
  listCharacteristicsController,
  listProductOrdersController,
  listProductReviewsController,
  listVariantsController,
  removeSlotImageController,
  removeVariantImageController,
  searchProductsController,
  updateAssignmentsController,
  updateCharacteristicController,
  updateProductController,
  updateProductFlagController,
  updateProductStatusController,
  updateVariantController,
  uploadSlotImageController,
} from '../controller';
import {
  bulkActiveSchema,
  bulkDeleteSchema,
  bulkStatusSchema,
  catalogStatsQuerySchema,
  characteristicParamsSchema,
  createCharacteristicSchema,
  createVariantSchema,
  imageSlotParamsSchema,
  importProductsQuerySchema,
  listProductsQuerySchema,
  productFlagParamsSchema,
  productIdParamsSchema,
  updateAssignmentsSchema,
  updateCharacteristicSchema,
  updateProductFlagSchema,
  updateProductStatusSchema,
  updateVariantSchema,
  variantImageParamsSchema,
  variantParamsSchema,
} from '../validator';
import { VARIANT_IMAGES_MAX_FILES } from '../constants';
import { csvUploader } from '../utils/csvUploader';

const router = Router();

// ── Admin: fixed-path routes ─────────────────────────────────────────────────
// Registered before any `/:id`-shaped route below — Express matches routes in
// registration order, so `/stats` or `/bulk/status` would otherwise be
// swallowed by `GET /:id` / `PATCH /:id/status` with `id` capturing the literal
// segment ("stats", "bulk").
defineRoutes(router, [
  { method: 'get', path: '/stats', auth: 'ADMIN',
    schema: { query: catalogStatsQuerySchema }, handler: getCatalogStatsController },

  { method: 'post', path: '/bulk/status', auth: 'ADMIN',
    schema: { body: bulkStatusSchema }, handler: bulkUpdateStatusController },
  { method: 'post', path: '/bulk/active', auth: 'ADMIN',
    schema: { body: bulkActiveSchema }, handler: bulkUpdateActiveController },
  { method: 'post', path: '/bulk/delete', auth: 'ADMIN',
    schema: { body: bulkDeleteSchema }, handler: bulkDeleteController },

  { method: 'post', path: '/import', auth: 'ADMIN',
    schema: { query: importProductsQuerySchema },
    middleware: [csvUploader().single('file')],
    handler: importProductsController },
]);

// ── Public reads (storefront) ────────────────────────────────────────────────
defineRoutes(router, [
  // optionalAuth: an ADMIN caller (the admin console reuses this same route to
  // manage the catalog) sees every status; anonymous/customer callers are
  // silently restricted to PUBLISHED + active — see getProductsController.
  { method: 'get', path: '/', auth: 'public', preAuth: [optionalAuth], schema: { query: listProductsQuerySchema }, handler: getProductsController },
  { method: 'get', path: '/featured', auth: 'public', schema: { query: listProductsQuerySchema }, handler: getFeaturedProductsController },
  { method: 'get', path: '/new', auth: 'public', schema: { query: listProductsQuerySchema }, handler: getNewProductsController },
  { method: 'get', path: '/best-sellers', auth: 'public', schema: { query: listProductsQuerySchema }, handler: getBestSellerProductsController },
  { method: 'get', path: '/trending', auth: 'public', schema: { query: listProductsQuerySchema }, handler: getTrendingProductsController },
  { method: 'get', path: '/search', auth: 'public', schema: { query: listProductsQuerySchema }, handler: searchProductsController },
  { method: 'get', path: '/:id', auth: 'public', preAuth: [optionalAuth], schema: { params: productIdParamsSchema },  handler: getProductController },
  { method: 'get', path: '/:id/reviews', auth: 'public',
    schema: { params: productIdParamsSchema, query: listReviewsQuerySchema }, handler: listProductReviewsController },
  { method: 'get', path: '/:id/reviews/summary', auth: 'public',
    schema: { params: productIdParamsSchema }, handler: getProductReviewSummaryController },

  // Characteristics / variants — public reads (storefront needs these to render
  // spec sheets and size/color/price/stock pickers).
  { method: 'get', path: '/:id/characteristics', auth: 'public',
    schema: { params: productIdParamsSchema }, handler: listCharacteristicsController },
  { method: 'get', path: '/:id/variants', auth: 'public',
    schema: { params: productIdParamsSchema }, handler: listVariantsController },
  { method: 'get', path: '/:id/variants/:variantId', auth: 'public',
    schema: { params: variantParamsSchema }, handler: getVariantController },
]);

// ── Admin writes ─────────────────────────────────────────────────────────────
defineRoutes(router, [
  // Core CRUD
  { method: 'post',   path: '/',    auth: 'ADMIN', schema: {},
    middleware: [memoryUploader().single('image')],
    handler: createProductController },
  { method: 'put',    path: '/:id', auth: 'ADMIN', schema: { params: productIdParamsSchema },
    middleware: [memoryUploader().single('image')],
    handler: updateProductController },
  { method: 'delete', path: '/:id', auth: 'ADMIN', schema: { params: productIdParamsSchema },                                 handler: deleteProductController },

  { method: 'patch', path: '/:id/status',          auth: 'ADMIN',
    schema: { params: productIdParamsSchema, body: updateProductStatusSchema }, handler: updateProductStatusController },
  { method: 'patch', path: '/:id/flags/:flag',      auth: 'ADMIN',
    schema: { params: productFlagParamsSchema, body: updateProductFlagSchema }, handler: updateProductFlagController },
  { method: 'patch', path: '/:id/assignments',      auth: 'ADMIN',
    schema: { params: productIdParamsSchema, body: updateAssignmentsSchema }, handler: updateAssignmentsController },

  // ── Images: unified slot-based endpoint ──────────────────────────────────
  // POST   /products/:id/images/:slot  → upload (slot: thumbnail|extra1|extra2|extra3)
  // DELETE /products/:id/images/:slot  → remove
  { method: 'post',   path: '/:id/images/:slot', auth: 'ADMIN',
    schema: { params: imageSlotParamsSchema },
    middleware: [memoryUploader().single('image')],
    handler: uploadSlotImageController },
  { method: 'delete', path: '/:id/images/:slot', auth: 'ADMIN',
    schema: { params: imageSlotParamsSchema },
    handler: removeSlotImageController },

  // ── Admin nested views ─────────────────────────────────────────────────────
  { method: 'get', path: '/:id/orders', auth: 'ADMIN',
    schema: { params: productIdParamsSchema, query: listOrdersQuerySchema }, handler: listProductOrdersController },

  // ── Characteristics (spec sheet rows) ────────────────────────────────────
  { method: 'post',   path: '/:id/characteristics',         auth: 'ADMIN',
    schema: { params: productIdParamsSchema, body: createCharacteristicSchema }, handler: createCharacteristicController },
  { method: 'put',    path: '/:id/characteristics/:charId', auth: 'ADMIN',
    schema: { params: characteristicParamsSchema, body: updateCharacteristicSchema }, handler: updateCharacteristicController },
  { method: 'delete', path: '/:id/characteristics/:charId', auth: 'ADMIN',
    schema: { params: characteristicParamsSchema }, handler: deleteCharacteristicController },

  // ── Variants (sellable SKUs — color/size/price/stock) ────────────────────
  { method: 'post',   path: '/:id/variants',            auth: 'ADMIN',
    schema: { params: productIdParamsSchema, body: createVariantSchema }, handler: createVariantController },
  { method: 'put',    path: '/:id/variants/:variantId',  auth: 'ADMIN',
    schema: { params: variantParamsSchema, body: updateVariantSchema }, handler: updateVariantController },
  { method: 'delete', path: '/:id/variants/:variantId',  auth: 'ADMIN',
    schema: { params: variantParamsSchema }, handler: deleteVariantController },

  // Variant images (max VARIANT_IMAGES_MAX_FILES per upload request)
  { method: 'post',   path: '/:id/variants/:variantId/images', auth: 'ADMIN',
    schema: { params: variantParamsSchema },
    middleware: [memoryUploader(VARIANT_IMAGES_MAX_FILES).array('images', VARIANT_IMAGES_MAX_FILES)],
    handler: addVariantImagesController },
  { method: 'delete', path: '/:id/variants/:variantId/images/:imageId', auth: 'ADMIN',
    schema: { params: variantImageParamsSchema }, handler: removeVariantImageController },
]);

export default router;

