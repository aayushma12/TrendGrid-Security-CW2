import { PaginationMeta, QueryOptions } from '../../../types';
import { BadRequestError, NotFoundError } from '../../../utils/errors';
import { buildPaginationMeta } from '../../../utils/queryOptions';
import { logger } from '../../../utils/logger';
import { deleteImage, replaceImage } from '../../../services/imageService';

import * as reviewService from '../../review/service';
import * as orderService from '../../order/service';

import * as productRepo from '../repository/product';
import * as variantRepo from '../repository/variant';
import {
  CreateProductDto, ProductResponseDto, UpdateAssignmentsDto, UpdateProductDto,
  UpdateProductFlagDto, UpdateProductStatusDto, toProductResponseDto,
} from '../dto';
import {
  BEST_SELLER_WINDOW_DAYS,
  DEFAULT_CURRENCY,
  NEW_ARRIVAL_WINDOW_DAYS,
  PRODUCT_MESSAGES,
  PRODUCT_THUMBNAIL_SUBFOLDER,
  ProductToggleFlag,
  STOREFRONT_STRIP_LIMIT,
  TRENDING_WINDOW_DAYS,
} from '../constants';
import { ProductWithRelations } from '../types';

// ------------- helpers -------------

const assertCatalogsExist = async (dto: {
  categoryId?: string;
  sizes?: string[];
  colors?: { name: string; hexCode: string }[];
  tags?: string[];
  labels?: string[];
  collections?: string[];
}): Promise<void> => {
  if (dto.categoryId) {
    const exists = await productRepo.categoryExists(dto.categoryId);
    if (!exists) {
      throw new BadRequestError(PRODUCT_MESSAGES.CATEGORY_NOT_FOUND, [
        { field: 'categoryId', message: PRODUCT_MESSAGES.CATEGORY_NOT_FOUND },
      ]);
    }
  }
};

// ------------- CRUD -------------

export const createProduct = async (dto: CreateProductDto): Promise<ProductResponseDto> => {
  await assertCatalogsExist(dto);

  const created = await productRepo.create({
    name: dto.name,
    description: dto.description ?? null,
    shortDescription: dto.shortDescription ?? null,
    basePrice: dto.basePrice,
    discountPrice: dto.discountPrice ?? null,
    currency: dto.currency ?? DEFAULT_CURRENCY,
    categoryId: dto.categoryId,
    brand: dto.brand ?? null,
    status: dto.status ?? 'DRAFT',
    isActive: dto.isActive ?? true,
    isFeatured: dto.isFeatured ?? false,
    isRecommended: dto.isRecommended ?? false,
    isTrending: dto.isTrending ?? false,
    isBestSeller: dto.isBestSeller ?? false,
    isNewArrival: dto.isNewArrival ?? false,
    sizes: dto.sizes,
    colors: dto.colors,
    tags: dto.tags,
    labels: dto.labels,
    collections: dto.collections,
  });
  logger.info(`Product created id=${created.id} name="${created.name}"`);
  return toProductResponseDto(created);
};

export const getProductById = async (id: string): Promise<ProductResponseDto> => {
  const p = await productRepo.findById(id);
  if (!p) throw new NotFoundError(PRODUCT_MESSAGES.NOT_FOUND);
  return toProductResponseDto(p);
};

export const getProducts = async (
  options: QueryOptions,
): Promise<{ items: ProductResponseDto[]; meta: PaginationMeta }> => {
  const { items, total } = await productRepo.findMany(options);
  return {
    items: items.map(toProductResponseDto),
    meta: buildPaginationMeta(total, options.page, options.limit),
  };
};

export const updateProduct = async (id: string, dto: UpdateProductDto): Promise<ProductResponseDto> => {
  const existing = await productRepo.findById(id);
  if (!existing) throw new NotFoundError(PRODUCT_MESSAGES.NOT_FOUND);
  await assertCatalogsExist(dto);

  const updated = await productRepo.update(id, dto);
  if (!updated) throw new NotFoundError(PRODUCT_MESSAGES.NOT_FOUND);
  logger.info(`Product updated id=${id}`);
  return toProductResponseDto(updated);
};

