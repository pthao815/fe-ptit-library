import { buildApiUrl } from "../config/env";
import type {
  AuthorDto,
  AuthorRequestDto,
  DigitalCopyDto,
  DigitalCopyUploadResponse,
  DocumentDetailDto,
  DocumentFilterParams,
  DocumentRequestDto,
  DocumentSummaryDto,
  PageResponse,
  PaginationParams,
  PhysicalCopyDto,
  PhysicalCopyRequestDto,
  ProcessingStatusResponse,
  ReviewDto,
  ReviewRequestDto,
} from "../types/api";
import type { Book } from "../types/library";
import { ApiError, http } from "./http";
import { getStoredUser } from "./session";

const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const FAVORITES_STORAGE_PREFIX = "ptit-library-favorites";

function getFavoritesStorageKey(): string {
  const userId = getStoredUser()?.id || "current";
  return `${FAVORITES_STORAGE_PREFIX}:${userId}`;
}

export function getTrackedFavorites(): Book[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(getFavoritesStorageKey());
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Book[];
    return Array.isArray(parsed) ? parsed.filter((b) => Boolean(b?.documentId)) : [];
  } catch {
    return [];
  }
}

export function syncFavoriteBook(book: Book, isFavorite: boolean): void {
  if (typeof window === "undefined" || !book?.documentId) return;
  const docId = book.documentId.toLowerCase();
  const current = getTrackedFavorites().filter(
    (item) => item.documentId?.toLowerCase() !== docId,
  );
  const next = isFavorite ? [book, ...current] : current;
  window.localStorage.setItem(getFavoritesStorageKey(), JSON.stringify(next));
}

export function removeTrackedFavoriteById(documentId: string): void {
  if (typeof window === "undefined" || !documentId) return;
  const docId = documentId.toLowerCase();
  const next = getTrackedFavorites().filter(
    (item) => item.documentId?.toLowerCase() !== docId,
  );
  window.localStorage.setItem(getFavoritesStorageKey(), JSON.stringify(next));
}

function confirmedId(id: unknown): string {
  if (typeof id !== "string" || !uuidPattern.test(id)) {
    throw new ApiError("Backend không trả về UUID hợp lệ để xác nhận thao tác.", 0);
  }
  return id;
}

function normalizeReviewDto(raw: unknown, fallbackIndex = 0): ReviewDto {
  if (!raw || typeof raw !== "object") {
    throw new ApiError("Backend không trả về dữ liệu đánh giá hợp lệ.", 0);
  }
  const obj = raw as Record<string, unknown>;
  const rating = Number(obj.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new ApiError("Điểm đánh giá từ backend không hợp lệ.", 0);
  }
  const userObj =
    obj.user && typeof obj.user === "object"
      ? (obj.user as Record<string, unknown>)
      : undefined;
  const userFullName =
    typeof obj.userFullName === "string"
      ? obj.userFullName
      : typeof userObj?.fullName === "string"
        ? userObj.fullName
        : typeof userObj?.userCode === "string"
          ? userObj.userCode
          : undefined;

  return {
    id: Number.isSafeInteger(Number(obj.id)) ? Number(obj.id) : fallbackIndex + 1,
    rating,
    comment: typeof obj.comment === "string" ? obj.comment : undefined,
    createdAt: typeof obj.createdAt === "string" ? obj.createdAt : undefined,
    updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : undefined,
    userFullName,
    user: userObj
      ? {
          id: typeof userObj.id === "string" ? userObj.id : undefined,
          fullName: typeof userObj.fullName === "string" ? userObj.fullName : undefined,
          userCode: typeof userObj.userCode === "string" ? userObj.userCode : undefined,
        }
      : undefined,
  };
}

