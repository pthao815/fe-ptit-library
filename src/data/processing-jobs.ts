export type ProcessingJob = {
  id: number;
  title: string;
  record: string;
  file: string;
  size: string;
  status: "Đang chờ" | "Đang xử lý" | "Hoàn thành" | "Lỗi";
  progress: number;
  started: string;
  completed: string;
  stage: string;
};

export const initialProcessingJobs: ProcessingJob[] = [
  { id: 501, title: "Trí tuệ nhân tạo trong đổi mới giáo dục đại học", record: "BIB-0001842", file: "tri-tue-nhan-tao-giao-duc.pdf", size: "24.8 MB", status: "Hoàn thành", progress: 100, started: "22/06/2025 · 08:32", completed: "22/06/2025 · 08:39", stage: "Đã lập chỉ mục" },
  { id: 502, title: "Mạng máy tính và hệ thống phân tán", record: "BIB-0002016", file: "mang-may-tinh-phan-tan.pdf", size: "18.2 MB", status: "Đang xử lý", progress: 68, started: "22/06/2025 · 09:14", completed: "—", stage: "Tạo biểu diễn nội dung" },
  { id: 503, title: "Nghiên cứu ứng dụng AI tạo sinh", record: "BIB-0002431", file: "bao-cao-ai-tao-sinh-2025.pdf", size: "31.6 MB", status: "Đang xử lý", progress: 42, started: "22/06/2025 · 09:26", completed: "—", stage: "Phân đoạn tài liệu" },
  { id: 504, title: "An toàn thông tin trong kỷ nguyên số", record: "BIB-0000964", file: "an-toan-thong-tin-scan.pdf", size: "46.1 MB", status: "Lỗi", progress: 18, started: "22/06/2025 · 08:47", completed: "22/06/2025 · 08:49", stage: "Không thể trích xuất văn bản" },
  { id: 505, title: "Thiết kế trải nghiệm người dùng", record: "BIB-0002356", file: "thiet-ke-trai-nghiem-nguoi-dung.pdf", size: "12.4 MB", status: "Đang chờ", progress: 0, started: "—", completed: "—", stage: "Chờ tài nguyên xử lý" },
  { id: 506, title: "Giáo trình xử lý tín hiệu số", record: "BIB-0001528", file: "xu-ly-tin-hieu-so.pdf", size: "28.7 MB", status: "Hoàn thành", progress: 100, started: "22/06/2025 · 07:51", completed: "22/06/2025 · 08:02", stage: "Đã lập chỉ mục" },
];
