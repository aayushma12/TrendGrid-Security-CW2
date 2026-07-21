/**
 * Homepage CMS business logic — the ONLY place with rules for this feature.
 *
 * Sections themselves are a fixed set seeded once (prisma/seed.ts), mirroring
 * the storefront's actual component tree. The admin can reorder sections,
 * toggle visibility, and edit each section's content (fields + repeaters),
 * but cannot create/delete sections through this API — that would require a
 * matching storefront component and is a code change, not a content edit.
 */
import { BadRequestError, NotFoundError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { uploadImage } from '../../../services/imageService';

import * as homepageRepo from '../repository';
import {
  HomepageImageUploadResponseDto,
  HomepageSectionResponseDto,
  ReorderSectionsDto,
  UpdateSectionContentDto,
  UpdateSectionVisibilityDto,
  toHomepageSectionResponseDto,
} from '../dto';
import { HOMEPAGE_IMAGE_SUBFOLDER, HOMEPAGE_MESSAGES } from '../constants';

/** Public/storefront read — visible sections only, in display order. */
export const listPublicSections = async (): Promise<HomepageSectionResponseDto[]> => {
  const rows = await homepageRepo.findVisibleOrdered();
  return rows.map(toHomepageSectionResponseDto);
};

/** Admin read — every section (visible + hidden), in display order. */
export const listAdminSections = async (): Promise<HomepageSectionResponseDto[]> => {
  const rows = await homepageRepo.findAllOrdered();
  return rows.map(toHomepageSectionResponseDto);
};

export const getSectionById = async (id: string): Promise<HomepageSectionResponseDto> => {
  const s = await homepageRepo.findById(id);
  if (!s) throw new NotFoundError(HOMEPAGE_MESSAGES.NOT_FOUND);
  return toHomepageSectionResponseDto(s);
};

export const updateSectionContent = async (
  id: string,
  dto: UpdateSectionContentDto,
): Promise<HomepageSectionResponseDto> => {
  const updated = await homepageRepo.updateContent(id, dto);
  if (!updated) throw new NotFoundError(HOMEPAGE_MESSAGES.NOT_FOUND);
  logger.info(`Homepage section content saved id=${id} key=${updated.key}`);
  return toHomepageSectionResponseDto(updated);
};

export const updateSectionVisibility = async (
  id: string,
  dto: UpdateSectionVisibilityDto,
): Promise<HomepageSectionResponseDto> => {
  const updated = await homepageRepo.updateVisibility(id, dto.visible);
  if (!updated) throw new NotFoundError(HOMEPAGE_MESSAGES.NOT_FOUND);
  logger.info(`Homepage section visibility set id=${id} key=${updated.key} visible=${dto.visible}`);
  return toHomepageSectionResponseDto(updated);
};

export const reorderSections = async (dto: ReorderSectionsDto): Promise<HomepageSectionResponseDto[]> => {
  const existingIds = await homepageRepo.findAllIds();
  const existingSet = new Set(existingIds);
  const incomingSet = new Set(dto.order);

  const sameSize = existingIds.length === dto.order.length && incomingSet.size === dto.order.length;
  const sameMembers = sameSize && dto.order.every((id) => existingSet.has(id));
  if (!sameSize || !sameMembers) {
    throw new BadRequestError(HOMEPAGE_MESSAGES.REORDER_MISMATCH);
  }

  await homepageRepo.reorder(dto.order);
  logger.info(`Homepage sections reordered count=${dto.order.length}`);
  return listAdminSections();
};

// -------- Image --------

/**
 * Upload an image asset for a section's content (a `HomeField`/repeater item
 * of type "image"). Returns the Cloudinary URL — the admin UI places it into
 * the relevant field's `value` and saves via updateSectionContent. Not tied
 * to a single DB column, since content shape varies per section.
 */
export const uploadSectionImage = async (
  id: string,
  buffer: Buffer,
): Promise<HomepageImageUploadResponseDto> => {
  const existing = await homepageRepo.findById(id);
  if (!existing) throw new NotFoundError(HOMEPAGE_MESSAGES.NOT_FOUND);

  const stored = await uploadImage(buffer, HOMEPAGE_IMAGE_SUBFOLDER);
  logger.info(`Homepage section image uploaded id=${id} publicId=${stored.publicId}`);
  return { url: stored.secureUrl, publicId: stored.publicId };
};
