/**
 * Full order lifecycle. Order matters only for documentation — the actual
 * allowed flow is enforced by ORDER_TRANSITIONS below.
 *   PENDING → CONFIRMED → PROCESSING → PACKED → READY_FOR_SHIPMENT →
 *   SHIPPED → OUT_FOR_DELIVERY → DELIVERED → (RETURNED → REFUNDED)
 * CANCELLED and FAILED are terminal states reachable only from early stages.
 */
export const ORDER_STATUSES = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'READY_FOR_SHIPMENT',
  'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED',
  'REFUNDED', 'FAILED',
] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] as const;
export type PaymentStatusValue = (typeof PAYMENT_STATUSES)[number];

/**
 * State machine: allowed forward transitions.
 *   • DELIVERED never moves backward — only forward to RETURNED.
 *   • CANCELLED can never become DELIVERED (CANCELLED has no outgoing edges).
 *   • RETURNED is only reachable from DELIVERED.
 *   • REFUNDED is only reachable from RETURNED.
 *   • FAILED is reachable only from the pre-fulfilment stages.
 */
export const ORDER_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED', 'FAILED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED', 'FAILED'],
  PROCESSING: ['PACKED', 'CANCELLED', 'FAILED'],
  PACKED: ['READY_FOR_SHIPMENT', 'CANCELLED'],
  READY_FOR_SHIPMENT: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['RETURNED'],
  RETURNED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
  FAILED: [],
};

/** Cancellation allowed only before the order ships. */
export const CANCELLABLE_FROM: OrderStatusValue[] = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'READY_FOR_SHIPMENT',
];

/** Reviews are only permitted for orders in DELIVERED state. */
export const REVIEW_ELIGIBLE_STATUSES: OrderStatusValue[] = ['DELIVERED'];

/** Statuses whose entry auto-stamps a timestamp field on the order row. */
export const STATUS_TIMESTAMP_FIELD: Partial<Record<OrderStatusValue, string>> = {
  CONFIRMED: 'confirmedAt',
  PROCESSING: 'processingAt',
  PACKED: 'packedAt',
  READY_FOR_SHIPMENT: 'readyForShipmentAt',
  SHIPPED: 'shippedAt',
  OUT_FOR_DELIVERY: 'outForDeliveryAt',
  DELIVERED: 'deliveredAt',
  RETURNED: 'returnedAt',
  FAILED: 'failedAt',
};

/** Business days added to placedAt to auto-calculate estimatedDelivery when not provided. */
export const ESTIMATED_DELIVERY_DAYS = 5;

export const ORDER_SORT_FIELDS = ['placedAt', 'createdAt', 'grandTotal'] as const;
export const ORDER_FILTER_FIELDS = ['userId', 'status', 'paymentStatus', 'productId'] as const;

export const ORDER_MESSAGES = {
  RETRIEVED: 'Order retrieved successfully.',
  LISTED: 'Orders retrieved successfully.',
  UPDATED: 'Order updated successfully.',
  STATUS_UPDATED: 'Order status updated successfully.',
  PAYMENT_UPDATED: 'Order payment status updated successfully.',
  CANCELLED: 'Order cancelled successfully.',
  REFUNDED: 'Order refunded successfully.',
  DELETED: 'Order deleted successfully.',
  RESTORED: 'Order restored successfully.',
  TRACKED: 'Order tracking information retrieved successfully.',

  NOT_FOUND: 'Order not found.',
  TRACKING_NOT_FOUND: 'No order found for that tracking number or order number.',
  INVALID_TRANSITION: 'Invalid order status transition.',
  NOT_CANCELLABLE: 'This order cannot be cancelled after shipment.',
  CANCEL_AFTER_SHIPPED: 'Cancelled only allowed before shipment.',
  RETURN_BEFORE_DELIVERED: 'Return only allowed after delivered.',
  REFUND_BEFORE_RETURNED: 'Refund only allowed after returned.',
  REFUND_AMOUNT_INVALID: 'Refund amount must be positive and cannot exceed the order total.',
  NO_UPDATABLE_FIELDS: 'No editable fields provided.',
  ADDRESS_LOCKED_AFTER_SHIPPED: 'Shipping address cannot be edited after the order has shipped.',
} as const;
