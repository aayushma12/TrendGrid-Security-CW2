/**
 * Category service — the ONLY place with business rules.
 * Controllers must go through here; repositories are called only by this file.
 * Cloudinary is accessed EXCLUSIVELY through `services/imageService`.
 */
import { PaginationMeta, QueryOptions } from '../../../types';
import { BadRequestError, DuplicateError, NotFoundError } from '../../../utils/errors';
import { buildPaginationMeta } from '../../../utils/queryOptions';
import { logger } from '../../../utils/logger';
import { deleteImage, replaceImage } from '../../../services/imageService';

import * as productService from '../../product/service/product';
import * as categoryRepo from '../repository';
import {
  CategoryResponseDto,
  CategoryProductsResponseDto,
  CategoryTreeNode,
  CreateCategoryDto,
  UpdateCategoryDto,
  UpdateCategoryFeatureDto,
  UpdateCategoryStatusDto,
  toCategoryResponseDto,
} from '../dto';
import { CATEGORY_IMAGE_SUBFOLDER, CATEGORY_MESSAGES } from '../constants';

const assertParentExists = async (parentId: string): Promise<void> => {
  const parent = await categoryRepo.findById(parentId);
  if (!parent) {
    throw new BadRequestError(CATEGORY_MESSAGES.PARENT_NOT_FOUND, [
      { field: 'parentCategoryId', message: CATEGORY_MESSAGES.PARENT_NOT_FOUND },
    ]);
  }
};

const assertNameUnique = async (name: string, ignoreId?: string): Promise<void> => {
  const existing = await categoryRepo.findByName(name);
  if (existing && existing.id !== ignoreId) {
    throw new DuplicateError(CATEGORY_MESSAGES.DUPLICATE_NAME, [
      { field: 'name', message: CATEGORY_MESSAGES.DUPLICATE_NAME },
    ]);
  }
};

export const createCategory = async (dto: CreateCategoryDto): Promise<CategoryResponseDto> => {
  await assertNameUnique(dto.name);

  if (dto.parentCategoryId) {
    await assertParentExists(dto.parentCategoryId);
  }

  const created = await categoryRepo.create({
    name: dto.name,
    description: dto.description ?? null,
    parentCategoryId: dto.parentCategoryId ?? null,
    isFeatured: dto.isFeatured ?? false,
    isActive: dto.isActive ?? true,
  });

  logger.info(`Category created id=${created.id} name="${created.name}"`);
  return toCategoryResponseDto(created);
};

export const getCategoryById = async (id: string): Promise<CategoryResponseDto> => {
  const category = await categoryRepo.findById(id);
  if (!category) throw new NotFoundError(CATEGORY_MESSAGES.NOT_FOUND);
  return toCategoryResponseDto(category);
};

export const getCategories = async (
  options: QueryOptions,
): Promise<{ items: CategoryResponseDto[]; meta: PaginationMeta }> => {
  const { items, total } = await categoryRepo.findMany(options);
  return {
    items: items.map(toCategoryResponseDto),
    meta: buildPaginationMeta(total, options.page, options.limit),
  };
};

export const getCategoryTree = async (): Promise<CategoryTreeNode[]> => {
  const all = await categoryRepo.findAllActive();
  const byParent = new Map<string | null, typeof all>();

  for (const category of all) {
    const key = category.parentCategoryId ?? null;
    const siblings = byParent.get(key) ?? [];
    siblings.push(category);
    byParent.set(key, siblings);
  }

  const build = (parentId: string | null): CategoryTreeNode[] =>
    (byParent.get(parentId) ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      imageUrl: category.imageUrl ?? null,
      isFeatured: category.isFeatured,
      children: build(category.id),
    }));

  return build(null);
};

export const getFeaturedCategories = async (): Promise<CategoryResponseDto[]> => {
  const { items } = await categoryRepo.findMany({
    page: 1,
    limit: 100,
    skip: 0,
    sortBy: 'name',
    sortOrder: 'asc',
    filters: { isFeatured: true, isActive: true },
  });
  return items.map(toCategoryResponseDto);
};

