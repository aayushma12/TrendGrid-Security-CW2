import { CouponTypeValue } from '../constants';
import { Coupon, CouponPublicStatus } from '../types';

export interface CreateCouponDto {
  code: string;
  description?: string;
  type: CouponTypeValue;
  value: number;
  minimumPurchase?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface UpdateCouponDto {
  code?: string;
  description?: string | null;
  type?: CouponTypeValue;
  value?: number;
  minimumPurchase?: number | null;
  maximumDiscount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface CouponResponseDto {
  id: string;
  code: string;
  description: string | null;
  type: CouponTypeValue;
  value: number;
  minimumPurchase: number | null;
  maximumDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isDeleted: boolean;
  status: CouponPublicStatus;
  createdAt: string;
  updatedAt: string;
}

const derivePublicStatus = (c: Coupon): CouponPublicStatus => {
  if (c.isDeleted || !c.isActive) return 'INACTIVE';
  const now = Date.now();
  if (c.endDate.getTime() < now) return 'EXPIRED';
  return 'ACTIVE';
};

export const toCouponResponseDto = (c: Coupon): CouponResponseDto => ({
  id: c.id,
  code: c.code,
  description: c.description ?? null,
  type: c.type,
  value: c.value,
  minimumPurchase: c.minimumPurchase ?? null,
  maximumDiscount: c.maximumDiscount ?? null,
  usageLimit: c.usageLimit ?? null,
  usageCount: c.usageCount,
  perUserLimit: c.perUserLimit ?? null,
  startDate: c.startDate.toISOString(),
  endDate: c.endDate.toISOString(),
  isActive: c.isActive,
  isDeleted: c.isDeleted,
  status: derivePublicStatus(c),
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});