export const deleteProduct = async (id: string): Promise<void> => {
  const existing = await productRepo.findById(id);
  if (!existing) throw new NotFoundError(PRODUCT_MESSAGES.NOT_FOUND);

  // Best-effort cleanup of Cloudinary assets. DB rows cascade via Prisma.
  const publicIds: string[] = [];
  if (existing.imagePublicId) publicIds.push(existing.imagePublicId);
  if (existing.extraImage1PublicId) publicIds.push(existing.extraImage1PublicId);
  if (existing.extraImage2PublicId) publicIds.push(existing.extraImage2PublicId);
  if (existing.extraImage3PublicId) publicIds.push(existing.extraImage3PublicId);
  const variantImagePublicIds = await variantRepo.listAllPublicIdsForProduct(id);
  publicIds.push(...variantImagePublicIds);

  const removed = await productRepo.remove(id);
  if (!removed) throw new NotFoundError(PRODUCT_MESSAGES.NOT_FOUND);

  await Promise.all(publicIds.map((pid) => deleteImage(pid)));
  logger.info(`Product deleted id=${id} cleanupImages=${publicIds.length}`);
};

// ------------- Status & flags -------------

export const updateProductStatus = async (
  id: string, dto: UpdateProductStatusDto,
): Promise<ProductResponseDto> => {
  const updated = await productRepo.update(id, { status: dto.status });
  if (!updated) throw new NotFoundError(PRODUCT_MESSAGES.NOT_FOUND);
  logger.info(`Product status updated id=${id} status=${dto.status}`);
  return toProductResponseDto(updated);
};

export const toggleProductFlag = async (
  id: string, flag: ProductToggleFlag, dto: UpdateProductFlagDto,
): Promise<ProductResponseDto> => {
  const updated = await productRepo.update(id, { [flag]: dto.value });
  if (!updated) throw new NotFoundError(PRODUCT_MESSAGES.NOT_FOUND);
  logger.info(`Product flag updated id=${id} ${flag}=${dto.value}`);
  return toProductResponseDto(updated);
};

// ------------- Assignments -------------

export const updateProductAssignments = async (
  id: string, dto: UpdateAssignmentsDto,
): Promise<ProductResponseDto> => {
  const existing = await productRepo.findById(id);
  if (!existing) throw new NotFoundError(PRODUCT_MESSAGES.NOT_FOUND);
  await assertCatalogsExist(dto);
  const updated = await productRepo.updateAssignments(id, dto);
  if (!updated) throw new NotFoundError(PRODUCT_MESSAGES.NOT_FOUND);
  logger.info(`Product assignments updated id=${id}`);
  return toProductResponseDto(updated);
};

// ------------- Main Image -------------

/** Slot → DB field mapping for type-safe updates */
const SLOT_URL_FIELD = {
  thumbnail: 'imageUrl',
  extra1:    'extraImage1Url',
  extra2:    'extraImage2Url',
  extra3:    'extraImage3Url',
} as const;

const SLOT_PID_FIELD = {
  thumbnail: 'imagePublicId',
  extra1:    'extraImage1PublicId',
  extra2:    'extraImage2PublicId',
  extra3:    'extraImage3PublicId',
} as const;

type ImageSlot = keyof typeof SLOT_URL_FIELD;

/**
 * Upload or replace a product image for a specific slot.
 *
 * Slots:
 *   - thumbnail → the primary/main display image
 *   - extra1/extra2/extra3 → additional gallery images
 */
export const setProductSlotImage = async (
  id: string, slot: ImageSlot, buffer: Buffer,
): Promise<ProductResponseDto> => {
  const existing = await productRepo.findById(id);
  if (!existing) throw new NotFoundError(PRODUCT_MESSAGES.NOT_FOUND);

  const existingPublicId = (existing as any)[SLOT_PID_FIELD[slot]] as string | null ?? null;
  const stored = await replaceImage(existingPublicId, buffer, PRODUCT_THUMBNAIL_SUBFOLDER);

  const updated = await productRepo.update(id, {
    [SLOT_URL_FIELD[slot]]: stored.secureUrl,
    [SLOT_PID_FIELD[slot]]: stored.publicId,
  });
  if (!updated) throw new NotFoundError(PRODUCT_MESSAGES.NOT_FOUND);
  logger.info(`Product image set id=${id} slot=${slot}`);
  return toProductResponseDto(updated);
};

/** Remove a product image from a specific slot. */
export const removeProductSlotImage = async (
  id: string, slot: ImageSlot,
): Promise<ProductResponseDto> => {
  const existing = await productRepo.findById(id);
  if (!existing) throw new NotFoundError(PRODUCT_MESSAGES.NOT_FOUND);

  const publicId = (existing as any)[SLOT_PID_FIELD[slot]] as string | null ?? null;
  if (!publicId) throw new BadRequestError(`No image found in slot "${slot}".`);

  await deleteImage(publicId);
  const updated = await productRepo.update(id, {
    [SLOT_URL_FIELD[slot]]: null,
    [SLOT_PID_FIELD[slot]]: null,
  });
  if (!updated) throw new NotFoundError(PRODUCT_MESSAGES.NOT_FOUND);
  logger.info(`Product image removed id=${id} slot=${slot}`);
  return toProductResponseDto(updated);
};

