import { BannerPlacementValue } from '../constants';
import { Banner, BannerPublicStatus } from '../types';

export interface CreateBannerDto {
  placement: BannerPlacementValue;
  title: string;
  subtext?: string;
  ctaText?: string;
  ctaLink?: string;
  bgColor?: string;
  textColor?: string;
  sortOrder?: number;
  startsAt: string;
  expiresAt: string;
  isActive?: boolean;
}

export interface UpdateBannerDto {
  placement?: BannerPlacementValue;
  title?: string;
  subtext?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  bgColor?: string;
  textColor?: string;
  sortOrder?: number;
  startsAt?: string;
  expiresAt?: string;
  isActive?: boolean;
}

export interface BannerResponseDto {
  id: string;
  placement: BannerPlacementValue;
  title: string;
  subtext: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  bgColor: string;
  textColor: string;
  imageUrl: string | null;
  imagePublicId: string | null;
  sortOrder: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  isDeleted: boolean;
  status: BannerPublicStatus;
  createdAt: string;
  updatedAt: string;
}

export const deriveBannerStatus = (b: Banner): BannerPublicStatus => {
  if (b.isDeleted || !b.isActive) return 'INACTIVE';
  const now = Date.now();
  if (b.startsAt.getTime() > now) return 'SCHEDULED';
  if (b.expiresAt.getTime() < now) return 'EXPIRED';
  return 'ACTIVE';
};

export const toBannerResponseDto = (b: Banner): BannerResponseDto => ({
  id: b.id,
  placement: b.placement,
  title: b.title,
  subtext: b.subtext ?? null,
  ctaText: b.ctaText ?? null,
  ctaLink: b.ctaLink ?? null,
  bgColor: b.bgColor,
  textColor: b.textColor,
  imageUrl: b.imageUrl ?? null,
  imagePublicId: b.imagePublicId ?? null,
  sortOrder: b.sortOrder,
  startsAt: b.startsAt.toISOString(),
  expiresAt: b.expiresAt.toISOString(),
  isActive: b.isActive,
  isDeleted: b.isDeleted,
  status: deriveBannerStatus(b),
  createdAt: b.createdAt.toISOString(),
  updatedAt: b.updatedAt.toISOString(),
});
