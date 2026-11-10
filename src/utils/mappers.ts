import type { CatalogRecord } from "../data/catalog";
import type { LibraryNotification } from "../data/notifications";
import type { ManagedReader } from "../data/readers";
import type { ContentSearchResult, SearchResult } from "../data/search-results";
import type {
  CirculationHistoryItemDto,
  ContentSearchResultDto,
  DocumentDetailDto,
  DocumentSummaryDto,
  MessageQueueDto,
  RecommendationItemDto,
  UserDto,
} from "../types/api";
import type { Book } from "../types/library";

const COVER_PALETTE = ["cover-red", "cover-charcoal", "cover-sand", "cover-slate"] as const;

export function pickCoverByIndex(index: number, coverUrl?: string): string {
  if (coverUrl && coverUrl.startsWith("cover-")) return coverUrl;
  return COVER_PALETTE[Math.abs(index) % COVER_PALETTE.length];
}

export function formatDocTypeLabel(docType?: string): string {
  if (!docType) return "Sách chuyên khảo";
  const upper = docType.toUpperCase();
  if (upper === "TEXTBOOK" || upper === "GIAO_TRINH") return "Giáo trình";
  if (upper === "BOOK" || upper === "MONOGRAPH") return "Sách chuyên khảo";
  if (upper === "REFERENCE") return "Sách tham khảo";
  if (upper === "SLIDE" || upper === "LECTURE") return "Bài giảng";
  if (upper === "THESIS" || upper === "DISSERTATION") return "Luận án tiến sĩ";
  if (upper === "DIGITAL") return "Tài liệu số";
  return docType;
}