export const catalogService = {
  // Public Documents & Authors
  searchDocuments(params?: DocumentFilterParams): Promise<PageResponse<DocumentSummaryDto>> {
    return http.get<PageResponse<DocumentSummaryDto>>("/api/catalog/documents", { ...params }).then((page) => {
      if (!Array.isArray(page?.items)) throw new ApiError("Backend không trả về danh sách tài liệu hợp lệ.", 0);
      return page;
    });
  },

  getDocumentDetails(id: string): Promise<DocumentDetailDto> {
    return http.get<DocumentDetailDto>(`/api/catalog/documents/${id}`).then((document) => {
      if (confirmedId(document?.id).toLowerCase() !== id.toLowerCase()) {
        throw new ApiError("Backend trả về tài liệu khác với tài liệu đã chọn.", 0);
      }
      return document;
    });
  },

  searchAuthors(keyword?: string, params?: PaginationParams): Promise<PageResponse<AuthorDto>> {
    return http.get<PageResponse<AuthorDto>>("/api/catalog/authors", {
      keyword,
      ...params,
    });
  },

  getAuthorById(id: number): Promise<AuthorDto> {
    return http.get<AuthorDto>(`/api/catalog/authors/${id}`);
  },

  // Reader Interactions (Favorites & Reviews)
  toggleFavorite(documentId: string): Promise<{ documentId: string; isFavorite: boolean }> {
    return http
      .post<{ documentId: string; isFavorite: boolean }>(
        `/api/catalog/interactions/favorites/${documentId}`,
      )
      .then((res) => {
        if (!res || typeof res.isFavorite !== "boolean") {
          throw new ApiError("Backend không xác nhận trạng thái yêu thích.", 0);
        }
        if (!res.isFavorite) {
          removeTrackedFavoriteById(String(res.documentId || documentId));
        }
        return {
          documentId: String(res.documentId || documentId),
          isFavorite: res.isFavorite,
        };
      });
  },

  checkFavoriteStatus(documentId: string): Promise<{ documentId: string; isFavorite: boolean }> {
    return http
      .get<{ documentId: string; isFavorite: boolean }>(
        `/api/catalog/interactions/favorites/${documentId}/status`,
      )
      .then((res) => {
        if (!res || typeof res.isFavorite !== "boolean") {
          throw new ApiError("Backend không trả về trạng thái yêu thích hợp lệ.", 0);
        }
        return {
          documentId: String(res.documentId || documentId),
          isFavorite: res.isFavorite,
        };
      });
  },

  submitReview(documentId: string, payload: ReviewRequestDto): Promise<ReviewDto> {
    return http
      .post<unknown>(`/api/catalog/interactions/reviews/${documentId}`, payload)
      .then((raw) => normalizeReviewDto(raw));
  },

  getDocumentReviews(
    documentId: string,
    params?: PaginationParams,
  ): Promise<PageResponse<ReviewDto>> {
    return http
      .get<PageResponse<unknown>>(`/api/catalog/interactions/reviews/${documentId}`, {
        ...params,
      })
      .then((page) => {
        if (!page || !Array.isArray(page.items)) {
          throw new ApiError("Backend không trả về danh sách đánh giá hợp lệ.", 0);
        }
        return {
          ...page,
          items: page.items.map((item, idx) => normalizeReviewDto(item, idx)),
        };
      });
  },

  // Digital Copy Upload & Download
  uploadPdf(documentId: string, file: File, version = "1.0"): Promise<DigitalCopyUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("version", version);
    return http.post<DigitalCopyUploadResponse>(`/api/admin/documents/${documentId}/digital-copies`, formData).then((result) => {
      confirmedId(result?.digitalCopyId);
      if (!Number.isSafeInteger(result.jobId) || result.jobId < 1) {
        throw new ApiError("Backend chưa xác nhận mã tiến trình xử lý PDF.", 0);
      }
      return result;
    });
  },

  getProcessingStatus(jobId: number): Promise<ProcessingStatusResponse> {
    return http.get<ProcessingStatusResponse>("/api/admin/digital-copies/processing-status", { jobId });
  },

  getDigitalDownloadUrl(digitalCopyId: string): string {
    return buildApiUrl(`/api/catalog/digital/${digitalCopyId}/download`);
  },

  // Admin / Staff Catalog Management
  createDocument(payload: DocumentRequestDto): Promise<string> {
    return http.post<string>("/api/catalog-admin/documents", payload).then(confirmedId);
  },

  updateDocument(id: string, payload: DocumentRequestDto): Promise<string> {
    return http.put<string>(`/api/catalog-admin/documents/${id}`, payload).then(confirmedId);
  },

  deleteDocument(id: string): Promise<void> {
    return http.delete<void>(`/api/catalog-admin/documents/${id}`);
  },

  getPhysicalCopies(documentId: string): Promise<PhysicalCopyDto[]> {
    return http.get<PhysicalCopyDto[]>(`/api/catalog-admin/documents/${documentId}/physical-copies`);
  },

  createPhysicalCopy(payload: PhysicalCopyRequestDto): Promise<PhysicalCopyDto> {
    return http.post<PhysicalCopyDto>("/api/catalog-admin/physical-copies", payload).then((copy) => {
      confirmedId(copy?.id);
      return copy;
    });
  },

  updatePhysicalCopy(id: string, payload: PhysicalCopyRequestDto): Promise<PhysicalCopyDto> {
    return http.put<PhysicalCopyDto>(`/api/catalog-admin/physical-copies/${id}`, payload);
  },

  deletePhysicalCopy(id: string): Promise<void> {
    return http.delete<void>(`/api/catalog-admin/physical-copies/${id}`);
  },

  createAuthor(payload: AuthorRequestDto): Promise<AuthorDto> {
    return http.post<AuthorDto>("/api/catalog-admin/authors", payload);
  },

  updateAuthor(id: number, payload: AuthorRequestDto): Promise<AuthorDto> {
    return http.put<AuthorDto>(`/api/catalog-admin/authors/${id}`, payload);
  },

  deleteAuthor(id: number): Promise<void> {
    return http.delete<void>(`/api/catalog-admin/authors/${id}`);
  },
};