export const updateCategory = async (
  id: string,
  dto: UpdateCategoryDto,
): Promise<CategoryResponseDto> => {
  const existing = await categoryRepo.findById(id);
  if (!existing) throw new NotFoundError(CATEGORY_MESSAGES.NOT_FOUND);

  if (dto.name && dto.name !== existing.name) {
    await assertNameUnique(dto.name, id);
  }

  if (dto.parentCategoryId !== undefined && dto.parentCategoryId !== null) {
    if (dto.parentCategoryId === id) {
      throw new BadRequestError(CATEGORY_MESSAGES.SELF_PARENT, [
        { field: 'parentCategoryId', message: CATEGORY_MESSAGES.SELF_PARENT },
      ]);
    }
    await assertParentExists(dto.parentCategoryId);
    const cycle = await categoryRepo.wouldCreateCycle(id, dto.parentCategoryId);
    if (cycle) {
      throw new BadRequestError(CATEGORY_MESSAGES.CYCLE, [
        { field: 'parentCategoryId', message: CATEGORY_MESSAGES.CYCLE },
      ]);
    }
  }

  const updated = await categoryRepo.update(id, dto);
  if (!updated) throw new NotFoundError(CATEGORY_MESSAGES.NOT_FOUND);

  logger.info(`Category updated id=${id}`);
  return toCategoryResponseDto(updated);
};

export const deleteCategory = async (id: string): Promise<void> => {
  const existing = await categoryRepo.findById(id);
  if (!existing) throw new NotFoundError(CATEGORY_MESSAGES.NOT_FOUND);

  const childCount = await categoryRepo.countChildren(id);
  if (childCount > 0) {
    throw new BadRequestError(CATEGORY_MESSAGES.HAS_CHILDREN);
  }
  // Product.category is onDelete: Restrict at the DB level — check up front
  // for a clean error instead of letting a raw FK-constraint error surface.
  const productCount = await categoryRepo.countProducts(id);
  if (productCount > 0) {
    throw new BadRequestError(CATEGORY_MESSAGES.HAS_PRODUCTS);
  }

  // Best-effort image cleanup — deleteImage swallows errors and logs.
  if (existing.imagePublicId) {
    await deleteImage(existing.imagePublicId);
  }

  const removed = await categoryRepo.remove(id);
  if (!removed) throw new NotFoundError(CATEGORY_MESSAGES.NOT_FOUND);

  logger.info(`Category deleted id=${id}`);
};

// ------------- Bulk operations -------------

export interface CategoryBulkResult {
  requested: number;
  updated: number;
  notFound: string[];
}

export const bulkUpdateCategoryActive = async (ids: string[], isActive: boolean): Promise<CategoryBulkResult> => {
  const existing = await categoryRepo.findExistingIds(ids);
  const existingSet = new Set(existing);
  const notFound = ids.filter((id) => !existingSet.has(id));
  const updated = existing.length > 0 ? await categoryRepo.bulkUpdateActive(existing, isActive) : 0;
  logger.info(`Bulk category active update: ${updated}/${ids.length} to isActive=${isActive}`);
  return { requested: ids.length, updated, notFound };
};

export interface CategoryBulkDeleteResult {
  requested: number;
  deleted: number;
  failed: { id: string; reason: string }[];
}

/** Reuses the single-delete path per id (image cleanup + children/products
 *  checks) so one bad id in the batch is reported, not a whole-batch failure. */
