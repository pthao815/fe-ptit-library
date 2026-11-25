import type { NavIcon } from "../types/library";

export const readerNavigation = [
  { label: "Trang chủ", path: "/reader" },
  { label: "Khám phá", path: "/reader/search" },
  { label: "Tủ sách của tôi", path: "/reader/my-library" },
  { label: "Lịch sử mượn", path: "/reader/my-library/history" },
];

export const staffNavigation: Array<{ label: string; icon: NavIcon }> = [
  { label: "Tổng quan", icon: "dashboard" },
  { label: "Lưu thông", icon: "circulation" },
  { label: "Quản lý tài liệu", icon: "book" },
  { label: "Tài liệu số", icon: "document" },
  { label: "Đặt trước", icon: "bookmark" },
  { label: "Bạn đọc", icon: "users" },
  { label: "Thông báo", icon: "bell" },
  { label: "Thống kê & báo cáo", icon: "chart" },
  { label: "Chính sách & Hình phạt", icon: "settings" },
  { label: "Thông tin cá nhân", icon: "user" },
];

export const adminNavigation: Array<{ label: string; icon: NavIcon }> = [
  { label: "Tổng quan", icon: "dashboard" },
  { label: "Bạn đọc", icon: "users" },
  { label: "Thông báo", icon: "bell" },
  { label: "Quản lý tài liệu", icon: "book" },
  { label: "Chính sách & Hình phạt", icon: "settings" },
  { label: "Cấu hình tra cứu", icon: "search" },
  { label: "Thông tin cá nhân", icon: "user" },
];

export const workspacePaths: Readonly<Record<string, string>> = {
  "Tổng quan": "",
  "Lưu thông": "circulation",
  "Quản lý tài liệu": "materials",
  "Tài liệu số": "digital-processing",
  "Đặt trước": "reservations",
  "Bạn đọc": "readers",
  "Thông báo": "notifications",
  "Thống kê & báo cáo": "reports",
  "Chính sách & Hình phạt": "policies",
  "Chính sách mượn trả": "policies",
  "Loại hình phạt": "penalty-types",
  "Cấu hình tra cứu": "search-configs",
  "Thông tin cá nhân": "profile",
};
