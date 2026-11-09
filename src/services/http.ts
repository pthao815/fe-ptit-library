import { authSession } from "../shared/auth/auth-session";
import { API_TIMEOUT_MS, buildApiUrl } from "../config/env";
import type { ApiResponse, TokenResponse } from "../types/api";
import { clearAuthSession, getAccessToken, getRefreshToken, remembersSession, saveAuthSession } from "./session";

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

let refreshFlight: { refreshToken: string; promise: Promise<string | null> } | undefined;

export async function tryRefreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  if (refreshFlight?.refreshToken === refreshToken) return refreshFlight.promise;

  const remember = remembersSession();
  const originalAccessToken = getAccessToken();
  const promise = (async () => {
    try {
      const url = buildUrlWithParams("/api/auth/refresh", { token: refreshToken });
      const response = await fetch(url, {
        method: "POST",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      });
      if (!response.ok) return null;
      const payload = (await response.json()) as ApiResponse<TokenResponse>;
      if (payload?.success && payload.data?.accessToken) {
        if (getRefreshToken() !== refreshToken || getAccessToken() !== originalAccessToken) return null;
        saveAuthSession(payload.data, remember);
        return payload.data.accessToken;
      }
      return null;
    } catch {
      return null;
    }
  })();
  refreshFlight = { refreshToken, promise };
  void promise.then(() => {
    if (refreshFlight?.promise === promise) refreshFlight = undefined;
  });
  return promise;
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
  const { identityVersion } = authSession.getSnapshot();
  const assertIdentity = () => {
    if (token && identityVersion !== authSession.getSnapshot().identityVersion) {
      throw new ApiError("Tài khoản đã thay đổi trong khi xử lý yêu cầu.", 401);
    }
  };
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

    assertIdentity();
    if (response.status === 401 && token === getAccessToken() && !skipAuth && !path.startsWith("/api/auth/")) {
      const refreshedToken = await tryRefreshAccessToken();
      assertIdentity();
      if (refreshedToken && (!rest.method || rest.method === "GET")) {
        headers.set("Authorization", `Bearer ${refreshedToken}`);
        response = await fetch(url, {
          ...rest,
          headers,
          body: serializedBody,
          signal: controller.signal,
        });
      }
    }

    assertIdentity();
    if (response.status === 401 && token && token === getAccessToken() && !skipAuth) clearAuthSession("expired");

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = (await response.json()) as ApiResponse<T>;
      if (!response.ok || json?.success !== true) {
        throw new ApiError(
          json?.message || `Yêu cầu thất bại (${response.status})`,
          response.status,
          json?.code || response.status,
          json?.data,
        );
      }
      return json.data;
    }

    if (!response.ok) {
      throw new ApiError(`Lỗi kết nối máy chủ (${response.status})`, response.status);
    }

    throw new ApiError("Backend không trả về JSON hợp lệ.", 0);
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
