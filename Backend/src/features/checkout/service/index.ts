/**
 * Checkout service — the workflow orchestrator.
 *
 * Flow (per spec):
 *   Cart → Product → Inventory → Coupon → Discount → Shipping → Tax → Grand Total
 *
 * All amounts are calculated on the BACKEND from the latest DB values —
 * frontend calculations are never trusted.
 */
import { BadRequestError, NotFoundError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { capDiscount, effectiveUnitPrice, percentageOf, round2 } from '../../../utils/money';
import { encryptJson } from '../../../utils/crypto';

import * as cartRepo from '../../cart/repository';
import { validateCoupon } from '../../coupon/service';
import * as couponRepo from '../../coupon/repository';
import { getEffectiveSettings } from '../../settings/service';
import { ESTIMATED_DELIVERY_DAYS } from '../../order/constants';

import * as checkoutRepo from '../repository';

import {
  CheckoutSummaryResponseDto, PlaceOrderDto, PreviewCheckoutDto, toCheckoutSummaryResponseDto,
} from '../dto';
import { CheckoutLine, CheckoutSummary } from '../types';
import { CHECKOUT_MESSAGES } from '../constants';

// -------- shipping / tax helpers --------
// Rates come from the admin-editable StoreSettings (env values are only the
// first-boot defaults), so pricing changes never require a redeploy.

type CommerceSettings = { taxRate: number; shippingFlatRate: number; freeShippingThreshold: number; currency: string };

const computeShipping = (subtotalAfterDiscount: number, s: CommerceSettings): number => {
  if (subtotalAfterDiscount <= 0) return 0;
  if (subtotalAfterDiscount >= s.freeShippingThreshold) return 0;
  return round2(s.shippingFlatRate);
};

const computeTax = (taxableBase: number, s: CommerceSettings): number =>
  round2(percentageOf(taxableBase, s.taxRate * 100));

// -------- build summary from persistent cart --------

/**
 * Build a full checkout summary from the persistent cart. Applies latest
 * discounts, validates availability, validates coupon (if any), and computes
 * shipping, tax, and grand total.
 */
const buildSummary = async (
  userId: string, couponCode?: string,
): Promise<CheckoutSummary> => {
  const cart = await cartRepo.findByUser(userId);
  if (!cart) throw new NotFoundError(CHECKOUT_MESSAGES.CART_NOT_FOUND);
  if (cart.items.length === 0) throw new BadRequestError(CHECKOUT_MESSAGES.CART_EMPTY);

  const errors: string[] = [];
  const items: CheckoutLine[] = [];
  let subtotal = 0;
  let discountAmount = 0;

  for (const it of cart.items) {
    if (!it.isAvailable) {
      errors.push(`${it.productName} (${it.variantSku}): ${it.unavailableReason}`);
      continue;
    }
    // Sale pricing: charge the discounted price when one is active. This is
    // the same rule the PDP and cart use (utils/money.effectiveUnitPrice),
    // so the price the customer saw is the price they pay.
    const unit = effectiveUnitPrice(it.originalPrice, it.discountedPrice);
    const unitDiscount = round2(it.originalPrice - unit);
    const lineDiscount = round2(unitDiscount * it.quantity);
    const lineTotal = round2(unit * it.quantity);

    items.push({
      variantId: it.variantId,
      productId: it.productId,
      productName: it.productName,
      productThumbnail: it.productThumbnail,
      variantSku: it.variantSku,
      colorName: it.colorName,
      sizeName: it.sizeName,
      quantity: it.quantity,
      originalPrice: it.originalPrice,
      unitPrice: unit,
      discountAmount: unitDiscount,
      lineDiscount,
      lineTotal,
    });

    subtotal = round2(subtotal + lineTotal);
    discountAmount = round2(discountAmount + lineDiscount);
  }

  if (errors.length) {
    throw new BadRequestError(CHECKOUT_MESSAGES.ITEM_NOT_AVAILABLE, errors.map((m) => ({ message: m })));
  }

  // Coupon on the post-line-discount subtotal
  let couponDiscount = 0;
  let couponRef: string | undefined;
  if (couponCode) {
    const evalRes = await validateCoupon(couponCode, subtotal, userId);
    couponDiscount = capDiscount(subtotal, evalRes.discount);
    couponRef = evalRes.coupon.code;
  }

  const settings = await getEffectiveSettings();
  const subtotalAfterCoupon = round2(subtotal - couponDiscount);
  const shippingCharge = computeShipping(subtotalAfterCoupon, settings);
  const taxAmount = computeTax(subtotalAfterCoupon, settings);
  const grandTotal = round2(Math.max(0, subtotalAfterCoupon + shippingCharge + taxAmount));

  return {
    items,
    subtotal,
    discountAmount,
    couponCode: couponRef,
    couponDiscount,
    shippingCharge,
    taxAmount,
    grandTotal,
    currency: settings.currency,
  };
};

// -------- public: preview --------

export const previewCheckout = async (userId: string, dto: PreviewCheckoutDto): Promise<CheckoutSummaryResponseDto> => {
  logger.info(`Checkout preview userId=${userId} coupon=${dto.couponCode ?? 'none'}`);
  const summary = await buildSummary(userId, dto.couponCode);
  return toCheckoutSummaryResponseDto(summary);
};

// -------- public: place order --------

/**
 * Places an order atomically:
 *   1. Recomputes the summary (never trusts frontend numbers)
 *   2. Inside a transaction, decrements each variant's stock via a guarded
 *      updateMany with `stock: { gte: qty }` — if any row fails the whole
 *      transaction rolls back.
 *   3. Creates Order + OrderItem rows with snapshot pricing.
 *   4. Tracks coupon usage.
 *   5. Clears the cart.
 */
export const placeOrder = async (
  userId: string, dto: PlaceOrderDto,
): Promise<{ orderId: string; orderNumber: string; trackingNumber: string; summary: CheckoutSummaryResponseDto }> => {
  logger.info(`Checkout place order userId=${userId} coupon=${dto.couponCode ?? 'none'}`);
  const summary = await buildSummary(userId, dto.couponCode);

  const now = new Date();
  const { orderNumber, invoiceNumber, trackingNumber } = await checkoutRepo.nextOrderNumbers(now);
  const estimatedDelivery = new Date(now);
  estimatedDelivery.setDate(estimatedDelivery.getDate() + ESTIMATED_DELIVERY_DAYS);

  // Look up coupon id (if any) once — validateCoupon inside buildSummary already
  // verified the code, so this is guaranteed to exist when summary.couponCode is set.
  let couponId: string | null = null;
  if (summary.couponCode) {
    const c = await couponRepo.findByCode(summary.couponCode);
    couponId = c?.id ?? null;
  }

  const orderId = await checkoutRepo.runInTx(async (tx) => {
    // Atomic stock decrement per line — guarded so stock can NEVER go
    // negative. A false return means the guard failed and we abort.
    for (const item of summary.items) {
      const decremented = await checkoutRepo.decrementStockGuarded(tx, item.variantId, item.quantity);
      if (!decremented) {
        throw new BadRequestError(
          `${item.productName} (${item.variantSku}): ${CHECKOUT_MESSAGES.INSUFFICIENT_STOCK}`,
        );
      }
    }

    const order = await checkoutRepo.createOrderWithItems(tx, {
      orderNumber,
      invoiceNumber,
      trackingNumber,
      userId,
      paymentMethod: dto.paymentMethod ?? 'COD',
      estimatedDelivery,
      subtotal: summary.subtotal,
      discountAmount: summary.discountAmount,
      couponId,
      couponCode: summary.couponCode ?? null,
      couponDiscount: summary.couponDiscount,
      shippingCharge: summary.shippingCharge,
      taxAmount: summary.taxAmount,
      grandTotal: summary.grandTotal,
      currency: summary.currency,
      shippingAddressCiphertext: encryptJson(dto.shippingAddress),
      billingAddressCiphertext: encryptJson(dto.billingAddress ?? dto.shippingAddress),
      customerNote: dto.customerNote ?? null,
      items: summary.items,
    });

    if (couponId) {
      // Guarded increment — aborts the whole transaction (order + stock)
      // if a concurrent checkout exhausted the coupon's usage limit first.
      const tracked = await couponRepo.trackUsage(tx, {
        couponId,
        userId,
        orderId: order.id,
        discount: summary.couponDiscount,
      });
      if (!tracked) {
        throw new BadRequestError(CHECKOUT_MESSAGES.COUPON_EXHAUSTED);
      }
    }

    // Clear the cart inside the same tx so users can't double-order.
    await checkoutRepo.clearUserCart(tx, userId);

    return order.id;
  });

  logger.info(`Order created id=${orderId} number=${orderNumber} tracking=${trackingNumber} userId=${userId} total=${summary.grandTotal}`);
  return { orderId, orderNumber, trackingNumber, summary: toCheckoutSummaryResponseDto(summary) };
};
