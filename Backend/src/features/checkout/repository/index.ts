/**
 * Checkout repository — every database operation the checkout workflow needs.
 * The service orchestrates; all Prisma access lives here (per workflowtunelling.md:
 * "Database operations only occur through the repository layer").
 */
import { Prisma } from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { round2 } from '../../../utils/money';
import {
  generateOrderNumber,
  generateInvoiceNumber,
  generateTrackingNumber,
} from '../../order/utils/numbering';
import type { CheckoutLine } from '../types';

/**
 * Run `fn` inside a single database transaction. Place-order does several
 * sequential round-trips per line item (guarded stock decrement, order+items
 * create, optional coupon tracking, cart clear) — on a database with
 * meaningful network latency this can approach Prisma's 5000ms default
 * interactive-transaction timeout for even a small cart, surfacing as an
 * intermittent 500 under normal load rather than genuine deadlock/hang.
 * 15s gives real headroom without masking an actually-stuck transaction.
 */
export const runInTx = async <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> =>
  prisma.$transaction(fn, { timeout: 15000, maxWait: 10000 });

/** Generate the order / invoice / tracking numbers for a new order. Independent
 *  queries — run in parallel rather than three sequential round-trips. */
export const nextOrderNumbers = async (
  now: Date,
): Promise<{ orderNumber: string; invoiceNumber: string; trackingNumber: string }> => {
  const [orderNumber, invoiceNumber, trackingNumber] = await Promise.all([
    generateOrderNumber(prisma, now),
    generateInvoiceNumber(prisma, now),
    generateTrackingNumber(prisma),
  ]);
  return { orderNumber, invoiceNumber, trackingNumber };
};

/**
 * Atomically decrement a variant's stock, guarded so it can never go
 * negative. Returns false when stock is insufficient (0 rows matched).
 */
export const decrementStockGuarded = async (
  tx: Prisma.TransactionClient,
  variantId: string,
  quantity: number,
): Promise<boolean> => {
  const res = await tx.productVariant.updateMany({
    where: { id: variantId, stock: { gte: quantity } },
    data: { stock: { decrement: quantity } },
  });
  return res.count === 1;
};

export interface CreateOrderInput {
  orderNumber: string;
  invoiceNumber: string;
  trackingNumber: string;
  userId: string;
  paymentMethod: 'COD' | 'ESEWA';
  estimatedDelivery: Date;
  subtotal: number;
  discountAmount: number;
  couponId: string | null;
  couponCode: string | null;
  couponDiscount: number;
  shippingCharge: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;
  /** Already encrypted by the service (crypto stays an app-layer concern). */
  shippingAddressCiphertext: string;
  billingAddressCiphertext: string;
  customerNote: string | null;
  items: CheckoutLine[];
}

/** Create the Order + OrderItem snapshot rows + initial status-history entry. */
export const createOrderWithItems = async (
  tx: Prisma.TransactionClient,
  input: CreateOrderInput,
): Promise<{ id: string }> =>
  tx.order.create({
    data: {
      orderNumber: input.orderNumber,
      invoiceNumber: input.invoiceNumber,
      trackingNumber: input.trackingNumber,
      userId: input.userId,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentMethod: input.paymentMethod,
      estimatedDelivery: input.estimatedDelivery,
      subtotal: new Prisma.Decimal(input.subtotal),
      discountAmount: new Prisma.Decimal(input.discountAmount),
      couponId: input.couponId,
      couponCode: input.couponCode,
      couponDiscount: new Prisma.Decimal(input.couponDiscount),
      shippingCharge: new Prisma.Decimal(input.shippingCharge),
      taxAmount: new Prisma.Decimal(input.taxAmount),
      grandTotal: new Prisma.Decimal(input.grandTotal),
      currency: input.currency,
      shippingAddress: input.shippingAddressCiphertext,
      billingAddress: input.billingAddressCiphertext,
      customerNote: input.customerNote,
      items: {
        create: input.items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          productName: i.productName,
          variantSku: i.variantSku,
          colorName: i.colorName ?? null,
          sizeName: i.sizeName ?? null,
          imageUrl: i.productThumbnail ?? null,
          originalPrice: new Prisma.Decimal(i.originalPrice),
          unitPrice: new Prisma.Decimal(i.unitPrice),
          discountAmount: new Prisma.Decimal(round2(i.discountAmount * i.quantity)),
          quantity: i.quantity,
          lineTotal: new Prisma.Decimal(i.lineTotal),
        })),
      },
      // Seed the immutable status-history trail with the initial placement event.
      statusHistory: {
        create: { status: 'PENDING', updatedBy: 'SYSTEM', note: 'Order placed' },
      },
    },
    select: { id: true },
  });

/** Empty the user's cart (same tx as order creation so users can't double-order). */
export const clearUserCart = async (
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> => {
  await tx.cartItem.deleteMany({ where: { cart: { userId } } });
};
