import { apiRequest } from "./client";
import type { CheckoutSummaryDto, OrderAddress } from "./types";

export interface PlaceOrderInput {
  couponCode?: string;
  /** COD is the only supported method today. */
  paymentMethod?: "COD";
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  customerNote?: string;
}

export interface PlaceOrderResult {
  orderId: string;
  orderNumber: string;
  trackingNumber: string;
  summary: CheckoutSummaryDto;
}

/** Priced summary of the current cart — used to show totals before placing the order. */
export async function previewCheckout(couponCode?: string) {
  return apiRequest<CheckoutSummaryDto>("/checkout/preview", {
    method: "POST",
    body: JSON.stringify(couponCode ? { couponCode } : {}),
  });
}

/** Places the order from the current cart; the cart is cleared server-side on success. */
export async function placeOrder(input: PlaceOrderInput) {
  return apiRequest<PlaceOrderResult>("/checkout/place-order", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
