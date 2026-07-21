import { Prisma } from '@prisma/client';

import { prisma } from '../../../config/prisma';
import type { QueryOptions } from '../../../types';
import { decryptJson } from '../../../utils/crypto';
import type { Order, OrderAddress, OrderItem, OrderStatusHistoryEntry } from '../types';
import type { OrderStatusValue, PaymentStatusValue } from '../constants';

const ORDER_INCLUDE = {
  items: { orderBy: { createdAt: 'asc' } },
  statusHistory: { orderBy: { updatedAt: 'asc' } },
} satisfies Prisma.OrderInclude;

type PrismaOrderWithIncludes = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

const decimalToNumber = (v: Prisma.Decimal | null | undefined): number =>
  v === null || v === undefined ? 0 : Number(v);

const toItem = (r: PrismaOrderWithIncludes['items'][number]): OrderItem => ({
  id: r.id,
  productId: r.productId,
  variantId: r.variantId,
  productName: r.productName,
  variantSku: r.variantSku,
  colorName: r.colorName ?? undefined,
  sizeName: r.sizeName ?? undefined,
  imageUrl: r.imageUrl ?? undefined,
  originalPrice: Number(r.originalPrice),
  unitPrice: Number(r.unitPrice),
  discountAmount: Number(r.discountAmount),
  quantity: r.quantity,
  lineTotal: Number(r.lineTotal),
});

const toHistoryEntry = (r: PrismaOrderWithIncludes['statusHistory'][number]): OrderStatusHistoryEntry => ({
  id: r.id,
  orderId: r.orderId,
  status: r.status as OrderStatusValue,
  updatedBy: r.updatedBy,
  note: r.note ?? undefined,
  updatedAt: r.updatedAt,
});

