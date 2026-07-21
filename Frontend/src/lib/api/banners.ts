import { apiRequest } from "./client";
import type { BannerDto, BannerPlacement } from "./types";

export interface ListBannersParams {
  page?: number;
  limit?: number;
  search?: string;
  placement?: BannerPlacement;
  isActive?: boolean;
  sortBy?: "createdAt" | "updatedAt" | "startsAt" | "expiresAt" | "sortOrder";
  sortOrder?: "asc" | "desc";
}

/** Fields accepted by createBannerSchema — undefined keys are simply omitted. */
export interface CreateBannerInput {
  placement: BannerPlacement;
  title: string;
  subtext?: string;
  ctaText?: string;
  ctaLink?: string;
  bgColor?: string;
  textColor?: string;
  sortOrder?: number;
  /** ISO datetime string, e.g. new Date().toISOString() */
  startsAt: string;
  /** ISO datetime string */
  expiresAt: string;
  isActive?: boolean;
}

/**
 * Fields accepted by updateBannerSchema. The nullable text fields are
 * nullable here — passing `null` explicitly clears the field on the server,
 * while omitting a key (undefined) leaves it unchanged.
 */
export interface UpdateBannerInput {
  placement?: BannerPlacement;
  title?: string;
  subtext?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  bgColor?: string;
  textColor?: string;
  sortOrder?: number;
  startsAt?: string;
  expiresAt?: string;
  isActive?: boolean;
}

export async function listBanners(params: ListBannersParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  if (params.placement) q.set("placement", params.placement);
  if (params.isActive !== undefined) q.set("isActive", String(params.isActive));
  q.set("sortBy", params.sortBy ?? "sortOrder");
  q.set("sortOrder", params.sortOrder ?? "asc");

  const qs = q.toString();
  return apiRequest<BannerDto[]>(`/banners${qs ? `?${qs}` : ""}`);
}

/** Public/storefront: currently-live banners, optionally scoped to a placement. */
export async function listActiveBanners(placement?: BannerPlacement) {
  const qs = placement ? `?placement=${placement}` : "";
  return apiRequest<BannerDto[]>(`/banners/active${qs}`);
}

export async function getBanner(id: string) {
  return apiRequest<BannerDto>(`/banners/${id}`);
}

export async function createBanner(input: CreateBannerInput) {
  return apiRequest<BannerDto>("/banners", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateBanner(id: string, input: UpdateBannerInput) {
  return apiRequest<BannerDto>(`/banners/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteBanner(id: string) {
  await apiRequest<null>(`/banners/${id}`, { method: "DELETE" });
}
