/**
 * Collection service — the ONLY place with business rules for admin-curated
 * merchandising collections (Men, Summer Collection, Best Sellers, ...).
 *
 * Distinct from Category: collections cross-cut the product-type category
 * tree rather than replacing it, have no parent/child hierarchy, and a
 * product can belong to any number of them.
 */
import type { PaginationMeta, QueryOptions } from '../../../types';
import { BadRequestError, DuplicateError, NotFoundError } from '../../../utils/errors';
import { buildPaginationMeta } from '../../../utils/queryOptions';
import { logger } from '../../../utils/logger';
import { deleteImage, replaceImage } from '../../../services/imageService';
import * as productService from '../../product/service/product';
import * as collectionRepo from '../repository';
import type {
  CollectionProductsResponseDto,
  CollectionResponseDto,
  CreateCollectionDto,
  UpdateCollectionDto,
  UpdateCollectionStatusDto} from '../dto';
import {
  toCollectionResponseDto,
} from '../dto';
import { COLLECTION_IMAGE_SUBFOLDER, COLLECTION_MESSAGES } from '../constants';

const assertNameUnique = async (name: string, ignoreId?: string): Promise<void> => {
  const existing = await collectionRepo.findByName(name);
  if (existing && existing.id !== ignoreId) {
    throw new DuplicateError(COLLECTION_MESSAGES.DUPLICATE_NAME, [
      { field: 'name', message: COLLECTION_MESSAGES.DUPLICATE_NAME },
    ]);
  }
};

export const createCollection = async (dto: CreateCollectionDto): Promise<CollectionResponseDto> => {
  await assertNameUnique(dto.name);

  const created = await collectionRepo.create({
    name: dto.name,
    description: dto.description ?? null,
    isActive: dto.isActive ?? true,
    displayOrder: dto.displayOrder ?? 0,
  });

  logger.info(`Collection created id=${created.id} name="${created.name}"`);
  return toCollectionResponseDto(created);
};

export const getCollectionById = async (id: string): Promise<CollectionResponseDto> => {
  const collection = await collectionRepo.findById(id);
  if (!collection) throw new NotFoundError(COLLECTION_MESSAGES.NOT_FOUND);
  return toCollectionResponseDto(collection);
};

export const getCollections = async (
  options: QueryOptions,
): Promise<{ items: CollectionResponseDto[]; meta: PaginationMeta }> => {
  const { items, total } = await collectionRepo.findMany(options);
  return { items: items.map(toCollectionResponseDto), meta: buildPaginationMeta(total, options.page, options.limit) };
};

export const getActiveCollections = async (): Promise<CollectionResponseDto[]> => {
  const items = await collectionRepo.findAllActive();
  return items.map(toCollectionResponseDto);
};

export const updateCollection = async (id: string, dto: UpdateCollectionDto): Promise<CollectionResponseDto> => {
  const existing = await collectionRepo.findById(id);
  if (!existing) throw new NotFoundError(COLLECTION_MESSAGES.NOT_FOUND);

  if (dto.name && dto.name !== existing.name) {
    await assertNameUnique(dto.name, id);
  }

  const updated = await collectionRepo.update(id, dto);
  if (!updated) throw new NotFoundError(COLLECTION_MESSAGES.NOT_FOUND);

  logger.info(`Collection updated id=${id}`);
  return toCollectionResponseDto(updated);
};

export const deleteCollection = async (id: string): Promise<void> => {
  const existing = await collectionRepo.findById(id);
  if (!existing) throw new NotFoundError(COLLECTION_MESSAGES.NOT_FOUND);

  // Unlike Category→Product, collection membership is a plain many-to-many
  // with no onDelete: Restrict — Prisma drops the join rows automatically,
  // so deleting a collection never blocks on its products.
  if (existing.imagePublicId) {
    await deleteImage(existing.imagePublicId);
  }

  const removed = await collectionRepo.remove(id);
  if (!removed) throw new NotFoundError(COLLECTION_MESSAGES.NOT_FOUND);
  logger.info(`Collection deleted id=${id}`);
};

export const updateCollectionStatus = async (
  id: string, dto: UpdateCollectionStatusDto,
): Promise<CollectionResponseDto> => {
  const updated = await collectionRepo.update(id, { isActive: dto.isActive });
  if (!updated) throw new NotFoundError(COLLECTION_MESSAGES.NOT_FOUND);
  logger.info(`Collection status updated id=${id} isActive=${dto.isActive}`);
  return toCollectionResponseDto(updated);
};

export const setCollectionImage = async (id: string, buffer: Buffer): Promise<CollectionResponseDto> => {
  const existing = await collectionRepo.findById(id);
  if (!existing) throw new NotFoundError(COLLECTION_MESSAGES.NOT_FOUND);

  const stored = await replaceImage(existing.imagePublicId, buffer, COLLECTION_IMAGE_SUBFOLDER);
  const updated = await collectionRepo.update(id, { imageUrl: stored.secureUrl, imagePublicId: stored.publicId });
  if (!updated) throw new NotFoundError(COLLECTION_MESSAGES.NOT_FOUND);

  logger.info(`Collection image set id=${id} publicId=${stored.publicId}`);
  return toCollectionResponseDto(updated);
};

export const removeCollectionImage = async (id: string): Promise<CollectionResponseDto> => {
  const existing = await collectionRepo.findById(id);
  if (!existing) throw new NotFoundError(COLLECTION_MESSAGES.NOT_FOUND);
  if (!existing.imagePublicId) throw new BadRequestError(COLLECTION_MESSAGES.NO_IMAGE);

  await deleteImage(existing.imagePublicId);
  const updated = await collectionRepo.update(id, { imageUrl: null, imagePublicId: null });
  if (!updated) throw new NotFoundError(COLLECTION_MESSAGES.NOT_FOUND);

  logger.info(`Collection image removed id=${id}`);
  return toCollectionResponseDto(updated);
};

// -------- product membership --------

export const addProductsToCollection = async (id: string, productIds: string[]): Promise<CollectionResponseDto> => {
  const existing = await collectionRepo.findById(id);
  if (!existing) throw new NotFoundError(COLLECTION_MESSAGES.NOT_FOUND);

  const validIds = await collectionRepo.findExistingProductIds(productIds);
  if (validIds.length) await collectionRepo.addProducts(id, validIds);

  logger.info(`Collection ${id}: added ${validIds.length}/${productIds.length} products`);
  return getCollectionById(id);
};

export const removeProductsFromCollection = async (id: string, productIds: string[]): Promise<CollectionResponseDto> => {
  const existing = await collectionRepo.findById(id);
  if (!existing) throw new NotFoundError(COLLECTION_MESSAGES.NOT_FOUND);

  await collectionRepo.removeProducts(id, productIds);
  logger.info(`Collection ${id}: removed ${productIds.length} products`);
  return getCollectionById(id);
};

/** GET /collections/:id/products — paginated list of products in this collection. */
export const listProductsInCollection = async (
  id: string, options: QueryOptions,
): Promise<CollectionProductsResponseDto> => {
  const collection = await collectionRepo.findById(id);
  if (!collection) throw new NotFoundError(COLLECTION_MESSAGES.NOT_FOUND);

  const { items, meta } = await productService.getProducts({
    ...options,
    filters: { ...options.filters, curatedCollectionId: id },
  });

  return { collection: { id: collection.id, name: collection.name }, products: items, meta };
};