// Kept for backward compatibility with any existing integrations.
export const setProductImage = async (id: string, buffer: Buffer): Promise<ProductResponseDto> =>
  setProductSlotImage(id, 'thumbnail', buffer);

export const removeProductImage = async (id: string): Promise<ProductResponseDto> =>
  removeProductSlotImage(id, 'thumbnail');


// ------------- Helper: enforce product exists (used by sub-resource services) -------------

export const assertProductExists = async (id: string): Promise<void> => {
  const exists = await productRepo.existsById(id);
  if (!exists) throw new NotFoundError(PRODUCT_MESSAGES.NOT_FOUND);
};

/** Not exported to controllers directly — kept for future needs. */
export const _refetch = async (id: string): Promise<ProductResponseDto> => {
  const p = await productRepo.findById(id);
  if (!p) throw new NotFoundError(PRODUCT_MESSAGES.NOT_FOUND);
  return toProductResponseDto(p);
};

// ------------- Nested read views -------------


/** GET /products/:id/reviews — reviews for this product (respects status/rating filters). */
export const listReviewsForProduct = async (productId: string, options: QueryOptions) => {
  await assertProductExists(productId);
  return reviewService.getReviews({
    ...options,
    filters: { ...options.filters, productId },
  });
};

/** GET /products/:id/reviews/summary — average + total + 1..5 breakdown (APPROVED only). */
export const getReviewSummaryForProduct = async (productId: string) => {
  await assertProductExists(productId);
  return reviewService.getSummary(productId);
};

/** GET /products/:id/orders — orders containing this product (admin/analytics). */
export const listOrdersForProduct = async (
  productId: string,
  options: QueryOptions & { from?: Date; to?: Date },
) => {
  await assertProductExists(productId);
  return orderService.getOrders({
    ...options,
    filters: { ...options.filters, productId },
  });
};

// ------------- Computed merchandising (storefront strips) -------------
//
// Best-sellers and trending are DERIVED from actual sales (units sold in a
// rolling window), with the manual flags acting as admin "pins" that always
// lead the list. New arrivals derive from createdAt so products age out
// automatically. The flags are no longer the sole source of truth.

const mergeRanked = (
  pinned: ProductWithRelations[],
  computed: ProductWithRelations[],
  rankedIds: string[],
  limit: number,
): ProductWithRelations[] => {
  const rank = new Map(rankedIds.map((id, i) => [id, i]));
  const ordered = [...computed].sort(
    (a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
  );
  const seen = new Set<string>();
  const out: ProductWithRelations[] = [];
  for (const p of [...pinned, ...ordered]) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
};

const stripResponse = (
  items: ProductWithRelations[],
  limit: number,
): { items: ProductResponseDto[]; meta: PaginationMeta } => ({
  items: items.map(toProductResponseDto),
  meta: buildPaginationMeta(items.length, 1, limit),
});

/** Top sellers by units sold (90-day window); admin-pinned products first. */
export const getBestSellerProducts = async (
  limit = STOREFRONT_STRIP_LIMIT,
): Promise<{ items: ProductResponseDto[]; meta: PaginationMeta }> => {
  const rankedIds = await productRepo.findTopSellingProductIds(BEST_SELLER_WINDOW_DAYS, limit);
  const [pinned, computed] = await Promise.all([
    productRepo.findFlaggedPublished('isBestSeller', limit),
    productRepo.findPublishedByIds(rankedIds),
  ]);
  return stripResponse(mergeRanked(pinned, computed, rankedIds, limit), limit);
};

/** Sales velocity over the past 7 days; admin-pinned products first. */
export const getTrendingProducts = async (
  limit = STOREFRONT_STRIP_LIMIT,
): Promise<{ items: ProductResponseDto[]; meta: PaginationMeta }> => {
  const rankedIds = await productRepo.findTopSellingProductIds(TRENDING_WINDOW_DAYS, limit);
  const [pinned, computed] = await Promise.all([
    productRepo.findFlaggedPublished('isTrending', limit),
    productRepo.findPublishedByIds(rankedIds),
  ]);
  return stripResponse(mergeRanked(pinned, computed, rankedIds, limit), limit);
};

/** Products created in the past 30 days (or pinned), newest first. */
export const getNewArrivalProducts = async (
  limit = STOREFRONT_STRIP_LIMIT,
): Promise<{ items: ProductResponseDto[]; meta: PaginationMeta }> => {
  const items = await productRepo.findNewArrivals(NEW_ARRIVAL_WINDOW_DAYS, limit);
  return stripResponse(items.slice(0, limit), limit);
};
