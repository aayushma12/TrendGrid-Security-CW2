import { BannerPlacementValue } from '../constants';

/** Derived, read-only lifecycle status for admin/storefront display. */
export type BannerPublicStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'INACTIVE';

export interface Banner {
  id: string;
  placement: BannerPlacementValue;
  title: string;
  subtext?: string;
  ctaText?: string;
  ctaLink?: string;
  bgColor: string;
  textColor: string;
  imageUrl?: string;
  imagePublicId?: string;
  sortOrder: number;
  startsAt: Date;
  expiresAt: Date;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
