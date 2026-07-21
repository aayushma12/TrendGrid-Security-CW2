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

// ------------- Bulk operations -------------
//
// Bulk endpoints operate on ids the caller already has (e.g. selected rows in
// the admin table) — there's no need to fetch full relations back, so these
// use Prisma's own bulk `updateMany`/`findMany`+`deleteMany` rather than N
// individual round trips through `update`/`remove`.

/** Returns only the ids that actually exist, in the same order-independent set — lets the
 *  service report which requested ids were skipped instead of silently no-oping on them. */
export const findExistingIds = async (ids: string[]): Promise<string[]> => {
  const rows = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true } });
  return rows.map((r) => r.id);
};

export const bulkUpdateStatus = async (ids: string[], status: ProductStatusValue): Promise<number> => {
  const { count } = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { status } });
  return count;
};

export const bulkUpdateActive = async (ids: string[], isActive: boolean): Promise<number> => {
  const { count } = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { isActive } });
  return count;
};

/** Cloudinary public ids for every image (product slots + variant gallery)
 *  across a set of products — the service uses this for cleanup before the
 *  bulk delete, same as the single-product delete path. */
export const listImagePublicIdsForProducts = async (ids: string[]): Promise<string[]> => {
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: {
      imagePublicId: true, extraImage1PublicId: true, extraImage2PublicId: true, extraImage3PublicId: true,
      variants: { select: { images: { select: { imagePublicId: true } } } },
    },
  });
  const publicIds: string[] = [];
  for (const p of products) {
    for (const pid of [p.imagePublicId, p.extraImage1PublicId, p.extraImage2PublicId, p.extraImage3PublicId]) {
      if (pid) publicIds.push(pid);
    }
    for (const v of p.variants) {
      for (const img of v.images) publicIds.push(img.imagePublicId);
    }
  }
  return publicIds;
};

export const bulkDelete = async (ids: string[]): Promise<number> => {
  const { count } = await prisma.product.deleteMany({ where: { id: { in: ids } } });
  return count;
};

// ------------- Catalog statistics -------------

export interface CatalogStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  draftProducts: number;
  publishedProducts: number;
  archivedProducts: number;
  recentlyAdded: number;
  lowStockVariants: number;
  productsPerCategory: { categoryId: string; categoryName: string; count: number }[];
}

export const getCatalogStats = async (recentDays: number, lowStockThreshold: number): Promise<CatalogStats> => {
  const since = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);

  const [
    totalProducts, activeProducts, inactiveProducts,
    draftProducts, publishedProducts, archivedProducts,
    recentlyAdded, lowStockVariants, categoryCounts,
  ] = await prisma.$transaction([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: false } }),
    prisma.product.count({ where: { status: 'DRAFT' } }),
    prisma.product.count({ where: { status: 'PUBLISHED' } }),
    prisma.product.count({ where: { status: 'ARCHIVED' } }),
    prisma.product.count({ where: { createdAt: { gte: since } } }),
    prisma.productVariant.count({
      where: { isActive: true, lowStockThreshold: { not: null }, stock: { lte: lowStockThreshold } },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    totalProducts, activeProducts, inactiveProducts,
    draftProducts, publishedProducts, archivedProducts,
    recentlyAdded, lowStockVariants,
    productsPerCategory: categoryCounts
      .filter((c) => c._count.products > 0)
      .map((c) => ({ categoryId: c.id, categoryName: c.name, count: c._count.products })),
  };
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

/** A filter value that's either a single string or several (repeated query key) — normalizes to an array, or undefined if absent/wrong type. */
const asStringArray = (v: unknown): string[] | undefined => {
  if (typeof v === 'string') return [v];
  if (Array.isArray(v) && v.every((x) => typeof x === 'string')) return v as string[];
  return undefined;
};

export const findMany = async (
  options: QueryOptions,
): Promise<{ items: ProductWithRelations[]; total: number }> => {
  const where: Prisma.ProductWhereInput = {};

  const f = options.filters;

  const categoryIds = asStringArray(f.categoryId);
  if (categoryIds?.length) where.categoryId = categoryIds.length === 1 ? categoryIds[0] : { in: categoryIds };

  const brands = asStringArray(f.brand);
  if (brands?.length) where.brand = brands.length === 1 ? brands[0] : { in: brands };

  if (typeof f.status === 'string') where.status = f.status as ProductStatusValue;
  if (typeof f.isActive === 'boolean') where.isActive = f.isActive;
  if (typeof f.isFeatured === 'boolean') where.isFeatured = f.isFeatured;
  if (typeof f.isRecommended === 'boolean') where.isRecommended = f.isRecommended;
  if (typeof f.isTrending === 'boolean') where.isTrending = f.isTrending;
  if (typeof f.isBestSeller === 'boolean') where.isBestSeller = f.isBestSeller;
  if (typeof f.isNewArrival === 'boolean') where.isNewArrival = f.isNewArrival;
  if (f.onSale === true) where.discountPrice = { not: null };

  if (typeof f.priceMin === 'number' || typeof f.priceMax === 'number') {
    where.basePrice = {
      ...(typeof f.priceMin === 'number' ? { gte: new Prisma.Decimal(f.priceMin) } : {}),
      ...(typeof f.priceMax === 'number' ? { lte: new Prisma.Decimal(f.priceMax) } : {}),
    };
  }

  // Season/occasion/style/weather/dress-code/gender live as free-form entries
  // in these String[] columns rather than dedicated fields (see
  // seedCatalog.ts) — `hasSome` is Prisma's native "array contains any of
  // these values" operator, so a multi-select filter (or the gender filter,
  // which reuses `label`) stays a single indexed-ish where clause rather
  // than an app-side scan.
  const tags = asStringArray(f.tag);
  if (tags?.length) where.tags = { hasSome: tags };
  const labels = asStringArray(f.label);
  if (labels?.length) where.labels = { hasSome: labels };
  const collections = asStringArray(f.collection);
  if (collections?.length) where.collections = { hasSome: collections };
  const sizes = asStringArray(f.size);
  if (sizes?.length) where.sizes = { hasSome: sizes };

  if (typeof f.curatedCollectionId === 'string') {
    where.curatedCollections = { some: { id: f.curatedCollectionId } };
  }

  // Color and stock are sellable-variant attributes, not Product-level
  // columns — filtered through the relation rather than the display-only
  // `colors` Json field. Combined into one `some` so "in stock AND (Red or
  // Blue)" requires a single variant matching both, not two different ones.
  const colors = asStringArray(f.color);
  const variantWhere: Prisma.ProductVariantWhereInput = {};
  if (colors?.length) variantWhere.color = { in: colors, mode: 'insensitive' };
  if (f.inStock === true) {
    variantWhere.stock = { gt: 0 };
    variantWhere.isActive = true;
  }
  if (Object.keys(variantWhere).length > 0) where.variants = { some: variantWhere };

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

/** Case-insensitive category lookup by name — CSV import identifies the
 *  category/subcategory by name rather than requiring the admin to know its UUID. */
export const findCategoryIdByName = async (name: string): Promise<string | null> => {
  const row = await prisma.category.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
  });
  return row?.id ?? null;
};

/** All existing product names, lowercased — used by CSV import (and available
 *  for any other bulk-insert path) to detect duplicates without a query per row. */
export const findAllProductNamesLower = async (): Promise<Set<string>> => {
  const rows = await prisma.product.findMany({ select: { name: true } });
  return new Set(rows.map((r) => r.name.toLowerCase()));
};





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
