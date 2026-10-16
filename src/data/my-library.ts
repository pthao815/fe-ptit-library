import type { Book } from "../types/library";
import { relatedSimilar, fieldBooks, newBooks, relatedBorrowed } from "./books";

export const loanBooks: Array<Book & { borrowed: string; due: string; days: number; renewable: boolean }> = [
  { id: 301, title: "Cấu trúc dữ liệu và giải thuật", author: "Nguyễn Đức Nghĩa", year: "2023", type: "Giáo trình", rating: 5, available: false, code: "005.73", cover: "cover-red", borrowed: "12/06/2025", due: "10/07/2025", days: 12, renewable: true },
  { id: 302, title: "Mạng máy tính và hệ thống phân tán", author: "Lê Nhật Quang", year: "2024", type: "Sách chuyên khảo", rating: 4, available: false, code: "004.6", cover: "cover-charcoal", borrowed: "28/05/2025", due: "25/06/2025", days: -3, renewable: false },
  { id: 303, title: "Nhập môn Khoa học dữ liệu", author: "Trần Đức Khánh", year: "2023", type: "Giáo trình", rating: 4, available: false, code: "006.3", cover: "cover-sand", borrowed: "08/06/2025", due: "06/07/2025", days: 8, renewable: true },
];

export const reservedBooks = [
  { ...relatedSimilar[0], id: 311, position: "02", reserved: "18/06/2025", status: "Đang chờ", expiration: "Chưa xác định" },
  { ...relatedSimilar[1], id: 312, position: "Sẵn sàng", reserved: "11/06/2025", status: "Chờ nhận", expiration: "30/06/2025 · 17:00" },
];

export const shelfGroups: Record<string, Book[]> = {
  "Muốn đọc": [fieldBooks[0], newBooks[1], relatedSimilar[2]],
  "Đang đọc": [relatedBorrowed[0], newBooks[2]],
  "Đã đọc": [fieldBooks[1], relatedBorrowed[1], relatedBorrowed[2]],
};

export const loanHistory = [
  { ...relatedBorrowed[0], id: 321, borrowed: "03/04/2025", returned: "28/04/2025", returnStatus: "Đã trả đúng hạn", historyRating: 5 },
  { ...newBooks[2], id: 322, borrowed: "11/03/2025", returned: "10/04/2025", returnStatus: "Trả muộn 2 ngày", historyRating: 4 },
  { ...fieldBooks[3], id: 323, borrowed: "14/01/2025", returned: "08/02/2025", returnStatus: "Đã trả đúng hạn", historyRating: 0 },
];
