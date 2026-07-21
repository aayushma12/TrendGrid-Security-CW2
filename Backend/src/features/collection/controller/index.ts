import type { Request, Response } from 'express';

import { created, noContent, paginated, success } from '../../../utils/response';
import { parseQueryOptions } from '../../../utils/queryOptions';
import { BadRequestError } from '../../../utils/errors';
import { PRODUCT_FILTER_FIELDS, PRODUCT_SORT_FIELDS } from '../../product/constants';
import * as collectionService from '../service';
import { COLLECTION_FILTER_FIELDS, COLLECTION_MESSAGES, COLLECTION_SORT_FIELDS } from '../constants';

export const createCollectionController = async (req: Request, res: Response): Promise<void> => {
  const body = {
    name: req.body.name,
    description: req.body.description,
    isActive: req.body.isActive !== 'false' && req.body.isActive !== false,
    displayOrder: req.body.displayOrder !== undefined ? Number(req.body.displayOrder) : undefined,
  };
  const collection = await collectionService.createCollection(body);

  if (req.file?.buffer) {
    const withImage = await collectionService.setCollectionImage(collection.id, req.file.buffer);
    created(res, withImage, COLLECTION_MESSAGES.CREATED);
    return;
  }
  created(res, collection, COLLECTION_MESSAGES.CREATED);
};

export const getCollectionController = async (req: Request, res: Response): Promise<void> => {
  const collection = await collectionService.getCollectionById(req.params.id);
  success(res, collection, COLLECTION_MESSAGES.RETRIEVED);
};

export const getCollectionsController = async (req: Request, res: Response): Promise<void> => {
  const options = parseQueryOptions(req, {
    allowedSortFields: [...COLLECTION_SORT_FIELDS],
    allowedFilters: [...COLLECTION_FILTER_FIELDS],
  });
  const { items, meta } = await collectionService.getCollections(options);
  paginated(res, items, meta, COLLECTION_MESSAGES.LISTED);
};

export const getActiveCollectionsController = async (_req: Request, res: Response): Promise<void> => {
  const items = await collectionService.getActiveCollections();
  success(res, items, COLLECTION_MESSAGES.LISTED);
};

export const updateCollectionController = async (req: Request, res: Response): Promise<void> => {
  const body: Record<string, unknown> = {};
  if (req.body.name !== undefined) body.name = req.body.name;
  if (req.body.description !== undefined) body.description = req.body.description || null;
  if (req.body.isActive !== undefined) body.isActive = req.body.isActive === 'true' || req.body.isActive === true;
  if (req.body.displayOrder !== undefined) body.displayOrder = Number(req.body.displayOrder);

  const collection = await collectionService.updateCollection(req.params.id, body);

  if (req.file?.buffer) {
    const withImage = await collectionService.setCollectionImage(req.params.id, req.file.buffer);
    success(res, withImage, COLLECTION_MESSAGES.UPDATED);
    return;
  }
  success(res, collection, COLLECTION_MESSAGES.UPDATED);
};

export const deleteCollectionController = async (req: Request, res: Response): Promise<void> => {
  await collectionService.deleteCollection(req.params.id);
  noContent(res);
};

export const updateCollectionStatusController = async (req: Request, res: Response): Promise<void> => {
  const collection = await collectionService.updateCollectionStatus(req.params.id, req.body);
  success(res, collection, COLLECTION_MESSAGES.STATUS_UPDATED);
};

export const uploadCollectionImageController = async (req: Request, res: Response): Promise<void> => {
  const file = req.file;
  if (!file?.buffer) throw new BadRequestError(COLLECTION_MESSAGES.IMAGE_REQUIRED);
  const collection = await collectionService.setCollectionImage(req.params.id, file.buffer);
  success(res, collection, COLLECTION_MESSAGES.IMAGE_UPLOADED);
};

export const removeCollectionImageController = async (req: Request, res: Response): Promise<void> => {
  const collection = await collectionService.removeCollectionImage(req.params.id);
  success(res, collection, COLLECTION_MESSAGES.IMAGE_REMOVED);
};

export const addProductsToCollectionController = async (req: Request, res: Response): Promise<void> => {
  const collection = await collectionService.addProductsToCollection(req.params.id, req.body.productIds);
  success(res, collection, COLLECTION_MESSAGES.PRODUCTS_ADDED);
};

export const removeProductsFromCollectionController = async (req: Request, res: Response): Promise<void> => {
  const collection = await collectionService.removeProductsFromCollection(req.params.id, req.body.productIds);
  success(res, collection, COLLECTION_MESSAGES.PRODUCTS_REMOVED);
};

export const listCollectionProductsController = async (req: Request, res: Response): Promise<void> => {
  const options = parseQueryOptions(req, {
    allowedSortFields: [...PRODUCT_SORT_FIELDS],
    allowedFilters: PRODUCT_FILTER_FIELDS.filter((f) => f !== 'curatedCollectionId'),
  });
  // This route is public (storefront) but reused by admin previews — only an
  // authenticated admin sees draft/inactive products through it.
  if (req.user?.role !== 'ADMIN') {
    options.filters.status = 'PUBLISHED';
    options.filters.isActive = true;
  }
  const result = await collectionService.listProductsInCollection(req.params.id, options);
  success(res, result, 'Products retrieved successfully.');
};
