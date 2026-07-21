/**
 * Banner (special offers) routes — everything wired through defineRoutes so the
 * tunnel (auth + validate + asyncHandler) is applied to every handler.
 *
 * Auth matrix:
 *   public  → GET /active (storefront reads the currently-live banners)
 *   ADMIN   → full CRUD + list (admin Banners page)
 */
import { Router } from 'express';

import { defineRoutes } from '../../../utils/defineRoute';
import { memoryUploader } from '../../../config/cloudinary';

import {
  createBannerController,
  deleteBannerController,
  getActiveBannersController,
  getBannerController,
  getBannersController,
  removeBannerImageController,
  updateBannerController,
  uploadBannerImageController,
} from '../controller';
import {
  activeBannersQuerySchema,
  bannerIdParamsSchema,
  createBannerSchema,
  listBannersQuerySchema,
  updateBannerSchema,
} from '../validator';

const router = Router();

defineRoutes(router, [
  // Storefront: currently-live banners only
  { method: 'get', path: '/active', auth: 'public', schema: { query: activeBannersQuerySchema }, handler: getActiveBannersController },

  // Admin management
  { method: 'get',    path: '/',    auth: 'ADMIN', schema: { query: listBannersQuerySchema },                          handler: getBannersController },
  { method: 'post',   path: '/',    auth: 'ADMIN', schema: { body: createBannerSchema },                               handler: createBannerController },
  { method: 'get',    path: '/:id', auth: 'ADMIN', schema: { params: bannerIdParamsSchema },                           handler: getBannerController },
  { method: 'put',    path: '/:id', auth: 'ADMIN', schema: { params: bannerIdParamsSchema, body: updateBannerSchema }, handler: updateBannerController },
  { method: 'delete', path: '/:id', auth: 'ADMIN', schema: { params: bannerIdParamsSchema },                           handler: deleteBannerController },

  // Image (Cloudinary, via the shared imageService pipeline)
  { method: 'post',   path: '/:id/image', auth: 'ADMIN', schema: { params: bannerIdParamsSchema },
    middleware: [memoryUploader().single('image')],
    handler: uploadBannerImageController },
  { method: 'delete', path: '/:id/image', auth: 'ADMIN', schema: { params: bannerIdParamsSchema },
    handler: removeBannerImageController },
]);

export default router;
