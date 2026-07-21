/**
 * Collection routes — registered via defineRoutes so validate + asyncHandler
 * are wired automatically.
 *
 * Auth matrix:
 *   public  → GET listing / single / products (storefront reads)
 *   ADMIN   → all write operations (create, update, delete, image, status, product membership)
 */
import { Router } from 'express';

import { defineRoutes } from '../../../utils/defineRoute';
import { memoryUploader } from '../../../config/cloudinary';
import { optionalAuth } from '../../../middleware/auth';
import { listProductsQuerySchema } from '../../product/validator';
import {
  addProductsToCollectionController,
  createCollectionController,
  deleteCollectionController,
  getActiveCollectionsController,
  getCollectionController,
  getCollectionsController,
  listCollectionProductsController,
  removeCollectionImageController,
  removeProductsFromCollectionController,
  updateCollectionController,
  updateCollectionStatusController,
  uploadCollectionImageController,
} from '../controller';
import {
  collectionIdParamsSchema,
  collectionProductIdsSchema,
  listCollectionsQuerySchema,
  updateCollectionStatusSchema,
} from '../validator';

const router = Router();

// ── Public reads (storefront) ──────────────────────────────────────────────
defineRoutes(router, [
  { method: 'get', path: '/', auth: 'public', schema: { query: listCollectionsQuerySchema }, handler: getCollectionsController },
  // Fixed path — must stay registered before GET '/:id' below.
  { method: 'get', path: '/active', auth: 'public', schema: {}, handler: getActiveCollectionsController },
  { method: 'get', path: '/:id', auth: 'public', schema: { params: collectionIdParamsSchema }, handler: getCollectionController },
  {
    method: 'get', path: '/:id/products', auth: 'public', preAuth: [optionalAuth],
    schema: { params: collectionIdParamsSchema, query: listProductsQuerySchema },
    handler: listCollectionProductsController,
  },
]);

// ── Admin writes ───────────────────────────────────────────────────────────
defineRoutes(router, [
  { method: 'post', path: '/', auth: 'ADMIN', schema: {}, middleware: [memoryUploader().single('image')], handler: createCollectionController },
  { method: 'put', path: '/:id', auth: 'ADMIN', schema: { params: collectionIdParamsSchema }, middleware: [memoryUploader().single('image')], handler: updateCollectionController },
  { method: 'delete', path: '/:id', auth: 'ADMIN', schema: { params: collectionIdParamsSchema }, handler: deleteCollectionController },
  { method: 'patch', path: '/:id/status', auth: 'ADMIN', schema: { params: collectionIdParamsSchema, body: updateCollectionStatusSchema }, handler: updateCollectionStatusController },
  { method: 'post', path: '/:id/image', auth: 'ADMIN', schema: { params: collectionIdParamsSchema }, middleware: [memoryUploader().single('image')], handler: uploadCollectionImageController },
  { method: 'delete', path: '/:id/image', auth: 'ADMIN', schema: { params: collectionIdParamsSchema }, handler: removeCollectionImageController },
  { method: 'post', path: '/:id/products', auth: 'ADMIN', schema: { params: collectionIdParamsSchema, body: collectionProductIdsSchema }, handler: addProductsToCollectionController },
  { method: 'delete', path: '/:id/products', auth: 'ADMIN', schema: { params: collectionIdParamsSchema, body: collectionProductIdsSchema }, handler: removeProductsFromCollectionController },
]);

export default router;