const toOrder = (r: PrismaOrderWithIncludes): Order => ({
  id: r.id,
  orderNumber: r.orderNumber,
  invoiceNumber: r.invoiceNumber,
  trackingNumber: r.trackingNumber,
  userId: r.userId,
  status: r.status as OrderStatusValue,
  paymentStatus: r.paymentStatus as PaymentStatusValue,
  paymentMethod: r.paymentMethod as 'COD' | 'ESEWA',
  paidAt: r.paidAt ?? undefined,

  subtotal: Number(r.subtotal),
  discountAmount: Number(r.discountAmount),
  couponId: r.couponId ?? undefined,
  couponCode: r.couponCode ?? undefined,
  couponDiscount: decimalToNumber(r.couponDiscount),
  shippingCharge: decimalToNumber(r.shippingCharge),
  taxAmount: decimalToNumber(r.taxAmount),
  grandTotal: Number(r.grandTotal),
  currency: r.currency,

  shippingAddress: decryptJson<OrderAddress>(r.shippingAddress),
  billingAddress: decryptJson<OrderAddress>(r.billingAddress),
  customerNote: r.customerNote ?? undefined,

  items: r.items.map(toItem),
  statusHistory: r.statusHistory.map(toHistoryEntry),

  estimatedDelivery: r.estimatedDelivery ?? undefined,

  placedAt: r.placedAt,
  confirmedAt: r.confirmedAt ?? undefined,
  processingAt: r.processingAt ?? undefined,
  packedAt: r.packedAt ?? undefined,
  readyForShipmentAt: r.readyForShipmentAt ?? undefined,
  shippedAt: r.shippedAt ?? undefined,
  outForDeliveryAt: r.outForDeliveryAt ?? undefined,
  deliveredAt: r.deliveredAt ?? undefined,
  cancelledAt: r.cancelledAt ?? undefined,
  cancelReason: r.cancelReason ?? undefined,
  returnedAt: r.returnedAt ?? undefined,
  returnReason: r.returnReason ?? undefined,
  refundedAt: r.refundedAt ?? undefined,
  refundAmount: r.refundAmount != null ? Number(r.refundAmount) : undefined,
  refundNote: r.refundNote ?? undefined,
  failedAt: r.failedAt ?? undefined,

  isDeleted: r.isDeleted,
  deletedAt: r.deletedAt ?? undefined,

  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

export const findById = async (id: string): Promise<Order | null> => {
  const r = await prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
  return r ? toOrder(r) : null;
};

export const findByOrderNumber = async (orderNumber: string): Promise<Order | null> => {
  const r = await prisma.order.findUnique({ where: { orderNumber }, include: ORDER_INCLUDE });
  return r ? toOrder(r) : null;
};

export const findByTrackingNumber = async (trackingNumber: string): Promise<Order | null> => {
  const r = await prisma.order.findUnique({ where: { trackingNumber }, include: ORDER_INCLUDE });
  return r ? toOrder(r) : null;
};

export const updateFields = async (
  id: string,
  patch: Partial<Prisma.OrderUpdateInput>,
): Promise<Order | null> => {
  try {
    const r = await prisma.order.update({
      where: { id }, data: patch, include: ORDER_INCLUDE,
    });
    return toOrder(r);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return null;
    throw err;
  }
};

/**
 * Update order fields AND append an immutable status-history row in a single
 * atomic write (Prisma nested create — no separate transaction needed).
 */
export const updateWithHistory = async (
  id: string,
  patch: Partial<Prisma.OrderUpdateInput>,
  history: { status: OrderStatusValue; updatedBy: string; note?: string },
): Promise<Order | null> => {
  try {
    const r = await prisma.order.update({
      where: { id },
      data: {
        ...patch,
        statusHistory: {
          create: {
            status: history.status,
            updatedBy: history.updatedBy,
            note: history.note ?? null,
          },
        },
      },
      include: ORDER_INCLUDE,
    });
    return toOrder(r);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return null;
    throw err;
  }
};

export const findMany = async (
  options: QueryOptions & { from?: Date; to?: Date; includeDeleted?: boolean },
): Promise<{ items: Order[]; total: number }> => {
  const where: Prisma.OrderWhereInput = {};
  if (!options.includeDeleted) where.isDeleted = false;
  if (typeof options.filters.userId === 'string') where.userId = options.filters.userId;
  if (typeof options.filters.status === 'string') where.status = options.filters.status as OrderStatusValue;
  if (typeof options.filters.paymentStatus === 'string')
    where.paymentStatus = options.filters.paymentStatus as PaymentStatusValue;
  if (typeof options.filters.productId === 'string') {
    where.items = { some: { productId: options.filters.productId } };
  }
  if (options.from || options.to) {
    where.placedAt = {
      gte: options.from,
      lte: options.to,
    };
  }
  if (options.search) {
    where.OR = [
      { orderNumber: { contains: options.search, mode: 'insensitive' } },
      { invoiceNumber: { contains: options.search, mode: 'insensitive' } },
      { trackingNumber: { contains: options.search, mode: 'insensitive' } },
      { user: { firstName: { contains: options.search, mode: 'insensitive' } } },
      { user: { lastName: { contains: options.search, mode: 'insensitive' } } },
      { user: { email: { contains: options.search, mode: 'insensitive' } } },
    ];
  }

  const [rows, total] = await prisma.$transaction([
    prisma.order.findMany({
      where, skip: options.skip, take: options.limit,
      orderBy: { [options.sortBy]: options.sortOrder },
      include: ORDER_INCLUDE,
    }),
    prisma.order.count({ where }),
  ]);
  return { items: rows.map(toOrder), total };
};

/** Soft-delete an order. Historical rows are preserved for accounting. */
export const softDelete = async (id: string): Promise<boolean> => {
  const r = await prisma.order.updateMany({
    where: { id, isDeleted: false },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  return r.count === 1;
};

/** Restore a soft-deleted order. */
export const restore = async (id: string): Promise<boolean> => {
  const r = await prisma.order.updateMany({
    where: { id, isDeleted: true },
    data: { isDeleted: false, deletedAt: null },
  });
  return r.count === 1;
};

/**
 * Existence check: does the user have any DELIVERED order that contains
 * this product? Used by the review service to gate eligibility.
 * Runs a single indexed COUNT — much cheaper than fetching orders.
 */
export const existsDeliveredWithProduct = async (
  userId: string,
  productId: string,
): Promise<boolean> => {
  const count = await prisma.order.count({
    where: {
      userId,
      status: 'DELIVERED',
      items: { some: { productId } },
    },
  });
  return count > 0;
};

/** Update an order inside an active transaction (used by cancelOrder), optionally appending status history. */
export const updateInTx = async (
  tx: Prisma.TransactionClient,
  id: string,
  patch: Prisma.OrderUpdateInput,
  history?: { status: OrderStatusValue; updatedBy: string; note?: string },
): Promise<Order> => {
  const r = await tx.order.update({
    where: { id },
    data: history
      ? {
          ...patch,
          statusHistory: {
            create: { status: history.status, updatedBy: history.updatedBy, note: history.note ?? null },
          },
        }
      : patch,
    include: ORDER_INCLUDE,
  });
  return toOrder(r);
};

/** Restore stock for every line of an order (used on cancel). */
export const restoreStockForOrder = async (
  tx: Prisma.TransactionClient, orderId: string,
): Promise<void> => {
  const items = await tx.orderItem.findMany({
    where: { orderId }, select: { variantId: true, quantity: true },
  });
  for (const it of items) {
    await tx.productVariant.update({
      where: { id: it.variantId }, data: { stock: { increment: it.quantity } },
    });
  }
};

export const runInTx = async <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> =>
  prisma.$transaction(fn);

export interface OrderStatsRaw {
  totalOrders: number;
  statusCounts: { status: string; count: number }[];
  totalRevenue: number;
  monthlyRevenue: number;
  todayOrders: number;
  bestSellers: { productId: string; productName: string; imageUrl: string | null; quantitySold: number; revenue: number }[];
}

/** Dashboard aggregate — one round trip per metric, run in parallel. */
export const getStats = async (): Promise<OrderStatsRaw> => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalOrders, statusGroups, revenueAgg, monthlyRevenueAgg, todayOrders, bestSellerGroups] = await Promise.all([
    prisma.order.count({ where: { isDeleted: false } }),
    prisma.order.groupBy({ by: ['status'], where: { isDeleted: false }, _count: { _all: true } }),
    prisma.order.aggregate({ where: { isDeleted: false, paymentStatus: 'PAID' }, _sum: { grandTotal: true } }),
    prisma.order.aggregate({
      where: { isDeleted: false, paymentStatus: 'PAID', placedAt: { gte: startOfMonth } },
      _sum: { grandTotal: true },
    }),
    prisma.order.count({ where: { isDeleted: false, placedAt: { gte: startOfToday } } }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { isDeleted: false, status: { not: 'CANCELLED' } } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  const productIds = bestSellerGroups.map((g) => g.productId);
  const products = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, imageUrl: true } })
    : [];
  const productById = new Map(products.map((p) => [p.id, p]));

  return {
    totalOrders,
    statusCounts: statusGroups.map((g) => ({ status: g.status, count: g._count._all })),
    totalRevenue: decimalToNumber(revenueAgg._sum.grandTotal),
    monthlyRevenue: decimalToNumber(monthlyRevenueAgg._sum.grandTotal),
    todayOrders,
    bestSellers: bestSellerGroups.map((g) => ({
      productId: g.productId,
      productName: productById.get(g.productId)?.name ?? '(deleted product)',
      imageUrl: productById.get(g.productId)?.imageUrl ?? null,
      quantitySold: g._sum.quantity ?? 0,
      revenue: decimalToNumber(g._sum.lineTotal),
    })),
  };
};
