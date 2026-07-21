import type { ApiErrorResponse, ApiSuccessResponse } from "./types";

const STORAGE_ACCESS = "tg_access_token";
const STORAGE_REFRESH = "tg_refresh_token";
const STORAGE_USER = "tg_user";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly errors: ApiErrorResponse["errors"];

  constructor(message: string, statusCode: number, errors: ApiErrorResponse["errors"] = []) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const getApiBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:5000/api/v1";

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_ACCESS);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_REFRESH);
};

export const setAuthSession = (accessToken: string, refreshToken: string, user: unknown): void => {
  localStorage.setItem(STORAGE_ACCESS, accessToken);
  localStorage.setItem(STORAGE_REFRESH, refreshToken);
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
};

export const clearAuthSession = (): void => {
  localStorage.removeItem(STORAGE_ACCESS);
  localStorage.removeItem(STORAGE_REFRESH);
  localStorage.removeItem(STORAGE_USER);
};

export const getStoredUser = <T>(): T | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export type ApiRequestOptions = RequestInit & {
  /** Attach Bearer token when available (default: true). */
  auth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiSuccessResponse<T>> {
  const { auth = true, headers: initHeaders, body, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (body && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, { ...rest, headers, body });
  } catch {
    throw new ApiError("Unable to reach the API server. Check that the backend is running.", 0);
  }

  if (response.status === 204) {
    return {
      success: true,
      statusCode: 204,
      message: "OK",
      data: null as T,
      timestamp: new Date().toISOString(),
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(response.ok ? "Invalid response from server." : `Request failed (${response.status}).`, response.status);
  }

  const data = payload as { success?: boolean; message?: string; statusCode?: number; errors?: ApiErrorResponse["errors"] };

  if (!data || data.success !== true) {
    throw new ApiError(
      data?.message ?? `Request failed (${response.status}).`,
      data?.statusCode ?? response.status,
      data?.errors ?? [],
    );
  }

  return payload as ApiSuccessResponse<T>;
}
