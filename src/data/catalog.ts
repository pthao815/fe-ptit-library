import type { Book } from "../types/library";

export type CatalogRecord = Book & {
  isbn: string;
  copies: number;
  digitalFiles: number;
  recordCode: string;
  recordStatus: "Đã xuất bản" | "Bản nháp" | "Cần bổ sung";
};

export const catalogRecords: CatalogRecord[] = [
  { id: 401, title: "Trí tuệ nhân tạo: Nền tảng và ứng dụng", author: "Nguyễn Thanh Thủy", year: "2024", type: "Sách chuyên khảo", rating: 5, available: true, code: "005.1", cover: "cover-red", isbn: "978-604-80-8932-1", copies: 5, digitalFiles: 2, recordCode: "BIB-0001842", recordStatus: "Đã xuất bản" },
  { id: 402, title: "Cấu trúc dữ liệu và giải thuật", author: "Nguyễn Đức Nghĩa", year: "2023", type: "Giáo trình", rating: 5, available: true, code: "005.73", cover: "cover-charcoal", isbn: "978-604-67-2451-8", copies: 8, digitalFiles: 1, recordCode: "BIB-0001108", recordStatus: "Đã xuất bản" },
  { id: 403, title: "Mạng máy tính và hệ thống phân tán", author: "Lê Nhật Quang", year: "2024", type: "Sách chuyên khảo", rating: 4, available: false, code: "004.6", cover: "cover-slate", isbn: "978-604-76-2918-4", copies: 4, digitalFiles: 1, recordCode: "BIB-0002016", recordStatus: "Đã xuất bản" },
  { id: 404, title: "Nghiên cứu ứng dụng AI tạo sinh trong giáo dục", author: "Trần Minh Tuấn", year: "2025", type: "Báo cáo nghiên cứu", rating: 4, available: true, code: "371.33", cover: "cover-sand", isbn: "Chưa cấp ISBN", copies: 1, digitalFiles: 3, recordCode: "BIB-0002431", recordStatus: "Bản nháp" },
  { id: 405, title: "An toàn thông tin trong kỷ nguyên số", author: "Phạm Văn Cường", year: "2022", type: "Sách tham khảo", rating: 4, available: true, code: "005.8", cover: "cover-red", isbn: "978-604-80-7216-3", copies: 4, digitalFiles: 0, recordCode: "BIB-0000964", recordStatus: "Cần bổ sung" },
  { id: 406, title: "Thiết kế trải nghiệm người dùng", author: "Lê Thu Trang", year: "2025", type: "Giáo trình", rating: 4, available: true, code: "004.2", cover: "cover-slate", isbn: "978-604-67-3022-9", copies: 6, digitalFiles: 2, recordCode: "BIB-0002356", recordStatus: "Đã xuất bản" },
];
