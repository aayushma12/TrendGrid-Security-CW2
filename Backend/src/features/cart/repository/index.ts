import { Prisma } from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { CartItem, Cart } from '../types';

/**
 * Rich shape used to build a fully-hydrated cart. Includes product, variant,
 * color, size, thumbnail — everything we need to compute pricing snapshots.
 */
const CART_INCLUDE = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            select: {
              id: true, name: true, isActive: true, imageUrl: true, basePrice: true, currency: true,
            },
          },

        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.CartInclude;

type PrismaCartWithIncludes = Prisma.CartGetPayload<{ include: typeof CART_INCLUDE }>;

export const getOrCreate = async (userId: string): Promise<Cart> => {
  const cart = await prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: CART_INCLUDE,
  });
  return hydrate(cart);
};

export const findByUser = async (userId: string): Promise<Cart | null> => {
  const cart = await prisma.cart.findUnique({ where: { userId }, include: CART_INCLUDE });
  return cart ? hydrate(cart) : null;
};

/**
 * Convert Prisma cart into a hydrated domain Cart.
 * NOTE: Line pricing and discount are computed by the service (not here) so
 * discount lookup + calculation stays in the service layer.
 */
const hydrate = (cart: PrismaCartWithIncludes): Cart => {
  const items: CartItem[] = cart.items.map((it) => {
    const v = it.variant;
    const p = v.product;
    const variantPrice = Number(v.price);
    return {
      id: it.id,
      variantId: it.variantId,
      quantity: it.quantity,
      productId: p.id,
      productName: p.name,
      imageUrl: p.imageUrl ?? undefined,
      variantSku: v.sku,
      colorName: v.color ?? undefined,
      sizeName: v.size ?? undefined,
      originalPrice: variantPrice,
      discountedPrice: v.discountPrice != null ? Number(v.discountPrice) : undefined,
      unitPrice: variantPrice,   // recalculated by service after discount lookup
      discountAmount: 0,         // recalculated by service
      lineTotal: variantPrice * it.quantity,
      stock: v.stock,
      isAvailable: p.isActive && v.isActive && v.stock >= it.quantity,
      unavailableReason: !p.isActive
        ? 'Product inactive'
        : !v.isActive
          ? 'Variant inactive'
          : v.stock < it.quantity
            ? 'Insufficient stock'
            : undefined,
    };
  });

  return {
    id: cart.id,
    userId: cart.userId,
    items,
    subtotal: 0,        // set by service
    discountTotal: 0,   // set by service
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    currency: cart.items[0]?.variant.product.currency ?? 'NPR',
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
};

// ---------- item ops ----------

export const findItem = async (
  userId: string, itemId: string,
): Promise<{ id: string; cartId: string; variantId: string; quantity: number } | null> => {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId } },
    select: { id: true, cartId: true, variantId: true, quantity: true },
  });
  return item;
};

export const findVariant = async (variantId: string) => {
  const v = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: {
      id: true, stock: true, isActive: true, productId: true,
      product: { select: { isActive: true } },
    },
  });
  return v;
};

export const upsertItem = async (
  cartId: string, variantId: string, quantity: number,
): Promise<{ id: string; quantity: number }> => {
  const item = await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    create: { cartId, variantId, quantity },
    update: { quantity: { increment: quantity } },
    select: { id: true, quantity: true },
  });
  return item;
};

export const updateItemQuantity = async (itemId: string, quantity: number): Promise<void> => {
  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
};

export const removeItem = async (itemId: string): Promise<void> => {
  await prisma.cartItem.delete({ where: { id: itemId } });
};

export const clearCart = async (userId: string): Promise<void> => {
  await prisma.cartItem.deleteMany({ where: { cart: { userId } } });
};
