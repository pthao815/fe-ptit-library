export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc" | "ASC" | "DESC";
}

// --- Module 1: Auth & Users ---
export type BackendRole = "READER" | "LIBRARIAN" | "ADMIN";
export type BackendUserType = "STUDENT" | "LECTURER" | "RESEARCHER" | "STAFF";

export interface UserDto {
  id: string;
  userCode: string;
  fullName: string;
  email: string;
  role: BackendRole | string;
  userType: BackendUserType | string;
  departmentId?: number;
  departmentName?: string;
  enrollmentYear?: number;
  status: string;
  cardExpiry?: string;
  phone?: string;
  address?: string;
  lockReason?: string;
  debt?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
  loginMethod?: string;
}

export interface RegisterRequest {
  userCode: string;
  fullName: string;
  email: string;
  password: string;
  userType?: string;
  departmentId?: number;
  enrollmentYear?: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserDto;
}

export interface UserProfileResponse {
  id: string;
  fullName: string;
  userCode: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  userType: string;
  departmentId?: number;
  departmentName?: string;
  enrollmentYear?: number;
  status: string;
  cardExpiry?: string;
  debt?: number;
}

export interface UpdateProfileRequest {
  phone?: string;
  address?: string;
}

export interface UserFilterParams extends PaginationParams {
  keyword?: string;
  departmentId?: number;
  status?: string;
  userType?: string;
  role?: string;
}

export interface UpdateUserStatusRequest {
  status: string;
  reason?: string;
}

export interface DepartmentDto {
  id: number;
  code: string;
  name: string;
}

// --- Module 2: Catalog & Documents ---
export interface DocumentSummaryDto {
  id: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  abstractText?: string;
  docType?: string;
  publicationYear?: number;
  totalPhysicalCopies: number;
  availablePhysicalCopies: number;
  hasDigitalCopy: boolean;
}

