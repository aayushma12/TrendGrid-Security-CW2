/**
 * Wishlist service — persistent per-user saved-products list.
 * Unlike the cart, there's no quantity or variant — just "did this user save
 * this product." Availability (isActive/inStock) is resolved live on read so
 * a saved item never goes stale.
 */
import { DuplicateError, NotFoundError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

import * as wishlistRepo from '../repository';
import { WishlistResponseDto, toWishlistResponseDto } from '../dto';
import { WISHLIST_MESSAGES } from '../constants';

export const getWishlist = async (userId: string): Promise<WishlistResponseDto> => {
  const wishlist = await wishlistRepo.getOrCreate(userId);
  return toWishlistResponseDto(wishlist);
};

export const addItem = async (userId: string, productId: string): Promise<WishlistResponseDto> => {
  const product = await wishlistRepo.findProduct(productId);
  if (!product) throw new NotFoundError(WISHLIST_MESSAGES.PRODUCT_NOT_FOUND);

  const wishlist = await wishlistRepo.getOrCreate(userId);
  const existing = wishlist.items.find((i) => i.productId === productId);
  if (existing) throw new DuplicateError(WISHLIST_MESSAGES.ITEM_ALREADY_SAVED);

  await wishlistRepo.addItem(wishlist.id, productId);
  logger.info(`Wishlist item added userId=${userId} productId=${productId}`);
  return getWishlist(userId);
};

export const removeItem = async (userId: string, productId: string): Promise<WishlistResponseDto> => {
  const removed = await wishlistRepo.removeItem(userId, productId);
  if (!removed) throw new NotFoundError(WISHLIST_MESSAGES.ITEM_NOT_FOUND);
  logger.info(`Wishlist item removed userId=${userId} productId=${productId}`);
  return getWishlist(userId);
};

export const clearWishlist = async (userId: string): Promise<WishlistResponseDto> => {
  await wishlistRepo.clear(userId);
  logger.info(`Wishlist cleared userId=${userId}`);
  return getWishlist(userId);
};
