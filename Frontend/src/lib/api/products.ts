import { apiRequest } from "./client";
import type { ProductColor, ProductDto, ProductImageSlot, ProductStatus } from "./types";

export interface ListProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  /** Accepts one value or several (repeated query key) — see the API's product repository findMany. */
  brand?: string | string[];
  status?: ProductStatus;
  priceMin?: number;
  priceMax?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  isRecommended?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  /** discountPrice is set. */
  onSale?: boolean;
  /** Has at least one active variant with stock > 0. */
  inStock?: boolean;
  /** "Array contains any of" filters — one value or several. `label` doubles as the gender filter (Women/Men/Unisex). */
  tag?: string | string[];
  label?: string | string[];
  collection?: string | string[];
  color?: string | string[];
  size?: string | string[];
  sortBy?: "name" | "basePrice" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

function appendMulti(q: URLSearchParams, key: string, value: string | string[] | undefined): void {
  if (value === undefined) return;
  for (const v of Array.isArray(value) ? value : [value]) {
    if (v) q.append(key, v);
  }
}

/** Core scalar fields — sent as multipart/form-data so the thumbnail can ride along. */
export interface ProductCoreInput {
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  basePrice: number;
  discountPrice?: number | null;
  currency?: string;
  categoryId: string;
  brand?: string | null;
  status?: ProductStatus;
  isActive?: boolean;
  isFeatured?: boolean;
  isRecommended?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  /** Thumbnail image — uploaded inline as multipart field "image". */
  image?: File | null;
}

/** List-type fields — updated separately via PATCH /:id/assignments (JSON body). */
export interface ProductAssignmentsInput {
  sizes?: string[];
  colors?: ProductColor[];
  tags?: string[];
  labels?: string[];
  collections?: string[];
}

export type ProductToggleFlag =
  | "isFeatured"
  | "isRecommended"
  | "isTrending"
  | "isBestSeller"
  | "isNewArrival"
  | "isActive";

function appendProductFields(body: FormData, input: Partial<ProductCoreInput>): void {
  if (input.name !== undefined) body.append("name", input.name);
  if (input.description !== undefined) body.append("description", input.description ?? "");
  if (input.shortDescription !== undefined) body.append("shortDescription", input.shortDescription ?? "");
  if (input.basePrice !== undefined) body.append("basePrice", String(input.basePrice));
  if (input.discountPrice !== undefined && input.discountPrice !== null) {
    body.append("discountPrice", String(input.discountPrice));
  }
  if (input.currency) body.append("currency", input.currency);
  if (input.categoryId) body.append("categoryId", input.categoryId);
  if (input.brand !== undefined) body.append("brand", input.brand ?? "");
  if (input.status) body.append("status", input.status);
  if (input.isActive !== undefined) body.append("isActive", String(input.isActive));
  if (input.isFeatured !== undefined) body.append("isFeatured", String(input.isFeatured));
  if (input.isRecommended !== undefined) body.append("isRecommended", String(input.isRecommended));
  if (input.isTrending !== undefined) body.append("isTrending", String(input.isTrending));
  if (input.isBestSeller !== undefined) body.append("isBestSeller", String(input.isBestSeller));
  if (input.isNewArrival !== undefined) body.append("isNewArrival", String(input.isNewArrival));
  if (input.image) body.append("image", input.image);
}

export async function listProducts(params: ListProductsParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  if (params.categoryId) q.set("categoryId", params.categoryId);
  appendMulti(q, "brand", params.brand);
  if (params.status) q.set("status", params.status);
  if (params.priceMin !== undefined) q.set("priceMin", String(params.priceMin));
  if (params.priceMax !== undefined) q.set("priceMax", String(params.priceMax));
  if (params.isActive !== undefined) q.set("isActive", String(params.isActive));
  if (params.isFeatured !== undefined) q.set("isFeatured", String(params.isFeatured));
  if (params.isRecommended !== undefined) q.set("isRecommended", String(params.isRecommended));
  if (params.isTrending !== undefined) q.set("isTrending", String(params.isTrending));
  if (params.isBestSeller !== undefined) q.set("isBestSeller", String(params.isBestSeller));
  if (params.isNewArrival !== undefined) q.set("isNewArrival", String(params.isNewArrival));
  if (params.onSale !== undefined) q.set("onSale", String(params.onSale));
  if (params.inStock !== undefined) q.set("inStock", String(params.inStock));
  appendMulti(q, "tag", params.tag);
  appendMulti(q, "label", params.label);
  appendMulti(q, "collection", params.collection);
  appendMulti(q, "color", params.color);
  appendMulti(q, "size", params.size);
  q.set("sortBy", params.sortBy ?? "createdAt");
  q.set("sortOrder", params.sortOrder ?? "desc");

  const qs = q.toString();
  return apiRequest<ProductDto[]>(`/products${qs ? `?${qs}` : ""}`);
}

