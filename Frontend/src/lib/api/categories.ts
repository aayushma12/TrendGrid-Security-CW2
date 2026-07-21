import { apiRequest } from "./client";
import type { CategoryDto } from "./types";

export interface ListCategoriesParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  parentCategoryId?: string | null;
  sortBy?: "createdAt" | "updatedAt" | "name";
  sortOrder?: "asc" | "desc";
}

export interface CreateCategoryInput {
  name: string;
  description?: string | null;
  parentCategoryId?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  image?: File | null;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  parentCategoryId?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  image?: File | null;
}

function appendCategoryFields(body: FormData, input: CreateCategoryInput | UpdateCategoryInput): void {
  if ("name" in input && input.name !== undefined) body.append("name", input.name);
  if (input.description !== undefined && input.description !== null) {
    body.append("description", input.description);
  }
  if (input.parentCategoryId) body.append("parentCategoryId", input.parentCategoryId);
  if (input.isActive !== undefined) body.append("isActive", String(input.isActive));
  if (input.isFeatured !== undefined) body.append("isFeatured", String(input.isFeatured));
  if (input.image) body.append("image", input.image);
}

export async function listCategories(params: ListCategoriesParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  if (params.isActive !== undefined) q.set("isActive", String(params.isActive));
  if (params.isFeatured !== undefined) q.set("isFeatured", String(params.isFeatured));
  if (params.parentCategoryId === null) q.set("parentCategoryId", "null");
  else if (params.parentCategoryId) q.set("parentCategoryId", params.parentCategoryId);
  q.set("sortBy", params.sortBy ?? "name");
  q.set("sortOrder", params.sortOrder ?? "asc");

  const qs = q.toString();
  return apiRequest<CategoryDto[]>(`/categories${qs ? `?${qs}` : ""}`, { auth: false });
}

export async function createCategory(input: CreateCategoryInput) {
  const body = new FormData();
  appendCategoryFields(body, input);
  return apiRequest<CategoryDto>("/categories", { method: "POST", body });
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const body = new FormData();
  appendCategoryFields(body, input);
  return apiRequest<CategoryDto>(`/categories/${id}`, { method: "PUT", body });
}

export async function updateCategoryStatus(id: string, isActive: boolean) {
  return apiRequest<CategoryDto>(`/categories/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export async function updateCategoryFeature(id: string, isFeatured: boolean) {
  return apiRequest<CategoryDto>(`/categories/${id}/feature`, {
    method: "PATCH",
    body: JSON.stringify({ isFeatured }),
  });
}

export async function uploadCategoryImage(id: string, image: File) {
  const body = new FormData();
  body.append("image", image);
  return apiRequest<CategoryDto>(`/categories/${id}/image`, { method: "POST", body });
}

export async function removeCategoryImage(id: string) {
  return apiRequest<CategoryDto>(`/categories/${id}/image`, { method: "DELETE" });
}

export async function deleteCategory(id: string) {
  await apiRequest<null>(`/categories/${id}`, { method: "DELETE" });
}
