import type {
  ContentSearchRequest,
  ContentSearchResultDto,
  SmartSearchRequest,
  SmartSearchResponse,
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
    return http.post<ContentSearchResultDto[]>("/api/search/content", body, { dedupe: true }).then((items) => {
      if (!Array.isArray(items)) {
        throw new ApiError("Backend không trả về danh sách kết quả tìm kiếm nội dung hợp lệ.", 0);
      }
      return items;
    });
  },
  smartSearch(payload: SmartSearchRequest): Promise<SmartSearchResponse> {
    const body: SmartSearchRequest = {
      query: payload.query.trim(),
      limit: payload.limit ?? 10,
      ...(payload.language ? { language: payload.language } : {}),
      ...(payload.docType ? { docType: payload.docType } : {}),
      ...(payload.departmentId ? { departmentId: payload.departmentId } : {}),
      ...(payload.authorName ? { authorName: payload.authorName } : {}),
      ...(payload.publicationYear ? { publicationYear: payload.publicationYear } : {}),
      ...(payload.searchMode ? { searchMode: payload.searchMode } : {}),
    };
    return http.post<SmartSearchResponse>("/api/search/smart", body, { dedupe: true }).then((data) => {
      if (!data || !Array.isArray(data.results)) {
        throw new ApiError("Backend không trả về kết quả tìm kiếm thông minh hợp lệ.", 0);
      }
      return data;
    });
  },
};