export interface DocumentDetailDto {
  id: string;
  title: string;
  isbn?: string;
  authors: string[];
  publisher?: string;
  publicationYear?: number;
  language?: string;
  docType?: string;
  classificationNumber?: string;
  abstractText?: string;
  coverUrl?: string;
  origin?: string;
  physicalDescription?: string;
  metadata?: Record<string, unknown>;
  departmentIds?: number[];
  departmentNames?: string[];
  totalPhysicalCopies: number;
  availablePhysicalCopies: number;
  hasDigitalCopy: boolean;
  digitalCopyId?: string;
  digitalFileName?: string;
  digitalProcessingStatus?: string;
  pageCount?: number;
  averageRating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentFilterParams extends PaginationParams {
  keyword?: string;
  departmentId?: number;
  docType?: string;
  authorId?: number;
  authorName?: string;
  publicationYear?: number;
  language?: string;
}

export interface DocumentRequestDto {
  title: string;
  isbn?: string;
  authors?: string[];
  publisher?: string;
  publicationYear?: number;
  abstractText?: string;
  docType?: string;
  classificationNumber?: string;
  language?: string;
  coverUrl?: string;
  origin?: string;
  physicalDescription?: string;
  departmentIds?: number[];
}

export interface PhysicalCopyDto {
  id: string;
  documentId: string;
  barcode: string;
  callNumber?: string;
  shelfLocation?: string;
  status?: string;
  condition?: string;
  accessionDate?: string;
  lastInventoryDate?: string;
}

export interface PhysicalCopyRequestDto {
  documentId: string;
  barcode: string;
  callNumber?: string;
  shelfLocation?: string;
  status?: string;
  condition?: string;
}

export interface AuthorDto {
  id: number;
  name: string;
}

export interface AuthorRequestDto {
  name: string;
}

export interface ReviewDto {
  id: number;
  documentId?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
  userFullName?: string;
  user?: {
    id?: string;
    fullName?: string;
    userCode?: string;
  };
}

export interface DocumentReviewsResponseDto extends PageResponse<ReviewDto> {
  averageRating?: number | null;
  totalReviews?: number;
  ratingDistribution?: Record<string, number>;
}

export interface FavoriteDocumentDto {
  id: string;
  documentId: string;
  title: string;
  authors?: string[];
  coverUrl?: string;
  abstractText?: string;
  docType?: string;
  publicationYear?: number;
  totalPhysicalCopies: number;
  availablePhysicalCopies: number;
  hasDigitalCopy: boolean;
  averageRating?: number | null;
  favoritedAt?: string;
}

export interface ReviewRequestDto {
  rating: number;
  comment?: string;
}

export interface DigitalCopyDto {
  id: string;
  version?: string;
  isCurrent?: boolean;
  processingStatus?: string;
  filePath?: string;
  fileSize?: number;
  pageCount?: number;
  extractionQuality?: number;
  createdAt?: string;
}

export interface DigitalCopyUploadResponse {
  digitalCopyId: string;
  documentId: string;
  version?: string;
  fileName?: string;
  fileSize?: number;
  fileStatus?: string;
  processingStatus?: string;
  jobId: number;
  jobStatus?: string;
}

export interface ProcessingStatusResponse {
  jobId: number;
  digitalCopyId?: string;
  status?: string;
  statusLabel?: string;
  digitalCopyStatus?: string;
  pageCount?: number;
  extractionQuality?: number;
  errorMessage?: string;
  attempts?: number;
  createdAt?: string;
  startedAt?: string;
  finishedAt?: string;
}

// --- Module 3: Circulation, Fines & Holds ---
export interface BorrowRequestDto {
  userCode: string;
  barcodes: string[];
  borrowNote?: string;
}

export interface BorrowedItemDto {
  circulationId: number;
  barcode: string;
  documentId: string;
  documentTitle: string;
  borrowDate: string;
  dueDate: string;
  status: string;
}

export interface BorrowResponseDto {
  userCode: string;
  fullName: string;
  totalBorrowed: number;
  currentActiveLoans: number;
  items: BorrowedItemDto[];
  warnings?: string[];
}

export type BookReturnCondition = "NORMAL" | "DAMAGED" | "LOST";

export interface ReturnRequestDto {
  barcode: string;
  condition?: BookReturnCondition;
  returnNote?: string;
}

export interface FineItemDto {
  fineId: number;
  circulationId: number;
  barcode: string;
  documentTitle: string;
  penaltyCode: string;
  reason: string;
  quantity: number;
  unitPrice: number;
  fineAmount: number;
  status: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReturnResponseDto {
  circulationId: number;
  barcode: string;
  documentId: string;
  documentTitle: string;
  userCode: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string;
  overdueDays: number;
  totalFineAmount: number;
  updatedCopyStatus: string;
  assignedHoldUserCode?: string;
  generatedFines?: FineItemDto[];
}

export interface RenewRequestDto {
  circulationId?: number;
  barcode?: string;
}

export interface RenewResponseDto {
  circulationId: number;
  barcode: string;
  documentTitle: string;
  oldDueDate: string;
  newDueDate: string;
  renewalsCount: number;
  maxRenewals: number;
  renewalStatus: string;
  message: string;
}

export interface CirculationHistoryItemDto {
  circulationId: number;
  documentId: string;
  documentTitle: string;
  barcode: string;
  callNumber?: string;
  shelfLocation?: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  renewalsCount: number;
  status: string;
  fineAmount: number;
}

export interface UserFinesSummaryDto {
  totalUnpaidAmount: number;
  totalPaidAmount: number;
  unpaidCount: number;
  fines: FineItemDto[];
}

export interface FinePaymentResponseDto {
  fineId: number;
  circulationId: number;
  fineAmount: number;
  status: string;
  paidAt: string;
  note?: string;
}

export interface HoldRequestDto {
  documentId: string;
}

export interface HoldResponseDto {
  holdId: number;
  documentId: string;
  documentTitle: string;
  queuePosition: number;
  requestDate: string;
  estimatedAvailableDate?: string;
  status: string;
}

export interface HoldCancelResponseDto {
  holdId: number;
  documentId: string;
  documentTitle?: string;
  status: string;
  cancelReason?: string;
  cancelledAt?: string;
}

// --- Module 4 & 5: Search & Recommendations ---
export interface ContentSearchRequest {
  query: string;
  limit?: number;
  searchMode?: "tfidf" | "vector" | "hybrid" | string;
  searchType?: "VECTOR" | "BM25" | "HYBRID";
}

export interface ContentSearchResultDto {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  chunkText: string;
  pageNumber?: number;
  chapter?: string;
  section?: string;
  relevanceScore?: number;
  availablePhysicalCopies: number;
  shelfLocation?: string;
}

export interface TextLocationDto {
  page?: number;
  printedPageLabel?: string;
  paragraph?: number;
  sentence?: number;
  wordStart?: number;
  wordEnd?: number;
  text?: string;
  rects?: number[][];
  pageWidth?: number;
  pageHeight?: number;
}

export interface SmartSearchRequest {
  query: string;
  language?: string;
  docType?: string;
  departmentId?: number;
  authorName?: string;
  publicationYear?: number;
  searchMode?: "tfidf" | "vector" | "hybrid" | string;
  limit?: number;
}

export interface SmartSearchItemDto {
  documentId: string;
  title: string;
  docType?: string;
  language?: string;
  publicationYear?: number;
  matchScore: number;
  snippet?: string;
  digitalCopyId?: string;
  chunkIds?: string[];
  pageNumber?: number;
  pageEnd?: number;
  chapter?: string;
  section?: string;
  locations?: TextLocationDto[];
}

export interface SmartSearchResponse {
  query: string;
  searchMode?: string;
  booleanQuery?: boolean;
  highlightTerms?: string[];
  results: SmartSearchItemDto[];
}

export interface RecommendationItemDto {
  documentId: string;
  title: string;
  docType?: string;
  score?: number;
  rank?: number;
  reason?: string;
  recModelVersion?: string;
}

// --- Module 6, 7 & 8: Analytics, Notifications & Admin Config ---
export type AnalyticsPeriod =
  | "TODAY"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "LAST_90_DAYS"
  | "THIS_MONTH"
  | "THIS_YEAR"
  | "ALL";

export interface InventoryBreakdownDto {
  available: number;
  borrowed: number;
  reserved: number;
  maintenance: number;
  damaged: number;
  lost: number;
}

export interface CirculationTrendPointDto {
  label: string;
  date: string;
  borrowCount: number;
  returnCount: number;
  overdueCount: number;
}

export interface CategoryStatDto {
  key: string;
  label: string;
  count: number;
  percentage: number;
}

export interface LowCirculationDocumentDto {
  documentId: string;
  title: string;
  docType?: string;
  borrowCount: number;
  lastBorrowedAt?: string | null;
}

export interface PopularDocumentDto {
  rank: number;
  documentId: string;
  title: string;
  authors?: string[];
  docType?: string;
  publicationYear?: number;
  coverUrl?: string;
  totalPhysicalCopies: number;
  availablePhysicalCopies: number;
  borrowCount: number;
  favoriteCount: number;
  reviewCount: number;
  averageRating?: number | null;
  interactionCount: number;
}

export interface AnalyticsOverviewQuery {
  period?: AnalyticsPeriod | string;
  fromDate?: string;
  toDate?: string;
  departmentId?: number;
  docType?: string;
}

export interface PopularDocumentsQuery extends AnalyticsOverviewQuery {
  limit?: number;
  sortBy?: "BORROWS" | "INTERACTIONS";
}

export interface LibraryOverviewStatsDto {
  totalDocuments: number;
  totalPhysicalCopies: number;
  availablePhysicalCopies: number;
  borrowedPhysicalCopies: number;
  totalDigitalCopies: number;
  totalUsers: number;
  activeLoans: number;
  pendingAcquisitionSuggestions: number;
  period?: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  activeUsers?: number;
  overdueLoans?: number;
  severeOverdueLoans?: number;
  pendingHolds?: number;
  failedDigitalJobs?: number;
  totalBorrowsInPeriod?: number;
  totalReturnsInPeriod?: number;
  overdueInPeriod?: number;
  inventoryBreakdown?: InventoryBreakdownDto;
  circulationTrend?: CirculationTrendPointDto[];
  borrowsByDepartment?: CategoryStatDto[];
  borrowsByDocType?: CategoryStatDto[];
  lowCirculationDocuments?: LowCirculationDocumentDto[];
}

export interface AcquisitionSuggestionDto {
  id: number;
  departmentId?: number;
  departmentName?: string;
  topic: string;
  sourceQueryCluster?: Record<string, unknown>;
  queryCount: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageQueueDto {
  id: number;
  channel?: string;
  messageType?: string;
  content: string;
  scheduledAt?: string;
  sentAt?: string;
  retryCount?: number;
  errorMessage?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PolicyResponse {
  id: number;
  userType: string;
  docType: string;
  loanDays: number;
  maxLoans: number;
  maxRenewals: number;
  holdExpiryDays: number;
}

export interface PenaltyTypeResponse {
  id: number;
  code: string;
  name: string;
  unitName: string;
  unitPrice: number;
}

export interface SearchConfigResponse {
  id: number;
  chunkSize: number;
  overlap: number;
  strategy: string;
  embeddingModel: string;
  vectorDimensions: number;
  isActive: boolean;
}
