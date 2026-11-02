import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Badge, Breadcrumb, Button, Field, Icon, IconButton, Status } from "../../../design-system";
import BookCover from "../../../components/books/BookCover";
import type { SearchResult } from "../../../data/search-results";
import { searchResults } from "../../../data/search-results";
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
    : "/reader/book-detail";
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
          <Button size="sm" onClick={() => { navigate(detailUrl); }}>Xem chi tiết</Button>
          <Button variant={saved ? "secondary" : "ghost"} size="sm" icon="bookmark" onClick={onSave}>{saved ? "Đã lưu vào tủ sách" : "Lưu vào tủ sách"}</Button>
        </div>
      </div>
    </article>
  );
}

export default function SearchResultsPage({ empty = false }: { empty?: boolean }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "trí tuệ nhân tạo";
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>(searchResults);
  const [totalElements, setTotalElements] = useState<number>(128);
  const [hasFetchedEmpty, setHasFetchedEmpty] = useState(false);
  const [saved, setSaved] = useState<number[]>([102]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState<"list" | "grid">("list");
  const [sort, setSort] = useState("relevance");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (empty) return;
    let active = true;
    const sortBy = sort === "title" ? "title" : sort === "newest" ? "publicationYear" : "createdAt";
    const sortDir = sort === "title" ? "asc" : "desc";

    catalogService
      .searchDocuments({
        keyword: submittedQuery.trim() || undefined,
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
          setHasFetchedEmpty(pageData.items.length === 0);
        }
      })
      .catch(() => {
        // Fallback to mock searchResults when backend is offline
      });

    return () => {
      active = false;
    };
  }, [empty, page, sort, submittedQuery]);

  const toggleFilter = (value: string) => setSelectedFilters((items) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);
  const toggleSave = (result: SearchResult) => {
    setSaved((items) =>
      items.includes(result.id)
        ? items.filter((item) => item !== result.id)
        : [...items, result.id],
    );
    if (result.documentId && getAccessToken()) {
      catalogService.toggleFavorite(result.documentId).catch(() => {
        // Ignore error on optimistic favorite toggle
      });
    }
  };
  const submitSearch = () => {
    if (query.trim()) {
      setSubmittedQuery(query.trim());
      setPage(1);
    }
  };

  const isEmptyState = empty || hasFetchedEmpty;
  const displayTotal = isEmptyState ? 0 : totalElements;

  return (
    <div className="search-results-page">
      <section className="results-search-area">
        <div className="results-search-inner">
          <Breadcrumb items={["Trang chủ", "Tìm kiếm"]} />
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
        <button className="mobile-filter-trigger" onClick={() => setFilterOpen(true)}><Icon name="filter" />Bộ lọc tìm kiếm {selectedFilters.length > 0 && <Badge tone="brand">{selectedFilters.length}</Badge>}</button>
        {filterOpen && <button className="mobile-scrim" aria-label="Đóng bộ lọc" onClick={() => setFilterOpen(false)} />}
        <aside className={`filter-sidebar ${filterOpen ? "open" : ""}`}>
          <div className="filter-head">
            <div><p className="eyebrow">TINH CHỈNH KẾT QUẢ</p><h2>Bộ lọc tìm kiếm</h2></div>
            <button className="clear-filter" onClick={() => setSelectedFilters([])}>Xóa bộ lọc</button>
            <IconButton label="Đóng bộ lọc" icon="close" onClick={() => setFilterOpen(false)} />
          </div>
          {filterGroups.map((group) => (
            <fieldset className="filter-group" key={group.title}>
              <legend>{group.title}<Icon name="chevron-down" size={15} /></legend>
              {group.options.map((option) => <label key={option}><input type="checkbox" checked={selectedFilters.includes(option)} onChange={() => toggleFilter(option)} /><span>{option}</span><small>{Math.floor(option.length * 2.4 + 8)}</small></label>)}
            </fieldset>
          ))}
          <fieldset className="filter-group year-filter">
            <legend>Năm xuất bản<Icon name="chevron-down" size={15} /></legend>
            <div><Field label="Từ năm" type="number" defaultValue="2020" /><Field label="Đến năm" type="number" defaultValue="2026" /></div>
          </fieldset>
          <div className="filter-actions"><Button onClick={() => setFilterOpen(false)}>Áp dụng bộ lọc</Button></div>
        </aside>

        <section className="results-main">
          <div className="results-toolbar">
            <div className="results-count"><strong>{displayTotal} kết quả</strong><span>Sắp xếp theo mức độ liên quan</span></div>
            <div className="toolbar-controls">
              <label className="sort-control"><span>Sắp xếp:</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="relevance">Mức độ liên quan</option><option value="title">Tên tài liệu A–Z</option><option value="newest">Năm xuất bản mới nhất</option><option value="popular">Mức độ phổ biến</option></select><Icon name="chevron-down" size={15} /></label>
              <div className="view-switch" aria-label="Kiểu hiển thị">
                <IconButton label="Hiển thị danh sách" icon="document" className={view === "list" ? "active" : ""} onClick={() => setView("list")} />
                <IconButton label="Hiển thị lưới" icon="dashboard" className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} />
              </div>
            </div>
          </div>
          {selectedFilters.length > 0 && <div className="active-filters">{selectedFilters.map((filter) => <button key={filter} onClick={() => toggleFilter(filter)}>{filter}<Icon name="close" size={13} /></button>)}</div>}
          {isEmptyState ? <div className="catalog-empty"><Icon name="search" size={28} /><h2>Không tìm thấy tài liệu phù hợp</h2><p>Hãy thử một từ khóa khác hoặc xóa bớt bộ lọc tìm kiếm.</p><Button variant="secondary" onClick={() => { setSelectedFilters([]); setHasFetchedEmpty(false); }}>Xóa bộ lọc</Button></div> : (
            <>
              <div className={`search-results-list ${view === "grid" ? "grid-view" : ""}`}>
                {results.map((result) => <SearchResultCard key={result.id} result={result} query={submittedQuery} saved={saved.includes(result.id)} onSave={() => toggleSave(result)} />)}
              </div>
              <div className="catalog-pagination">
                <p>Hiển thị <strong>{(page - 1) * 10 + 1}–{Math.min(page * 10, displayTotal)}</strong> trong {displayTotal} kết quả</p>
                <nav aria-label="Phân trang kết quả">
                  <IconButton label="Trang trước" icon="chevron-left" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} />
                  {[1, 2, 3, 4].map((number) => <button key={number} className={page === number ? "active" : ""} onClick={() => setPage(number)}>{number}</button>)}
                  <span>…</span><button className={page === 13 ? "active" : ""} onClick={() => setPage(13)}>13</button>
                  <IconButton label="Trang sau" icon="chevron-right" disabled={page === 13} onClick={() => setPage((value) => Math.min(13, value + 1))} />
                </nav>
                <label>Hiển thị<select defaultValue="10"><option>10</option><option>20</option><option>50</option></select>/ trang</label>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
