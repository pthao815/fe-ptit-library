import type {
  ContentSearchRequest,
  ContentSearchResultDto,
  DocumentMatchesResponse,
  RecommendationItemDto,
} from "../types/api";
import { buildApiUrl } from "../config/env";
import { ApiError, http } from "./http";

export const searchService = {
  searchContent(payload: ContentSearchRequest): Promise<ContentSearchResultDto[]> {
    const body = {
      query: payload.query,
      limit: payload.limit ?? 10,
      searchMode:
        payload.searchMode ??
        (payload.searchType ? payload.searchType.toLowerCase() : "hybrid"),
    };
    return http.post<ContentSearchResultDto[]>("/api/search/content", body).then((items) => {
      if (!Array.isArray(items)) {
        throw new ApiError("Backend không trả về danh sách kết quả tìm kiếm nội dung hợp lệ.", 0);
      }
      return items;
    });
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
    return http.get<RecommendationItemDto[]>("/api/recommendations/me", { limit }).then((items) => {
      if (!Array.isArray(items)) {
        throw new ApiError("Backend không trả về danh sách gợi ý hợp lệ.", 0);
      }
      return items;
    });
  },
};
