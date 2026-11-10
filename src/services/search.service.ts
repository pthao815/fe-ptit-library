import type {
  ContentSearchRequest,
  ContentSearchResultDto,
  DocumentMatchesResponse,
  RecommendationItemDto,
} from "../types/api";
import { buildApiUrl } from "../config/env";
import { http } from "./http";

export const searchService = {
  searchContent(payload: ContentSearchRequest): Promise<ContentSearchResultDto[]> {
    return http.post<ContentSearchResultDto[]>("/api/search/content", payload);
  },

  /** Vị trí các đoạn khớp với truy vấn trong một tài liệu (để tô sáng trên trình đọc). */
  getDocumentMatches(documentId: string, query: string, limit = 20): Promise<DocumentMatchesResponse> {
    return http.get<DocumentMatchesResponse>(`/api/search/document/${encodeURIComponent(documentId)}/matches`, { query, limit });
  },

  /** PDF bản số hiện hành của tài liệu (cần đăng nhập). */
  getReadUrl(documentId: string): string {
    return buildApiUrl(`/api/documents/${encodeURIComponent(documentId)}/read`);
  },

  getMyRecommendations(limit = 10): Promise<RecommendationItemDto[]> {
    return http.get<RecommendationItemDto[]>("/api/recommendations/me", { limit });
  },
};
