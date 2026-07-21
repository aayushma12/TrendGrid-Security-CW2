import { CheckoutAddress, CheckoutLine, CheckoutSummary } from '../types';

export interface PreviewCheckoutDto {
  couponCode?: string;
}

export interface PlaceOrderDto {
  couponCode?: string;
  /** Defaults to COD (the only live method). */
  paymentMethod?: 'COD';
  shippingAddress: CheckoutAddress;
  billingAddress?: CheckoutAddress;
  customerNote?: string;
}

export interface CheckoutLineResponseDto {
  variantId: string;
  productId: string;
  productName: string;
  productThumbnail: string | null;
  variantSku: string;
  colorName: string | null;
  sizeName: string | null;
  quantity: number;
  originalPrice: number;
  unitPrice: number;
  discountAmount: number;
  lineDiscount: number;
  lineTotal: number;
}

export interface CheckoutSummaryResponseDto {
  items: CheckoutLineResponseDto[];
  subtotal: number;
  discountAmount: number;
  couponCode: string | null;
  couponDiscount: number;
  shippingCharge: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;
}

const toLineDto = (i: CheckoutLine): CheckoutLineResponseDto => ({
  variantId: i.variantId,
  productId: i.productId,
  productName: i.productName,
  productThumbnail: i.productThumbnail ?? null,
  variantSku: i.variantSku,
  colorName: i.colorName ?? null,
  sizeName: i.sizeName ?? null,
  quantity: i.quantity,
  originalPrice: i.originalPrice,
  unitPrice: i.unitPrice,
  discountAmount: i.discountAmount,
  lineDiscount: i.lineDiscount,
  lineTotal: i.lineTotal,
});

export const toCheckoutSummaryResponseDto = (s: CheckoutSummary): CheckoutSummaryResponseDto => ({
  items: s.items.map(toLineDto),
  subtotal: s.subtotal,
  discountAmount: s.discountAmount,
  couponCode: s.couponCode ?? null,
  couponDiscount: s.couponDiscount,
  shippingCharge: s.shippingCharge,
  taxAmount: s.taxAmount,
  grandTotal: s.grandTotal,
  currency: s.currency,
});
