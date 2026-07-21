import { Prisma } from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { ProductVariant, ProductVariantImage } from '../types';

const VARIANT_INCLUDE = {
  images: { orderBy: { position: 'asc' } },
} satisfies Prisma.ProductVariantInclude;

type PrismaVariantWithIncludes = Prisma.ProductVariantGetPayload<{ include: typeof VARIANT_INCLUDE }>;

const toVariantImage = (i: {
  id: string; variantId: string; imageUrl: string; imagePublicId: string;
  position: number; createdAt: Date;
}): ProductVariantImage => ({
  id: i.id, variantId: i.variantId,
  imageUrl: i.imageUrl, imagePublicId: i.imagePublicId,
  position: i.position, createdAt: i.createdAt,
});

const toVariant = (v: PrismaVariantWithIncludes): ProductVariant => ({
  id: v.id,
  productId: v.productId,
  color: v.color ?? undefined,
  size: v.size ?? undefined,
  sku: v.sku,
  barcode: v.barcode ?? undefined,
  price: Number(v.price),
  discountPrice: v.discountPrice ? Number(v.discountPrice) : undefined,
  stock: v.stock,
  lowStockThreshold: v.lowStockThreshold ?? undefined,
  isActive: v.isActive,
  createdAt: v.createdAt,
  updatedAt: v.updatedAt,

  images: v.images.map(toVariantImage),
});

export interface CreateVariantRecord {
  productId: string;
  color?: string | null;
  size?: string | null;
  sku: string;
  barcode?: string | null;
  price: number;
  discountPrice?: number | null;
  stock: number;
  lowStockThreshold?: number | null;
  isActive: boolean;
}

export interface UpdateVariantRecord {
  color?: string | null;
  size?: string | null;
  sku?: string;
  barcode?: string | null;
  price?: number;
  discountPrice?: number | null;
  stock?: number;
  lowStockThreshold?: number | null;
  isActive?: boolean;
}

export const create = async (data: CreateVariantRecord): Promise<ProductVariant> => {
  const created = await prisma.productVariant.create({
    data: {
      productId: data.productId,
      color: data.color ?? null,
      size: data.size ?? null,
      sku: data.sku,
      barcode: data.barcode ?? null,
      price: new Prisma.Decimal(data.price),
      discountPrice: data.discountPrice !== null && data.discountPrice !== undefined
        ? new Prisma.Decimal(data.discountPrice) : null,
      stock: data.stock,
      lowStockThreshold: data.lowStockThreshold ?? null,
      isActive: data.isActive,
    },
    include: VARIANT_INCLUDE,
  });
  return toVariant(created);
};

export const findById = async (productId: string, variantId: string): Promise<ProductVariant | null> => {
  const r = await prisma.productVariant.findFirst({
    where: { id: variantId, productId }, include: VARIANT_INCLUDE,
  });
  return r ? toVariant(r) : null;
};

export const listByProduct = async (productId: string): Promise<ProductVariant[]> => {
  const rows = await prisma.productVariant.findMany({
    where: { productId }, include: VARIANT_INCLUDE, orderBy: { createdAt: 'asc' },
  });
  return rows.map(toVariant);
};

export const findBySku = async (sku: string): Promise<ProductVariant | null> => {
  const r = await prisma.productVariant.findUnique({ where: { sku }, include: VARIANT_INCLUDE });
  return r ? toVariant(r) : null;
};

export const findByBarcode = async (barcode: string): Promise<ProductVariant | null> => {
  const r = await prisma.productVariant.findUnique({ where: { barcode }, include: VARIANT_INCLUDE });
  return r ? toVariant(r) : null;
};

export const findByCombo = async (
  productId: string, color: string | null, size: string | null,
): Promise<ProductVariant | null> => {
  const r = await prisma.productVariant.findFirst({
    where: { productId, color, size }, include: VARIANT_INCLUDE,
  });
  return r ? toVariant(r) : null;
};

export const update = async (
  productId: string, variantId: string, patch: UpdateVariantRecord,
): Promise<ProductVariant | null> => {
  try {
    const existing = await prisma.productVariant.findFirst({
      where: { id: variantId, productId }, select: { id: true },
    });
    if (!existing) return null;
    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...patch,
        price: patch.price !== undefined ? new Prisma.Decimal(patch.price) : undefined,
        discountPrice: patch.discountPrice === null
          ? null
          : patch.discountPrice !== undefined
            ? new Prisma.Decimal(patch.discountPrice)
            : undefined,
      },
      include: VARIANT_INCLUDE,
    });
    return toVariant(updated);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return null;
    throw err;
  }
};

export const remove = async (productId: string, variantId: string): Promise<ProductVariant | null> => {
  const existing = await prisma.productVariant.findFirst({
    where: { id: variantId, productId }, include: VARIANT_INCLUDE,
  });
  if (!existing) return null;
  await prisma.productVariant.delete({ where: { id: variantId } });
  return toVariant(existing);
};

// ---------- variant images ----------

export const createImage = async (
  variantId: string,
  data: { imageUrl: string; imagePublicId: string; position: number },
): Promise<ProductVariantImage> =>
  toVariantImage(
    await prisma.productVariantImage.create({
      data: {
        variantId,
        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId,
        position: data.position,
      },
    }),
  );

export const findImageById = async (
  variantId: string, imageId: string,
): Promise<ProductVariantImage | null> => {
  const r = await prisma.productVariantImage.findFirst({ where: { id: imageId, variantId } });
  return r ? toVariantImage(r) : null;
};

export const removeImage = async (variantId: string, imageId: string): Promise<boolean> => {
  const existing = await prisma.productVariantImage.findFirst({ where: { id: imageId, variantId } });
  if (!existing) return false;
  await prisma.productVariantImage.delete({ where: { id: imageId } });
  return true;
};

export const maxImagePosition = async (variantId: string): Promise<number> => {
  const r = await prisma.productVariantImage.aggregate({
    where: { variantId }, _max: { position: true },
  });
  return r._max.position ?? -1;
};

/** Returns Cloudinary publicIds for every image belonging to variants of `productId` — used on product delete. */
export const listAllPublicIdsForProduct = async (productId: string): Promise<string[]> => {
  const rows = await prisma.productVariantImage.findMany({
    where: { variant: { productId } }, select: { imagePublicId: true },
  });
  return rows.map((r) => r.imagePublicId);
};
