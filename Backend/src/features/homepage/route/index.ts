/**
 * Homepage CMS routes — everything wired through defineRoutes so the tunnel
 * (auth + validate + asyncHandler) is applied to every handler.
 *
 * No create/delete routes: sections are a fixed set matching the storefront's
 * actual component tree, seeded once via prisma/seed.ts. Admins can reorder,
 * show/hide, and edit content — adding a new section requires a matching
 * storefront component, which is a code change, not a content edit.
 *
 * Auth matrix:
 *   public → GET / (storefront reads visible sections only)
 *   ADMIN  → everything else
 */
import { Router } from 'express';

import { defineRoutes } from '../../../utils/defineRoute';
import { memoryUploader } from '../../../config/cloudinary';

import {
  getSectionController,
  listAdminSectionsController,
  listPublicSectionsController,
  reorderSectionsController,
  updateSectionContentController,
  updateSectionVisibilityController,
  uploadSectionImageController,
} from '../controller';
import {
  reorderSectionsSchema,
  sectionIdParamsSchema,
  updateSectionContentSchema,
  updateSectionVisibilitySchema,
} from '../validator';

const router = Router();

defineRoutes(router, [
  { method: 'get', path: '/', auth: 'public', schema: {}, handler: listPublicSectionsController },

  { method: 'get', path: '/admin', auth: 'ADMIN', schema: {}, handler: listAdminSectionsController },
  { method: 'patch', path: '/reorder', auth: 'ADMIN', schema: { body: reorderSectionsSchema }, handler: reorderSectionsController },

  { method: 'get', path: '/:id', auth: 'ADMIN', schema: { params: sectionIdParamsSchema }, handler: getSectionController },
  { method: 'put', path: '/:id/content', auth: 'ADMIN',
    schema: { params: sectionIdParamsSchema, body: updateSectionContentSchema }, handler: updateSectionContentController },
  { method: 'patch', path: '/:id/visibility', auth: 'ADMIN',
    schema: { params: sectionIdParamsSchema, body: updateSectionVisibilitySchema }, handler: updateSectionVisibilityController },

  // Image (Cloudinary, via the shared imageService pipeline). Returns a URL —
  // does not persist to content; admin pastes it into a field and PUTs /content.
  { method: 'post', path: '/:id/image', auth: 'ADMIN', schema: { params: sectionIdParamsSchema },
    middleware: [memoryUploader().single('image')],
    handler: uploadSectionImageController },
]);

export default router;
