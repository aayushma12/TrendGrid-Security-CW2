import { Prisma, Banner as PrismaBanner } from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { QueryOptions } from '../../../types';
import { BannerPlacementValue } from '../constants';
import { Banner } from '../types';

const toBanner = (r: PrismaBanner): Banner => ({
  id: r.id,
  placement: r.placement as BannerPlacementValue,
  title: r.title,
  subtext: r.subtext ?? undefined,
  ctaText: r.ctaText ?? undefined,
  ctaLink: r.ctaLink ?? undefined,
  bgColor: r.bgColor,
  textColor: r.textColor,
  imageUrl: r.imageUrl ?? undefined,
  imagePublicId: r.imagePublicId ?? undefined,
  sortOrder: r.sortOrder,
  startsAt: r.startsAt,
  expiresAt: r.expiresAt,
  isActive: r.isActive,
  isDeleted: r.isDeleted,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

export interface CreateBannerRecord {
  placement: BannerPlacementValue;
  title: string;
  subtext?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  bgColor: string;
  textColor: string;
  sortOrder: number;
  startsAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface UpdateBannerRecord {
  placement?: BannerPlacementValue;
  title?: string;
  subtext?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  bgColor?: string;
  textColor?: string;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  sortOrder?: number;
  startsAt?: Date;
  expiresAt?: Date;
  isActive?: boolean;
}

export const create = async (data: CreateBannerRecord): Promise<Banner> =>
  toBanner(await prisma.banner.create({ data }));

export const findById = async (id: string): Promise<Banner | null> => {
  const r = await prisma.banner.findUnique({ where: { id } });
  return r ? toBanner(r) : null;
};

export const update = async (id: string, patch: UpdateBannerRecord): Promise<Banner | null> => {
  try {
    const r = await prisma.banner.update({ where: { id }, data: patch });
    return toBanner(r);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return null;
    throw err;
  }
};

export const softDelete = async (id: string): Promise<boolean> => {
  const r = await prisma.banner.updateMany({
    where: { id, isDeleted: false },
    data: { isDeleted: true, isActive: false },
  });
  return r.count === 1;
};

export const findMany = async (
  options: QueryOptions,
): Promise<{ items: Banner[]; total: number }> => {
  const where: Prisma.BannerWhereInput = { isDeleted: false };
  if (typeof options.filters.placement === 'string') {
    where.placement = options.filters.placement as BannerPlacementValue;
  }
  if (typeof options.filters.isActive === 'boolean') where.isActive = options.filters.isActive;
  if (options.search) {
    where.OR = [
      { title: { contains: options.search, mode: 'insensitive' } },
      { subtext: { contains: options.search, mode: 'insensitive' } },
    ];
  }
  const [rows, total] = await prisma.$transaction([
    prisma.banner.findMany({
      where, skip: options.skip, take: options.limit,
      orderBy: { [options.sortBy]: options.sortOrder },
    }),
    prisma.banner.count({ where }),
  ]);
  return { items: rows.map(toBanner), total };
};

/**
 * Storefront read: currently-live banners (active, not deleted, within the
 * start/expiry window "right now"), optionally scoped to one placement,
 * ordered for direct rendering (sortOrder asc, then newest first).
 */
export const findActive = async (placement?: BannerPlacementValue): Promise<Banner[]> => {
  const now = new Date();
  const where: Prisma.BannerWhereInput = {
    isDeleted: false,
    isActive: true,
    startsAt: { lte: now },
    expiresAt: { gte: now },
    ...(placement ? { placement } : {}),
  };
  const rows = await prisma.banner.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
  return rows.map(toBanner);
};
