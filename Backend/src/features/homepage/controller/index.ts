import { Request, Response } from 'express';

import { success } from '../../../utils/response';
import { BadRequestError } from '../../../utils/errors';

import * as homepageService from '../service';
import { HOMEPAGE_MESSAGES } from '../constants';

/** GET /homepage — public storefront read (visible sections only). */
export const listPublicSectionsController = async (_req: Request, res: Response): Promise<void> => {
  const items = await homepageService.listPublicSections();
  success(res, items, HOMEPAGE_MESSAGES.LISTED);
};

/** GET /homepage/admin — every section, for the admin CMS panel. */
export const listAdminSectionsController = async (_req: Request, res: Response): Promise<void> => {
  const items = await homepageService.listAdminSections();
  success(res, items, HOMEPAGE_MESSAGES.LISTED);
};

export const getSectionController = async (req: Request, res: Response): Promise<void> => {
  const item = await homepageService.getSectionById(req.params.id);
  success(res, item, HOMEPAGE_MESSAGES.RETRIEVED);
};

export const updateSectionContentController = async (req: Request, res: Response): Promise<void> => {
  const item = await homepageService.updateSectionContent(req.params.id, req.body);
  success(res, item, HOMEPAGE_MESSAGES.CONTENT_UPDATED);
};

export const updateSectionVisibilityController = async (req: Request, res: Response): Promise<void> => {
  const item = await homepageService.updateSectionVisibility(req.params.id, req.body);
  success(res, item, HOMEPAGE_MESSAGES.VISIBILITY_UPDATED);
};

export const reorderSectionsController = async (req: Request, res: Response): Promise<void> => {
  const items = await homepageService.reorderSections(req.body);
  success(res, items, HOMEPAGE_MESSAGES.REORDERED);
};

/** POST /homepage/:id/image — upload an asset for use in this section's content. */
export const uploadSectionImageController = async (req: Request, res: Response): Promise<void> => {
  if (!req.file?.buffer) throw new BadRequestError('Image file is required (field: "image").');
  const result = await homepageService.uploadSectionImage(req.params.id, req.file.buffer);
  success(res, result, HOMEPAGE_MESSAGES.IMAGE_UPLOADED);
};
