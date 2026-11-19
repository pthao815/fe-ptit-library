import type {
  BorrowRequestDto,
  BorrowResponseDto,
  CirculationHistoryItemDto,
  FinePaymentResponseDto,
  HoldCancelResponseDto,
  HoldRequestDto,
  HoldResponseDto,
  PageResponse,
  PaginationParams,
  RenewRequestDto,
  RenewResponseDto,
  ReturnRequestDto,
  ReturnResponseDto,
  UserFinesSummaryDto,
} from "../types/api";
import { ApiError, http } from "./http";
import { getStoredUser } from "./session";

const HOLDS_STORAGE_PREFIX = "ptit-library-holds";

function getHoldsStorageKey(): string {
  const userId = getStoredUser()?.id || "current";
  return `${HOLDS_STORAGE_PREFIX}:${userId}`;
}

export function getTrackedHolds(): HoldResponseDto[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(getHoldsStorageKey());
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as HoldResponseDto[];
    return Array.isArray(parsed)
      ? parsed.filter((item) => Number.isSafeInteger(item?.holdId) && item.holdId > 0)
      : [];
  } catch {
    return [];
  }
}

export function getTrackedHoldByDocumentId(documentId: string): HoldResponseDto | undefined {
  if (!documentId) return undefined;
  return getTrackedHolds().find(
    (item) => item.documentId?.toLowerCase() === documentId.toLowerCase(),
  );
}

export function saveTrackedHold(hold: HoldResponseDto): void {
  if (typeof window === "undefined" || !Number.isSafeInteger(hold?.holdId)) return;
  const current = getTrackedHolds().filter(
    (item) =>
      item.holdId !== hold.holdId &&
      item.documentId?.toLowerCase() !== hold.documentId?.toLowerCase(),
  );
  window.localStorage.setItem(getHoldsStorageKey(), JSON.stringify([hold, ...current]));
}

export function removeTrackedHold(holdId: number): void {
  if (typeof window === "undefined") return;
  const next = getTrackedHolds().filter((item) => item.holdId !== holdId);
  window.localStorage.setItem(getHoldsStorageKey(), JSON.stringify(next));
}

export const circulationService = {
  // Staff Circulation Desk
  borrowBooks(payload: BorrowRequestDto): Promise<BorrowResponseDto> {
    return http.post<BorrowResponseDto>("/api/circulation/borrow", payload).then((result) => {
      if (!result || typeof result.totalBorrowed !== "number") {
        throw new ApiError("Backend không trả về xác nhận phiếu mượn hợp lệ.", 0);
      }
      return result;
    });
  },

  returnBook(payload: ReturnRequestDto): Promise<ReturnResponseDto> {
    return http.post<ReturnResponseDto>("/api/circulation/return", payload).then((result) => {
      if (!result || !result.barcode) {
        throw new ApiError("Backend không trả về xác nhận nhận trả hợp lệ.", 0);
      }
      return result;
    });
  },

  renewLoan(payload: RenewRequestDto): Promise<RenewResponseDto> {
    return http.post<RenewResponseDto>("/api/circulation/renew", payload).then((result) => {
      if (!result || !result.renewalStatus) {
        throw new ApiError("Backend không trả về trạng thái gia hạn hợp lệ.", 0);
      }
      return result;
    });
  },

  payFine(fineId: number, note?: string): Promise<FinePaymentResponseDto> {
    if (!Number.isSafeInteger(fineId) || fineId < 1) {
      return Promise.reject(new ApiError("Mã khoản phạt không hợp lệ.", 0));
    }
    const query = note?.trim() ? `?note=${encodeURIComponent(note.trim())}` : "";
    return http.post<FinePaymentResponseDto>(`/api/fines-admin/${fineId}/pay${query}`).then((res) => {
      if (!res || !Number.isSafeInteger(res.fineId)) {
        throw new ApiError("Backend không trả về xác nhận thanh toán phí phạt hợp lệ.", 0);
      }
      return res;
    });
  },

  // Reader Circulation & Fines
  getMyCirculationHistory(
    status?: "BORROWING" | "RETURNED" | "OVERDUE" | string,
    params?: PaginationParams,
  ): Promise<PageResponse<CirculationHistoryItemDto>> {
    return http
      .get<PageResponse<CirculationHistoryItemDto>>("/api/users/me/circulation-history", {
        status,
        ...params,
      })
      .then((page) => {
        if (!Array.isArray(page?.items)) {
          throw new ApiError("Backend không trả về lịch sử mượn trả hợp lệ.", 0);
        }
        return page;
      });
  },

  getMyFines(status?: "UNPAID" | "PAID" | string): Promise<UserFinesSummaryDto> {
    return http.get<UserFinesSummaryDto>("/api/users/me/fines", { status }).then((summary) => {
      if (!summary || !Array.isArray(summary.fines)) {
        throw new ApiError("Backend không trả về dữ liệu công nợ hợp lệ.", 0);
      }
      return summary;
    });
  },

  // Hold Queue
  placeHold(payload: HoldRequestDto): Promise<HoldResponseDto> {
    return http.post<HoldResponseDto>("/api/holds", payload).then((hold) => {
      if (!hold || !Number.isSafeInteger(hold.holdId) || hold.holdId < 1) {
        throw new ApiError("Backend không trả về mã đặt trước hợp lệ.", 0);
      }
      saveTrackedHold(hold);
      return hold;
    });
  },

  cancelHold(holdId: number, reason?: string): Promise<HoldCancelResponseDto> {
    if (!Number.isSafeInteger(holdId) || holdId < 1) {
      return Promise.reject(new ApiError("Mã lượt đặt trước không hợp lệ.", 0));
    }
    return http.delete<HoldCancelResponseDto>(`/api/holds/${holdId}`, { reason }).then((result) => {
      if (!result || !Number.isSafeInteger(result.holdId)) {
        throw new ApiError("Backend không xác nhận hủy lượt đặt trước.", 0);
      }
      removeTrackedHold(holdId);
      return result;
    });
  },
};
