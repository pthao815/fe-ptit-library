import type { Book } from "../types/library";

export type SearchResult = Book & {
  publisher: string;
  identifier: string;
  subject: string;
  description: string;
  copies: number;
  digital: boolean;
};

export const searchResults: SearchResult[] = [
  {
    id: 101,
    title: "Trí tuệ nhân tạo – Cơ sở và ứng dụng",
    author: "Nguyễn Thanh Bình",
    year: "2024",
    type: "Sách",
    rating: 5,
    available: true,
    code: "006.3",
    cover: "cover-red",
    publisher: "Nhà xuất bản Khoa học và Kỹ thuật",
    identifier: "ISBN 978-604-67-2501-8",
    subject: "Công nghệ thông tin",
    description: "Trình bày các nền tảng, phương pháp và bài toán ứng dụng tiêu biểu của trí tuệ nhân tạo trong thực tiễn.",
    copies: 3,
    digital: true,
  },
  {
    id: 102,
    title: "Nhập môn học máy",
    author: "Trần Minh Đức",
    year: "2023",
    type: "Giáo trình",
    rating: 4,
    available: false,
    code: "006.31",
    cover: "cover-charcoal",
    publisher: "Nhà xuất bản Đại học Quốc gia Hà Nội",
    identifier: "ISBN 978-604-342-881-3",
    subject: "Công nghệ thông tin",
    description: "Giáo trình nhập môn về học có giám sát, học không giám sát và các kỹ thuật đánh giá mô hình.",
    copies: 0,
    digital: false,
  },
  {
    id: 103,
    title: "Ứng dụng học sâu trong xử lý ngôn ngữ tự nhiên",
    author: "Lê Hoàng Nam",
    year: "2025",
    type: "Sách",
    rating: 5,
    available: true,
    code: "006.35",
    cover: "cover-sand",
    publisher: "Nhà xuất bản Bách khoa Hà Nội",
    identifier: "ISBN 978-604-471-092-4",
    subject: "Trí tuệ nhân tạo",
    description: "Khảo sát mô hình học sâu hiện đại và cách ứng dụng trong phân loại văn bản, dịch máy và hỏi đáp tự động.",
    copies: 2,
    digital: true,
  },
  {
    id: 104,
    title: "Khai phá dữ liệu và ứng dụng",
    author: "Phạm Thu Hà",
    year: "2022",
    type: "Giáo trình",
    rating: 4,
    available: false,
    code: "005.74",
    cover: "cover-slate",
    publisher: "Nhà xuất bản Thông tin và Truyền thông",
    identifier: "ISBN 978-604-80-7012-4",
    subject: "Công nghệ thông tin",
    description: "Cung cấp kiến thức về tiền xử lý dữ liệu, phân lớp, gom cụm và khai phá mẫu trong các tập dữ liệu lớn.",
    copies: 0,
    digital: true,
  },
];

export type ContentSearchResult = Book & {
  relevance: number;
  classification: string;
  snippetBefore: string;
  snippetMatch: string;
  snippetAfter: string;
  location: string;
  copies: string;
  shelf: string;
  digital: boolean;
  borrows: number;
  communityRating: string;
};

export const contentSearchResults: ContentSearchResult[] = [
  {
    id: 301, title: "Trí tuệ nhân tạo trong đổi mới giáo dục đại học", author: "Nguyễn Thị Lan Hương", year: "2024", type: "Sách chuyên khảo", rating: 5, available: true, code: "378.173", cover: "cover-red",
    relevance: 96, classification: "378.173 NG-H 2024", snippetBefore: "Kết quả nghiên cứu cho thấy ", snippetMatch: "ứng dụng AI trong giáo dục đại học", snippetAfter: " đang tạo ra những thay đổi đáng kể trong phương pháp giảng dạy, đánh giá và hỗ trợ người học theo hướng cá nhân hóa.", location: "Trang 42 · Chương 3 · Ứng dụng AI", copies: "3 / 5 bản có sẵn", shelf: "Kệ A2-03", digital: true, borrows: 24, communityRating: "4.7",
  },
  {
    id: 302, title: "Chuyển đổi số và tương lai của giáo dục", author: "Trần Minh Tuấn, Phạm Thu Hà", year: "2023", type: "Tài liệu hội thảo", rating: 4, available: true, code: "370.285", cover: "cover-charcoal",
    relevance: 91, classification: "370.285 TR-T 2023", snippetBefore: "Trong bối cảnh chuyển đổi số, ", snippetMatch: "trí tuệ nhân tạo tác động đến giáo dục đại học", snippetAfter: " không chỉ ở công nghệ mà còn ở mô hình quản trị, năng lực giảng viên và cách thức kiến tạo tri thức.", location: "Trang 18 · Phần 2 · Chuyển đổi mô hình đào tạo", copies: "1 / 2 bản có sẵn", shelf: "Kệ B1-12", digital: true, borrows: 37, communityRating: "4.5",
  },
  {
    id: 303, title: "Cá nhân hóa học tập bằng công nghệ AI", author: "Lê Hoàng Anh", year: "2024", type: "Luận án tiến sĩ", rating: 5, available: false, code: "371.334", cover: "cover-slate",
    relevance: 87, classification: "LA 371.334 LE-A 2024", snippetBefore: "Các hệ thống học tập thích ứng sử dụng dữ liệu để ", snippetMatch: "cá nhân hóa trải nghiệm giáo dục đại học", snippetAfter: ", đồng thời cung cấp cho giảng viên những chỉ báo sớm về tiến độ và nhu cầu hỗ trợ của sinh viên.", location: "Trang 76 · Chương 4 · Mô hình học tập thích ứng", copies: "0 / 1 bản có sẵn", shelf: "Kho luận án LA-04", digital: true, borrows: 12, communityRating: "4.8",
  },
];
