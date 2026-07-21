import { apiRequest } from "./client";
import type { OrderAddress, OrderDto, OrderStatus, PaymentStatus } from "./types";

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  productId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  /** ISO datetime */
  from?: string;
  /** ISO datetime */
  to?: string;
  sortBy?: "placedAt" | "createdAt" | "grandTotal";
  sortOrder?: "asc" | "desc";
}

export interface UpdateOrderInput {
  shippingAddress?: OrderAddress;
  billingAddress?: OrderAddress;
  customerNote?: string | null;
}

/** Admin-only listing — GET /orders, requires the bearer token (auth defaults to true). */
export async function listOrders(params: ListOrdersParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  if (params.userId) q.set("userId", params.userId);
  if (params.productId) q.set("productId", params.productId);
  if (params.status) q.set("status", params.status);
  if (params.paymentStatus) q.set("paymentStatus", params.paymentStatus);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  q.set("sortBy", params.sortBy ?? "placedAt");
  q.set("sortOrder", params.sortOrder ?? "desc");

  const qs = q.toString();
  return apiRequest<OrderDto[]>(`/orders${qs ? `?${qs}` : ""}`);
}

/** Customer listing — GET /orders/me, always scoped to the signed-in user. */
export async function listMyOrders(params: Omit<ListOrdersParams, "userId"> = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  if (params.paymentStatus) q.set("paymentStatus", params.paymentStatus);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  q.set("sortBy", params.sortBy ?? "placedAt");
  q.set("sortOrder", params.sortOrder ?? "desc");

  const qs = q.toString();
  return apiRequest<OrderDto[]>(`/orders/me${qs ? `?${qs}` : ""}`);
}

/**
 * Single order fetch — GET /orders/:id. Works for both admin and customer:
 * the backend enforces ownership for non-admins and 403s otherwise.
 */
export async function getOrder(id: string) {
  return apiRequest<OrderDto>(`/orders/${id}`);
}

/**
 * Track an order by tracking number (TRK…) or order number (ORD-…) —
 * GET /orders/track/:identifier. Requires sign-in; the backend enforces
 * that non-admins may only track their own orders.
 */
export async function trackOrder(identifier: string) {
  return apiRequest<OrderDto>(`/orders/track/${encodeURIComponent(identifier)}`);
}

export async function updateOrder(id: string, input: UpdateOrderInput) {
  return apiRequest<OrderDto>(`/orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

/** PATCH /orders/:id/status — body is { status, note } per the tracking-system spec. */
export async function updateOrderStatus(id: string, status: OrderStatus, note?: string) {
  return apiRequest<OrderDto>(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(note ? { status, note } : { status }),
  });
}

export async function updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
  return apiRequest<OrderDto>(`/orders/${id}/payment`, {
    method: "PATCH",
    body: JSON.stringify({ paymentStatus }),
  });
}

/** Admin-only: refund a RETURNED order — PATCH /orders/:id/refund. */
export async function refundOrder(id: string, note?: string) {
  return apiRequest<OrderDto>(`/orders/${id}/refund`, {
    method: "PATCH",
    body: JSON.stringify(note ? { note } : {}),
  });
}

/** Customer/admin cancel — POST /orders/:id/cancel. Only allowed before shipment. */
export async function cancelOrder(id: string, reason?: string) {
  return apiRequest<OrderDto>(`/orders/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify(reason ? { reason } : {}),
  });
}

export async function deleteOrder(id: string) {
  await apiRequest<null>(`/orders/${id}`, { method: "DELETE" });
}

export async function restoreOrder(id: string) {
  return apiRequest<OrderDto>(`/orders/${id}/restore`, { method: "POST" });
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  todayOrders: number;
  bestSellers: { productId: string; productName: string; imageUrl: string | null; quantitySold: number; revenue: number }[];
}

/** Admin-only dashboard aggregate — GET /orders/stats. */
export async function getOrderStats() {
  return apiRequest<OrderStats>("/orders/stats");
}
