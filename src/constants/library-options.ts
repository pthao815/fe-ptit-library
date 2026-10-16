export const filterGroups = [
  { title: "Loại tài liệu", options: ["Tất cả", "Sách", "Giáo trình", "Luận văn / Luận án", "Bài báo / Tạp chí", "Tài liệu điện tử"] },
  { title: "Tình trạng tài liệu", options: ["Có thể mượn", "Có bản điện tử", "Đang được mượn"] },
  { title: "Ngôn ngữ", options: ["Tiếng Việt", "Tiếng Anh", "Ngôn ngữ khác"] },
  { title: "Chương trình đào tạo / lĩnh vực", options: ["Công nghệ thông tin", "Kỹ thuật điện tử viễn thông", "An toàn thông tin", "Quản trị kinh doanh"] },
];

export const contentFilterGroups = [
  { title: "Ngành đào tạo", options: ["Công nghệ thông tin", "Khoa học máy tính", "Công nghệ giáo dục"] },
  { title: "Dạng tài liệu", options: ["Sách", "Luận án, luận văn", "Bài báo khoa học", "Tài liệu hội thảo"] },
  { title: "Ngôn ngữ", options: ["Tiếng Việt", "Tiếng Anh"] },
  { title: "Năm xuất bản", options: ["2025", "2024", "2023", "Trước 2023"] },
  { title: "Tình trạng sẵn có", options: ["Có sẵn tại thư viện", "Có thể đặt trước"] },
];

export const reviewLabels = ["Rất không hài lòng", "Không hài lòng", "Bình thường", "Hài lòng", "Rất hài lòng"];

export const libraryTabs = ["Đang mượn", "Lịch sử mượn", "Đặt trước", "Muốn đọc", "Đang đọc", "Đã đọc"];

export const circulationTabs = ["Cho mượn", "Nhận trả", "Gia hạn"];

export const trainingPrograms = [
  "Công nghệ thông tin",
  "Khoa học máy tính",
  "An toàn thông tin",
  "Điện tử viễn thông",
  "Công nghệ đa phương tiện",
  "Quản trị kinh doanh",
  "Thương mại điện tử",
];

export const pipelineSteps = [
  { title: "Upload", description: "Tệp được tải lên và kiểm tra định dạng", status: "complete" },
  { title: "Extract text", description: "Trích xuất văn bản và nhận dạng OCR", status: "complete" },
  { title: "Preprocess", description: "Chuẩn hóa ký tự và loại bỏ nhiễu", status: "complete" },
  { title: "Segment document", description: "Phân tách chương, mục và đoạn văn", status: "complete" },
  { title: "Generate representation", description: "Tạo biểu diễn ngữ nghĩa cho nội dung", status: "processing" },
  { title: "Index", description: "Đưa dữ liệu vào chỉ mục tìm kiếm", status: "waiting" },
];
