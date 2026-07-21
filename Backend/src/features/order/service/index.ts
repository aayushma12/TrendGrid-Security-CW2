/**
 * Order service — state machine + payment + inventory restoration.
 *
 * Enforced rules:
 *   • Status transitions must follow ORDER_TRANSITIONS (no skipping)
 *   • Cancellation only allowed before shipment
 *   • Returns only from DELIVERED; Refunds only from RETURNED
 *   • Cancelling an already-decremented order restores stock atomically
 *   • Every transition appends an immutable OrderStatusHistory row —
 *     history is never overwritten, only appended to.
 */
import { PaginationMeta, QueryOptions } from '../../../types';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../utils/errors';
import { buildPaginationMeta } from '../../../utils/queryOptions';
import { logger } from '../../../utils/logger';
import { encryptJson } from '../../../utils/crypto';

import * as orderRepo from '../repository';
import * as couponRepo from '../../coupon/repository';
import {
  CancelOrderDto, OrderResponseDto, RefundOrderDto, UpdateOrderDto, UpdateOrderStatusDto,
  UpdatePaymentStatusDto, toOrderResponseDto,
} from '../dto';
import {
  CANCELLABLE_FROM,
  ESTIMATED_DELIVERY_DAYS,
  ORDER_MESSAGES,
  ORDER_TRANSITIONS,
  OrderStatusValue,
  PaymentStatusValue,
  STATUS_TIMESTAMP_FIELD,
} from '../constants';
import { Order } from '../types';

export type ReqUser = { id: string; role: string };

const SYSTEM_ACTOR = 'SYSTEM';

// -------- helpers --------

const requireOrder = async (id: string, includeDeleted = false, reqUser?: ReqUser): Promise<Order> => {
  const o = await orderRepo.findById(id);
  if (!o || (o.isDeleted && !includeDeleted)) throw new NotFoundError(ORDER_MESSAGES.NOT_FOUND);

  if (reqUser && reqUser.role !== 'ADMIN' && o.userId !== reqUser.id) {
    throw new ForbiddenError('You can only access your own orders.');
  }
  return o;
};

/** Statuses after which shipping-address changes are refused. */
const ADDRESS_LOCKED_STATUSES = new Set([
  'READY_FOR_SHIPMENT', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED', 'REFUNDED',
]);

const assertTransition = (from: OrderStatusValue, to: OrderStatusValue): void => {
  if (from === to) {
    throw new BadRequestError(ORDER_MESSAGES.INVALID_TRANSITION);
  }
  const allowed = ORDER_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new BadRequestError(
      `${ORDER_MESSAGES.INVALID_TRANSITION} Cannot move from ${from} to ${to}.`,
    );
  }
};

/** Business-day-naive estimate: placedAt + ESTIMATED_DELIVERY_DAYS calendar days. */
const computeEstimatedDelivery = (placedAt: Date): Date => {
  const d = new Date(placedAt);
  d.setDate(d.getDate() + ESTIMATED_DELIVERY_DAYS);
  return d;
};

// -------- CRUD reads --------

export const getOrderById = async (id: string, reqUser?: ReqUser): Promise<OrderResponseDto> => {
  const o = await requireOrder(id, false, reqUser);
  logger.info(`Order viewed id=${id} by=${reqUser?.id ?? 'unknown'} role=${reqUser?.role ?? 'unknown'}`);
  return toOrderResponseDto(o);
};

export const getOrders = async (
  options: QueryOptions & { from?: Date; to?: Date },
): Promise<{ items: OrderResponseDto[]; meta: PaginationMeta }> => {
  const { items, total } = await orderRepo.findMany(options);
  return {
    items: items.map(toOrderResponseDto),
    meta: buildPaginationMeta(total, options.page, options.limit),
  };
};

// -------- Status transitions --------

/**
 * Generic status transition — handles the linear happy path (CONFIRMED
 * through DELIVERED, plus RETURNED). CANCELLED and REFUNDED are routed to
 * their own dedicated functions below (they need extra side effects: stock
 * restoration for cancel, RETURNED-only guard for refund).
 */
