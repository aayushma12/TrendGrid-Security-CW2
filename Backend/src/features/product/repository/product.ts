/**
 * Product repository — DB queries only for the core product entity + assignments.
 * Sub-resources (characteristics, gallery, variants) live in their own files.
 */
import { Prisma } from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { QueryOptions } from '../../../types';
import { Product, ProductWithRelations } from '../types';
import { ProductStatusValue } from '../constants';

// ------------- Include shape used across queries -------------

export const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true } },

  characteristics: { orderBy: { position: 'asc' } },
  variants: {
    include: {

      images: { orderBy: { position: 'asc' } },
    },
    orderBy: { createdAt: 'asc' },
  },
  _count: { select: { variants: true } },
} satisfies Prisma.ProductInclude;

type PrismaProductWithIncludes = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

// ------------- Mappers -------------

const decimalToNumber = (v: Prisma.Decimal | null | undefined): number | undefined =>
  v === null || v === undefined ? undefined : Number(v);

export const toProduct = (r: PrismaProductWithIncludes): ProductWithRelations => ({
  id: r.id,
  name: r.name,
  description: r.description ?? undefined,
  shortDescription: r.shortDescription ?? undefined,
  imageUrl: r.imageUrl ?? undefined,
  imagePublicId: r.imagePublicId ?? undefined,

  extraImage1Url: r.extraImage1Url ?? undefined,
  extraImage1PublicId: r.extraImage1PublicId ?? undefined,
  extraImage2Url: r.extraImage2Url ?? undefined,
  extraImage2PublicId: r.extraImage2PublicId ?? undefined,
  extraImage3Url: r.extraImage3Url ?? undefined,
  extraImage3PublicId: r.extraImage3PublicId ?? undefined,

  basePrice: Number(r.basePrice),
  discountPrice: decimalToNumber(r.discountPrice),
  currency: r.currency,

  categoryId: r.categoryId,
  brand: r.brand ?? undefined,
  category: r.category ? { id: r.category.id, name: r.category.name } : null,

  status: r.status as ProductStatusValue,
  isActive: r.isActive,
  isFeatured: r.isFeatured,
  isRecommended: r.isRecommended,
  isTrending: r.isTrending,
  isBestSeller: r.isBestSeller,
  isNewArrival: r.isNewArrival,

  sizes: r.sizes,
  colors: (r.colors as any) ?? [],
  tags: r.tags,
  labels: r.labels,
  collections: r.collections,
  characteristics: r.characteristics.map((c) => ({
    id: c.id, productId: c.productId,
    name: c.name, value: c.value, position: c.position,
    createdAt: c.createdAt, updatedAt: c.updatedAt,
  })),
  variants: r.variants.map((v) => ({
    id: v.id, productId: v.productId,
    color: v.color ?? undefined, size: v.size ?? undefined,
    sku: v.sku, barcode: v.barcode ?? undefined,
    price: Number(v.price),
    discountPrice: decimalToNumber(v.discountPrice),
    stock: v.stock,
    lowStockThreshold: v.lowStockThreshold ?? undefined,
    isActive: v.isActive,
    createdAt: v.createdAt, updatedAt: v.updatedAt,

    images: v.images.map((i) => ({
      id: i.id, variantId: i.variantId,
      imageUrl: i.imageUrl, imagePublicId: i.imagePublicId,
      position: i.position, createdAt: i.createdAt,
    })),
  })),
  variantsCount: r._count?.variants,

  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

// ------------- CRUD -------------

export interface CreateProductRecord {
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  basePrice: number;
  discountPrice?: number | null;
  currency: string;
  categoryId: string;
  brand?: string | null;
  status: ProductStatusValue;
  isActive: boolean;
  isFeatured: boolean;
  isRecommended: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  sizes?: string[];
  colors?: { name: string; hexCode: string }[];
  tags?: string[];
  labels?: string[];
  collections?: string[];
}



export const create = async (data: CreateProductRecord): Promise<ProductWithRelations> => {
  const created = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      shortDescription: data.shortDescription ?? null,
      basePrice: new Prisma.Decimal(data.basePrice),
      discountPrice: data.discountPrice !== null && data.discountPrice !== undefined
        ? new Prisma.Decimal(data.discountPrice) : null,
      currency: data.currency,
      categoryId: data.categoryId,
      brand: data.brand ?? null,
      status: data.status,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      isRecommended: data.isRecommended,
      isTrending: data.isTrending,
      isBestSeller: data.isBestSeller,
      isNewArrival: data.isNewArrival,
      sizes: data.sizes ?? [],
      colors: data.colors ?? [],
      tags: data.tags ?? [],
      labels: data.labels ?? [],
      collections: data.collections ?? [],
    },
    include: PRODUCT_INCLUDE,
  });
  return toProduct(created);
};

