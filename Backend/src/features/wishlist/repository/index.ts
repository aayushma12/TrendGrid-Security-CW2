import { Prisma } from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { Wishlist, WishlistItem } from '../types';

const WISHLIST_INCLUDE = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          basePrice: true,
          discountPrice: true,
          currency: true,
          isActive: true,
          variants: { select: { stock: true, isActive: true } },
        },
      },
    },
    orderBy: { addedAt: 'desc' },
  },
} satisfies Prisma.WishlistInclude;

type PrismaWishlistWithIncludes = Prisma.WishlistGetPayload<{ include: typeof WISHLIST_INCLUDE }>;

const hydrate = (w: PrismaWishlistWithIncludes): Wishlist => {
  const items: WishlistItem[] = w.items.map((it) => {
    const p = it.product;
    return {
      id: it.id,
      productId: p.id,
      productName: p.name,
      productThumbnail: p.imageUrl ?? undefined,
      basePrice: Number(p.basePrice),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : undefined,
      currency: p.currency,
      isActive: p.isActive,
      inStock: p.variants.some((v) => v.isActive && v.stock > 0),
      addedAt: it.addedAt,
    };
  });

  return {
    id: w.id,
    userId: w.userId,
    items,
    itemCount: items.length,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
};

export const getOrCreate = async (userId: string): Promise<Wishlist> => {
  const wishlist = await prisma.wishlist.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: WISHLIST_INCLUDE,
  });
  return hydrate(wishlist);
};

export const findProduct = async (productId: string) =>
  prisma.product.findUnique({ where: { id: productId }, select: { id: true, isActive: true } });

export const findItem = async (userId: string, productId: string) =>
  prisma.wishlistItem.findFirst({
    where: { productId, wishlist: { userId } },
    select: { id: true },
  });

export const addItem = async (wishlistId: string, productId: string): Promise<void> => {
  await prisma.wishlistItem.upsert({
    where: { wishlistId_productId: { wishlistId, productId } },
    create: { wishlistId, productId },
    update: {},
  });
};

export const removeItem = async (userId: string, productId: string): Promise<boolean> => {
  const r = await prisma.wishlistItem.deleteMany({
    where: { productId, wishlist: { userId } },
  });
  return r.count > 0;
};

export const clear = async (userId: string): Promise<void> => {
  await prisma.wishlistItem.deleteMany({ where: { wishlist: { userId } } });
};