/**
 * The API caps `limit` at 100 per request — pages beyond that are rejected,
 * not truncated. For admin screens that need every product at once (e.g.
 * building a productId → name lookup map), fetch every page instead of one
 * oversized request. Capped at 20 pages (2000 products) as a sanity backstop.
 */
export async function listAllProducts(params: Omit<ListProductsParams, "page" | "limit"> = {}): Promise<ProductDto[]> {
  const PAGE_SIZE = 100;
  const MAX_PAGES = 20;
  const all: ProductDto[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await listProducts({ ...params, page, limit: PAGE_SIZE });
    all.push(...res.data);
    const totalPages = res.meta?.totalPages ?? 1;
    if (page >= totalPages) break;
  }
  return all;
}

export async function getProduct(id: string) {
  return apiRequest<ProductDto>(`/products/${id}`);
}

export async function createProduct(input: ProductCoreInput) {
  const body = new FormData();
  appendProductFields(body, input);
  return apiRequest<ProductDto>("/products", { method: "POST", body });
}

export async function updateProduct(id: string, input: Partial<ProductCoreInput>) {
  const body = new FormData();
  appendProductFields(body, input);
  return apiRequest<ProductDto>(`/products/${id}`, { method: "PUT", body });
}

export async function deleteProduct(id: string) {
  await apiRequest<null>(`/products/${id}`, { method: "DELETE" });
}

export async function updateProductStatus(id: string, status: ProductStatus) {
  return apiRequest<ProductDto>(`/products/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function updateProductFlag(id: string, flag: ProductToggleFlag, value: boolean) {
  return apiRequest<ProductDto>(`/products/${id}/flags/${flag}`, {
    method: "PATCH",
    body: JSON.stringify({ value }),
  });
}

export async function updateProductAssignments(id: string, input: ProductAssignmentsInput) {
  return apiRequest<ProductDto>(`/products/${id}/assignments`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/** Upload/replace the image for a specific slot (thumbnail | extra1 | extra2 | extra3). */
export async function uploadProductImage(id: string, slot: ProductImageSlot, image: File) {
  const body = new FormData();
  body.append("image", image);
  return apiRequest<ProductDto>(`/products/${id}/images/${slot}`, { method: "POST", body });
}

export async function removeProductImage(id: string, slot: ProductImageSlot) {
  return apiRequest<ProductDto>(`/products/${id}/images/${slot}`, { method: "DELETE" });
}

// -------- Bulk operations --------

export interface BulkResult {
  requested: number;
  updated: number;
  notFound: string[];
}

export async function bulkUpdateProductStatus(ids: string[], status: ProductStatus) {
  return apiRequest<BulkResult>("/products/bulk/status", {
    method: "POST",
    body: JSON.stringify({ ids, status }),
  });
}

export async function bulkUpdateProductActive(ids: string[], isActive: boolean) {
  return apiRequest<BulkResult>("/products/bulk/active", {
    method: "POST",
    body: JSON.stringify({ ids, isActive }),
  });
}

export async function bulkDeleteProducts(ids: string[]) {
  return apiRequest<BulkResult>("/products/bulk/delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

// -------- CSV import --------

export interface ImportRowResult {
  row: number;
  name?: string;
  status: "created" | "skipped_duplicate" | "error";
  message?: string;
}

export interface ImportSummary {
  totalRows: number;
  created: number;
  skipped: number;
  errors: number;
  dryRun: boolean;
  results: ImportRowResult[];
}

export async function importProductsCsv(file: File, dryRun: boolean) {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<ImportSummary>(`/products/import${dryRun ? "?dryRun=true" : ""}`, {
    method: "POST",
    body,
  });
}

// -------- Catalog statistics --------

export interface CatalogStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  draftProducts: number;
  publishedProducts: number;
  archivedProducts: number;
  recentlyAdded: number;
  lowStockVariants: number;
  productsPerCategory: { categoryId: string; categoryName: string; count: number }[];
}

export async function getCatalogStats(recentDays = 30, lowStockThreshold = 10) {
  return apiRequest<CatalogStats>(
    `/products/stats?recentDays=${recentDays}&lowStockThreshold=${lowStockThreshold}`,
  );
}