export interface UpdateProductRecord {
  name?: string;
  description?: string | null;
  shortDescription?: string | null;
  basePrice?: number;
  discountPrice?: number | null;
  currency?: string;
  categoryId?: string;
  brand?: string | null;
  status?: ProductStatusValue;
  isActive?: boolean;
  isFeatured?: boolean;
  isRecommended?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  extraImage1Url?: string | null;
  extraImage1PublicId?: string | null;
  extraImage2Url?: string | null;
  extraImage2PublicId?: string | null;
  extraImage3Url?: string | null;
  extraImage3PublicId?: string | null;
}

export const update = async (id: string, patch: UpdateProductRecord): Promise<ProductWithRelations | null> => {
  try {
    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...patch,
        basePrice: patch.basePrice !== undefined ? new Prisma.Decimal(patch.basePrice) : undefined,
        discountPrice: patch.discountPrice === null
          ? null
          : patch.discountPrice !== undefined
            ? new Prisma.Decimal(patch.discountPrice)
            : undefined,
      },
      include: PRODUCT_INCLUDE,
    });
    return toProduct(updated);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return null;
    throw err;
  }
};

export const findById = async (id: string): Promise<ProductWithRelations | null> => {
  const r = await prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
  return r ? toProduct(r) : null;
};

/** Lightweight existence check for hot paths (e.g. asserting a product exists before hitting sub-repos). */
export const existsById = async (id: string): Promise<boolean> => {
  const r = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  return Boolean(r);
};