export function formatDateVi(isoString?: string): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTimeVi(isoString?: string): string {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  const datePart = date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

export function mapDocumentSummaryToBook(dto: DocumentSummaryDto, index = 0): Book {
  return {
    id: index + 1000,
    documentId: dto.id,
    title: dto.title,
    author: dto.authors?.length ? dto.authors.join(", ") : "Chưa cập nhật tác giả",
    year: dto.publicationYear?.toString() ?? "—",
    type: formatDocTypeLabel(dto.docType),
    rating: 5,
    available: dto.availablePhysicalCopies > 0 || dto.hasDigitalCopy,
    code: dto.id.slice(0, 6).toUpperCase(),
    cover: pickCoverByIndex(index, dto.coverUrl),
  };
}

export function mapDocumentDetailToBook(dto: DocumentDetailDto, index = 0): Book {
  return {
    id: index + 2000,
    documentId: dto.id,
    digitalCopyId: dto.digitalCopyId,
    title: dto.title,
    author: dto.authors?.length ? dto.authors.join(", ") : "Chưa cập nhật tác giả",
    year: dto.publicationYear ? String(dto.publicationYear) : "2024",
    type: formatDocTypeLabel(dto.docType),
    rating: dto.averageRating ? Math.round(dto.averageRating) : 5,
    available: dto.availablePhysicalCopies > 0 || dto.hasDigitalCopy,
    code: dto.classificationNumber || dto.id.slice(0, 6).toUpperCase(),
    cover: pickCoverByIndex(index, dto.coverUrl),
  };
}

export function mapRecommendationToBook(
  dto: RecommendationItemDto,
  index = 0,
): Book & { reason: string; relevance: number } {
  const relevance = dto.score
    ? Math.min(99, Math.max(70, Math.round(dto.score <= 1 ? dto.score * 100 : dto.score)))
    : 92 - index * 3;
  return {
    id: index + 3000,
    documentId: dto.documentId,
    title: dto.title,
    author: "Học viện Công nghệ Bưu chính Viễn thông",
    year: "2024",
    type: formatDocTypeLabel(dto.docType),
    rating: 5,
    available: true,
    code: dto.documentId.slice(0, 6).toUpperCase(),
    cover: pickCoverByIndex(index),
    reason: dto.reason || "Gợi ý cá nhân hóa dựa trên hồ sơ học tập của bạn",
    relevance,
  };
}

export function mapDocumentSummaryToSearchResult(
  dto: DocumentSummaryDto,
  index = 0,
): SearchResult {
  const base = mapDocumentSummaryToBook(dto, index);
  return {
    ...base,
    publisher: "—",
    identifier: `ID ${dto.id.slice(0, 8).toUpperCase()}`,
    available: dto.availablePhysicalCopies > 0,
    subject: formatDocTypeLabel(dto.docType),
    description:
      dto.abstractText ||
      "Chưa có tóm tắt.",
    copies: Number(dto.availablePhysicalCopies ?? 0),
    digital: Boolean(dto.hasDigitalCopy),
  };
}

export function mapContentSearchDtoToViewModel(
  dto: ContentSearchResultDto,
  query: string,
  index = 0,
): ContentSearchResult {
  const text = dto.chunkText || "";
  const cleanQuery = query.trim();
  const matchIdx = cleanQuery ? text.toLowerCase().indexOf(cleanQuery.toLowerCase()) : -1;

  let snippetBefore = "";
  let snippetMatch = cleanQuery || text.slice(0, 48);
  let snippetAfter = text;

  if (matchIdx >= 0 && cleanQuery.length > 0) {
    snippetBefore = text.slice(Math.max(0, matchIdx - 60), matchIdx);
    snippetMatch = text.slice(matchIdx, matchIdx + cleanQuery.length);
    snippetAfter = text.slice(matchIdx + cleanQuery.length, matchIdx + cleanQuery.length + 160);
  } else if (text.length > 48) {
    snippetBefore = "";
    snippetMatch = text.slice(0, 48);
    snippetAfter = text.slice(48, 220);
  }

  const locationParts = [
    dto.pageNumber ? `Trang ${dto.pageNumber}` : null,
    dto.chapter || null,
    dto.section || null,
  ].filter(Boolean);

  const rawScore = dto.relevanceScore ?? 0.9;
  const relevance = Math.min(
    99,
    Math.max(60, Math.round(rawScore <= 1 ? rawScore * 100 : rawScore)),
  );

  return {
    id: index + 4000,
    documentId: dto.documentId,
    title: dto.documentTitle,
    author: "Tài liệu số PTIT",
    year: "2024",
    type: "Tài liệu số",
    rating: 5,
    available: dto.availablePhysicalCopies > 0,
    code: dto.documentId.slice(0, 6).toUpperCase(),
    cover: pickCoverByIndex(index),
    relevance,
    classification: dto.shelfLocation || "KHO-SO-PTIT",
    snippetBefore,
    snippetMatch,
    snippetAfter,
    location: locationParts.length ? locationParts.join(" · ") : "Trang 1 · Nội dung trích xuất",
    copies: `${dto.availablePhysicalCopies} bản có sẵn`,
    shelf: dto.shelfLocation || "Bản số trực tuyến",
    digital: true,
    borrows: 15 + index * 4,
    communityRating: "4.8",
  };
}

export function mapDocumentSummaryToCatalogRecord(
  dto: DocumentSummaryDto,
  index = 0,
): CatalogRecord {
  const base = mapDocumentSummaryToBook(dto, index);
  return {
    ...base,
    isbn: `ID-${dto.id.slice(0, 8).toUpperCase()}`,
    copies: Number(dto.totalPhysicalCopies ?? 0),
    digitalFiles: dto.hasDigitalCopy ? 1 : 0,
    recordCode: `BIB-${dto.id.slice(0, 7).toUpperCase()}`,
    recordStatus:
      dto.totalPhysicalCopies > 0 || dto.hasDigitalCopy ? "Đã xuất bản" : "Cần bổ sung",
  };
}

export function mapCirculationItemToLoanBook(
  dto: CirculationHistoryItemDto,
  index = 0,
): Book & {
  circulationId: number;
  barcode: string;
  borrowed: string;
  due: string;
  days: number;
  renewable: boolean;
} {
  const dueMs = new Date(dto.dueDate).getTime();
  const diffDays = Number.isNaN(dueMs)
    ? 7
    : Math.ceil((dueMs - Date.now()) / (1000 * 60 * 60 * 24));
  return {
    id: dto.circulationId || index + 5000,
    circulationId: dto.circulationId,
    barcode: dto.barcode,
    documentId: dto.documentId,
    title: dto.documentTitle,
    author: dto.callNumber || `Mã vạch: ${dto.barcode}`,
    year: "2024",
    type: "Sách mượn",
    rating: 5,
    available: false,
    code: dto.callNumber || dto.barcode,
    cover: pickCoverByIndex(index),
    borrowed: formatDateVi(dto.borrowDate),
    due: formatDateVi(dto.dueDate),
    days: diffDays,
    renewable: dto.status !== "OVERDUE" && dto.renewalsCount < 2,
  };
}

export function mapCirculationItemToHistoryBook(
  dto: CirculationHistoryItemDto,
  index = 0,
): Book & {
  borrowed: string;
  returned: string;
  returnStatus: string;
  historyRating: number;
} {
  return {
    id: dto.circulationId || index + 6000,
    documentId: dto.documentId,
    title: dto.documentTitle,
    author: dto.callNumber || `Mã vạch: ${dto.barcode}`,
    year: "2024",
    type: "Sách mượn",
    rating: 5,
    available: true,
    code: dto.callNumber || dto.barcode,
    cover: pickCoverByIndex(index),
    borrowed: formatDateVi(dto.borrowDate),
    returned: formatDateVi(dto.returnDate || dto.dueDate),
    returnStatus:
      dto.fineAmount > 0
        ? `Phí phạt: ${dto.fineAmount.toLocaleString("vi-VN")} đ`
        : "Đã trả đúng hạn",
    historyRating: 5,
  };
}

export function mapUserDtoToManagedReader(
  dto: UserDto,
  index = 0,
): ManagedReader & { userId: string } {
  const statusUpper = (dto.status || "ACTIVE").toUpperCase();
  const cardStatus: ManagedReader["cardStatus"] =
    statusUpper === "LOCKED" || statusUpper === "SUSPENDED" || statusUpper === "INACTIVE"
      ? "Bị khóa"
      : "Hoạt động";

  const userTypeUpper = (dto.userType || "STUDENT").toUpperCase();
  const typeLabel =
    userTypeUpper === "LECTURER" || userTypeUpper === "STAFF"
      ? "Cán bộ, giảng viên"
      : userTypeUpper === "RESEARCHER"
        ? "Nghiên cứu sinh"
        : "Sinh viên chính quy";

  return {
    id: index + 700,
    userId: dto.id,
    code: dto.userCode || `USER-${dto.id.slice(0, 6).toUpperCase()}`,
    name: dto.fullName || dto.email,
    type: typeLabel,
    program: dto.departmentName || "Học viện Công nghệ Bưu chính Viễn thông",
    cardStatus,
    loans: 0,
    debt: Number(dto.debt ?? 0),
    email: dto.email || "—",
    phone: dto.phone || "Chưa cập nhật",
    birthDate: dto.enrollmentYear ? `Khóa ${dto.enrollmentYear}` : "—",
    cardExpiry: dto.cardExpiry ? formatDateVi(dto.cardExpiry) : "31/12/2027",
    lockReason: dto.lockReason,
    lockUntil: cardStatus === "Bị khóa" ? "Đến khi được mở khóa thẻ" : undefined,
  };
}

export function mapMessageQueueToNotification(dto: MessageQueueDto): LibraryNotification {
  const typeUpper = (dto.messageType || "").toUpperCase();
  const isOverdue = typeUpper.includes("OVERDUE") || typeUpper.includes("DUE");
  const isHold = typeUpper.includes("HOLD") || typeUpper.includes("READY");

  return {
    id: String(dto.id),
    title: isOverdue
      ? "Thông báo nhắc hạn trả tài liệu"
      : isHold
        ? "Thông báo đặt trước tài liệu"
        : "Thông báo từ Thư viện số PTIT",
    category: isOverdue ? "MƯỢN VÀ TRẢ TÀI LIỆU" : "THÔNG BÁO HỆ THỐNG",
    relativeTime: formatDateVi(dto.sentAt || dto.createdAt),
    sentAt: formatDateTimeVi(dto.sentAt || dto.createdAt),
    unread: dto.status !== "READ",
    icon: isOverdue ? "book" : isHold ? "bookmark" : "success",
    tone: isOverdue ? "warning" : isHold ? "brand" : "success",
    intro: dto.content,
    details: [
      { label: "Mã thông báo", value: `#MSG-${dto.id}` },
      { label: "Kênh gửi", value: dto.channel || "Hệ thống" },
      { label: "Thời gian", value: formatDateTimeVi(dto.sentAt || dto.createdAt) },
      { label: "Trạng thái", value: dto.status || "Đã gửi" },
    ],
    relatedTitle: "Thư viện số thông minh PTIT",
    relatedSubtitle: dto.content,
    actionLabel: "Xem tủ sách của tôi",
    actionPath: "/reader/my-library",
  };
}
