import type { ApiErrorResponse, ApiSuccessResponse } from "./types";

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

/**
 * The session lives in httpOnly cookies set by the API — this app never
 * touches the access/refresh tokens directly, which is what keeps them out
 * of reach of any injected script. Only the (non-sensitive) user profile is
 * cached here, purely so the UI can render "logged in as X" without a
 * round-trip on every page load.
 */
export const setStoredUser = (user: unknown): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
};

export const clearStoredUser = (): void => {
  if (typeof window === "undefined") return;
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

/**
 * Reads the CSRF token the API sets as a readable (non-httpOnly) cookie
 * alongside the httpOnly auth cookies — see the API's utils/cookies.ts.
 * Echoed back as `X-CSRF-Token` on every request (the API only actually
 * checks it once a session exists, so sending it unconditionally is harmless).
 */
const getCsrfTokenFromCookie = (): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

export type ApiRequestOptions = RequestInit;

/**
 * The access-token cookie is short-lived (30 min) by design — the refresh
 * token (30 days) is what actually keeps a session alive. Without this, an
 * admin mid-session for >30 minutes would suddenly see a raw "Missing bearer
 * token" 401 on their next click. A single in-flight refresh is shared across
 * concurrent 401s so a burst of requests doesn't fire the refresh endpoint
 * more than once.
 */
let refreshInFlight: Promise<boolean> | null = null;

const attemptRefresh = (): Promise<boolean> => {
  if (!refreshInFlight) {
    const headers = new Headers({ "Content-Type": "application/json" });
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken) headers.set("X-CSRF-Token", csrfToken);

    refreshInFlight = fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers,
      body: "{}",
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
};

/** Paths that must never trigger a refresh-and-retry — refreshing here would
 *  either loop forever or mask the real "wrong password" / "already logged
 *  out" outcome the caller needs to see. */
const NO_REFRESH_PATHS = ["/auth/login", "/auth/refresh", "/auth/register", "/auth/logout"];

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
  _isRetry = false,
): Promise<ApiSuccessResponse<T>> {
  const { headers: initHeaders, body, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (body && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const csrfToken = getCsrfTokenFromCookie();
  if (csrfToken) headers.set("X-CSRF-Token", csrfToken);

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...rest,
      headers,
      body,
      // Cross-origin (different port in dev) but same-site — cookies need
      // this explicitly since fetch omits credentials cross-origin by default.
      credentials: "include",
    });
  } catch {
    throw new ApiError("Unable to reach the API server. Check that the backend is running.", 0);
  }

  if (response.status === 401 && !_isRetry && !NO_REFRESH_PATHS.some((p) => path.startsWith(p))) {
    const refreshed = await attemptRefresh();
    if (refreshed) return apiRequest<T>(path, options, true);
    // The refresh token itself is gone/expired — this really is a dead
    // session. Drop the cached user so the UI's auth guards redirect to
    // login instead of silently re-showing stale "logged in" state.
    clearStoredUser();
    if (typeof window !== "undefined") window.dispatchEvent(new Event("auth:expired"));
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