export const remove = async (id: string): Promise<Product | null> => {
  try {
    const r = await prisma.product.findUnique({ where: { id } });
    if (!r) return null;
    await prisma.product.delete({ where: { id } });
    return {
      id: r.id, name: r.name,
      description: r.description ?? undefined,
      shortDescription: r.shortDescription ?? undefined,
      imageUrl: r.imageUrl ?? undefined,
      imagePublicId: r.imagePublicId ?? undefined,
      extraImage1Url: r.extraImage1Url ?? undefined,
      extraImage1PublicId: r.extraImage1PublicId ?? undefined,
      extraImage2Url: r.extraImage2Url ?? undefined,
      extraImage2PublicId: r.extraImage2PublicId ?? undefined,
      extraImage3Url: r.extraImage3Url ?? undefined,
      extraImage3PublicId: r.extraImage3PublicId ?? undefined,
      basePrice: Number(r.basePrice),
      discountPrice: r.discountPrice ? Number(r.discountPrice) : undefined,
      currency: r.currency,
      categoryId: r.categoryId,
      brand: r.brand ?? undefined,
      status: r.status as ProductStatusValue,
      isActive: r.isActive, isFeatured: r.isFeatured, isRecommended: r.isRecommended,
      isTrending: r.isTrending, isBestSeller: r.isBestSeller, isNewArrival: r.isNewArrival,
      createdAt: r.createdAt, updatedAt: r.updatedAt,
      sizes: r.sizes, colors: (r.colors as any) ?? [], tags: r.tags, labels: r.labels, collections: r.collections,
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return null;
    throw err;
  }
};

export const updateAssignments = async (
  id: string,
  patch: {
    sizes?: string[];
    colors?: { name: string; hexCode: string }[];
    tags?: string[];
    labels?: string[];
    collections?: string[];
  },
): Promise<ProductWithRelations | null> => {
  try {
    const r = await prisma.product.update({
      where: { id },
      data: {
        sizes: patch.sizes,
        colors: patch.colors,
        tags: patch.tags,
        labels: patch.labels,
        collections: patch.collections,
      },
      include: PRODUCT_INCLUDE,
    });
    return toProduct(r);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return null;
    throw err;
  }
};

// ------------- Listing -------------

export const findMany = async (
  options: QueryOptions,
): Promise<{ items: ProductWithRelations[]; total: number }> => {
  const where: Prisma.ProductWhereInput = {};

  const f = options.filters;
  if (typeof f.categoryId === 'string') where.categoryId = f.categoryId;
  if (typeof f.brand === 'string') where.brand = f.brand;
  if (typeof f.status === 'string') where.status = f.status as ProductStatusValue;
  if (typeof f.isActive === 'boolean') where.isActive = f.isActive;
  if (typeof f.isFeatured === 'boolean') where.isFeatured = f.isFeatured;
  if (typeof f.isRecommended === 'boolean') where.isRecommended = f.isRecommended;
  if (typeof f.isTrending === 'boolean') where.isTrending = f.isTrending;
  if (typeof f.isBestSeller === 'boolean') where.isBestSeller = f.isBestSeller;
  if (typeof f.isNewArrival === 'boolean') where.isNewArrival = f.isNewArrival;

  if (typeof f.priceMin === 'number' || typeof f.priceMax === 'number') {
    where.basePrice = {
      ...(typeof f.priceMin === 'number' ? { gte: new Prisma.Decimal(f.priceMin) } : {}),
      ...(typeof f.priceMax === 'number' ? { lte: new Prisma.Decimal(f.priceMax) } : {}),
    };
  }

  if (options.search) {
    where.OR = [
      { name: { contains: options.search, mode: 'insensitive' } },
      { shortDescription: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  const [rows, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip: options.skip,
      take: options.limit,
      orderBy: { [options.sortBy]: options.sortOrder },
      include: PRODUCT_INCLUDE,
    }),
    prisma.product.count({ where }),
  ]);
  return { items: rows.map(toProduct), total };
};

// ------------- Existence helpers for validation in service -------------

export const categoryExists = async (id: string): Promise<boolean> =>
  Boolean(await prisma.category.findUnique({ where: { id }, select: { id: true } }));





// ------------- Computed merchandising (sales-derived rankings) -------------

/** Order statuses that count toward sales rankings (money kept). */
const SALES_COUNTED_EXCLUDED = ['CANCELLED', 'FAILED', 'RETURNED', 'REFUNDED'] as const;

/**
 * Product ids ranked by units sold in the past `sinceDays` days, best first.
 * Cancelled/failed/returned/refunded orders don't count.
 */
export const findTopSellingProductIds = async (
  sinceDays: number,
  limit: number,
): Promise<string[]> => {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const rows = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        placedAt: { gte: since },
        isDeleted: false,
        status: { notIn: [...SALES_COUNTED_EXCLUDED] },
      },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });
  return rows.map((r) => r.productId);
};

/** Published + active products for the given ids (order NOT preserved — caller re-sorts). */
export const findPublishedByIds = async (ids: string[]): Promise<ProductWithRelations[]> => {
  if (ids.length === 0) return [];
  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true, status: 'PUBLISHED' },
    include: PRODUCT_INCLUDE,
  });
  return rows.map(toProduct);
};

/** Published + active products manually pinned via a merchandising flag. */
export const findFlaggedPublished = async (
  flag: 'isBestSeller' | 'isTrending' | 'isNewArrival' | 'isFeatured',
  limit: number,
): Promise<ProductWithRelations[]> => {
  const rows = await prisma.product.findMany({
    where: { [flag]: true, isActive: true, status: 'PUBLISHED' },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    include: PRODUCT_INCLUDE,
  });
  return rows.map(toProduct);
};

/**
 * New arrivals: created within `sinceDays` days OR manually pinned with the
 * isNewArrival flag. Newest first, so a product ages out automatically.
 */
export const findNewArrivals = async (
  sinceDays: number,
  limit: number,
): Promise<ProductWithRelations[]> => {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      status: 'PUBLISHED',
      OR: [{ createdAt: { gte: since } }, { isNewArrival: true }],
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: PRODUCT_INCLUDE,
  });
  return rows.map(toProduct);
};
