import type {
  ContentSearchRequest,
  ContentSearchResultDto,
  RecommendationItemDto,
} from "../types/api";
import { http } from "./http";

export const searchService = {
  searchContent(payload: ContentSearchRequest): Promise<ContentSearchResultDto[]> {
    return http.post<ContentSearchResultDto[]>("/api/search/content", payload);
  },

  getMyRecommendations(limit = 10): Promise<RecommendationItemDto[]> {
    return http.get<RecommendationItemDto[]>("/api/recommendations/me", { limit });
  },
};
