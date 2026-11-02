import type {
  DepartmentDto,
  PageResponse,
  PaginationParams,
  UpdateProfileRequest,
  UpdateUserStatusRequest,
  UserDto,
  UserFilterParams,
  UserProfileResponse,
} from "../types/api";
import { http } from "./http";

export const userService = {
  getProfile(): Promise<UserProfileResponse> {
    return http.get<UserProfileResponse>("/api/users/profile");
  },

  updateProfile(payload: UpdateProfileRequest): Promise<UserProfileResponse> {
    return http.put<UserProfileResponse>("/api/users/profile", payload);
  },

  getUserById(id: string): Promise<UserDto> {
    return http.get<UserDto>(`/api/users/${id}`);
  },

  getUsers(params?: PaginationParams): Promise<PageResponse<UserDto>> {
    return http.get<PageResponse<UserDto>>("/api/users", { ...params });
  },

  searchAdminUsers(params?: UserFilterParams): Promise<PageResponse<UserDto>> {
    return http.get<PageResponse<UserDto>>("/api/users-admin", { ...params });
  },

  updateUserStatus(id: string, payload: UpdateUserStatusRequest): Promise<void> {
    return http.put<void>(`/api/users-admin/${id}/status`, payload);
  },

  getDepartments(): Promise<DepartmentDto[]> {
    return http.get<DepartmentDto[]>("/api/departments", undefined, { skipAuth: true });
  },
};
