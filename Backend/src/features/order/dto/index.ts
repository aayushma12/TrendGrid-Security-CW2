import { OrderStatusValue, PaymentStatusValue } from '../constants';
import { Order, OrderAddress, OrderItem, OrderStatusHistoryEntry } from '../types';

export interface UpdateOrderStatusDto {
  status: OrderStatusValue;
  note?: string;
}

export interface UpdatePaymentStatusDto {
  paymentStatus: PaymentStatusValue;
}

export interface CancelOrderDto {
  reason?: string;
}

export interface RefundOrderDto {
  /** Amount to refund; defaults to the order grand total. Must be <= grand total. */
  amount?: number;
  /** Return the order's items to variant stock. */
  restock?: boolean;
  note?: string;
}

/**
 * Admin-editable fields. Items/totals/coupon are frozen at placement — editing
 * them would violate the snapshot invariant and coupon-usage accounting.
 */
export interface UpdateOrderDto {
  shippingAddress?: OrderAddress;
  billingAddress?: OrderAddress;
  customerNote?: string | null;
}

export interface OrderItemResponseDto {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantSku: string;
  colorName: string | null;
  sizeName: string | null;
  imageUrl: string | null;
  originalPrice: number;
  unitPrice: number;
  discountAmount: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderStatusHistoryResponseDto {
  id: string;
  status: OrderStatusValue;
  updatedBy: string;
  note: string | null;
  updatedAt: string;
}

export interface OrderResponseDto {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  trackingNumber: string;
  userId: string;
  status: OrderStatusValue;
  paymentStatus: PaymentStatusValue;
  paymentMethod: 'COD';
  paidAt: string | null;

  subtotal: number;
  discountAmount: number;
  couponCode: string | null;
  couponDiscount: number;
  shippingCharge: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;

  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  customerNote: string | null;

  items: OrderItemResponseDto[];
  statusHistory: OrderStatusHistoryResponseDto[];

  estimatedDelivery: string | null;

  placedAt: string;
  confirmedAt: string | null;
  processingAt: string | null;
  packedAt: string | null;
  readyForShipmentAt: string | null;
  shippedAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  returnedAt: string | null;
  returnReason: string | null;
  refundedAt: string | null;
  refundAmount: number | null;
  refundNote: string | null;
  failedAt: string | null;

  isDeleted: boolean;
  deletedAt: string | null;

  createdAt: string;
  updatedAt: string;
}

const toItemDto = (i: OrderItem): OrderItemResponseDto => ({
  id: i.id,
  productId: i.productId,
  variantId: i.variantId,
  productName: i.productName,
  variantSku: i.variantSku,
  colorName: i.colorName ?? null,
  sizeName: i.sizeName ?? null,
  imageUrl: i.imageUrl ?? null,
  originalPrice: i.originalPrice,
  unitPrice: i.unitPrice,
  discountAmount: i.discountAmount,
  quantity: i.quantity,
  lineTotal: i.lineTotal,
});

const toHistoryDto = (h: OrderStatusHistoryEntry): OrderStatusHistoryResponseDto => ({
  id: h.id,
  status: h.status,
  updatedBy: h.updatedBy,
  note: h.note ?? null,
  updatedAt: h.updatedAt.toISOString(),
});

export const toOrderResponseDto = (o: Order): OrderResponseDto => ({
  id: o.id,
  orderNumber: o.orderNumber,
  invoiceNumber: o.invoiceNumber,
  trackingNumber: o.trackingNumber,
  userId: o.userId,
  status: o.status,
  paymentStatus: o.paymentStatus,
  paymentMethod: o.paymentMethod,
  paidAt: o.paidAt?.toISOString() ?? null,

  subtotal: o.subtotal,
  discountAmount: o.discountAmount,
  couponCode: o.couponCode ?? null,
  couponDiscount: o.couponDiscount,
  shippingCharge: o.shippingCharge,
  taxAmount: o.taxAmount,
  grandTotal: o.grandTotal,
  currency: o.currency,

  shippingAddress: o.shippingAddress,
  billingAddress: o.billingAddress,
  customerNote: o.customerNote ?? null,

  items: o.items.map(toItemDto),
  statusHistory: o.statusHistory
    .slice()
    .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
    .map(toHistoryDto),

  estimatedDelivery: o.estimatedDelivery?.toISOString() ?? null,

  placedAt: o.placedAt.toISOString(),
  confirmedAt: o.confirmedAt?.toISOString() ?? null,
  processingAt: o.processingAt?.toISOString() ?? null,
  packedAt: o.packedAt?.toISOString() ?? null,
  readyForShipmentAt: o.readyForShipmentAt?.toISOString() ?? null,
  shippedAt: o.shippedAt?.toISOString() ?? null,
  outForDeliveryAt: o.outForDeliveryAt?.toISOString() ?? null,
  deliveredAt: o.deliveredAt?.toISOString() ?? null,
  cancelledAt: o.cancelledAt?.toISOString() ?? null,
  cancelReason: o.cancelReason ?? null,
  returnedAt: o.returnedAt?.toISOString() ?? null,
  returnReason: o.returnReason ?? null,
  refundedAt: o.refundedAt?.toISOString() ?? null,
  refundAmount: o.refundAmount ?? null,
  refundNote: o.refundNote ?? null,
  failedAt: o.failedAt?.toISOString() ?? null,

  isDeleted: o.isDeleted,
  deletedAt: o.deletedAt?.toISOString() ?? null,

  createdAt: o.createdAt.toISOString(),
  updatedAt: o.updatedAt.toISOString(),
});
