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
import { ApiError, http } from "./http";

const notificationItemCache = new Map<string, MessageQueueDto>();

function cacheNotifications(items: MessageQueueDto[]): void {
  items.forEach((item) => {
    if (item && item.id !== undefined) {
      notificationItemCache.set(String(item.id), item);
    }
  });
}

export const analyticsService = {
  getOverviewStatistics(): Promise<LibraryOverviewStatsDto> {
    return http.get<LibraryOverviewStatsDto>("/api/analytics/overview").then((stats) => {
      if (!stats || typeof stats.totalDocuments !== "number") {
        throw new ApiError("Backend không trả về dữ liệu thống kê tổng quan hợp lệ.", 0);
      }
      return stats;
    });
  },

  getAcquisitionSuggestions(
    status?: string,
    params?: PaginationParams,
  ): Promise<PageResponse<AcquisitionSuggestionDto>> {
    return http
      .get<PageResponse<AcquisitionSuggestionDto>>("/api/analytics/acquisitions", {
        status,
        ...params,
      })
      .then((page) => {
        if (!page || !Array.isArray(page.items)) {
          throw new ApiError("Backend không trả về danh sách đề xuất bổ sung hợp lệ.", 0);
        }
        return page;
      });
  },
};

export const notificationService = {
  getMyNotifications(params?: PaginationParams): Promise<PageResponse<MessageQueueDto>> {
    return http
      .get<PageResponse<MessageQueueDto>>("/api/notifications/my-messages", {
        ...params,
      })
      .then((page) => {
        if (!page || !Array.isArray(page.items)) {
          throw new ApiError("Backend không trả về danh sách thông báo hợp lệ.", 0);
        }
        cacheNotifications(page.items);
        return page;
      });
  },

  async findMyNotificationById(
    notificationId: string,
    preferredPage = 0,
    pageSize = 20,
  ): Promise<{
    item: MessageQueueDto | null;
    page: number;
    pageData: PageResponse<MessageQueueDto>;
  }> {
    const firstPageData = await this.getMyNotifications({
      page: preferredPage,
      size: pageSize,
    });
    const inPreferred = firstPageData.items.find(
      (entry) => String(entry.id) === String(notificationId),
    );
    if (inPreferred) {
      return { item: inPreferred, page: preferredPage, pageData: firstPageData };
    }

    const cached = notificationItemCache.get(String(notificationId));
    if (cached) {
      return { item: cached, page: preferredPage, pageData: firstPageData };
    }

    const maxPagesToScan = Math.min(firstPageData.totalPages || 1, 10);
    for (let p = 0; p < maxPagesToScan; p++) {
      if (p === preferredPage) continue;
      const scannedPage = await this.getMyNotifications({ page: p, size: pageSize });
      const found = scannedPage.items.find(
        (entry) => String(entry.id) === String(notificationId),
      );
      if (found) {
        return { item: found, page: p, pageData: scannedPage };
      }
    }

    return { item: null, page: preferredPage, pageData: firstPageData };
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
