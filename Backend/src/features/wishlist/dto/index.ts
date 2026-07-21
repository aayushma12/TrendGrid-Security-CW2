import { Wishlist, WishlistItem } from '../types';

export interface AddWishlistItemDto {
  productId: string;
}

export interface WishlistItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  productThumbnail: string | null;
  basePrice: number;
  discountPrice: number | null;
  currency: string;
  isActive: boolean;
  inStock: boolean;
  addedAt: string;
}

export interface WishlistResponseDto {
  id: string;
  userId: string;
  items: WishlistItemResponseDto[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

const toItemDto = (i: WishlistItem): WishlistItemResponseDto => ({
  id: i.id,
  productId: i.productId,
  productName: i.productName,
  productThumbnail: i.productThumbnail ?? null,
  basePrice: i.basePrice,
  discountPrice: i.discountPrice ?? null,
  currency: i.currency,
  isActive: i.isActive,
  inStock: i.inStock,
  addedAt: i.addedAt.toISOString(),
});

export const toWishlistResponseDto = (w: Wishlist): WishlistResponseDto => ({
  id: w.id,
  userId: w.userId,
  items: w.items.map(toItemDto),
  itemCount: w.itemCount,
  createdAt: w.createdAt.toISOString(),
  updatedAt: w.updatedAt.toISOString(),
});