export const updateOrderStatus = async (
  id: string, dto: UpdateOrderStatusDto, reqUser?: ReqUser,
): Promise<OrderResponseDto> => {
  const order = await requireOrder(id, false, reqUser);
  assertTransition(order.status, dto.status);

  if (dto.status === 'CANCELLED') {
    return cancelOrder(id, { reason: dto.note }, reqUser);
  }
  if (dto.status === 'REFUNDED') {
    return refundOrder(id, { note: dto.note }, reqUser);
  }

  const field = STATUS_TIMESTAMP_FIELD[dto.status];
  const patch: Record<string, unknown> = { status: dto.status };
  if (field) patch[field] = new Date();
  if (dto.status === 'RETURNED') patch.returnReason = dto.note ?? null;

  // Auto-calculate estimated delivery the first time the order is confirmed,
  // unless it was already set explicitly.
  if (dto.status === 'CONFIRMED' && !order.estimatedDelivery) {
    patch.estimatedDelivery = computeEstimatedDelivery(order.placedAt);
  }

  // COD settlement: cash is collected at the doorstep, so delivery IS the
  // payment event. Mark the order PAID automatically and record it in the
  // audit trail — no more honor-system toggles for the happy path.
  let historyNote = dto.note;
  if (
    dto.status === 'DELIVERED'
    && order.paymentMethod === 'COD'
    && order.paymentStatus === 'PENDING'
  ) {
    patch.paymentStatus = 'PAID';
    patch.paidAt = new Date();
    historyNote = [dto.note, 'COD payment collected on delivery'].filter(Boolean).join(' · ');
  }

  const updated = await orderRepo.updateWithHistory(id, patch, {
    status: dto.status,
    updatedBy: reqUser?.id ?? SYSTEM_ACTOR,
    note: historyNote,
  });
  if (!updated) throw new NotFoundError(ORDER_MESSAGES.NOT_FOUND);
  logger.info(`Order status updated id=${id} ${order.status}→${dto.status} by=${reqUser?.id ?? SYSTEM_ACTOR}`);
  return toOrderResponseDto(updated);
};

export const cancelOrder = async (id: string, dto: CancelOrderDto, reqUser?: ReqUser): Promise<OrderResponseDto> => {
  const order = await requireOrder(id, false, reqUser);
  if (!CANCELLABLE_FROM.includes(order.status)) {
    throw new BadRequestError(ORDER_MESSAGES.CANCEL_AFTER_SHIPPED);
  }
  const updated = await orderRepo.runInTx(async (tx) => {
    await orderRepo.restoreStockForOrder(tx, id);
    // Give any consumed coupon back to the customer — a cancelled order
    // should never permanently burn a usage.
    if (order.couponId) {
      await couponRepo.releaseUsage(tx, { couponId: order.couponId, orderId: id });
    }
    return orderRepo.updateInTx(
      tx, id,
      { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: dto.reason ?? null },
      { status: 'CANCELLED', updatedBy: reqUser?.id ?? SYSTEM_ACTOR, note: dto.reason },
    );
  });
  logger.info(`Order cancelled id=${id} previous=${order.status} restoredItems=${order.items.length} couponReleased=${Boolean(order.couponId)} by=${reqUser?.id ?? SYSTEM_ACTOR}`);
  return toOrderResponseDto(updated);
};

/**
 * Admin-only: refund a RETURNED order. No other source status is allowed.
 *
 * Records the actual refunded amount (defaults to the full grand total,
 * capped there for partial refunds), optionally restocks the returned items,
 * and releases any consumed coupon usage — all atomically.
 */
export const refundOrder = async (id: string, dto: RefundOrderDto, reqUser?: ReqUser): Promise<OrderResponseDto> => {
  const order = await requireOrder(id, false, reqUser);
  assertTransition(order.status, 'REFUNDED');
  if (order.status !== 'RETURNED') {
    throw new BadRequestError(ORDER_MESSAGES.REFUND_BEFORE_RETURNED);
  }

  const refundAmount = dto.amount ?? order.grandTotal;
  if (refundAmount <= 0 || refundAmount > order.grandTotal) {
    throw new BadRequestError(ORDER_MESSAGES.REFUND_AMOUNT_INVALID);
  }
  const isPartial = refundAmount < order.grandTotal;

  const updated = await orderRepo.runInTx(async (tx) => {
    if (dto.restock) {
      await orderRepo.restoreStockForOrder(tx, id);
    }
    if (order.couponId) {
      await couponRepo.releaseUsage(tx, { couponId: order.couponId, orderId: id });
    }
    return orderRepo.updateInTx(
      tx, id,
      {
        status: 'REFUNDED',
        refundedAt: new Date(),
        paymentStatus: 'REFUNDED',
        refundAmount,
        refundNote: dto.note ?? null,
      },
      {
        status: 'REFUNDED',
        updatedBy: reqUser?.id ?? SYSTEM_ACTOR,
        note: [
          `Refunded ${order.currency} ${refundAmount.toFixed(2)}${isPartial ? ' (partial)' : ''}`,
          dto.restock ? 'items restocked' : null,
          dto.note ?? null,
        ].filter(Boolean).join(' · '),
      },
    );
  });
  logger.info(`Order refund processed id=${id} amount=${refundAmount} partial=${isPartial} restock=${Boolean(dto.restock)} by=${reqUser?.id ?? SYSTEM_ACTOR}`);
  return toOrderResponseDto(updated);
};

