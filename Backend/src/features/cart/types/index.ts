export interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  productId: string;
  productName: string;
  productThumbnail?: string;
  variantSku: string;
  colorName?: string;
  sizeName?: string;
  originalPrice: number;
  /** Variant's currently-active sale price, when one exists. */
  discountedPrice?: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  stock: number;
  isAvailable: boolean;
  unavailableReason?: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  itemCount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}