export const bulkDeleteCategories = async (ids: string[]): Promise<CategoryBulkDeleteResult> => {
  let deleted = 0;
  const failed: { id: string; reason: string }[] = [];

  for (const id of ids) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await deleteCategory(id);
      deleted++;
    } catch (err) {
      failed.push({ id, reason: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  logger.info(`Bulk category delete: ${deleted}/${ids.length} removed, ${failed.length} failed`);
  return { requested: ids.length, deleted, failed };
};

export const updateCategoryStatus = async (
  id: string,
  dto: UpdateCategoryStatusDto,
): Promise<CategoryResponseDto> => {
  const updated = await categoryRepo.update(id, { isActive: dto.isActive });
  if (!updated) throw new NotFoundError(CATEGORY_MESSAGES.NOT_FOUND);
  logger.info(`Category status updated id=${id} isActive=${dto.isActive}`);
  return toCategoryResponseDto(updated);
};

export const updateCategoryFeature = async (
  id: string,
  dto: UpdateCategoryFeatureDto,
): Promise<CategoryResponseDto> => {
  const updated = await categoryRepo.update(id, { isFeatured: dto.isFeatured });
  if (!updated) throw new NotFoundError(CATEGORY_MESSAGES.NOT_FOUND);
  logger.info(`Category feature flag updated id=${id} isFeatured=${dto.isFeatured}`);
  return toCategoryResponseDto(updated);
};

/**
 * Upload or replace a category's image. Deletes the previous asset from
 * Cloudinary after the new one is stored (atomic-safe via replaceImage).
 */
export const setCategoryImage = async (
  id: string,
  buffer: Buffer,
): Promise<CategoryResponseDto> => {
  const existing = await categoryRepo.findById(id);
  if (!existing) throw new NotFoundError(CATEGORY_MESSAGES.NOT_FOUND);

  const stored = await replaceImage(existing.imagePublicId, buffer, CATEGORY_IMAGE_SUBFOLDER);

  const updated = await categoryRepo.update(id, {
    imageUrl: stored.secureUrl,
    imagePublicId: stored.publicId,
  });
  if (!updated) throw new NotFoundError(CATEGORY_MESSAGES.NOT_FOUND);

  logger.info(`Category image set id=${id} publicId=${stored.publicId}`);
  return toCategoryResponseDto(updated);
};

/** Remove the current image (Cloudinary + DB). */
export const removeCategoryImage = async (id: string): Promise<CategoryResponseDto> => {
  const existing = await categoryRepo.findById(id);
  if (!existing) throw new NotFoundError(CATEGORY_MESSAGES.NOT_FOUND);
  if (!existing.imagePublicId) throw new BadRequestError(CATEGORY_MESSAGES.NO_IMAGE);

  await deleteImage(existing.imagePublicId);
  const updated = await categoryRepo.update(id, { imageUrl: null, imagePublicId: null });
  if (!updated) throw new NotFoundError(CATEGORY_MESSAGES.NOT_FOUND);

  logger.info(`Category image removed id=${id}`);
  return toCategoryResponseDto(updated);
};

/**
 * Smart listing for GET /categories/:id/products.
 *
 * Logic:
 *   1. Verify the category exists (throws 404 if not).
 *   2. Fetch all active direct subcategories of this category.
 *   3. If subcategories exist → return products GROUPED per subcategory (each group is paginated).
 *      Also includes a group for products assigned directly to the parent (if any).
 *   4. If NO subcategories → return a flat paginated list of products in this category.
 */
export const listProductsInCategory = async (
  id: string,
  options: QueryOptions,
): Promise<CategoryProductsResponseDto> => {
  const category = await categoryRepo.findById(id);
  if (!category) throw new NotFoundError(CATEGORY_MESSAGES.NOT_FOUND);

  const subcategories = await categoryRepo.findSubcategories(id);

  if (subcategories.length === 0) {
    // Flat mode — no subcategories, just return products directly in this category.
    const { items, meta } = await productService.getProducts({
      ...options,
      filters: { ...options.filters, categoryId: id },
    });
    return {
      mode: 'flat',
      category: { id: category.id, name: category.name },
      products: items,
      meta,
    };
  }

  // Grouped mode — fetch products per subcategory in parallel.
  const groups = await Promise.all(
    subcategories.map(async (sub) => {
      const { items, meta } = await productService.getProducts({
        ...options,
        filters: { ...options.filters, categoryId: sub.id },
      });
      return {
        subcategory: {
          id: sub.id,
          name: sub.name,
          imageUrl: sub.imageUrl,
        },
        products: items,
        meta,
      };
    }),
  );

  return {
    mode: 'grouped',
    category: { id: category.id, name: category.name },
    // Only include subcategory groups that actually have products.
    groups: groups.filter((g) => g.products.length > 0),
  };
};
