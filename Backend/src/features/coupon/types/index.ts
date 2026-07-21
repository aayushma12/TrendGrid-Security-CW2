import { CouponTypeValue } from '../constants';

export type CouponPublicStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: CouponTypeValue;
  value: number;
  minimumPurchase?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponEvaluation {
  coupon: Coupon;
  discount: number;
  status: CouponPublicStatus;
}
