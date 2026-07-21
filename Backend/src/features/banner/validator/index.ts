import { z } from 'zod';

import {
  BANNER_CTA_LINK_MAX,
  BANNER_CTA_TEXT_MAX,
  BANNER_PLACEMENTS,
  BANNER_SORT_FIELDS,
  BANNER_SUBTEXT_MAX,
  BANNER_TITLE_MAX,
  HEX_COLOR_REGEX,
} from '../constants';

const uuid = z.string().uuid('Must be a valid UUID');
const isoDate = z.string().datetime({ offset: true }).or(z.string().datetime());
const hexColor = z.string().trim().regex(HEX_COLOR_REGEX, 'Must be a valid hex color, e.g. #101828');

export const createBannerSchema = z.object({
  placement: z.enum(BANNER_PLACEMENTS),
  title: z.string().trim().min(1).max(BANNER_TITLE_MAX),
  subtext: z.string().trim().max(BANNER_SUBTEXT_MAX).optional(),
  ctaText: z.string().trim().max(BANNER_CTA_TEXT_MAX).optional(),
  ctaLink: z.string().trim().max(BANNER_CTA_LINK_MAX).optional(),
  bgColor: hexColor.optional(),
  textColor: hexColor.optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  startsAt: isoDate,
  expiresAt: isoDate,
  isActive: z.boolean().optional().default(true),
});

export const updateBannerSchema = z
  .object({
    placement: z.enum(BANNER_PLACEMENTS).optional(),
    title: z.string().trim().min(1).max(BANNER_TITLE_MAX).optional(),
    subtext: z.string().trim().max(BANNER_SUBTEXT_MAX).nullable().optional(),
    ctaText: z.string().trim().max(BANNER_CTA_TEXT_MAX).nullable().optional(),
    ctaLink: z.string().trim().max(BANNER_CTA_LINK_MAX).nullable().optional(),
    bgColor: hexColor.optional(),
    textColor: hexColor.optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
    startsAt: isoDate.optional(),
    expiresAt: isoDate.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });

export const bannerIdParamsSchema = z.object({ id: uuid });

export const listBannersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).optional(),
  placement: z.enum(BANNER_PLACEMENTS).optional(),
  isActive: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .optional(),
  sortBy: z.enum(BANNER_SORT_FIELDS).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const activeBannersQuerySchema = z.object({
  placement: z.enum(BANNER_PLACEMENTS).optional(),
});
