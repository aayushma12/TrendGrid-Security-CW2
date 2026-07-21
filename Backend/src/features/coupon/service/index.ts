/**
 * Coupon business logic.
 *
 * Enforced rules:
 *   • Code unique
 *   • Percentage: 1..100
 *   • Fixed: > 0
 *   • startDate <= endDate
 *   • Cannot validate/apply if: expired, inactive, deleted, usage limit reached,
 *     per-user limit reached, minimum purchase not met
 *   • Discount never reduces total below 0
 *   • maximumDiscount caps a percentage coupon
 */
import { PaginationMeta, QueryOptions } from '../../../types';
import { BadRequestError, DuplicateError, NotFoundError } from '../../../utils/errors';
import { buildPaginationMeta } from '../../../utils/queryOptions';
import { logger } from '../../../utils/logger';
import { capDiscount, percentageOf, round2 } from '../../../utils/money';

import * as couponRepo from '../repository';
import {
  CouponResponseDto,
  CreateCouponDto,
  UpdateCouponDto,
  toCouponResponseDto,
} from '../dto';
import { COUPON_MESSAGES, CouponTypeValue } from '../constants';
import { Coupon, CouponEvaluation, CouponPublicStatus } from '../types';

// -------- Rule helpers --------

const validateShape = (type: CouponTypeValue, value: number): void => {
  if (type === 'PERCENTAGE') {
    if (!Number.isFinite(value) || value < 1 || value > 100) {
      throw new BadRequestError(COUPON_MESSAGES.PERCENT_RANGE, [
        { field: 'value', message: COUPON_MESSAGES.PERCENT_RANGE },
      ]);
    }
    return;
  }
  if (!Number.isFinite(value) || value <= 0) {
    throw new BadRequestError(COUPON_MESSAGES.FIXED_NEGATIVE, [
      { field: 'value', message: COUPON_MESSAGES.FIXED_NEGATIVE },
    ]);
  }
};

const validateDates = (start: Date, end: Date): void => {
  if (start.getTime() > end.getTime()) {
    throw new BadRequestError(COUPON_MESSAGES.DATES_INVALID, [
      { field: 'endDate', message: COUPON_MESSAGES.DATES_INVALID },
    ]);
  }
};

// -------- Validation & calculation --------

/** Compute raw discount amount for a coupon against a cart total (no cap logic). */
const rawDiscount = (c: Coupon, cartTotal: number): number => {
  if (c.type === 'PERCENTAGE') return percentageOf(cartTotal, c.value);
  return round2(Math.max(0, c.value));
};

/** Return the effective discount after applying maximumDiscount cap and non-negative floor. */
const effectiveDiscount = (c: Coupon, cartTotal: number): number => {
  let d = rawDiscount(c, cartTotal);
  if (c.maximumDiscount !== undefined) d = Math.min(d, c.maximumDiscount);
  return capDiscount(cartTotal, d);
};

/**
 * Validate a coupon against a cart total. Throws BadRequestError on any failure.
 * If `userId` is provided, per-user usage limit is checked.
 * Returns the evaluation (coupon + effective discount).
 */
export const validateCoupon = async (
  code: string, cartTotal: number, userId?: string,
): Promise<CouponEvaluation> => {
  const coupon = await couponRepo.findByCode(code);
  if (!coupon) throw new NotFoundError(COUPON_MESSAGES.NOT_FOUND);

  if (coupon.isDeleted) throw new BadRequestError(COUPON_MESSAGES.DELETED_STATE);
  if (!coupon.isActive) throw new BadRequestError(COUPON_MESSAGES.INACTIVE);

  const now = Date.now();
  if (coupon.startDate.getTime() > now) {
    throw new BadRequestError(COUPON_MESSAGES.NOT_YET_ACTIVE);
  }
  if (coupon.endDate.getTime() < now) {
    throw new BadRequestError(COUPON_MESSAGES.EXPIRED);
  }

  if (coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit) {
    throw new BadRequestError(COUPON_MESSAGES.USAGE_LIMIT_REACHED);
  }

  if (userId && coupon.perUserLimit !== undefined) {
    const used = await couponRepo.countUsageForUser(coupon.id, userId);
    if (used >= coupon.perUserLimit) {
      throw new BadRequestError(COUPON_MESSAGES.USER_LIMIT_REACHED);
    }
  }

  if (coupon.minimumPurchase !== undefined && cartTotal < coupon.minimumPurchase) {
    throw new BadRequestError(COUPON_MESSAGES.MIN_PURCHASE_NOT_MET, [
      { field: 'cartTotal', message: COUPON_MESSAGES.MIN_PURCHASE_NOT_MET },
    ]);
  }

  const status: CouponPublicStatus = 'ACTIVE';
  return { coupon, discount: effectiveDiscount(coupon, cartTotal), status };
};

