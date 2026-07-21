import { apiRequest } from "./client";
import type { ProductDto } from "./types";
import type { PaginationMeta } from "./types";

export interface CollectionDto {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  isActive: boolean;
  displayOrder: number;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListCollectionsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "createdAt" | "updatedAt" | "name" | "displayOrder";
  sortOrder?: "asc" | "desc";
}

export interface CreateCollectionInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
  displayOrder?: number;
  image?: File | null;
}

export interface UpdateCollectionInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
  displayOrder?: number;
  image?: File | null;
}

function appendCollectionFields(body: FormData, input: CreateCollectionInput | UpdateCollectionInput): void {
  if ("name" in input && input.name !== undefined) body.append("name", input.name);
  if (input.description !== undefined && input.description !== null) body.append("description", input.description);
  if (input.isActive !== undefined) body.append("isActive", String(input.isActive));
  if (input.displayOrder !== undefined) body.append("displayOrder", String(input.displayOrder));
  if (input.image) body.append("image", input.image);
}

export async function listCollections(params: ListCollectionsParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  if (params.isActive !== undefined) q.set("isActive", String(params.isActive));
  q.set("sortBy", params.sortBy ?? "displayOrder");
  q.set("sortOrder", params.sortOrder ?? "asc");

  const qs = q.toString();
  return apiRequest<CollectionDto[]>(`/collections${qs ? `?${qs}` : ""}`);
}

/** Public: active collections only, for storefront nav/homepage sections. */
export async function listActiveCollections() {
  return apiRequest<CollectionDto[]>("/collections/active");
}

export async function getCollection(id: string) {
  return apiRequest<CollectionDto>(`/collections/${id}`);
}

export async function createCollection(input: CreateCollectionInput) {
  const body = new FormData();
  appendCollectionFields(body, input);
  return apiRequest<CollectionDto>("/collections", { method: "POST", body });
}

export async function updateCollection(id: string, input: UpdateCollectionInput) {
  const body = new FormData();
  appendCollectionFields(body, input);
  return apiRequest<CollectionDto>(`/collections/${id}`, { method: "PUT", body });
}

export async function updateCollectionStatus(id: string, isActive: boolean) {
  return apiRequest<CollectionDto>(`/collections/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export async function deleteCollection(id: string) {
  await apiRequest<null>(`/collections/${id}`, { method: "DELETE" });
}

export async function addProductsToCollection(id: string, productIds: string[]) {
  return apiRequest<CollectionDto>(`/collections/${id}/products`, {
    method: "POST",
    body: JSON.stringify({ productIds }),
  });
}

export async function removeProductsFromCollection(id: string, productIds: string[]) {
  return apiRequest<CollectionDto>(`/collections/${id}/products`, {
    method: "DELETE",
    body: JSON.stringify({ productIds }),
  });
}

export interface ListCollectionProductsParams {
  page?: number;
  limit?: number;
}

export async function listCollectionProducts(id: string, params: ListCollectionProductsParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return apiRequest<{ collection: { id: string; name: string }; products: ProductDto[]; meta: PaginationMeta }>(
    `/collections/${id}/products${qs ? `?${qs}` : ""}`,
  );
}
