/**
 * Category controller — lightweight.
 * Only: receive request, call service, return standard response.
 */
import { Request, Response } from 'express';

import { created, noContent, paginated, success } from '../../../utils/response';
import { parseQueryOptions } from '../../../utils/queryOptions';
import { BadRequestError } from '../../../utils/errors';

import { PRODUCT_FILTER_FIELDS, PRODUCT_SORT_FIELDS } from '../../product/constants';
import * as categoryService from '../service';
import { CATEGORY_FILTER_FIELDS, CATEGORY_MESSAGES, CATEGORY_SORT_FIELDS } from '../constants';

export const createCategoryController = async (req: Request, res: Response): Promise<void> => {
  // When using multipart/form-data, text fields come as strings
  const body = {
    name: req.body.name,
    description: req.body.description,
    parentCategoryId: req.body.parentCategoryId || undefined,
    isFeatured: req.body.isFeatured === 'true' || req.body.isFeatured === true,
    isActive: req.body.isActive !== 'false' && req.body.isActive !== false,
  };
  const category = await categoryService.createCategory(body);

  // If an image file was included, upload it immediately
  if (req.file?.buffer) {
    const withImage = await categoryService.setCategoryImage(category.id, req.file.buffer);
    created(res, withImage, CATEGORY_MESSAGES.CREATED);
    return;
  }

  created(res, category, CATEGORY_MESSAGES.CREATED);
};

export const getCategoryController = async (req: Request, res: Response): Promise<void> => {
  const category = await categoryService.getCategoryById(req.params.id);
  success(res, category, CATEGORY_MESSAGES.RETRIEVED);
};

export const getCategoriesController = async (req: Request, res: Response): Promise<void> => {
  const options = parseQueryOptions(req, {
    allowedSortFields: [...CATEGORY_SORT_FIELDS],
    allowedFilters: [...CATEGORY_FILTER_FIELDS],
  });
  const { items, meta } = await categoryService.getCategories(options);
  paginated(res, items, meta, CATEGORY_MESSAGES.LISTED);
};

export const getCategoryTreeController = async (_req: Request, res: Response): Promise<void> => {
  const tree = await categoryService.getCategoryTree();
  success(res, tree, 'Category tree retrieved successfully.');
};

export const getFeaturedCategoriesController = async (_req: Request, res: Response): Promise<void> => {
  const categories = await categoryService.getFeaturedCategories();
  success(res, categories, 'Featured categories retrieved successfully.');
};

export const updateCategoryController = async (req: Request, res: Response): Promise<void> => {
  // When using multipart/form-data, parse text fields
  const body: any = {};
  if (req.body.name !== undefined) body.name = req.body.name;
  if (req.body.description !== undefined) body.description = req.body.description || null;
  if (req.body.parentCategoryId !== undefined) body.parentCategoryId = req.body.parentCategoryId || null;
  if (req.body.isFeatured !== undefined) body.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
  if (req.body.isActive !== undefined) body.isActive = req.body.isActive === 'true' || req.body.isActive === true;

  const category = await categoryService.updateCategory(req.params.id, body);

  // If an image file was included, upload it
  if (req.file?.buffer) {
    const withImage = await categoryService.setCategoryImage(req.params.id, req.file.buffer);
    success(res, withImage, CATEGORY_MESSAGES.UPDATED);
    return;
  }

  success(res, category, CATEGORY_MESSAGES.UPDATED);
};

export const deleteCategoryController = async (req: Request, res: Response): Promise<void> => {
  await categoryService.deleteCategory(req.params.id);
  noContent(res);
};

export const updateCategoryStatusController = async (req: Request, res: Response): Promise<void> => {
  const category = await categoryService.updateCategoryStatus(req.params.id, req.body);
  success(res, category, CATEGORY_MESSAGES.STATUS_UPDATED);
};

export const updateCategoryFeatureController = async (req: Request, res: Response): Promise<void> => {
  const category = await categoryService.updateCategoryFeature(req.params.id, req.body);
  success(res, category, CATEGORY_MESSAGES.FEATURED_UPDATED);
};

export const uploadCategoryImageController = async (req: Request, res: Response): Promise<void> => {
  const file = req.file;
  if (!file?.buffer) throw new BadRequestError(CATEGORY_MESSAGES.IMAGE_REQUIRED);
  const category = await categoryService.setCategoryImage(req.params.id, file.buffer);
  success(res, category, CATEGORY_MESSAGES.IMAGE_UPLOADED);
};

export const removeCategoryImageController = async (req: Request, res: Response): Promise<void> => {
  const category = await categoryService.removeCategoryImage(req.params.id);
  success(res, category, CATEGORY_MESSAGES.IMAGE_REMOVED);
};

/**
 * Nested: GET /categories/:id/products
 *
 * Smart response:
 *   - If the category has active subcategories → returns `{ mode: "grouped", groups: [...] }`
 *     where each group contains the subcategory info and its products.
 *   - If the category has NO subcategories → returns `{ mode: "flat", products: [...], meta }`
 *     as a standard paginated list.
 */
export const listCategoryProductsController = async (req: Request, res: Response): Promise<void> => {
  const options = parseQueryOptions(req, {
    allowedSortFields: [...PRODUCT_SORT_FIELDS],
    allowedFilters: PRODUCT_FILTER_FIELDS.filter((f) => f !== 'categoryId'),
  });
  // This route is public (storefront) but reused by admin previews — only an
  // authenticated admin sees draft/inactive products through it.
  if (req.user?.role !== 'ADMIN') {
    options.filters.status = 'PUBLISHED';
    options.filters.isActive = true;
  }
  const result = await categoryService.listProductsInCategory(req.params.id, options);
  success(res, result, 'Products retrieved successfully.');
};

// -------- Bulk operations --------

export const bulkUpdateCategoryActiveController = async (req: Request, res: Response): Promise<void> => {
  const result = await categoryService.bulkUpdateCategoryActive(req.body.ids, req.body.isActive);
  success(res, result, CATEGORY_MESSAGES.BULK_STATUS_UPDATED);
};

export const bulkDeleteCategoriesController = async (req: Request, res: Response): Promise<void> => {
  const result = await categoryService.bulkDeleteCategories(req.body.ids);
  success(res, result, CATEGORY_MESSAGES.BULK_DELETED);
};
