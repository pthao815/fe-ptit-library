export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
export const MAX_BACKEND_PAGE_SIZE = 100;
const MAX_SAFE_PAGE = 2147483647;

export type PaginationToken = number | "gap";

/**
 * Tính danh sách số trang hiển thị thông minh (1-based), không tạo dấu "…" thừa.
 */
export function buildPaginationRange(currentPage: number, totalPages: number): PaginationToken[] {
  const safeTotal = Math.max(1, Math.floor(totalPages));
  const safeCurrent = Math.min(Math.max(1, Math.floor(currentPage)), safeTotal);

  if (safeTotal <= 1) return [1];
  if (safeTotal <= 7) {
    return Array.from({ length: safeTotal }, (_, index) => index + 1);
  }
  if (safeCurrent <= 3) {
    return [1, 2, 3, 4, "gap", safeTotal];
  }
  if (safeCurrent >= safeTotal - 2) {
    return [1, "gap", safeTotal - 3, safeTotal - 2, safeTotal - 1, safeTotal];
  }
  return [1, "gap", safeCurrent - 1, safeCurrent, safeCurrent + 1, "gap", safeTotal];
}

export function clampPageNumber(value: number, totalPages: number): number {
  const safeTotal = Math.max(1, Math.floor(totalPages));
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(1, Math.floor(value)), safeTotal);
}

export function parsePageSizeParam(
  raw: string | null | undefined,
  fallback: number,
  max = MAX_BACKEND_PAGE_SIZE,
): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : fallback;
}

export function parsePageParam(
  raw: string | null | undefined,
  fallback: number,
  min = 0,
): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= min && parsed <= MAX_SAFE_PAGE ? parsed : fallback;
}
