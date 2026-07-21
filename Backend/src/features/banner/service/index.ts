/**
 * Banner (special offers / promo strips) business logic.
 *
 * Enforced rules:
 *   • startsAt <= expiresAt
 *   • bgColor / textColor must be valid hex if provided (defaults applied otherwise)
 *   • Soft delete only — banners are kept for audit/history, never hard-deleted
 *
 * Lifecycle status (derived, not stored): SCHEDULED (not started yet) →
 * ACTIVE (within window + isActive) → EXPIRED (past expiresAt), or INACTIVE
 * whenever isActive is off / the banner has been deleted.
 */
import { PaginationMeta, QueryOptions } from '../../../types';
import { BadRequestError, NotFoundError } from '../../../utils/errors';
import { buildPaginationMeta } from '../../../utils/queryOptions';
import { logger } from '../../../utils/logger';
import { deleteImage, replaceImage } from '../../../services/imageService';

import * as bannerRepo from '../repository';
import {
  BannerResponseDto,
  CreateBannerDto,
  UpdateBannerDto,
  toBannerResponseDto,
} from '../dto';
import { BANNER_IMAGE_SUBFOLDER, BANNER_MESSAGES, BannerPlacementValue, HEX_COLOR_REGEX } from '../constants';

const validateDates = (start: Date, end: Date): void => {
  if (start.getTime() > end.getTime()) {
    throw new BadRequestError(BANNER_MESSAGES.DATES_INVALID, [
      { field: 'expiresAt', message: BANNER_MESSAGES.DATES_INVALID },
    ]);
  }
};

const validateColor = (field: 'bgColor' | 'textColor', value?: string): void => {
  if (value !== undefined && !HEX_COLOR_REGEX.test(value)) {
    throw new BadRequestError(`${field} must be a valid hex color (e.g. #101828).`, [
      { field, message: 'Must be a valid hex color, e.g. #101828 or #fff.' },
    ]);
  }
};

// -------- CRUD --------

export const createBanner = async (dto: CreateBannerDto): Promise<BannerResponseDto> => {
  const start = new Date(dto.startsAt);
  const end = new Date(dto.expiresAt);
  validateDates(start, end);
  validateColor('bgColor', dto.bgColor);
  validateColor('textColor', dto.textColor);

  const created = await bannerRepo.create({
    placement: dto.placement,
    title: dto.title.trim(),
    subtext: dto.subtext?.trim() ?? null,
    ctaText: dto.ctaText?.trim() ?? null,
    ctaLink: dto.ctaLink?.trim() ?? null,
    bgColor: dto.bgColor ?? '#101828',
    textColor: dto.textColor ?? '#ffffff',
    sortOrder: dto.sortOrder ?? 0,
    startsAt: start,
    expiresAt: end,
    isActive: dto.isActive ?? true,
  });
  logger.info(`Banner created id=${created.id} placement=${created.placement}`);
  return toBannerResponseDto(created);
};

export const getBannerById = async (id: string): Promise<BannerResponseDto> => {
  const b = await bannerRepo.findById(id);
  if (!b || b.isDeleted) throw new NotFoundError(BANNER_MESSAGES.NOT_FOUND);
  return toBannerResponseDto(b);
};

export const getBanners = async (
  options: QueryOptions,
): Promise<{ items: BannerResponseDto[]; meta: PaginationMeta }> => {
  const { items, total } = await bannerRepo.findMany(options);
  return {
    items: items.map(toBannerResponseDto),
    meta: buildPaginationMeta(total, options.page, options.limit),
  };
};

export const updateBanner = async (id: string, dto: UpdateBannerDto): Promise<BannerResponseDto> => {
  const existing = await bannerRepo.findById(id);
  if (!existing || existing.isDeleted) throw new NotFoundError(BANNER_MESSAGES.NOT_FOUND);

  const nextStart = dto.startsAt ? new Date(dto.startsAt) : existing.startsAt;
  const nextEnd = dto.expiresAt ? new Date(dto.expiresAt) : existing.expiresAt;
  validateDates(nextStart, nextEnd);
  validateColor('bgColor', dto.bgColor);
  validateColor('textColor', dto.textColor);

  // Pass nullable fields through as-is: null = clear, undefined = skip.
  const updated = await bannerRepo.update(id, {
    placement: dto.placement,
    title: dto.title?.trim(),
    subtext: dto.subtext === null ? null : dto.subtext?.trim(),
    ctaText: dto.ctaText === null ? null : dto.ctaText?.trim(),
    ctaLink: dto.ctaLink === null ? null : dto.ctaLink?.trim(),
    bgColor: dto.bgColor,
    textColor: dto.textColor,
    sortOrder: dto.sortOrder,
    startsAt: dto.startsAt ? nextStart : undefined,
    expiresAt: dto.expiresAt ? nextEnd : undefined,
    isActive: dto.isActive,
  });
  if (!updated) throw new NotFoundError(BANNER_MESSAGES.NOT_FOUND);
  logger.info(`Banner updated id=${id}`);
  return toBannerResponseDto(updated);
};

export const deleteBanner = async (id: string): Promise<void> => {
  const removed = await bannerRepo.softDelete(id);
  if (!removed) throw new NotFoundError(BANNER_MESSAGES.NOT_FOUND);
  logger.info(`Banner deleted (soft) id=${id}`);
};

/** Public/storefront read: currently-live banners, optionally scoped to a placement. */
export const getActiveBanners = async (
  placement?: BannerPlacementValue,
): Promise<BannerResponseDto[]> => {
  const items = await bannerRepo.findActive(placement);
  return items.map(toBannerResponseDto);
};

// -------- Image --------

/**
 * Upload or replace a banner's image. Deletes the previous asset from
 * Cloudinary after the new one is stored (atomic-safe via replaceImage).
 */
export const setBannerImage = async (id: string, buffer: Buffer): Promise<BannerResponseDto> => {
  const existing = await bannerRepo.findById(id);
  if (!existing || existing.isDeleted) throw new NotFoundError(BANNER_MESSAGES.NOT_FOUND);

  const stored = await replaceImage(existing.imagePublicId, buffer, BANNER_IMAGE_SUBFOLDER);

  const updated = await bannerRepo.update(id, {
    imageUrl: stored.secureUrl,
    imagePublicId: stored.publicId,
  });
  if (!updated) throw new NotFoundError(BANNER_MESSAGES.NOT_FOUND);

  logger.info(`Banner image set id=${id} publicId=${stored.publicId}`);
  return toBannerResponseDto(updated);
};

/** Remove the current image (Cloudinary + DB). */
export const removeBannerImage = async (id: string): Promise<BannerResponseDto> => {
  const existing = await bannerRepo.findById(id);
  if (!existing || existing.isDeleted) throw new NotFoundError(BANNER_MESSAGES.NOT_FOUND);
  if (!existing.imagePublicId) throw new BadRequestError(BANNER_MESSAGES.NO_IMAGE);

  await deleteImage(existing.imagePublicId);
  const updated = await bannerRepo.update(id, { imageUrl: null, imagePublicId: null });
  if (!updated) throw new NotFoundError(BANNER_MESSAGES.NOT_FOUND);

  logger.info(`Banner image removed id=${id}`);
  return toBannerResponseDto(updated);
};
