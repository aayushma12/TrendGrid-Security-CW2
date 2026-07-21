import { Prisma, Coupon as PrismaCoupon } from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { QueryOptions } from '../../../types';
import { CouponTypeValue } from '../constants';
import { Coupon } from '../types';

const toCoupon = (r: PrismaCoupon): Coupon => ({
  id: r.id,
  code: r.code,
  description: r.description ?? undefined,
  type: r.type as CouponTypeValue,
  value: Number(r.value),
  minimumPurchase: r.minimumPurchase ? Number(r.minimumPurchase) : undefined,
  maximumDiscount: r.maximumDiscount ? Number(r.maximumDiscount) : undefined,
  usageLimit: r.usageLimit ?? undefined,
  usageCount: r.usageCount,
  perUserLimit: r.perUserLimit ?? undefined,
  startDate: r.startDate,
  endDate: r.endDate,
  isActive: r.isActive,
  isDeleted: r.isDeleted,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

export interface CreateCouponRecord {
  code: string;
  description?: string | null;
  type: CouponTypeValue;
  value: number;
  minimumPurchase?: number | null;
  maximumDiscount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface UpdateCouponRecord {
  code?: string;
  description?: string | null;
  type?: CouponTypeValue;
  value?: number;
  minimumPurchase?: number | null;
  maximumDiscount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}

const decimal = (n?: number | null) =>
  n === null || n === undefined ? n : new Prisma.Decimal(n);

export const create = async (data: CreateCouponRecord): Promise<Coupon> =>
  toCoupon(await prisma.coupon.create({
    data: {
      ...data,
      value: new Prisma.Decimal(data.value),
      minimumPurchase: decimal(data.minimumPurchase),
      maximumDiscount: decimal(data.maximumDiscount),
    },
  }));

export const findById = async (id: string): Promise<Coupon | null> => {
  const r = await prisma.coupon.findUnique({ where: { id } });
  return r ? toCoupon(r) : null;
};

export const findByCode = async (code: string): Promise<Coupon | null> => {
  const r = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  return r ? toCoupon(r) : null;
};

export const update = async (id: string, patch: UpdateCouponRecord): Promise<Coupon | null> => {
  try {
    const r = await prisma.coupon.update({
      where: { id },
      data: {
        ...patch,
        value: patch.value !== undefined ? new Prisma.Decimal(patch.value) : undefined,
        minimumPurchase: patch.minimumPurchase === null ? null
          : patch.minimumPurchase !== undefined ? new Prisma.Decimal(patch.minimumPurchase) : undefined,
        maximumDiscount: patch.maximumDiscount === null ? null
          : patch.maximumDiscount !== undefined ? new Prisma.Decimal(patch.maximumDiscount) : undefined,
      },
    });
    return toCoupon(r);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return null;
    throw err;
  }
};

export const softDelete = async (id: string): Promise<boolean> => {
  const r = await prisma.coupon.updateMany({
    where: { id, isDeleted: false },
    data: { isDeleted: true, isActive: false },
  });
  return r.count === 1;
};

export const findMany = async (
  options: QueryOptions,
): Promise<{ items: Coupon[]; total: number }> => {
  const where: Prisma.CouponWhereInput = { isDeleted: false };
  if (typeof options.filters.type === 'string') where.type = options.filters.type as CouponTypeValue;
  if (typeof options.filters.isActive === 'boolean') where.isActive = options.filters.isActive;
  if (options.search) {
    where.OR = [
      { code: { contains: options.search.toUpperCase(), mode: 'insensitive' } },
      { description: { contains: options.search, mode: 'insensitive' } },
    ];
  }
  const [rows, total] = await prisma.$transaction([
    prisma.coupon.findMany({
      where, skip: options.skip, take: options.limit,
      orderBy: { [options.sortBy]: options.sortOrder },
    }),
    prisma.coupon.count({ where }),
  ]);
  return { items: rows.map(toCoupon), total };
};

/**
 * Track a usage inside an existing transaction.
 *
 * The usageCount increment is GUARDED with a raw conditional update
 * (`usage_count < usage_limit`) so two concurrent checkouts can never push a
 * coupon past its limit — Prisma's typed API can't compare two columns, hence
 * the raw statement. Returns false (without writing anything) when the limit
 * was already exhausted; the caller must abort the transaction.
 */
export const trackUsage = async (
  tx: Prisma.TransactionClient,
  args: { couponId: string; userId: string; orderId?: string | null; discount: number },
): Promise<boolean> => {
  const updated = await tx.$executeRaw`
    UPDATE "coupons"
       SET "usageCount" = "usageCount" + 1
     WHERE "id" = ${args.couponId}
       AND ("usageLimit" IS NULL OR "usageCount" < "usageLimit")`;
  if (updated !== 1) return false;

  await tx.couponUsage.create({
    data: {
      couponId: args.couponId,
      userId: args.userId,
      orderId: args.orderId ?? null,
      discount: new Prisma.Decimal(args.discount),
    },
  });
  return true;
};

/**
 * Release a coupon consumed by an order that was cancelled or refunded:
 * removes the usage rows and gives the uses back to the pool. Idempotent —
 * decrements only by however many rows actually existed.
 */
export const releaseUsage = async (
  tx: Prisma.TransactionClient,
  args: { couponId: string; orderId: string },
): Promise<number> => {
  const removed = await tx.couponUsage.deleteMany({
    where: { couponId: args.couponId, orderId: args.orderId },
  });
  if (removed.count > 0) {
    await tx.coupon.update({
      where: { id: args.couponId },
      data: { usageCount: { decrement: removed.count } },
    });
  }
  return removed.count;
};

export const countUsageForUser = async (couponId: string, userId: string): Promise<number> =>
  prisma.couponUsage.count({ where: { couponId, userId } });
