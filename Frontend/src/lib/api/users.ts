import { apiRequest } from "./client";
import type { UserDto, UserRole } from "./types";

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy?: "createdAt" | "updatedAt" | "firstName" | "lastName" | "email";
  sortOrder?: "asc" | "desc";
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: UserRole;
  isActive?: boolean;
}

export async function listUsers(params: ListUsersParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  if (params.role) q.set("role", params.role);
  if (params.isActive !== undefined) q.set("isActive", String(params.isActive));
  q.set("sortBy", params.sortBy ?? "createdAt");
  q.set("sortOrder", params.sortOrder ?? "desc");

  const qs = q.toString();
  return apiRequest<UserDto[]>(`/users${qs ? `?${qs}` : ""}`);
}

export async function getUser(id: string) {
  return apiRequest<UserDto>(`/users/${id}`);
}

export async function createUser(input: CreateUserInput) {
  return apiRequest<UserDto>("/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateUser(id: string, input: UpdateUserInput) {
  return apiRequest<UserDto>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteUser(id: string) {
  await apiRequest<null>(`/users/${id}`, { method: "DELETE" });
}

export async function uploadUserAvatar(id: string, avatar: File) {
  const body = new FormData();
  body.append("avatar", avatar);
  return apiRequest<UserDto>(`/users/${id}/avatar`, { method: "POST", body });
}
