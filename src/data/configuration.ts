import type { Policy, PenaltyType, SearchConfig, UserType } from "../types/configuration";

export const userTypeLabels: Record<UserType, string> = {
  STUDENT: "Sinh viên", LECTURER: "Giảng viên", RESEARCHER: "Nghiên cứu viên", STAFF: "Cán bộ",
};
// Mã loại tài liệu minh họa cho demo; không phải danh mục đã xác nhận từ database.
export const initialPolicies: Policy[] = [
  { id: 1, userType: "STUDENT", docType: "BOOK", loanDays: 14, maxLoans: 5, maxRenewals: 2, holdExpiryDays: 3 },
  { id: 2, userType: "LECTURER", docType: "BOOK", loanDays: 30, maxLoans: 10, maxRenewals: 3, holdExpiryDays: 5 },
  { id: 3, userType: "RESEARCHER", docType: "THESIS", loanDays: 21, maxLoans: 4, maxRenewals: 1, holdExpiryDays: 3 },
  { id: 4, userType: "STAFF", docType: "BOOK", loanDays: 21, maxLoans: 6, maxRenewals: 2, holdExpiryDays: 3 },
];
export const initialPenaltyTypes: PenaltyType[] = [
  { id: 1, code: "LATE", name: "Trả tài liệu quá hạn", unitName: "ngày", unitPrice: 5000 },
  { id: 2, code: "DAMAGED", name: "Làm hư hỏng tài liệu", unitName: "cuốn", unitPrice: 50000 },
  { id: 3, code: "LOST", name: "Làm mất tài liệu", unitName: "cuốn", unitPrice: 150000 },
];
export const initialSearchConfigs: SearchConfig[] = [
  { id: 1, chunkSize: 512, overlap: 64, strategy: "fixed", embeddingModel: "demo-vietnamese-encoder-v1", vectorDimensions: 768, isActive: true },
  { id: 2, chunkSize: 768, overlap: 96, strategy: "recursive", embeddingModel: "demo-multilingual-encoder-v2", vectorDimensions: 1024, isActive: false },
  { id: 3, chunkSize: 256, overlap: 32, strategy: "fixed", embeddingModel: "demo-compact-encoder", vectorDimensions: 384, isActive: false },
];
