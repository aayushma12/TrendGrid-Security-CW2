import type { OrderStatus } from "@/lib/api/types";

/**
 * Single source of truth for order-status metadata, shared by every
 * component in this kit (badge, timeline, progress bar, filters) so the
 * labels/colors/ordering never drift out of sync with each other.
 */

/** The linear "happy path" — used to render the timeline and progress bar. */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "READY_FOR_SHIPMENT",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

/** Terminal/exception statuses that branch off the happy path. */
export const EXCEPTION_STATUSES: OrderStatus[] = ["CANCELLED", "RETURNED", "REFUNDED", "FAILED"];

export const ALL_STATUSES: OrderStatus[] = [...ORDER_STATUS_FLOW, ...EXCEPTION_STATUSES];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Order Placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  READY_FOR_SHIPMENT: "Ready for Shipment",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

/** Short label used in compact contexts (table cells, pills). */
export const STATUS_SHORT_LABEL: Record<OrderStatus, string> = {
  ...STATUS_LABEL,
  PENDING: "Pending",
};

export type StatusTone = "amber" | "blue" | "purple" | "indigo" | "green" | "red" | "gray";

export const STATUS_TONE: Record<OrderStatus, StatusTone> = {
  PENDING: "amber",
  CONFIRMED: "blue",
  PROCESSING: "blue",
  PACKED: "purple",
  READY_FOR_SHIPMENT: "purple",
  SHIPPED: "indigo",
  OUT_FOR_DELIVERY: "indigo",
  DELIVERED: "green",
  CANCELLED: "red",
  RETURNED: "amber",
  REFUNDED: "gray",
  FAILED: "red",
};

export const TONE_CLASSES: Record<StatusTone, string> = {
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  green: "bg-green-50 text-green-700 border-green-200",
  red: "bg-red-50 text-red-700 border-red-200",
  gray: "bg-gray-100 text-gray-600 border-gray-200",
};

/**
 * Where a given status sits on the happy-path progress bar, 0-based.
 * Exception statuses map to -1 (rendered as a distinct "derailed" state).
 */
export function statusProgressIndex(status: OrderStatus): number {
  return ORDER_STATUS_FLOW.indexOf(status);
}

/**
 * Mirrors NDH.Trendgrid.Api ORDER_TRANSITIONS — used client-side purely to
 * restrict the Status Update Modal's dropdown to valid next steps. The
 * backend is the source of truth and re-validates on every request.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "FAILED"],
  CONFIRMED: ["PROCESSING", "CANCELLED", "FAILED"],
  PROCESSING: ["PACKED", "CANCELLED", "FAILED"],
  PACKED: ["READY_FOR_SHIPMENT", "CANCELLED"],
  READY_FOR_SHIPMENT: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["RETURNED"],
  RETURNED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
  FAILED: [],
};

export function isExceptionStatus(status: OrderStatus): boolean {
  return EXCEPTION_STATUSES.includes(status);
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export function formatMoney(n: number, currency: string): string {
  return `${currency} ${n.toFixed(2)}`;
}
