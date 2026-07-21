import { DuplicateError, NotFoundError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { deleteImage, uploadImage } from '../../../services/imageService';

import * as variantRepo from '../repository/variant';
import * as productRepo from '../repository/product';
import {
  CreateVariantDto, UpdateVariantDto, VariantImageResponseDto, VariantResponseDto,
  toVariantDto, toVariantImageDto,
} from '../dto';
import { PRODUCT_MESSAGES, PRODUCT_VARIANT_SUBFOLDER } from '../constants';

const assertProductExists = async (productId: string): Promise<void> => {
  const exists = await productRepo.existsById(productId);
  if (!exists) throw new NotFoundError(PRODUCT_MESSAGES.NOT_FOUND);
};



const assertSkuUnique = async (sku: string, ignoreVariantId?: string): Promise<void> => {
  const existing = await variantRepo.findBySku(sku);
  if (existing && existing.id !== ignoreVariantId) {
    throw new DuplicateError(PRODUCT_MESSAGES.VARIANT_DUP_SKU, [
      { field: 'sku', message: PRODUCT_MESSAGES.VARIANT_DUP_SKU },
    ]);
  }
};

const assertBarcodeUnique = async (barcode: string, ignoreVariantId?: string): Promise<void> => {
  const existing = await variantRepo.findByBarcode(barcode);
  if (existing && existing.id !== ignoreVariantId) {
    throw new DuplicateError(PRODUCT_MESSAGES.VARIANT_DUP_BARCODE, [
      { field: 'barcode', message: PRODUCT_MESSAGES.VARIANT_DUP_BARCODE },
    ]);
  }
};

const assertComboUnique = async (
  productId: string, color: string | null, size: string | null,
  ignoreVariantId?: string,
): Promise<void> => {
  const existing = await variantRepo.findByCombo(productId, color, size);
  if (existing && existing.id !== ignoreVariantId) {
    throw new DuplicateError(PRODUCT_MESSAGES.VARIANT_DUP_COMBO, [
      { field: 'combo', message: PRODUCT_MESSAGES.VARIANT_DUP_COMBO },
    ]);
  }
};

// ---------- CRUD ----------

export const listVariants = async (productId: string): Promise<VariantResponseDto[]> => {
  await assertProductExists(productId);
  const rows = await variantRepo.listByProduct(productId);
  return rows.map(toVariantDto);
};

export const getVariantById = async (productId: string, variantId: string): Promise<VariantResponseDto> => {
  await assertProductExists(productId);
  const v = await variantRepo.findById(productId, variantId);
  if (!v) throw new NotFoundError(PRODUCT_MESSAGES.VARIANT_NOT_FOUND);
  return toVariantDto(v);
};

export const createVariant = async (
  productId: string, dto: CreateVariantDto,
): Promise<VariantResponseDto> => {
  await assertProductExists(productId);
  await assertSkuUnique(dto.sku);
  if (dto.barcode) await assertBarcodeUnique(dto.barcode);
  await assertComboUnique(productId, dto.color ?? null, dto.size ?? null);

  const created = await variantRepo.create({
    productId,
    color: dto.color ?? null,
    size: dto.size ?? null,
    sku: dto.sku,
    barcode: dto.barcode ?? null,
    price: dto.price,
    discountPrice: dto.discountPrice ?? null,
    stock: dto.stock ?? 0,
    lowStockThreshold: dto.lowStockThreshold ?? null,
    isActive: dto.isActive ?? true,
  });
  logger.info(`Variant created productId=${productId} variantId=${created.id} sku=${created.sku}`);
  return toVariantDto(created);
};

export const updateVariant = async (
  productId: string, variantId: string, dto: UpdateVariantDto,
): Promise<VariantResponseDto> => {
  await assertProductExists(productId);
  const existing = await variantRepo.findById(productId, variantId);
  if (!existing) throw new NotFoundError(PRODUCT_MESSAGES.VARIANT_NOT_FOUND);

  if (dto.sku && dto.sku !== existing.sku) await assertSkuUnique(dto.sku, variantId);
  if (dto.barcode && dto.barcode !== existing.barcode) await assertBarcodeUnique(dto.barcode, variantId);

  const nextColor = dto.color === undefined ? existing.color ?? null : dto.color;
  const nextSize = dto.size === undefined ? existing.size ?? null : dto.size;
  if (nextColor !== (existing.color ?? null) || nextSize !== (existing.size ?? null)) {
    await assertComboUnique(productId, nextColor, nextSize, variantId);
  }

  const updated = await variantRepo.update(productId, variantId, dto);
  if (!updated) throw new NotFoundError(PRODUCT_MESSAGES.VARIANT_NOT_FOUND);
  logger.info(`Variant updated productId=${productId} variantId=${variantId}`);
  return toVariantDto(updated);
};

export const deleteVariant = async (productId: string, variantId: string): Promise<void> => {
  await assertProductExists(productId);
  const removed = await variantRepo.remove(productId, variantId);
  if (!removed) throw new NotFoundError(PRODUCT_MESSAGES.VARIANT_NOT_FOUND);
  await Promise.all(removed.images!.map((i) => deleteImage(i.imagePublicId)));
  logger.info(`Variant deleted productId=${productId} variantId=${variantId}`);
};

// ---------- Variant images ----------

export const addVariantImages = async (
  productId: string, variantId: string, files: Express.Multer.File[],
): Promise<VariantImageResponseDto[]> => {
  await assertProductExists(productId);
  const variant = await variantRepo.findById(productId, variantId);
  if (!variant) throw new NotFoundError(PRODUCT_MESSAGES.VARIANT_NOT_FOUND);

  let nextPos = (await variantRepo.maxImagePosition(variantId)) + 1;
  const added: VariantImageResponseDto[] = [];
  for (const file of files) {
    const stored = await uploadImage(file.buffer, PRODUCT_VARIANT_SUBFOLDER);
    const record = await variantRepo.createImage(variantId, {
      imageUrl: stored.secureUrl, imagePublicId: stored.publicId, position: nextPos++,
    });
    added.push(toVariantImageDto(record));
  }
  logger.info(`Variant images added variantId=${variantId} count=${added.length}`);
  return added;
};

export const removeVariantImage = async (
  productId: string, variantId: string, imageId: string,
): Promise<void> => {
  await assertProductExists(productId);
  const variant = await variantRepo.findById(productId, variantId);
  if (!variant) throw new NotFoundError(PRODUCT_MESSAGES.VARIANT_NOT_FOUND);
  const image = await variantRepo.findImageById(variantId, imageId);
  if (!image) throw new NotFoundError(PRODUCT_MESSAGES.VARIANT_IMAGE_NOT_FOUND);
  await deleteImage(image.imagePublicId);
  const removed = await variantRepo.removeImage(variantId, imageId);
  if (!removed) throw new NotFoundError(PRODUCT_MESSAGES.VARIANT_IMAGE_NOT_FOUND);
  logger.info(`Variant image removed variantId=${variantId} imageId=${imageId}`);
};
