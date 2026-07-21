import { Request, Response } from 'express';

import { success } from '../../../utils/response';
import { ForbiddenError } from '../../../utils/errors';

import * as wishlistService from '../service';
import { WISHLIST_MESSAGES } from '../constants';

const enforceWishlistOwnership = (req: Request): void => {
  if (req.user?.id !== req.params.userId) {
    throw new ForbiddenError('You can only access your own wishlist.');
  }
};

export const getWishlistController = async (req: Request, res: Response): Promise<void> => {
  enforceWishlistOwnership(req);
  const wishlist = await wishlistService.getWishlist(req.params.userId);
  success(res, wishlist, WISHLIST_MESSAGES.RETRIEVED);
};

export const addWishlistItemController = async (req: Request, res: Response): Promise<void> => {
  enforceWishlistOwnership(req);
  const wishlist = await wishlistService.addItem(req.params.userId, req.body.productId);
  success(res, wishlist, WISHLIST_MESSAGES.ITEM_ADDED);
};

export const removeWishlistItemController = async (req: Request, res: Response): Promise<void> => {
  enforceWishlistOwnership(req);
  const wishlist = await wishlistService.removeItem(req.params.userId, req.params.productId);
  success(res, wishlist, WISHLIST_MESSAGES.ITEM_REMOVED);
};

export const clearWishlistController = async (req: Request, res: Response): Promise<void> => {
  enforceWishlistOwnership(req);
  const wishlist = await wishlistService.clearWishlist(req.params.userId);
  success(res, wishlist, WISHLIST_MESSAGES.CLEARED);
};
