/**
 * Product controllers — all thin. Every handler receives req, calls a service,
 * returns via the standard response builder.
 */
import { Request, Response } from 'express';

import { created, noContent, paginated, success } from '../../../utils/response';
import { parseQueryOptions } from '../../../utils/queryOptions';
import { BadRequestError } from '../../../utils/errors';
import { QueryOptions } from '../../../types';


import { REVIEW_FILTER_FIELDS, REVIEW_SORT_FIELDS } from '../../review/constants';
import { ORDER_FILTER_FIELDS, ORDER_SORT_FIELDS } from '../../order/constants';

import * as productService from '../service/product';
import * as characteristicService from '../service/characteristic';
import * as variantService from '../service/variant';
import {
  PRODUCT_FILTER_FIELDS, PRODUCT_MESSAGES, PRODUCT_SORT_FIELDS, PRODUCT_TOGGLE_FLAGS,
  ProductToggleFlag,
} from '../constants';
import { ImageSlot } from '../validator';

// -------- Product --------

export const createProductController = async (req: Request, res: Response): Promise<void> => {
  // When using multipart/form-data, parse text fields
  const body: any = { ...req.body };
  // Convert string booleans from form-data
  ['isActive', 'isFeatured', 'isRecommended', 'isTrending', 'isBestSeller', 'isNewArrival'].forEach((key) => {
    if (body[key] === 'true') body[key] = true;
    if (body[key] === 'false') body[key] = false;
  });
  // Convert numeric strings
  if (body.basePrice) body.basePrice = Number(body.basePrice);
  if (body.discountPrice) body.discountPrice = Number(body.discountPrice);

  const product = await productService.createProduct(body);

  // If a thumbnail image was included, upload it immediately
  if (req.file?.buffer) {
    const withImage = await productService.setProductSlotImage(product.id, 'thumbnail', req.file.buffer);
    created(res, withImage, PRODUCT_MESSAGES.CREATED);
    return;
  }

  created(res, product, PRODUCT_MESSAGES.CREATED);
};

export const getProductController = async (req: Request, res: Response): Promise<void> => {
  const product = await productService.getProductById(req.params.id);
  success(res, product, PRODUCT_MESSAGES.RETRIEVED);
};

export const getProductsController = async (req: Request, res: Response): Promise<void> => {
  const options = parseQueryOptions(req, {
    allowedSortFields: [...PRODUCT_SORT_FIELDS],
    allowedFilters: [...PRODUCT_FILTER_FIELDS],
  });
  const { items, meta } = await productService.getProducts(options);
  paginated(res, items, meta, PRODUCT_MESSAGES.LISTED);
};

const listStorefrontProducts = async (
  req: Request,
  res: Response,
  preset: Partial<QueryOptions['filters']>,
  message: string,
): Promise<void> => {
  const options = parseQueryOptions(req, {
    allowedSortFields: [...PRODUCT_SORT_FIELDS],
    allowedFilters: [...PRODUCT_FILTER_FIELDS],
  });
  options.filters = {
    ...options.filters,
    isActive: true,
    status: 'PUBLISHED',
    ...preset,
  };
  const { items, meta } = await productService.getProducts(options);
  paginated(res, items, meta, message);
};

export const getFeaturedProductsController = async (req: Request, res: Response): Promise<void> => {
  await listStorefrontProducts(req, res, { isFeatured: true }, 'Featured products retrieved successfully.');
};

/** Parse an optional ?limit= for storefront strips, capped at 50. */
const stripLimit = (req: Request): number | undefined => {
  const n = Number(req.query.limit);
  return Number.isInteger(n) && n > 0 ? Math.min(n, 50) : undefined;
};

export const getNewProductsController = async (req: Request, res: Response): Promise<void> => {
  // Computed: created in the last 30 days (or admin-pinned), newest first.
  const { items, meta } = await productService.getNewArrivalProducts(stripLimit(req));
  paginated(res, items, meta, 'New arrival products retrieved successfully.');
};

