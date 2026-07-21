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

import { listProductsQuerySchema } from '../../product/validator';
import {
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
  categoryIdParamsSchema,
  listCategoriesQuerySchema,
  updateCategoryFeatureSchema,
  updateCategoryStatusSchema,
} from '../validator';

const router = Router();

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
