import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Badge, Breadcrumb, Button, Field, Icon, IconButton, Status } from "../../../design-system";
import BookCover from "../../../components/books/BookCover";
import type { SearchResult } from "../../../data/search-results";
import { userService } from "../../../services/user.service";
import type { DepartmentDto } from "../../../types/api";
import { filterGroups } from "../../../constants/library-options";
import { catalogService } from "../../../services/catalog.service";
import { getAccessToken } from "../../../services/session";
import { mapDocumentSummaryToSearchResult } from "../../../utils/mappers";

function HighlightText({ text, query }: { text: string; query: string }) {
  const normalized = query.trim();
  if (!normalized) return <>{text}</>;
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return <>{parts.map((part, index) => part.toLowerCase() === normalized.toLowerCase() ? <mark key={`${part}-${index}`}>{part}</mark> : part)}</>;
}

function SearchResultCard({
  result,
  saved,
  onSave,
  query,
}: {
  result: SearchResult;
  saved: boolean;
  onSave: () => void;
  query: string;
}) {
  const navigate = useNavigate();
  const detailUrl = result.documentId
    ? `/reader/book-detail?id=${encodeURIComponent(result.documentId)}`
    : "/reader/search";
  const location = useLocation();
  return (
    <article className="search-result-card">
      <div className="result-cover-column">
        <BookCover book={result} />
        <Badge tone="neutral">{result.type}</Badge>
      </div>
      <div className="result-main">
        <div className="result-heading-row">
          <div className="result-title-block">
            <div className="book-meta"><span>{result.subject}</span><i /><span>{result.year}</span></div>
            <h2><HighlightText text={result.title} query={query} /></h2>
            <p className="result-author">Tác giả: <strong>{result.author}</strong></p>
          </div>
        </div>
        <div className="result-bibliography">
          <span><small>Nhà xuất bản</small><strong>{result.publisher}</strong></span>
          <span><small>Mã tài liệu</small><strong>{result.identifier}</strong></span>
        </div>
        <p className="result-description">{result.description}</p>
        <div className="result-status-row">
          <Status tone={result.available ? "success" : "warning"}>{result.available ? "Có thể mượn" : "Đang được mượn"}</Status>
          <Badge tone={result.digital ? "info" : "neutral"}>{result.digital ? "Có bản điện tử" : "Không có bản điện tử"}</Badge>
          <span className="copy-count">{result.copies > 0 ? `Còn ${result.copies} bản` : "Hết bản có thể mượn"}</span>
        </div>
      </div>
      <div className="result-side">
        <div className="result-side-status">
          <span className={result.available ? "available" : "unavailable"}><Icon name={result.available ? "success" : "info"} size={17} /></span>
          <strong>{result.available ? "Có thể mượn" : "Chưa có bản trống"}</strong>
          <small>{result.copies > 0 ? `${result.copies} bản tại thư viện` : "Có thể lưu để xem lại"}</small>
        </div>
        <div className="result-actions">
          <Button size="sm" onClick={() => { navigate(detailUrl, { state: { returnTo: location.pathname + location.search } }); }}>Xem chi tiết</Button>
          <Button variant={saved ? "secondary" : "ghost"} size="sm" icon="bookmark" onClick={onSave}>{saved ? "Đã lưu vào tủ sách" : "Lưu vào tủ sách"}</Button>
        </div>
      </div>
    </article>
  );
}

export default function SearchResultsPage({ empty = false }: { empty?: boolean }) {
  const { search } = useLocation();
  return <BookSearch key={search} empty={empty} />;
}

