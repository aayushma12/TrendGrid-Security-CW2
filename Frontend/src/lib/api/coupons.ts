import { apiRequest } from "./client";
import type { CouponDto, CouponType } from "./types";

export interface ListCouponsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: CouponType;
  isActive?: boolean;
  sortBy?: "createdAt" | "updatedAt" | "startDate" | "endDate" | "code";
  sortOrder?: "asc" | "desc";
}

/** Fields accepted by createCouponSchema — undefined keys are simply omitted. */
export interface CreateCouponInput {
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  minimumPurchase?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  /** ISO datetime string, e.g. new Date().toISOString() */
  startDate: string;
  /** ISO datetime string */
  endDate: string;
  isActive?: boolean;
}

/**
 * Fields accepted by updateCouponSchema. Unlike create, the nullable numeric
 * fields are nullable here — passing `null` explicitly clears the field on
 * the server, while omitting a key (undefined) leaves it unchanged.
 */
export interface UpdateCouponInput {
  code?: string;
  description?: string | null;
  type?: CouponType;
  value?: number;
  minimumPurchase?: number | null;
  maximumDiscount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export async function listCoupons(params: ListCouponsParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  if (params.type) q.set("type", params.type);
  if (params.isActive !== undefined) q.set("isActive", String(params.isActive));
  q.set("sortBy", params.sortBy ?? "createdAt");
  q.set("sortOrder", params.sortOrder ?? "desc");

  const qs = q.toString();
  return apiRequest<CouponDto[]>(`/coupons${qs ? `?${qs}` : ""}`);
}

export async function getCoupon(id: string) {
  return apiRequest<CouponDto>(`/coupons/${id}`);
}

export async function createCoupon(input: CreateCouponInput) {
  return apiRequest<CouponDto>("/coupons", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCoupon(id: string, input: UpdateCouponInput) {
  return apiRequest<CouponDto>(`/coupons/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteCoupon(id: string) {
  await apiRequest<null>(`/coupons/${id}`, { method: "DELETE" });
}