/**
 * Public tracking lookup. Accepts either a tracking number (TRK…) or an
 * order number (ORD-…) — tries tracking number first since it's the more
 * specific/likely identifier from a "Track my order" form.
 */
export const trackOrder = async (identifier: string, reqUser?: ReqUser): Promise<OrderResponseDto> => {
  const trimmed = identifier.trim();
  const order = (await orderRepo.findByTrackingNumber(trimmed)) ?? (await orderRepo.findByOrderNumber(trimmed));
  if (!order || order.isDeleted) throw new NotFoundError(ORDER_MESSAGES.TRACKING_NOT_FOUND);

  if (reqUser && reqUser.role !== 'ADMIN' && order.userId !== reqUser.id) {
    throw new ForbiddenError('You can only track your own orders.');
  }
  logger.info(`Order tracked identifier=${trimmed} orderId=${order.id} by=${reqUser?.id ?? 'unknown'}`);
  return toOrderResponseDto(order);
};

export const updatePaymentStatus = async (
  id: string, dto: UpdatePaymentStatusDto, reqUser?: ReqUser,
): Promise<OrderResponseDto> => {
  const order = await requireOrder(id);

  // Basic safety: don't allow going backwards from a terminal state.
  if (order.paymentStatus === 'REFUNDED' && dto.paymentStatus !== 'REFUNDED') {
    throw new BadRequestError(ORDER_MESSAGES.INVALID_TRANSITION);
  }

  // Manual payment overrides are audited: the change lands in the immutable
  // status history so there is a trail of WHO marked an order paid, and when.
  const updated = await orderRepo.updateWithHistory(
    id,
    {
      paymentStatus: dto.paymentStatus as PaymentStatusValue,
      ...(dto.paymentStatus === 'PAID' && !order.paidAt ? { paidAt: new Date() } : {}),
    },
    {
      status: order.status,
      updatedBy: reqUser?.id ?? SYSTEM_ACTOR,
      note: `Payment status changed ${order.paymentStatus} → ${dto.paymentStatus} (manual)`,
    },
  );
  if (!updated) throw new NotFoundError(ORDER_MESSAGES.NOT_FOUND);
  logger.info(`Order payment updated id=${id} ${order.paymentStatus}→${dto.paymentStatus} by=${reqUser?.id ?? SYSTEM_ACTOR}`);
  return toOrderResponseDto(updated);
};

/**
 * Admin update — only shipping/billing address and customer note.
 * Items, totals, coupon and status are locked (they have dedicated endpoints
 * or are immutable snapshots).
 */
export const updateOrder = async (id: string, dto: UpdateOrderDto): Promise<OrderResponseDto> => {
  const order = await requireOrder(id);

  if (dto.shippingAddress && ADDRESS_LOCKED_STATUSES.has(order.status)) {
    throw new BadRequestError(ORDER_MESSAGES.ADDRESS_LOCKED_AFTER_SHIPPED);
  }

  const updated = await orderRepo.updateFields(id, {
    ...(dto.shippingAddress ? { shippingAddress: encryptJson(dto.shippingAddress) } : {}),
    ...(dto.billingAddress ? { billingAddress: encryptJson(dto.billingAddress) } : {}),
    customerNote: dto.customerNote,
  });
  if (!updated) throw new NotFoundError(ORDER_MESSAGES.NOT_FOUND);
  logger.info(`Order updated id=${id}`);
  return toOrderResponseDto(updated);
};

/**
 * Soft-delete an order. The row is preserved for accounting; it's hidden
 * from default listings and returned as 404 from GET /orders/:id.
 * Restore via POST /orders/:id/restore.
 */
export const deleteOrder = async (id: string): Promise<void> => {
  await requireOrder(id);
  const removed = await orderRepo.softDelete(id);
  if (!removed) throw new NotFoundError(ORDER_MESSAGES.NOT_FOUND);
  logger.info(`Order soft-deleted id=${id}`);
};

/** Restore a soft-deleted order. */
export const restoreOrder = async (id: string): Promise<OrderResponseDto> => {
  const order = await requireOrder(id, true);
  if (!order.isDeleted) return toOrderResponseDto(order);
  const restored = await orderRepo.restore(id);
  if (!restored) throw new NotFoundError(ORDER_MESSAGES.NOT_FOUND);
  const refreshed = await requireOrder(id);
  logger.info(`Order restored id=${id}`);
  return toOrderResponseDto(refreshed);
};

// -------- Review-eligibility helper (used by review service) --------

/**
 * Single indexed COUNT — the review service uses this to gate submissions
 * to customers whose delivered orders contain the product.
 */
export const hasDeliveredOrderForProduct = async (
  userId: string, productId: string,
): Promise<boolean> => orderRepo.existsDeliveredWithProduct(userId, productId);