function BookSearch({ empty }: { empty: boolean }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const submittedQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(submittedQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [hasFetchedEmpty, setHasFetchedEmpty] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [applied] = useState(() => ({
    docType: searchParams.get("docType") ?? "",
    publicationYear: searchParams.get("publicationYear") ?? "",
    departmentId: searchParams.get("departmentId") ?? "",
    authorId: searchParams.get("authorId") ?? "",
  }));
  const [filters, setFilters] = useState(applied);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(!empty);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [revision, setRevision] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  useEffect(() => {
    let active = true;
    userService.getDepartments().then((data) => {
      if (active) setDepartments(data);
    }).catch(() => {
      if (active) setDepartments([]);
    });
    return () => { active = false; };
  }, []);
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState<"list" | "grid">("list");
  const sort = searchParams.get("sort") ?? "relevance";
  const rawPage = Number(searchParams.get("page"));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 2147483647 ? rawPage : 1;

  function updateSearch(values: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    Object.entries(values).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    const search = params.toString();
    if (!empty && search === searchParams.toString()) setRevision((value) => value + 1);
    else navigate({ pathname: "/reader/search", search });
  }

  useEffect(() => {
    if (empty) return;
    let active = true;
    setLoading(true);
    setLoadError("");
    const sortBy = sort === "title" ? "title" : sort === "newest" ? "publicationYear" : "createdAt";
    const sortDir = sort === "title" ? "asc" : "desc";

    catalogService
      .searchDocuments({
        keyword: submittedQuery.trim() || undefined,
        docType: applied.docType.trim() || undefined,
        publicationYear: Number(applied.publicationYear) || undefined,
        departmentId: Number(applied.departmentId) || undefined,
        authorId: Number(applied.authorId) || undefined,
        page: page - 1,
        size: 10,
        sortBy,
        sortDir,
      })
      .then((pageData) => {
        if (!active) return;
        if (pageData.items) {
          setResults(
            pageData.items.map((dto, index) => mapDocumentSummaryToSearchResult(dto, index)),
          );
          setTotalElements(pageData.totalElements);
          setTotalPages(pageData.totalPages);
          setHasFetchedEmpty(pageData.items.length === 0);
        }
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Không tải được kết quả.");
      }).finally(() => { if (active) setLoading(false); });

    return () => {
      active = false;
    };
  }, [empty, page, sort, submittedQuery, applied, revision]);

  const resetFilters = () => {
    const reset = { docType: "", publicationYear: "", departmentId: "", authorId: "" };
    setFilters(reset);
    updateSearch({ ...reset, page: "" });
  };
  const toggleSave = async (result: SearchResult) => {
    setActionError("");
    if (!result.documentId || !getAccessToken()) return setActionError("Vui lòng đăng nhập để lưu tài liệu.");
    try {
      const response = await catalogService.toggleFavorite(result.documentId);
      setSaved((ids) => response.isFavorite ? [...new Set([...ids, response.documentId])] : ids.filter((id) => id !== response.documentId));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Không lưu được tài liệu.");
    }
  };
  const submitSearch = () => {
    updateSearch({ q: query.trim(), page: "" });
  };

  const isEmptyState = empty || hasFetchedEmpty;
  const displayTotal = isEmptyState ? 0 : totalElements;

  return (
    <div className="search-results-page">
      <section className="results-search-area">
        <div className="results-search-inner">
          <Breadcrumb items={[{ label: "Trang chủ", to: "/reader" }, "Tìm kiếm"]} />
          <div className="results-search-box">
            <Icon name="search" size={22} />
            <input
              aria-label="Từ khóa tìm kiếm"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && submitSearch()}
            />
            {query && <IconButton label="Xóa từ khóa" icon="close" onClick={() => setQuery("")} />}
            <Button icon="search" onClick={submitSearch}>Tìm kiếm</Button>
          </div>
          <div className="search-summary">
            <div>
              <p className="eyebrow">TRA CỨU TÀI LIỆU</p>
              <h1>Kết quả tìm kiếm cho “<mark>{submittedQuery}</mark>”</h1>
              <p>Tìm thấy <strong>{displayTotal} tài liệu phù hợp</strong> trong phạm vi <span>Toàn bộ tài liệu</span></p>
            </div>
            <Badge tone="brand">{displayTotal} KẾT QUẢ</Badge>
          </div>
          <div className="results-mode" role="tablist" aria-label="Chế độ tìm kiếm">
            <button className="active" role="tab" aria-selected="true">Tìm theo từ khóa</button>
            <button onClick={() => { navigate(`/reader/content-search?q=${encodeURIComponent(query)}`); }} role="tab" aria-selected="false">Tìm trong nội dung</button>
            <button onClick={() => { navigate(`/reader/content-search?q=${encodeURIComponent(query)}`); }} role="tab" aria-selected="false"><Icon name="sparkle" size={15} />Tìm kiếm thông minh</button>
          </div>
        </div>
      </section>

      <main className="results-layout">
        <button className="mobile-filter-trigger" onClick={() => setFilterOpen(true)}><Icon name="filter" />Bộ lọc tìm kiếm</button>
        {filterOpen && <button className="mobile-scrim" aria-label="Đóng bộ lọc" onClick={() => setFilterOpen(false)} />}
        <aside className={`filter-sidebar ${filterOpen ? "open" : ""}`}>
          <div className="filter-head">
            <div><p className="eyebrow">TINH CHỈNH KẾT QUẢ</p><h2>Bộ lọc tìm kiếm</h2></div>
            <button className="clear-filter" onClick={resetFilters}>Xóa bộ lọc</button>
            <IconButton label="Đóng bộ lọc" icon="close" onClick={() => setFilterOpen(false)} />
          </div>
          <form className="filter-group" onSubmit={(event) => {
            event.preventDefault();
            setFilterOpen(false);
            updateSearch({ ...filters, page: "" });
          }}>
            <Field label="Mã loại tài liệu" value={filters.docType} onChange={(event) => setFilters({ ...filters, docType: event.target.value })} />
            <Field label="Năm xuất bản" type="number" min={1000} max={9999} value={filters.publicationYear} onChange={(event) => setFilters({ ...filters, publicationYear: event.target.value })} />
            <Field label="ID tác giả" type="number" min={1} value={filters.authorId} onChange={(event) => setFilters({ ...filters, authorId: event.target.value })} />
            <label>Khoa/ngành <select value={filters.departmentId} onChange={(event) => setFilters({ ...filters, departmentId: event.target.value })}>
              <option value="">Tất cả</option>
              {departments.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select></label>
            <Button type="submit">Áp dụng bộ lọc</Button>
          </form>
        </aside>

        <section className="results-main">
          <div className="results-toolbar">
            <div className="results-count"><strong>{displayTotal} kết quả</strong></div>
            <div className="toolbar-controls">
              <label className="sort-control"><span>Sắp xếp:</span><select value={sort} onChange={(event) => updateSearch({ sort: event.target.value, page: "" })}><option value="relevance">Ngày thêm gần đây</option><option value="title">Tên tài liệu A–Z</option><option value="newest">Năm xuất bản mới nhất</option></select><Icon name="chevron-down" size={15} /></label>
              <div className="view-switch" aria-label="Kiểu hiển thị">
                <IconButton label="Hiển thị danh sách" icon="document" className={view === "list" ? "active" : ""} onClick={() => setView("list")} />
                <IconButton label="Hiển thị lưới" icon="dashboard" className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} />
              </div>
            </div>
          </div>
          {actionError && <p role="alert">{actionError}</p>}
          {loadError ? <div role="alert">{loadError} <Button onClick={() => setRevision((value) => value + 1)}>Thử lại</Button></div>
            : loading ? <p role="status">Đang tìm tài liệu…</p> : isEmptyState ? <div className="catalog-empty"><Icon name="search" size={28} /><h2>Không tìm thấy tài liệu phù hợp</h2><p>Hãy thử một từ khóa khác hoặc xóa bớt bộ lọc tìm kiếm.</p><Button variant="secondary" onClick={resetFilters}>Xóa bộ lọc</Button></div> : (
            <>
              <div className={`search-results-list ${view === "grid" ? "grid-view" : ""}`}>
                {results.map((result) => <SearchResultCard key={result.documentId} result={result} query={submittedQuery} saved={saved.includes(result.documentId ?? "")} onSave={() => toggleSave(result)} />)}
              </div>
              <div className="catalog-pagination">
                <p>Hiển thị <strong>{(page - 1) * 10 + 1}–{Math.min(page * 10, displayTotal)}</strong> trong {displayTotal} kết quả</p>
                <nav aria-label="Phân trang kết quả">
                  <IconButton label="Trang trước" icon="chevron-left" disabled={page === 1} onClick={() => updateSearch({ page: String(page - 1) })} />
                  <span>Trang {page}/{totalPages}</span>
                  <IconButton label="Trang sau" icon="chevron-right" disabled={page >= totalPages} onClick={() => updateSearch({ page: String(page + 1) })} />
                </nav>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
