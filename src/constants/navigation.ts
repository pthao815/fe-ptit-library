import type { NavIcon } from "../types/library";

export const readerNavigation = [
  "Trang chủ",
  "Khám phá",
  "Ngành đào tạo",
  "Tủ sách của tôi",
  "Lịch sử mượn",
];

export const staffNavigation: Array<{ label: string; icon: NavIcon }> = [
  { label: "Tổng quan", icon: "dashboard" },
  { label: "Lưu thông", icon: "sparkle" },
  { label: "Quản lý tài liệu", icon: "book" },
  { label: "Tài liệu số", icon: "document" },
  { label: "Đặt trước", icon: "bookmark" },
  { label: "Bạn đọc", icon: "users" },
  { label: "Thống kê & báo cáo", icon: "dashboard" },
  { label: "Thông tin cá nhân", icon: "users" },
];

export const adminNavigation: Array<{ label: string; icon: NavIcon }> = [
  { label: "Tổng quan", icon: "dashboard" },
  { label: "Tài khoản & phân quyền", icon: "users" },
  { label: "Cấu hình nghiệp vụ", icon: "settings" },
  { label: "Cấu hình tra cứu", icon: "search" },
  { label: "Trạng thái chỉ mục", icon: "sparkle" },
  { label: "Nhật ký hoạt động", icon: "document" },
  { label: "Thông tin cá nhân", icon: "users" },
];
