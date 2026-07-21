import { apiRequest } from "./client";
import type { ProductColor, ProductDto, ProductImageSlot, ProductStatus } from "./types";

export interface ListProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brand?: string;
  status?: ProductStatus;
  priceMin?: number;
  priceMax?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  isRecommended?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  sortBy?: "name" | "basePrice" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
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
  if (params.brand) q.set("brand", params.brand);
  if (params.status) q.set("status", params.status);
  if (params.priceMin !== undefined) q.set("priceMin", String(params.priceMin));
  if (params.priceMax !== undefined) q.set("priceMax", String(params.priceMax));
  if (params.isActive !== undefined) q.set("isActive", String(params.isActive));
  if (params.isFeatured !== undefined) q.set("isFeatured", String(params.isFeatured));
  if (params.isRecommended !== undefined) q.set("isRecommended", String(params.isRecommended));
  if (params.isTrending !== undefined) q.set("isTrending", String(params.isTrending));
  if (params.isBestSeller !== undefined) q.set("isBestSeller", String(params.isBestSeller));
  if (params.isNewArrival !== undefined) q.set("isNewArrival", String(params.isNewArrival));
  q.set("sortBy", params.sortBy ?? "createdAt");
  q.set("sortOrder", params.sortOrder ?? "desc");

  const qs = q.toString();
  return apiRequest<ProductDto[]>(`/products${qs ? `?${qs}` : ""}`, { auth: false });
}

export async function getProduct(id: string) {
  return apiRequest<ProductDto>(`/products/${id}`, { auth: false });
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
