import type { Book } from "../types/library";

export const fieldBooks: Book[] = [
  { id: 1, title: "Trí tuệ nhân tạo: Nền tảng và ứng dụng", author: "Nguyễn Thanh Thủy", year: "2024", type: "Sách chuyên khảo", rating: 5, available: true, code: "005.1", cover: "cover-red" },
  { id: 2, title: "Nhập môn Khoa học dữ liệu", author: "Trần Đức Khánh", year: "2023", type: "Giáo trình", rating: 4, available: true, code: "006.3", cover: "cover-charcoal" },
  { id: 3, title: "Mạng máy tính và hệ thống phân tán", author: "Lê Nhật Quang", year: "2024", type: "Tài liệu số", rating: 4, available: true, code: "004.6", cover: "cover-sand" },
  { id: 4, title: "An toàn thông tin trong kỷ nguyên số", author: "Phạm Văn Cường", year: "2022", type: "Sách tham khảo", rating: 5, available: false, code: "005.8", cover: "cover-slate" },
];

export const recommendationBooks = [
  { ...fieldBooks[0], id: 11, reason: "Phù hợp với ngành Công nghệ thông tin", relevance: 96 },
  { ...fieldBooks[2], id: 12, title: "Xử lý ngôn ngữ tự nhiên", author: "Vũ Hải Quân", reason: "Dựa trên lịch sử mượn của bạn", relevance: 91, cover: "cover-slate" },
  { ...fieldBooks[1], id: 13, title: "Học máy: Từ lý thuyết đến thực hành", author: "Đỗ Thanh Hà", reason: "Có nội dung tương đồng với tài liệu bạn đã đọc", relevance: 88, cover: "cover-red" },
];

export const newBooks: Book[] = [
  { id: 21, title: "Điện toán đám mây hiện đại", author: "Ngô Quang Hưng", year: "2025", type: "Giáo trình", rating: 4, available: true, code: "004.7", cover: "cover-charcoal" },
  { id: 22, title: "Kỹ thuật phần mềm hướng dịch vụ", author: "Đặng Minh Tuấn", year: "2025", type: "Tài liệu số", rating: 5, available: true, code: "005.3", cover: "cover-sand" },
  { id: 23, title: "Thiết kế trải nghiệm người dùng", author: "Lê Thu Trang", year: "2025", type: "Sách tham khảo", rating: 4, available: true, code: "004.2", cover: "cover-slate" },
  { id: 24, title: "Internet vạn vật và ứng dụng", author: "Phan Minh Đức", year: "2025", type: "Sách chuyên khảo", rating: 4, available: false, code: "004.6", cover: "cover-red" },
];

export const detailBook: Book = {
  id: 201,
  title: "Trí tuệ nhân tạo trong đổi mới giáo dục đại học",
  author: "Nguyễn Thị Lan Hương",
  year: "2024",
  type: "Sách chuyên khảo",
  rating: 5,
  available: true,
  code: "378.173",
  cover: "cover-red",
};

export const relatedSimilar: Book[] = [
  { id: 211, title: "Cá nhân hóa học tập bằng công nghệ AI", author: "Lê Hoàng Anh", year: "2024", type: "Luận án tiến sĩ", rating: 5, available: false, code: "371.334", cover: "cover-slate" },
  { id: 212, title: "Chuyển đổi số và tương lai của giáo dục", author: "Trần Minh Tuấn", year: "2023", type: "Tài liệu hội thảo", rating: 4, available: true, code: "370.285", cover: "cover-charcoal" },
  { id: 213, title: "Dữ liệu lớn trong quản trị đại học", author: "Phạm Thu Hà", year: "2024", type: "Sách tham khảo", rating: 4, available: true, code: "378.1", cover: "cover-sand" },
];

export const relatedBorrowed: Book[] = [
  { id: 221, title: "Học máy: Từ lý thuyết đến thực hành", author: "Đỗ Thanh Hà", year: "2023", type: "Giáo trình", rating: 5, available: true, code: "006.31", cover: "cover-charcoal" },
  { id: 222, title: "Thiết kế trải nghiệm học tập số", author: "Lê Thu Trang", year: "2024", type: "Sách chuyên khảo", rating: 4, available: true, code: "371.33", cover: "cover-red" },
  { id: 223, title: "Nghiên cứu khoa học trong kỷ nguyên số", author: "Vũ Minh Đức", year: "2022", type: "Sách tham khảo", rating: 4, available: false, code: "001.42", cover: "cover-slate" },
];
