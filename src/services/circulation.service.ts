import type {
  BorrowRequestDto,
  BorrowResponseDto,
  CirculationHistoryItemDto,
  CopyLookupDto,
  FinePaymentResponseDto,
  HoldCancelResponseDto,
  HoldRequestDto,
  HoldResponseDto,
  HoldStatus,
  MyHoldItemDto,
  PageResponse,
  PaginationParams,
  RenewRequestDto,
  RenewResponseDto,
  ReturnRequestDto,
  ReturnResponseDto,
  StaffHoldItemDto,
  UserFinesSummaryDto,
} from "../types/api";
import { ApiError, http } from "./http";

// Trước đây lượt đặt trước được lưu tạm trong localStorage; giờ đọc từ API, dọn khóa cũ cho sạch.
try {
  if (typeof window !== "undefined") {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith("ptit-library-holds"))
      .forEach((key) => window.localStorage.removeItem(key));
  }
} catch {
  // Trình duyệt chặn storage: bỏ qua
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
      return hold;
    });
  },

  // status: bỏ trống = tất cả; "ACTIVE" = đang chờ + sẵn sàng nhận
  getMyHolds(status?: "ACTIVE" | HoldStatus): Promise<MyHoldItemDto[]> {
    return http.get<MyHoldItemDto[]>("/api/users/me/holds", { status }).then((items) => {
      if (!Array.isArray(items)) {
        throw new ApiError("Backend không trả về danh sách đặt trước hợp lệ.", 0);
      }
      return items;
    });
  },

  // Thủ thư: danh sách đặt trước (mặc định đang chờ + sẵn sàng nhận)
  searchHolds(params?: { status?: "ACTIVE" | HoldStatus; keyword?: string }): Promise<StaffHoldItemDto[]> {
    return http.get<StaffHoldItemDto[]>("/api/holds", params).then((items) => {
      if (!Array.isArray(items)) {
        throw new ApiError("Backend không trả về danh sách đặt trước hợp lệ.", 0);
      }
      return items;
    });
  },

  // Thủ thư: tra bản sách theo mã vạch (nhan đề, lượt mượn đang mở, lượt giữ)
  lookupCopy(barcode: string): Promise<CopyLookupDto> {
    return http.get<CopyLookupDto>(`/api/circulation/copies/${encodeURIComponent(barcode.trim())}`).then((copy) => {
      if (!copy?.barcode) {
        throw new ApiError("Backend không trả về thông tin bản sách hợp lệ.", 0);
      }
      return copy;
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
      return result;
    });
  },
};
