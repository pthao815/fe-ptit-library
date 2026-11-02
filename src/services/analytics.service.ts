import type {
  AcquisitionSuggestionDto,
  LibraryOverviewStatsDto,
  MessageQueueDto,
  PageResponse,
  PaginationParams,
  PenaltyTypeResponse,
  PolicyResponse,
  SearchConfigResponse,
} from "../types/api";
import { http } from "./http";

export const analyticsService = {
  getOverviewStatistics(): Promise<LibraryOverviewStatsDto> {
    return http.get<LibraryOverviewStatsDto>("/api/analytics/overview");
  },

  getAcquisitionSuggestions(
    status?: string,
    params?: PaginationParams,
  ): Promise<PageResponse<AcquisitionSuggestionDto>> {
    return http.get<PageResponse<AcquisitionSuggestionDto>>("/api/analytics/acquisitions", {
      status,
      ...params,
    });
  },
};

export const notificationService = {
  getMyNotifications(params?: PaginationParams): Promise<PageResponse<MessageQueueDto>> {
    return http.get<PageResponse<MessageQueueDto>>("/api/notifications/my-messages", {
      ...params,
    });
  },
};

export const adminConfigService = {
  getPolicies(): Promise<PolicyResponse[]> {
    return http.get<PolicyResponse[]>("/api/admin/policies");
  },

  updatePolicy(id: number, payload: Omit<PolicyResponse, "id">): Promise<PolicyResponse> {
    return http.put<PolicyResponse>(`/api/admin/policies/${id}`, payload);
  },

  getPenaltyTypes(): Promise<PenaltyTypeResponse[]> {
    return http.get<PenaltyTypeResponse[]>("/api/admin/penalty-types");
  },

  createPenaltyType(payload: Omit<PenaltyTypeResponse, "id">): Promise<PenaltyTypeResponse> {
    return http.post<PenaltyTypeResponse>("/api/admin/penalty-types", payload);
  },

  updatePenaltyType(payload: PenaltyTypeResponse): Promise<PenaltyTypeResponse> {
    return http.put<PenaltyTypeResponse>("/api/admin/penalty-types", payload);
  },

  getSearchConfigs(): Promise<SearchConfigResponse[]> {
    return http.get<SearchConfigResponse[]>("/api/admin/search-configs");
  },

  activateSearchConfig(id: number): Promise<SearchConfigResponse> {
    return http.put<SearchConfigResponse>(`/api/admin/search-configs/${id}/active`);
  },
};
