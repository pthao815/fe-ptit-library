import { API_TIMEOUT_MS, buildApiUrl } from "../config/env";
import type { ApiResponse, TokenResponse } from "../types/api";
import { getAccessToken, getRefreshToken, saveAuthSession } from "./session";

export class ApiError extends Error {
  readonly status: number;
  readonly code: number;
  readonly details?: unknown;

  constructor(message: string, status = 500, code = status, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  skipAuth?: boolean;
}

function buildUrlWithParams(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  const baseUrl = buildApiUrl(path);
  if (!params) return baseUrl;
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  if (!queryString) return baseUrl;
  return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}${queryString}`;
}

let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const url = buildUrlWithParams("/api/auth/refresh", { token: refreshToken });
      const response = await fetch(url, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return null;
      const payload = (await response.json()) as ApiResponse<TokenResponse>;
      if (payload?.success && payload.data?.accessToken) {
        saveAuthSession(payload.data, true);
        return payload.data.accessToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, body, skipAuth = false, headers: customHeaders, ...rest } = options;
  const url = buildUrlWithParams(path, params);

  const headers = new Headers(customHeaders);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = !skipAuth ? getAccessToken() : null;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const serializedBody =
      body === undefined
        ? undefined
        : isFormData
          ? body
          : typeof body === "string"
            ? body
            : JSON.stringify(body);

    let response = await fetch(url, {
      ...rest,
      headers,
      body: serializedBody,
      signal: controller.signal,
    });

    if (response.status === 401 && !skipAuth && !path.startsWith("/api/auth/")) {
      const refreshedToken = await tryRefreshAccessToken();
      if (refreshedToken) {
        headers.set("Authorization", `Bearer ${refreshedToken}`);
        response = await fetch(url, {
          ...rest,
          headers,
          body: serializedBody,
          signal: controller.signal,
        });
      }
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = (await response.json()) as ApiResponse<T>;
      if (!response.ok || json.success === false) {
        throw new ApiError(
          json.message || `Yêu cầu thất bại (${response.status})`,
          response.status,
          json.code || response.status,
          json.data,
        );
      }
      return json.data;
    }

    if (!response.ok) {
      throw new ApiError(`Lỗi kết nối máy chủ (${response.status})`, response.status);
    }

    return (await response.text()) as unknown as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Yêu cầu quá thời gian phản hồi từ máy chủ.", 408);
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Không thể kết nối tới máy chủ Backend.",
      0,
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const http = {
  get: <T>(path: string, params?: RequestOptions["params"], options?: Omit<RequestOptions, "params" | "method">) =>
    apiRequest<T>(path, { ...options, method: "GET", params }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body" | "method">) =>
    apiRequest<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body" | "method">) =>
    apiRequest<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, params?: RequestOptions["params"], options?: Omit<RequestOptions, "params" | "method">) =>
    apiRequest<T>(path, { ...options, method: "DELETE", params }),
};
