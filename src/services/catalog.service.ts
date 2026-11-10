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
import { ApiError, http } from "./http";

const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function confirmedId(id: unknown): string {
  if (typeof id !== "string" || !uuidPattern.test(id)) {
    throw new ApiError("Backend không trả về UUID hợp lệ để xác nhận thao tác.", 0);
  }
  return id;
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
    return http.post<{ documentId: string; isFavorite: boolean }>(
      `/api/catalog/interactions/favorites/${documentId}`,
    );
  },

  checkFavoriteStatus(documentId: string): Promise<{ documentId: string; isFavorite: boolean }> {
    return http.get<{ documentId: string; isFavorite: boolean }>(
      `/api/catalog/interactions/favorites/${documentId}/status`,
    );
  },

  submitReview(documentId: string, payload: ReviewRequestDto): Promise<ReviewDto> {
    return http.post<ReviewDto>(`/api/catalog/interactions/reviews/${documentId}`, payload);
  },

  getDocumentReviews(
    documentId: string,
    params?: PaginationParams,
  ): Promise<PageResponse<ReviewDto>> {
    return http.get<PageResponse<ReviewDto>>(`/api/catalog/interactions/reviews/${documentId}`, {
      ...params,
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