export const getBestSellerProductsController = async (req: Request, res: Response): Promise<void> => {
  // Computed from actual sales (90-day window); admin pins lead the list.
  const { items, meta } = await productService.getBestSellerProducts(stripLimit(req));
  paginated(res, items, meta, 'Best seller products retrieved successfully.');
};

export const getTrendingProductsController = async (req: Request, res: Response): Promise<void> => {
  // Computed from 7-day sales velocity; admin pins lead the list.
  const { items, meta } = await productService.getTrendingProducts(stripLimit(req));
  paginated(res, items, meta, 'Trending products retrieved successfully.');
};

export const searchProductsController = async (req: Request, res: Response): Promise<void> => {
  const options = parseQueryOptions(req, {
    allowedSortFields: [...PRODUCT_SORT_FIELDS],
    allowedFilters: [...PRODUCT_FILTER_FIELDS],
  });
  if (!options.search) {
    throw new BadRequestError('Search query is required', [
      { field: 'search', message: 'Search query is required' },
    ]);
  }
  options.filters = { ...options.filters, isActive: true, status: 'PUBLISHED' };
  const { items, meta } = await productService.getProducts(options);
  paginated(res, items, meta, 'Product search results retrieved successfully.');
};

export const updateProductController = async (req: Request, res: Response): Promise<void> => {
  const body: any = { ...req.body };
  // Convert string booleans from form-data
  ['isActive', 'isFeatured', 'isRecommended', 'isTrending', 'isBestSeller', 'isNewArrival'].forEach((key) => {
    if (body[key] === 'true') body[key] = true;
    if (body[key] === 'false') body[key] = false;
  });
  if (body.basePrice) body.basePrice = Number(body.basePrice);
  if (body.discountPrice) body.discountPrice = Number(body.discountPrice);

  const product = await productService.updateProduct(req.params.id, body);

  // If a thumbnail image was included, upload it
  if (req.file?.buffer) {
    const withImage = await productService.setProductSlotImage(req.params.id, 'thumbnail', req.file.buffer);
    success(res, withImage, PRODUCT_MESSAGES.UPDATED);
    return;
  }

  success(res, product, PRODUCT_MESSAGES.UPDATED);
};

export const deleteProductController = async (req: Request, res: Response): Promise<void> => {
  await productService.deleteProduct(req.params.id);
  noContent(res);
};

export const updateProductStatusController = async (req: Request, res: Response): Promise<void> => {
  const product = await productService.updateProductStatus(req.params.id, req.body);
  success(res, product, PRODUCT_MESSAGES.STATUS_UPDATED);
};

export const updateProductFlagController = async (req: Request, res: Response): Promise<void> => {
  const flag = req.params.flag as ProductToggleFlag;
  if (!PRODUCT_TOGGLE_FLAGS.includes(flag)) throw new BadRequestError(PRODUCT_MESSAGES.INVALID_FLAG);
  const product = await productService.toggleProductFlag(req.params.id, flag, req.body);
  success(res, product, PRODUCT_MESSAGES.FLAG_UPDATED);
};

export const updateAssignmentsController = async (req: Request, res: Response): Promise<void> => {
  const product = await productService.updateProductAssignments(req.params.id, req.body);
  success(res, product, PRODUCT_MESSAGES.ASSIGNMENTS_UPDATED);
};

export const uploadSlotImageController = async (req: Request, res: Response): Promise<void> => {
  if (!req.file?.buffer) throw new BadRequestError(PRODUCT_MESSAGES.THUMB_REQUIRED);
  const slot = req.params.slot as ImageSlot;
  const product = await productService.setProductSlotImage(req.params.id, slot, req.file.buffer);
  success(res, product, `Image uploaded for slot: ${slot}`);
};

export const removeSlotImageController = async (req: Request, res: Response): Promise<void> => {
  const slot = req.params.slot as ImageSlot;
  const product = await productService.removeProductSlotImage(req.params.id, slot);
  success(res, product, `Image removed from slot: ${slot}`);
};

