import type {
  RecommendationItemDto,
  SimilarDocumentDto,
  SimilarRebuildResponse,
} from "../types/api";
import { ApiError, http } from "./http";

export const recommendationService = {
  getMyRecommendations(limit = 10): Promise<RecommendationItemDto[]> {
    return http.get<RecommendationItemDto[]>("/api/recommendations/me", { limit }).then((items) => {
      if (!Array.isArray(items)) {
        throw new ApiError("Backend không trả về danh sách gợi ý hợp lệ.", 0);
      }
      return items;
    });
  },

  getSimilarDocuments(documentId: string, limit = 6): Promise<SimilarDocumentDto[]> {
    return http
      .get<SimilarDocumentDto[]>(`/api/recommendations/similar/${documentId}`, { limit })
      .then((items) => {
        if (!Array.isArray(items)) {
          throw new ApiError("Backend không trả về danh sách sách tương tự hợp lệ.", 0);
        }
        return items;
      });
  },

  rebuildSimilarBooks(): Promise<SimilarRebuildResponse> {
    return http.post<SimilarRebuildResponse>("/api/recommendations/similar/rebuild");
  },
};