/** Peek the current status of a coupon without throwing (for admin/list UIs). */
export const evaluate = (c: Coupon, cartTotal: number): CouponEvaluation => {
  let status: CouponPublicStatus = 'ACTIVE';
  if (c.isDeleted || !c.isActive) status = 'INACTIVE';
  else if (c.endDate.getTime() < Date.now()) status = 'EXPIRED';
  return { coupon: c, discount: effectiveDiscount(c, cartTotal), status };
};

// -------- CRUD --------

export const createCoupon = async (dto: CreateCouponDto): Promise<CouponResponseDto> => {
  validateShape(dto.type, dto.value);
  const start = new Date(dto.startDate);
  const end = new Date(dto.endDate);
  validateDates(start, end);

  const existing = await couponRepo.findByCode(dto.code);
  if (existing) {
    throw new DuplicateError(COUPON_MESSAGES.DUPLICATE_CODE, [
      { field: 'code', message: COUPON_MESSAGES.DUPLICATE_CODE },
    ]);
  }

  const created = await couponRepo.create({
    code: dto.code.toUpperCase(),
    description: dto.description ?? null,
    type: dto.type,
    value: dto.value,
    minimumPurchase: dto.minimumPurchase ?? null,
    maximumDiscount: dto.maximumDiscount ?? null,
    usageLimit: dto.usageLimit ?? null,
    perUserLimit: dto.perUserLimit ?? null,
    startDate: start,
    endDate: end,
    isActive: dto.isActive ?? true,
  });
  logger.info(`Coupon created id=${created.id} code=${created.code}`);
  return toCouponResponseDto(created);
};

export const getCouponById = async (id: string): Promise<CouponResponseDto> => {
  const c = await couponRepo.findById(id);
  if (!c || c.isDeleted) throw new NotFoundError(COUPON_MESSAGES.NOT_FOUND);
  return toCouponResponseDto(c);
};

export const getCoupons = async (
  options: QueryOptions,
): Promise<{ items: CouponResponseDto[]; meta: PaginationMeta }> => {
  const { items, total } = await couponRepo.findMany(options);
  return {
    items: items.map(toCouponResponseDto),
    meta: buildPaginationMeta(total, options.page, options.limit),
  };
};

export const updateCoupon = async (id: string, dto: UpdateCouponDto): Promise<CouponResponseDto> => {
  const existing = await couponRepo.findById(id);
  if (!existing || existing.isDeleted) throw new NotFoundError(COUPON_MESSAGES.NOT_FOUND);

  if (dto.code && dto.code.toUpperCase() !== existing.code) {
    const dup = await couponRepo.findByCode(dto.code);
    if (dup && dup.id !== id) {
      throw new DuplicateError(COUPON_MESSAGES.DUPLICATE_CODE, [
        { field: 'code', message: COUPON_MESSAGES.DUPLICATE_CODE },
      ]);
    }
  }

  const nextType = dto.type ?? existing.type;
  const nextValue = dto.value ?? existing.value;
  validateShape(nextType, nextValue);

  const nextStart = dto.startDate ? new Date(dto.startDate) : existing.startDate;
  const nextEnd = dto.endDate ? new Date(dto.endDate) : existing.endDate;
  validateDates(nextStart, nextEnd);

  // Pass nullable fields through as-is: null = clear, undefined = skip.
  const updated = await couponRepo.update(id, {
    code: dto.code?.toUpperCase(),
    description: dto.description,
    type: dto.type,
    value: dto.value,
    minimumPurchase: dto.minimumPurchase,
    maximumDiscount: dto.maximumDiscount,
    usageLimit: dto.usageLimit,
    perUserLimit: dto.perUserLimit,
    startDate: dto.startDate ? nextStart : undefined,
    endDate: dto.endDate ? nextEnd : undefined,
    isActive: dto.isActive,
  });
  if (!updated) throw new NotFoundError(COUPON_MESSAGES.NOT_FOUND);
  logger.info(`Coupon updated id=${id}`);
  return toCouponResponseDto(updated);
};

export const deleteCoupon = async (id: string): Promise<void> => {
  const removed = await couponRepo.softDelete(id);
  if (!removed) throw new NotFoundError(COUPON_MESSAGES.NOT_FOUND);
  logger.info(`Coupon deleted (soft) id=${id}`);
};

/** Public preview endpoint result. */
export const validateCouponPublic = async (
  code: string, cartTotal: number,
): Promise<{ coupon: CouponResponseDto; discount: number; grandTotalAfter: number }> => {
  try {
    const evalRes = await validateCoupon(code, cartTotal);
    logger.info(`Coupon validated code=${code} cartTotal=${cartTotal} discount=${evalRes.discount}`);
    return {
      coupon: toCouponResponseDto(evalRes.coupon),
      discount: evalRes.discount,
      grandTotalAfter: round2(Math.max(0, cartTotal - evalRes.discount)),
    };
  } catch (err) {
    logger.warn(`Coupon validation failed code=${code}: ${(err as Error).message}`);
    throw err;
  }
};
