/**
 * Category routes — registered via defineRoutes so validate + asyncHandler
 * are wired automatically.
 *
 * Auth matrix:
 *   public  → GET listing / single / products (storefront reads)
 *   ADMIN   → all write operations (create, update, delete, image, status, feature)
 */
import { Router } from 'express';

import { defineRoutes } from '../../../utils/defineRoute';
import { memoryUploader } from '../../../config/cloudinary';
import { optionalAuth } from '../../../middleware/auth';

import { listProductsQuerySchema } from '../../product/validator';
import {
  bulkDeleteCategoriesController,
  bulkUpdateCategoryActiveController,
  createCategoryController,
  deleteCategoryController,
  getCategoriesController,
  getCategoryController,
  getCategoryTreeController,
  getFeaturedCategoriesController,
  listCategoryProductsController,
  removeCategoryImageController,
  updateCategoryController,
  updateCategoryFeatureController,
  updateCategoryStatusController,
  uploadCategoryImageController,
} from '../controller';
import {
  bulkCategoryActiveSchema,
  bulkCategoryDeleteSchema,
  categoryIdParamsSchema,
  listCategoriesQuerySchema,
  updateCategoryFeatureSchema,
  updateCategoryStatusSchema,
} from '../validator';

const router = Router();

// ── Admin: fixed-path bulk routes — registered before any `/:id` route below. ──
defineRoutes(router, [
  { method: 'post', path: '/bulk/active', auth: 'ADMIN',
    schema: { body: bulkCategoryActiveSchema }, handler: bulkUpdateCategoryActiveController },
  { method: 'post', path: '/bulk/delete', auth: 'ADMIN',
    schema: { body: bulkCategoryDeleteSchema }, handler: bulkDeleteCategoriesController },
]);

// ── Public reads (storefront) ──────────────────────────────────────────────
defineRoutes(router, [
  {
    method: 'get',
    path: '/',
    auth: 'public',
    schema: { query: listCategoriesQuerySchema },
    handler: getCategoriesController,
  },
  {
    method: 'get',
    path: '/tree',
    auth: 'public',
    schema: {},
    handler: getCategoryTreeController,
  },
  {
    method: 'get',
    path: '/featured',
    auth: 'public',
    schema: {},
    handler: getFeaturedCategoriesController,
  },
  {
    method: 'get',
    path: '/:id',
    auth: 'public',
    schema: { params: categoryIdParamsSchema },
    handler: getCategoryController,
  },
  {
    method: 'get',
    path: '/:id/products',
    auth: 'public',
    preAuth: [optionalAuth],
    schema: { params: categoryIdParamsSchema, query: listProductsQuerySchema },
    handler: listCategoryProductsController,
  },
]);

// ── Admin writes ───────────────────────────────────────────────────────────
defineRoutes(router, [
  {
    method: 'post',
    path: '/',
    auth: 'ADMIN',
    schema: {},
    middleware: [memoryUploader().single('image')],
    handler: createCategoryController,
  },
  {
    method: 'put',
    path: '/:id',
    auth: 'ADMIN',
    schema: { params: categoryIdParamsSchema },
    middleware: [memoryUploader().single('image')],
    handler: updateCategoryController,
  },
  {
    method: 'delete',
    path: '/:id',
    auth: 'ADMIN',
    schema: { params: categoryIdParamsSchema },
    handler: deleteCategoryController,
  },
  {
    method: 'patch',
    path: '/:id/status',
    auth: 'ADMIN',
    schema: { params: categoryIdParamsSchema, body: updateCategoryStatusSchema },
    handler: updateCategoryStatusController,
  },
  {
    method: 'patch',
    path: '/:id/feature',
    auth: 'ADMIN',
    schema: { params: categoryIdParamsSchema, body: updateCategoryFeatureSchema },
    handler: updateCategoryFeatureController,
  },
  {
    method: 'post',
    path: '/:id/image',
    auth: 'ADMIN',
    schema: { params: categoryIdParamsSchema },
    middleware: [memoryUploader().single('image')],
    handler: uploadCategoryImageController,
  },
  {
    method: 'delete',
    path: '/:id/image',
    auth: 'ADMIN',
    schema: { params: categoryIdParamsSchema },
    handler: removeCategoryImageController,
  },
]);

export default router;
