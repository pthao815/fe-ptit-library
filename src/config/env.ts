export type ApiTarget = "local" | "remote";

const DEFAULT_LOCAL_URL = "http://localhost:8080";
const DEFAULT_TIMEOUT_MS = 30000;

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

const rawTarget = (import.meta.env.VITE_API_TARGET || "local").toLowerCase();
export const API_TARGET: ApiTarget = rawTarget === "remote" ? "remote" : "local";

export const API_LOCAL_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_LOCAL_URL || DEFAULT_LOCAL_URL,
);

export const API_REMOTE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_REMOTE_URL || API_LOCAL_URL,
);

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined
  ? normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)
  : API_TARGET === "remote" ? API_REMOTE_URL : API_LOCAL_URL;

export const API_TIMEOUT_MS =
  Number(import.meta.env.VITE_API_TIMEOUT) > 0
    ? Number(import.meta.env.VITE_API_TIMEOUT)
    : DEFAULT_TIMEOUT_MS;

export function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
