import { Cart, CartItem } from '../types';

export interface AddCartItemDto {
  variantId: string;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

export interface CartItemResponseDto {
  id: string;
  variantId: string;
  quantity: number;
  productId: string;
  productName: string;
  productThumbnail: string | null;
  variantSku: string;
  colorName: string | null;
  sizeName: string | null;
  originalPrice: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  stock: number;
  isAvailable: boolean;
  unavailableReason: string | null;
}

export interface CartResponseDto {
  id: string;
  userId: string;
  items: CartItemResponseDto[];
  subtotal: number;
  discountTotal: number;
  itemCount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

const toItemDto = (i: CartItem): CartItemResponseDto => ({
  id: i.id,
  variantId: i.variantId,
  quantity: i.quantity,
  productId: i.productId,
  productName: i.productName,
  productThumbnail: i.productThumbnail ?? null,
  variantSku: i.variantSku,
  colorName: i.colorName ?? null,
  sizeName: i.sizeName ?? null,
  originalPrice: i.originalPrice,
  unitPrice: i.unitPrice,
  discountAmount: i.discountAmount,
  lineTotal: i.lineTotal,
  stock: i.stock,
  isAvailable: i.isAvailable,
  unavailableReason: i.unavailableReason ?? null,
});

export const toCartResponseDto = (c: Cart): CartResponseDto => ({
  id: c.id,
  userId: c.userId,
  items: c.items.map(toItemDto),
  subtotal: c.subtotal,
  discountTotal: c.discountTotal,
  itemCount: c.itemCount,
  currency: c.currency,
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});
