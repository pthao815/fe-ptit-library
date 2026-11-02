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
import { http } from "./http";

export const circulationService = {
  // Staff Circulation Desk
  borrowBooks(payload: BorrowRequestDto): Promise<BorrowResponseDto> {
    return http.post<BorrowResponseDto>("/api/circulation/borrow", payload);
  },

  returnBook(payload: ReturnRequestDto): Promise<ReturnResponseDto> {
    return http.post<ReturnResponseDto>("/api/circulation/return", payload);
  },

  renewLoan(payload: RenewRequestDto): Promise<RenewResponseDto> {
    return http.post<RenewResponseDto>("/api/circulation/renew", payload);
  },

  payFine(fineId: number, note?: string): Promise<FinePaymentResponseDto> {
    const query = note ? `?note=${encodeURIComponent(note)}` : "";
    return http.post<FinePaymentResponseDto>(`/api/fines-admin/${fineId}/pay${query}`);
  },

  // Reader Circulation & Fines
  getMyCirculationHistory(
    status?: "BORROWING" | "RETURNED" | "OVERDUE" | string,
    params?: PaginationParams,
  ): Promise<PageResponse<CirculationHistoryItemDto>> {
    return http.get<PageResponse<CirculationHistoryItemDto>>("/api/users/me/circulation-history", {
      status,
      ...params,
    });
  },

  getMyFines(status?: "UNPAID" | "PAID" | string): Promise<UserFinesSummaryDto> {
    return http.get<UserFinesSummaryDto>("/api/users/me/fines", { status });
  },

  // Hold Queue
  placeHold(payload: HoldRequestDto): Promise<HoldResponseDto> {
    return http.post<HoldResponseDto>("/api/holds", payload);
  },

  cancelHold(holdId: number, reason?: string): Promise<HoldCancelResponseDto> {
    return http.delete<HoldCancelResponseDto>(`/api/holds/${holdId}`, { reason });
  },
};
