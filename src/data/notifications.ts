export type LibraryNotification = {
  id: string;
  title: string;
  category: string;
  relativeTime: string;
  sentAt: string;
  unread: boolean;
  icon: "book" | "bookmark" | "success";
  tone: "brand" | "warning" | "success";
  intro: string;
  details: Array<{ label: string; value: string }>;
  relatedTitle: string;
  relatedSubtitle: string;
  actionLabel?: string;
  actionPath?: string;
  expired?: boolean;
};

export const libraryNotifications: Record<string, LibraryNotification> = {
  due: {
    id: "due",
    title: "Tài liệu sắp đến hạn trả",
    category: "MƯỢN VÀ TRẢ TÀI LIỆU",
    relativeTime: "2 giờ trước",
    sentAt: "13/10/2026 · 09:30",
    unread: true,
    icon: "book",
    tone: "warning",
    intro: "Bạn có tài liệu sắp đến hạn trả. Vui lòng kiểm tra thông tin bên dưới và hoàn tất việc trả tài liệu đúng hạn để tránh phát sinh phí phạt theo quy định của thư viện.",
    details: [
      { label: "Tên tài liệu", value: "Nhập môn Trí tuệ nhân tạo" },
      { label: "Ngày mượn", value: "05/10/2026" },
      { label: "Hạn trả", value: "15/10/2026" },
      { label: "Trạng thái", value: "Sắp đến hạn" },
    ],
    relatedTitle: "Nhập môn Trí tuệ nhân tạo",
    relatedSubtitle: "Giáo trình · Nguyễn Văn A · 2024",
    actionLabel: "Xem chi tiết khoản mượn",
    actionPath: "/reader/my-library",
  },
  reserved: {
    id: "reserved",
    title: "Đặt trước tài liệu thành công",
    category: "ĐẶT TRƯỚC TÀI LIỆU",
    relativeTime: "Hôm qua",
    sentAt: "12/10/2026 · 14:20",
    unread: false,
    icon: "bookmark",
    tone: "brand",
    intro: "Yêu cầu đặt trước của bạn đã được ghi nhận. Thư viện sẽ thông báo khi tài liệu có bản sẵn sàng để nhận.",
    details: [
      { label: "Tên tài liệu", value: "Khai phá dữ liệu và ứng dụng" },
      { label: "Ngày đặt trước", value: "12/10/2026" },
      { label: "Vị trí hàng chờ", value: "02" },
      { label: "Trạng thái", value: "Đang chờ" },
    ],
    relatedTitle: "Khai phá dữ liệu và ứng dụng",
    relatedSubtitle: "Giáo trình · Phạm Thu Hà · 2022",
    actionLabel: "Xem yêu cầu đặt trước",
    actionPath: "/reader/my-library/reservations",
  },
  ready: {
    id: "ready",
    title: "Tài liệu đã sẵn sàng để nhận",
    category: "ĐẶT TRƯỚC TÀI LIỆU",
    relativeTime: "2 ngày trước",
    sentAt: "11/10/2026 · 10:05",
    unread: true,
    icon: "success",
    tone: "success",
    intro: "Tài liệu bạn đặt trước hiện đã sẵn sàng. Vui lòng đến quầy lưu thông trong thời hạn giữ tài liệu được thông báo bên dưới.",
    details: [
      { label: "Tên tài liệu", value: "Trí tuệ nhân tạo – Cơ sở và ứng dụng" },
      { label: "Trạng thái", value: "Chờ nhận" },
      { label: "Địa điểm nhận", value: "Quầy lưu thông" },
      { label: "Thời hạn giữ", value: "15/10/2026 · 17:00" },
    ],
    relatedTitle: "Trí tuệ nhân tạo – Cơ sở và ứng dụng",
    relatedSubtitle: "Sách chuyên khảo · Nguyễn Thanh Bình · 2024",
    actionLabel: "Xem thông tin tài liệu",
    actionPath: "/reader/book-detail",
  },
  expired: {
    id: "expired",
    title: "Yêu cầu đặt trước đã hết hiệu lực",
    category: "ĐẶT TRƯỚC TÀI LIỆU",
    relativeTime: "7 ngày trước",
    sentAt: "06/10/2026 · 17:05",
    unread: false,
    icon: "bookmark",
    tone: "warning",
    intro: "Thời hạn nhận tài liệu đã kết thúc. Yêu cầu đặt trước này không còn hiệu lực và không thể tiếp tục xử lý.",
    details: [
      { label: "Tên tài liệu", value: "Mạng máy tính và hệ thống phân tán" },
      { label: "Trạng thái hiện tại", value: "Đã hết hiệu lực" },
    ],
    relatedTitle: "Mạng máy tính và hệ thống phân tán",
    relatedSubtitle: "Sách chuyên khảo · Lê Nhật Quang · 2024",
    expired: true,
  },
};
