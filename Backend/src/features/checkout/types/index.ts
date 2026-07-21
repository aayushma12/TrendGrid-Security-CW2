export interface CheckoutLine {
  variantId: string;
  productId: string;
  productName: string;
  productThumbnail?: string;
  variantSku: string;
  colorName?: string;
  sizeName?: string;
  quantity: number;
  originalPrice: number;
  unitPrice: number;      // after discount
  discountAmount: number; // per unit
  lineDiscount: number;   // per line (unit × quantity)
  lineTotal: number;
}

export interface CheckoutAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface CheckoutSummary {
  items: CheckoutLine[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  couponDiscount: number;
  shippingCharge: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;
}