// -------- Characteristics --------

export const listCharacteristicsController = async (req: Request, res: Response): Promise<void> => {
  const items = await characteristicService.listCharacteristics(req.params.id);
  success(res, items, PRODUCT_MESSAGES.CHAR_LISTED);
};

export const createCharacteristicController = async (req: Request, res: Response): Promise<void> => {
  const item = await characteristicService.createCharacteristic(req.params.id, req.body);
  created(res, item, PRODUCT_MESSAGES.CHAR_CREATED);
};

export const updateCharacteristicController = async (req: Request, res: Response): Promise<void> => {
  const item = await characteristicService.updateCharacteristic(req.params.id, req.params.charId, req.body);
  success(res, item, PRODUCT_MESSAGES.CHAR_UPDATED);
};

export const deleteCharacteristicController = async (req: Request, res: Response): Promise<void> => {
  await characteristicService.deleteCharacteristic(req.params.id, req.params.charId);
  noContent(res);
};

// -------- Variants --------

export const listVariantsController = async (req: Request, res: Response): Promise<void> => {
  const items = await variantService.listVariants(req.params.id);
  success(res, items, PRODUCT_MESSAGES.VARIANT_LISTED);
};

export const getVariantController = async (req: Request, res: Response): Promise<void> => {
  const item = await variantService.getVariantById(req.params.id, req.params.variantId);
  success(res, item, PRODUCT_MESSAGES.VARIANT_RETRIEVED);
};

export const createVariantController = async (req: Request, res: Response): Promise<void> => {
  const item = await variantService.createVariant(req.params.id, req.body);
  created(res, item, PRODUCT_MESSAGES.VARIANT_CREATED);
};

export const updateVariantController = async (req: Request, res: Response): Promise<void> => {
  const item = await variantService.updateVariant(req.params.id, req.params.variantId, req.body);
  success(res, item, PRODUCT_MESSAGES.VARIANT_UPDATED);
};

export const deleteVariantController = async (req: Request, res: Response): Promise<void> => {
  await variantService.deleteVariant(req.params.id, req.params.variantId);
  noContent(res);
};

export const addVariantImagesController = async (req: Request, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) throw new BadRequestError(PRODUCT_MESSAGES.VARIANT_IMAGE_REQUIRED);
  const images = await variantService.addVariantImages(req.params.id, req.params.variantId, files);
  created(res, images, PRODUCT_MESSAGES.VARIANT_IMAGE_UPLOADED);
};

export const removeVariantImageController = async (req: Request, res: Response): Promise<void> => {
  await variantService.removeVariantImage(req.params.id, req.params.variantId, req.params.imageId);
  noContent(res);
};

// -------- Nested read views --------


export const listProductReviewsController = async (req: Request, res: Response): Promise<void> => {
  const options = parseQueryOptions(req, {
    allowedSortFields: [...REVIEW_SORT_FIELDS],
    allowedFilters: REVIEW_FILTER_FIELDS.filter((f) => f !== 'productId'),
  });
  const { items, meta } = await productService.listReviewsForProduct(req.params.id, options);
  paginated(res, items, meta, 'Product reviews retrieved successfully.');
};

export const getProductReviewSummaryController = async (req: Request, res: Response): Promise<void> => {
  const summary = await productService.getReviewSummaryForProduct(req.params.id);
  success(res, summary, 'Product review summary retrieved successfully.');
};

export const listProductOrdersController = async (req: Request, res: Response): Promise<void> => {
  const options = parseQueryOptions(req, {
    allowedSortFields: [...ORDER_SORT_FIELDS],
    allowedFilters: ORDER_FILTER_FIELDS.filter((f) => f !== 'productId'),
  });
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  const { items, meta } = await productService.listOrdersForProduct(req.params.id, {
    ...options, from, to,
  });
  paginated(res, items, meta, 'Product orders retrieved successfully.');
};
