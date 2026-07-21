import { Request, Response } from 'express';

import { created, noContent, paginated, success } from '../../../utils/response';
import { parseQueryOptions } from '../../../utils/queryOptions';
import { BadRequestError } from '../../../utils/errors';

import * as bannerService from '../service';
import { BANNER_FILTER_FIELDS, BANNER_MESSAGES, BANNER_SORT_FIELDS, BannerPlacementValue } from '../constants';

export const createBannerController = async (req: Request, res: Response): Promise<void> => {
  const b = await bannerService.createBanner(req.body);
  created(res, b, BANNER_MESSAGES.CREATED);
};

export const getBannerController = async (req: Request, res: Response): Promise<void> => {
  const b = await bannerService.getBannerById(req.params.id);
  success(res, b, BANNER_MESSAGES.RETRIEVED);
};

export const getBannersController = async (req: Request, res: Response): Promise<void> => {
  const options = parseQueryOptions(req, {
    allowedSortFields: [...BANNER_SORT_FIELDS],
    allowedFilters: [...BANNER_FILTER_FIELDS],
  });
  const { items, meta } = await bannerService.getBanners(options);
  paginated(res, items, meta, BANNER_MESSAGES.LISTED);
};

export const updateBannerController = async (req: Request, res: Response): Promise<void> => {
  const b = await bannerService.updateBanner(req.params.id, req.body);
  success(res, b, BANNER_MESSAGES.UPDATED);
};

export const deleteBannerController = async (req: Request, res: Response): Promise<void> => {
  await bannerService.deleteBanner(req.params.id);
  noContent(res);
};

/** Public/storefront: currently-live banners, optionally scoped to ?placement=. */
export const getActiveBannersController = async (req: Request, res: Response): Promise<void> => {
  const placement = req.query.placement as BannerPlacementValue | undefined;
  const items = await bannerService.getActiveBanners(placement);
  success(res, items, BANNER_MESSAGES.ACTIVE_LISTED);
};

export const uploadBannerImageController = async (req: Request, res: Response): Promise<void> => {
  if (!req.file?.buffer) throw new BadRequestError('Image file is required (field: "image").');
  const banner = await bannerService.setBannerImage(req.params.id, req.file.buffer);
  success(res, banner, BANNER_MESSAGES.IMAGE_UPLOADED);
};

export const removeBannerImageController = async (req: Request, res: Response): Promise<void> => {
  const banner = await bannerService.removeBannerImage(req.params.id);
  success(res, banner, BANNER_MESSAGES.IMAGE_REMOVED);
};
