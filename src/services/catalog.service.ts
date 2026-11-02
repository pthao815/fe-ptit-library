import { buildApiUrl } from "../config/env";
import type {
  AuthorDto,
  AuthorRequestDto,
  DigitalCopyDto,
  DocumentDetailDto,
  DocumentFilterParams,
  DocumentRequestDto,
  DocumentSummaryDto,
  PageResponse,
  PaginationParams,
  PhysicalCopyDto,
  PhysicalCopyRequestDto,
  ReviewDto,
  ReviewRequestDto,
} from "../types/api";
import { http } from "./http";

export const catalogService = {
  // Public Documents & Authors
  searchDocuments(params?: DocumentFilterParams): Promise<PageResponse<DocumentSummaryDto>> {
    return http.get<PageResponse<DocumentSummaryDto>>("/api/catalog/documents", { ...params });
  },

  getDocumentDetails(id: string): Promise<DocumentDetailDto> {
    return http.get<DocumentDetailDto>(`/api/catalog/documents/${id}`);
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
  uploadPdf(documentId: string, file: File, version = "1.0"): Promise<DigitalCopyDto> {
    const formData = new FormData();
    formData.append("documentId", documentId);
    formData.append("file", file);
    formData.append("version", version);
    return http.post<DigitalCopyDto>("/api/catalog/digital/upload", formData);
  },

  getDigitalDownloadUrl(digitalCopyId: string): string {
    return buildApiUrl(`/api/catalog/digital/${digitalCopyId}/download`);
  },

  // Admin / Staff Catalog Management
  createDocument(payload: DocumentRequestDto): Promise<string> {
    return http.post<string>("/api/catalog-admin/documents", payload);
  },

  updateDocument(id: string, payload: DocumentRequestDto): Promise<string> {
    return http.put<string>(`/api/catalog-admin/documents/${id}`, payload);
  },

  deleteDocument(id: string): Promise<void> {
    return http.delete<void>(`/api/catalog-admin/documents/${id}`);
  },

  getPhysicalCopies(documentId: string): Promise<PhysicalCopyDto[]> {
    return http.get<PhysicalCopyDto[]>(`/api/catalog-admin/documents/${documentId}/physical-copies`);
  },

  createPhysicalCopy(payload: PhysicalCopyRequestDto): Promise<PhysicalCopyDto> {
    return http.post<PhysicalCopyDto>("/api/catalog-admin/physical-copies", payload);
  },

  updatePhysicalCopy(id: string, payload: PhysicalCopyRequestDto): Promise<PhysicalCopyDto> {
    return http.put<PhysicalCopyDto>(`/api/catalog-admin/physical-copies/${id}`, payload);
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
