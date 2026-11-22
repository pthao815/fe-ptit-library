import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Badge,
  Breadcrumb,
  Button,
  CustomSelect,
  EmptyState,
  Icon,
  IconButton,
  LoadingState,
} from "../../../design-system";
import { catalogService } from "../../../services/catalog.service";
import { searchService } from "../../../services/search.service";
import { getAccessToken } from "../../../services/session";
import { userService } from "../../../services/user.service";
import type { DepartmentDto } from "../../../types/api";
import { mapDocumentSummaryToSearchResult } from "../../../utils/mappers";
import SearchFilterSidebar from "./SearchFilterSidebar";
import SearchResultCard from "./SearchResultCard";
import {
  EMPTY_SEARCH_FILTERS,
  formatSearchDocType,
  formatSearchLanguage,
  formatSmartEngineBadge,
  fromKeywordSearchResult,
  fromSmartSearchItem,
  type SearchTabMode,
  type SmartEngineMode,
  type UnifiedSearchFilters,
  type UnifiedSearchItem,
} from "./search-options";

const KEYWORD_PAGE_SIZE = 10;
const SMART_LIMIT_STEP = 10;
const SMART_LIMIT_MAX = 50;

function parsePositiveInt(value: string): number | undefined {
  if (!/^[1-9][0-9]*$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= 2147483647 ? parsed : undefined;
}

function parseSmartMode(value: string | null): SmartEngineMode {
  if (value === "hybrid" || value === "tfidf" || value === "vector") return value;
  return "";
}

function readFiltersFromParams(params: URLSearchParams): UnifiedSearchFilters {
  return {
    docType: params.get("docType") ?? "",
    departmentId: params.get("departmentId") ?? "",
    publicationYear: params.get("publicationYear") ?? "",
    authorId: params.get("authorId") ?? "",
    authorName: params.get("authorName") ?? "",
    language: params.get("language") ?? "",
    searchMode: parseSmartMode(params.get("searchMode")),
  };
}

export default function SearchResultsPage({
  empty = false,
  initialMode = "keyword",
}: {
  empty?: boolean;
  initialMode?: SearchTabMode;
}) {
  const { search } = useLocation();
  return <UnifiedBookSearch key={`${initialMode}:${search}`} empty={empty} initialMode={initialMode} />;
}

function UnifiedBookSearch({
  empty,
  initialMode,
}: {
  empty: boolean;
  initialMode: SearchTabMode;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlMode = searchParams.get("mode");
  const mode: SearchTabMode =
    urlMode === "smart" ? "smart" : urlMode === "keyword" ? "keyword" : initialMode;

  const submittedQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(submittedQuery);
  const [applied] = useState<UnifiedSearchFilters>(() => readFiltersFromParams(searchParams));
  const [filters, setFilters] = useState<UnifiedSearchFilters>(applied);

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [items, setItems] = useState<UnifiedSearchItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [smartMeta, setSmartMeta] = useState<{ searchMode?: string; booleanQuery?: boolean } | null>(null);
  const [hasFetchedEmpty, setHasFetchedEmpty] = useState(false);

  const rawPage = Number(searchParams.get("page"));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 2147483647 ? rawPage : 1;
  const rawLimit = Number(searchParams.get("limit"));
  const smartLimit =
    Number.isSafeInteger(rawLimit) && rawLimit >= 1 && rawLimit <= SMART_LIMIT_MAX
      ? rawLimit
      : SMART_LIMIT_STEP;
  const sort = searchParams.get("sort") ?? "relevance";

  const needsSmartPrompt = mode === "smart" && !submittedQuery.trim();
  const [loading, setLoading] = useState(!empty && !needsSmartPrompt);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState<"list" | "grid">("list");

  useEffect(() => {
    let active = true;
    userService
      .getDepartments()
      .then((data) => {
        if (active) setDepartments(data);
      })
      .catch(() => {
        if (active) setDepartments([]);
      });
    return () => {
      active = false;
    };
  }, []);

  function updateSearch(values: Record<string, string>, nextMode: SearchTabMode = mode) {
    const params = new URLSearchParams(searchParams);
    if (nextMode === "smart") params.set("mode", "smart");
    else params.delete("mode");

    Object.entries(values).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });

    const nextSearch = params.toString();
    const onCanonicalPath = window.location.pathname.toLowerCase() === "/reader/search";
    if (!empty && onCanonicalPath && nextSearch === searchParams.toString()) {
      setRevision((value) => value + 1);
    } else {
      navigate({ pathname: "/reader/search", search: nextSearch });
    }
  }

  function switchTab(nextMode: SearchTabMode) {
    if (nextMode === mode && !empty) return;
    const shared: Record<string, string> = {
      q: query.trim(),
      docType: filters.docType.trim(),
      departmentId: filters.departmentId,
      authorName: filters.authorName.trim(),
      publicationYear: filters.publicationYear.trim(),
      language: filters.language.trim(),
      authorId: nextMode === "keyword" && parsePositiveInt(filters.authorId) ? filters.authorId : "",
      searchMode: nextMode === "smart" ? filters.searchMode : "",
      page: "",
      sort: "",
      limit: "",
    };
    updateSearch(shared, nextMode);
  }

  function submitSearch() {
    updateSearch({ q: query.trim(), page: "", limit: "" });
  }

  function applyFilters() {
    setFilterOpen(false);
    const trimmedAuthorName = filters.authorName.trim();
    const validAuthorId = !trimmedAuthorName && parsePositiveInt(filters.authorId) ? filters.authorId : "";
    updateSearch({
      q: query.trim(),
      docType: filters.docType.trim(),
      departmentId: filters.departmentId,
      authorName: trimmedAuthorName,
      authorId: mode === "keyword" ? validAuthorId : "",
      publicationYear: filters.publicationYear.trim(),
      language: filters.language.trim(),
      searchMode: mode === "smart" ? filters.searchMode : "",
      page: "",
      limit: "",
    });
  }

  function resetFilters() {
    setFilters(EMPTY_SEARCH_FILTERS);
    setFilterOpen(false);
    updateSearch({
      docType: "",
      departmentId: "",
      publicationYear: "",
      authorId: "",
      authorName: "",
      language: "",
      searchMode: "",
      page: "",
      limit: "",
    });
  }

  useEffect(() => {
    if (empty) {
      setLoading(false);
      return;
    }

    if (mode === "smart" && !submittedQuery.trim()) {
      setItems([]);
      setTotalElements(0);
      setTotalPages(0);
      setSmartMeta(null);
      setHasFetchedEmpty(false);
      setLoadError("");
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setLoadError("");

    if (mode === "keyword") {
      const sortBy =
        sort === "title" ? "title" : sort === "newest" ? "publicationYear" : "createdAt";
      const sortDir = sort === "title" ? "asc" : "desc";

      catalogService
        .searchDocuments({
          keyword: submittedQuery.trim() || undefined,
          docType: applied.docType.trim() || undefined,
          publicationYear: Number(applied.publicationYear) || undefined,
          departmentId: Number(applied.departmentId) || undefined,
          authorId: applied.authorName.trim() ? undefined : parsePositiveInt(applied.authorId),
          authorName: applied.authorName.trim() || undefined,
          language: applied.language.trim() || undefined,
          page: page - 1,
          size: KEYWORD_PAGE_SIZE,
          sortBy,
          sortDir,
        })
        .then((pageData) => {
          if (!active) return;
          const mapped = pageData.items.map((dto, index) =>
            fromKeywordSearchResult(mapDocumentSummaryToSearchResult(dto, index)),
          );
          setItems(mapped);
          setTotalElements(pageData.totalElements);
          setTotalPages(pageData.totalPages);
          setSmartMeta(null);
          setHasFetchedEmpty(mapped.length === 0);
        })
        .catch((error: unknown) => {
          if (active) {
            setLoadError(error instanceof Error ? error.message : "Không tải được kết quả tìm kiếm.");
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      searchService
        .smartSearch({
          query: submittedQuery.trim(),
          docType: applied.docType.trim() || undefined,
          departmentId: Number(applied.departmentId) || undefined,
          authorName: applied.authorName.trim() || undefined,
          publicationYear: Number(applied.publicationYear) || undefined,
          language: applied.language.trim() || undefined,
          searchMode: applied.searchMode || undefined,
          limit: smartLimit,
        })
        .then((response) => {
          if (!active) return;
          const mapped = response.results.map((item, index) => fromSmartSearchItem(item, index));
          setItems(mapped);
          setTotalElements(mapped.length);
          setTotalPages(mapped.length > 0 ? 1 : 0);
          setSmartMeta({
            searchMode: response.searchMode,
            booleanQuery: response.booleanQuery,
          });
          setHasFetchedEmpty(mapped.length === 0);
        })
        .catch((error: unknown) => {
          if (active) {
            setLoadError(
              error instanceof Error
                ? error.message
                : "Không thực hiện được tìm kiếm thông minh.",
            );
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [empty, mode, page, smartLimit, sort, submittedQuery, applied, revision]);

  const displayedItems = useMemo(() => {
    if (mode !== "smart" || sort === "relevance") return items;
    const copy = [...items];
    if (sort === "title") {
      copy.sort((a, b) => a.title.localeCompare(b.title, "vi"));
    } else if (sort === "newest") {
      copy.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    }
    return copy;
  }, [items, mode, sort]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string }> = [];
    if (applied.docType) {
      chips.push({ key: "docType", label: `Dạng: ${formatSearchDocType(applied.docType)}` });
    }
    if (applied.departmentId) {
      const deptName =
        departments.find((unit) => String(unit.id) === applied.departmentId)?.name ??
        `Khoa #${applied.departmentId}`;
      chips.push({ key: "departmentId", label: `Khoa: ${deptName}` });
    }
    if (applied.authorName.trim()) {
      chips.push({ key: "authorName", label: `Tác giả: ${applied.authorName.trim()}` });
    } else if (mode === "keyword" && parsePositiveInt(applied.authorId)) {
      chips.push({ key: "authorId", label: `Tác giả #${applied.authorId}` });
    }
    if (applied.publicationYear) {
      chips.push({ key: "publicationYear", label: `Năm XB: ${applied.publicationYear}` });
    }
    if (applied.language) {
      chips.push({ key: "language", label: `Ngôn ngữ: ${formatSearchLanguage(applied.language)}` });
    }
    if (mode === "smart" && applied.searchMode) {
      chips.push({
        key: "searchMode",
        label: `Chế độ: ${formatSmartEngineBadge(applied.searchMode)}`,
      });
    }
    return chips;
  }, [applied, departments, mode]);

  const toggleSave = async (item: UnifiedSearchItem) => {
    setActionError("");
    if (!item.documentId || !getAccessToken()) {
      setActionError("Vui lòng đăng nhập để lưu tài liệu.");
      return;
    }
    try {
      const response = await catalogService.toggleFavorite(item.documentId);
      setSaved((ids) =>
        response.isFavorite
          ? [...new Set([...ids, response.documentId])]
          : ids.filter((id) => id !== response.documentId),
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Không lưu được tài liệu.");
    }
  };

  const isEmptyState = empty || hasFetchedEmpty;
  const displayTotal = isEmptyState || needsSmartPrompt ? 0 : totalElements;
  const canLoadMoreSmart =
    mode === "smart" && !loading && items.length >= smartLimit && smartLimit < SMART_LIMIT_MAX;

  return (
    <div className="search-results-page">
      <section className="results-search-area">
        <div className="results-search-inner">
          <Breadcrumb items={[{ label: "Trang chủ", to: "/reader" }, "Khám phá"]} />
          <div className="results-search-box">
            <Icon name={mode === "smart" ? "sparkle" : "search"} size={22} />
            <input
              aria-label={mode === "smart" ? "Nội dung tìm kiếm thông minh" : "Từ khóa tìm kiếm"}
              value={query}
              placeholder={
                mode === "smart"
                  ? "Mô tả chủ đề, dán đoạn trích hoặc dùng toán tử AND / OR / NOT..."
                  : "Tìm theo nhan đề tài liệu, tác giả, ISBN..."
              }
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && submitSearch()}
            />
            {query && (
              <IconButton label="Xóa từ khóa" icon="close" onClick={() => setQuery("")} />
            )}
            <Button icon={mode === "smart" ? "sparkle" : "search"} onClick={submitSearch}>
              Tìm kiếm
            </Button>
          </div>

          <div className="search-summary">
            <div>
              <p className="eyebrow">
                {mode === "smart" ? "TÌM KIẾM THÔNG MINH" : "TRA CỨU TÀI LIỆU"}
              </p>
              <h1>
                {submittedQuery.trim() ? (
                  <>
                    Kết quả tìm kiếm cho “<mark>{submittedQuery.trim()}</mark>”
                  </>
                ) : mode === "smart" ? (
                  "Tìm kiếm thông minh trong nội dung tài liệu"
                ) : (
                  "Khám phá kho tài liệu thư viện"
                )}
              </h1>
              <p>
                {mode === "smart" ? (
                  needsSmartPrompt ? (
                    <>
                      Phân tích nội dung toàn văn bằng <span>TF-IDF, Vector &amp; Boolean</span>
                    </>
                  ) : (
                    <>
                      Tìm thấy <strong>{displayTotal} tài liệu phù hợp</strong> bằng{" "}
                      <span>
                        {formatSmartEngineBadge(smartMeta?.searchMode, smartMeta?.booleanQuery)}
                      </span>
                    </>
                  )
                ) : (
                  <>
                    Tìm thấy <strong>{displayTotal} tài liệu phù hợp</strong> trong phạm vi{" "}
                    <span>Toàn bộ tài liệu</span>
                  </>
                )}
              </p>
            </div>
            <Badge tone="brand">{displayTotal} KẾT QUẢ</Badge>
          </div>

          <div className="results-mode" role="tablist" aria-label="Chế độ tìm kiếm">
            <button
              type="button"
              className={mode === "keyword" ? "active" : ""}
              role="tab"
              aria-selected={mode === "keyword"}
              onClick={() => switchTab("keyword")}
            >
              <Icon name="search" size={15} />
              Tìm theo từ khóa
            </button>
            <button
              type="button"
              className={mode === "smart" ? "active" : ""}
              role="tab"
              aria-selected={mode === "smart"}
              onClick={() => switchTab("smart")}
            >
              <Icon name="sparkle" size={15} />
              Tìm kiếm thông minh
            </button>
          </div>
        </div>
      </section>

      <main className="results-layout">
        <button
          type="button"
          className="mobile-filter-trigger"
          onClick={() => setFilterOpen(true)}
        >
          <Icon name="filter" />
          Bộ lọc tìm kiếm
          {activeFilterChips.length > 0 && <Badge tone="brand">{activeFilterChips.length}</Badge>}
        </button>

        {filterOpen && (
          <button
            type="button"
            className="mobile-scrim"
            aria-label="Đóng bộ lọc"
            onClick={() => setFilterOpen(false)}
          />
        )}

        <SearchFilterSidebar
          mode={mode}
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          filters={filters}
          onChange={setFilters}
          departments={departments}
          onApply={applyFilters}
          onReset={resetFilters}
        />

        <section className="results-main">
          <div className="results-toolbar">
            <div className="results-count">
              <strong>{displayTotal} kết quả</strong>
            </div>
            <div className="toolbar-controls">
              <label className="sort-control">
                <span>Sắp xếp:</span>
                <CustomSelect
                  value={sort}
                  onChange={(event) => updateSearch({ sort: event.target.value, page: "" })}
                >
                  <option value="relevance">
                    {mode === "smart" ? "Mức độ phù hợp cao nhất" : "Ngày thêm gần đây"}
                  </option>
                  <option value="title">Tên tài liệu A–Z</option>
                  <option value="newest">Năm xuất bản mới nhất</option>
                </CustomSelect>
              </label>
              <div className="view-switch" aria-label="Kiểu hiển thị">
                <IconButton
                  label="Hiển thị danh sách"
                  icon="document"
                  className={view === "list" ? "active" : ""}
                  onClick={() => setView("list")}
                />
                <IconButton
                  label="Hiển thị lưới"
                  icon="dashboard"
                  className={view === "grid" ? "active" : ""}
                  onClick={() => setView("grid")}
                />
              </div>
            </div>
          </div>

          {activeFilterChips.length > 0 && (
            <div className="active-filters" aria-label="Bộ lọc đang áp dụng">
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => {
                    setFilters((current) => ({ ...current, [chip.key]: "" }));
                    updateSearch({ [chip.key]: "", page: "", limit: "" });
                  }}
                >
                  {chip.label}
                  <Icon name="close" size={12} />
                </button>
              ))}
            </div>
          )}

          {actionError && <p role="alert">{actionError}</p>}

          {loadError ? (
            <EmptyState
              surface="card"
              size="lg"
              tone="error"
              title={
                mode === "smart"
                  ? "Không thực hiện được tìm kiếm thông minh"
                  : "Không tải được kết quả tìm kiếm"
              }
              description={loadError}
              action={<Button onClick={() => setRevision((value) => value + 1)}>Thử lại</Button>}
            />
          ) : loading ? (
            <LoadingState
              variant="list"
              count={3}
              surface="card"
              title={
                mode === "smart"
                  ? "Đang phân tích và tìm kiếm thông minh…"
                  : "Đang tìm kiếm tài liệu…"
              }
            />
          ) : needsSmartPrompt ? (
            <EmptyState
              surface="card"
              size="lg"
              icon="sparkle"
              title="Nhập mô tả hoặc đoạn trích để tìm kiếm thông minh"
              description="Bạn có thể nhập câu hỏi tự nhiên, chủ đề quan tâm hoặc toán tử Boolean (AND, OR, NOT, &quot;cụm từ&quot;)."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    const sample = "mạng máy tính";
                    setQuery(sample);
                    updateSearch({ q: sample, limit: "" }, "smart");
                  }}
                >
                  Thử truy vấn mẫu
                </Button>
              }
            />
          ) : isEmptyState ? (
            <EmptyState
              surface="card"
              size="lg"
              icon="search"
              title="Không tìm thấy tài liệu phù hợp"
              description={
                mode === "smart"
                  ? "Thử diễn đạt rộng hơn, kiểm tra lại từ khóa hoặc xóa bớt bộ lọc đang áp dụng."
                  : "Hãy thử một từ khóa khác hoặc xóa bớt bộ lọc tìm kiếm."
              }
              action={
                <Button variant="secondary" onClick={resetFilters}>
                  Xóa bộ lọc
                </Button>
              }
            />
          ) : (
            <>
              <div className={`search-results-list ${view === "grid" ? "grid-view" : ""}`}>
                {displayedItems.map((item) => (
                  <SearchResultCard
                    key={item.id}
                    item={item}
                    query={submittedQuery}
                    saved={saved.includes(item.documentId)}
                    onSave={() => void toggleSave(item)}
                  />
                ))}
              </div>

              {mode === "keyword" ? (
                <div className="catalog-pagination">
                  <p>
                    Hiển thị{" "}
                    <strong>
                      {(page - 1) * KEYWORD_PAGE_SIZE + 1}–
                      {Math.min(page * KEYWORD_PAGE_SIZE, displayTotal)}
                    </strong>{" "}
                    trong {displayTotal} kết quả
                  </p>
                  <nav aria-label="Phân trang kết quả">
                    <IconButton
                      label="Trang trước"
                      icon="chevron-left"
                      disabled={page === 1}
                      onClick={() => updateSearch({ page: String(page - 1) })}
                    />
                    <span>
                      Trang {page}/{Math.max(1, totalPages)}
                    </span>
                    <IconButton
                      label="Trang sau"
                      icon="chevron-right"
                      disabled={page >= totalPages}
                      onClick={() => updateSearch({ page: String(page + 1) })}
                    />
                  </nav>
                </div>
              ) : (
                <div className="results-load-more">
                  <p>Đang hiển thị {displayedItems.length} tài liệu khớp nhất theo nội dung</p>
                  {canLoadMoreSmart && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        updateSearch({
                          limit: String(Math.min(SMART_LIMIT_MAX, smartLimit + SMART_LIMIT_STEP)),
                        })
                      }
                    >
                      Xem thêm kết quả
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
