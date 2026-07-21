import { OrderStatusValue, PaymentStatusValue } from '../constants';

export interface OrderAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantSku: string;
  colorName?: string;
  sizeName?: string;
  imageUrl?: string;
  originalPrice: number;
  unitPrice: number;
  discountAmount: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  status: OrderStatusValue;
  updatedBy: string;
  note?: string;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  trackingNumber: string;
  userId: string;
  status: OrderStatusValue;
  paymentStatus: PaymentStatusValue;
  paymentMethod: 'COD';
  paidAt?: Date;

  subtotal: number;
  discountAmount: number;
  couponId?: string;
  couponCode?: string;
  couponDiscount: number;
  shippingCharge: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;

  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  customerNote?: string;

  items: OrderItem[];
  statusHistory: OrderStatusHistoryEntry[];

  estimatedDelivery?: Date;

  placedAt: Date;
  confirmedAt?: Date;
  processingAt?: Date;
  packedAt?: Date;
  readyForShipmentAt?: Date;
  shippedAt?: Date;
  outForDeliveryAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  returnedAt?: Date;
  returnReason?: string;
  refundedAt?: Date;
  refundAmount?: number;
  refundNote?: string;
  failedAt?: Date;

  isDeleted: boolean;
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
