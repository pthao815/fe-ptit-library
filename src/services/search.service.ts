import type {
  ContentSearchRequest,
  ContentSearchResultDto,
} from "../types/api";
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
};
