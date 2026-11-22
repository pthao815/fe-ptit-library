import type { SearchResult } from "../../../data/search-results";
import type { SmartSearchItemDto } from "../../../types/api";
import type { Book } from "../../../types/library";

export type SearchTabMode = "keyword" | "smart";
export type SmartEngineMode = "" | "hybrid" | "tfidf" | "vector";

export interface UnifiedSearchFilters {
  docType: string;
  departmentId: string;
  publicationYear: string;
  authorId: string;
  authorName: string;
  language: string;
  searchMode: SmartEngineMode;
}

export const EMPTY_SEARCH_FILTERS: UnifiedSearchFilters = {
  docType: "",
  departmentId: "",
  publicationYear: "",
  authorId: "",
  authorName: "",
  language: "",
  searchMode: "",
};

export const DOC_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "", label: "Tất cả dạng tài liệu" },
  { value: "textbook", label: "Giáo trình" },
  { value: "slide", label: "Bài giảng" },
  { value: "reference", label: "Sách tham khảo" },
];

export const LANGUAGE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "", label: "Tất cả ngôn ngữ" },
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "Tiếng Anh" },
  { value: "fr", label: "Tiếng Pháp" },
];

export const SMART_ENGINE_OPTIONS: ReadonlyArray<{ value: SmartEngineMode; label: string }> = [
  { value: "", label: "Mặc định hệ thống" },
  { value: "hybrid", label: "Kết hợp lai (Hybrid)" },
  { value: "tfidf", label: "TF-IDF & Boolean" },
  { value: "vector", label: "Ngữ nghĩa Vector" },
];

const DOC_TYPE_LABELS: Record<string, string> = {
  textbook: "Giáo trình",
  slide: "Bài giảng",
  reference: "Sách tham khảo",
  book: "Sách chuyên khảo",
  thesis: "Luận văn / Luận án",
  journal: "Tạp chí / Bài báo",
  exam: "Đề thi / Bài tập",
};

const LANGUAGE_LABELS: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "Tiếng Anh",
  fr: "Tiếng Pháp",
};

const SMART_RESPONSE_MODE_LABELS: Record<string, string> = {
  TFIDF: "TF-IDF & Cosine",
  VECTOR: "Ngữ nghĩa Vector",
  HYBRID: "Kết hợp lai (Hybrid)",
  KEYWORD_ONLY: "Tìm kiếm toàn văn dự phòng",
};

export function formatSearchDocType(code?: string): string {
  if (!code) return "Tài liệu thư viện";
  return DOC_TYPE_LABELS[code.toLowerCase()] ?? code;
}

export function formatSearchLanguage(code?: string): string {
  if (!code) return "Chưa rõ";
  return LANGUAGE_LABELS[code.toLowerCase()] ?? code.toUpperCase();
}

export function formatSmartEngineBadge(mode?: string, booleanQuery?: boolean): string {
  const normalized = mode?.toUpperCase() ?? "";
  const base = SMART_RESPONSE_MODE_LABELS[normalized] ?? (mode || "Tìm kiếm thông minh");
  return booleanQuery ? `${base} · Boolean` : base;
}

export interface SnippetPart {
  text: string;
  marked: boolean;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

/**
 * Tách chuỗi trích đoạn có thẻ <mark>...</mark> đã escape từ Backend sang mảng React an toàn (không dùng dangerouslySetInnerHTML).
 */
export function parseMarkedSnippet(snippet?: string): SnippetPart[] {
  if (!snippet) return [];
  const parts: SnippetPart[] = [];
  const regex = /<mark>([\s\S]*?)<\/mark>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(snippet)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        text: decodeHtmlEntities(snippet.slice(lastIndex, match.index)),
        marked: false,
      });
    }
    if (match[1]) {
      parts.push({
        text: decodeHtmlEntities(match[1]),
        marked: true,
      });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < snippet.length) {
    parts.push({
      text: decodeHtmlEntities(snippet.slice(lastIndex)),
      marked: false,
    });
  }

  return parts;
}

export interface UnifiedSearchItem {
  id: string;
  documentId: string;
  mode: SearchTabMode;
  book: Book;
  title: string;
  author: string;
  year: string;
  docTypeLabel: string;
  languageLabel?: string;
  publisher?: string;
  description?: string;
  available?: boolean;
  copies?: number;
  digital: boolean;
  matchScore?: number;
  snippet?: string;
  matchLocation?: string;
  pageNumber?: number;
}

const COVER_POOL: Book["cover"][] = [
  "cover-red",
  "cover-slate",
  "cover-sand",
  "cover-charcoal",
];

function coverForId(id: string, index: number): Book["cover"] {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return COVER_POOL[Math.abs(hash + index) % COVER_POOL.length];
}

export function fromKeywordSearchResult(result: SearchResult): UnifiedSearchItem {
  return {
    id: result.documentId ?? String(result.id),
    documentId: result.documentId ?? String(result.id),
    mode: "keyword",
    book: result,
    title: result.title,
    author: result.author,
    year: result.year,
    docTypeLabel: formatSearchDocType(result.subject),
    publisher: result.publisher,
    description: result.description,
    available: result.available,
    copies: result.copies,
    digital: result.digital,
  };
}

export function fromSmartSearchItem(item: SmartSearchItemDto, index: number): UnifiedSearchItem {
  const year = item.publicationYear ? String(item.publicationYear) : "—";
  const docTypeLabel = formatSearchDocType(item.docType);
  const locationParts = [
    item.pageNumber
      ? item.pageEnd && item.pageEnd !== item.pageNumber
        ? `Trang ${item.pageNumber}–${item.pageEnd}`
        : `Trang ${item.pageNumber}`
      : null,
    item.chapter || null,
    item.section || null,
  ].filter(Boolean);

  const book: Book = {
    id: index + 5000,
    documentId: item.documentId,
    title: item.title,
    author: `${docTypeLabel} · ${formatSearchLanguage(item.language)}`,
    year,
    type: "Tài liệu số",
    rating: 5,
    available: true,
    code: item.documentId.slice(0, 8).toUpperCase(),
    cover: coverForId(item.documentId, index),
  };

  return {
    id: `${item.documentId}-${item.pageNumber ?? index}`,
    documentId: item.documentId,
    mode: "smart",
    book,
    title: item.title,
    author: `${docTypeLabel} · ${formatSearchLanguage(item.language)}`,
    year,
    docTypeLabel,
    languageLabel: formatSearchLanguage(item.language),
    digital: true,
    matchScore: Math.round(item.matchScore * 10) / 10,
    snippet: item.snippet,
    matchLocation: locationParts.length ? locationParts.join(" · ") : "Nội dung toàn văn đã lập chỉ mục",
    pageNumber: item.pageNumber,
  };
}
