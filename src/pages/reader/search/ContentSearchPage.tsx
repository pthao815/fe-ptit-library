import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Badge, Breadcrumb, Button, Icon, IconButton } from "../../../design-system";
import BookCover from "../../../components/books/BookCover";
import type { ContentSearchResult } from "../../../data/search-results";
import { contentSearchResults } from "../../../data/search-results";
import { contentFilterGroups } from "../../../constants/library-options";

function ContentSearchResultCard({ result, saved, onSave }: { result: ContentSearchResult; saved: boolean; onSave: () => void }) {
  const navigate = useNavigate();
  const documentPage = result.id === 301 ? 42 : result.id === 302 ? 18 : 76;
  return (
    <article className="semantic-result-card">
      <div className="semantic-cover">
        <BookCover book={result} />
        <span>{result.classification}</span>
      </div>
      <div className="semantic-result-main">
        <div className="semantic-heading">
          <div><div className="book-meta"><span>{result.type}</span><i /><span>{result.year}</span></div><h2>{result.title}</h2><p>{result.author}</p></div>
          <div className="semantic-score"><strong>{result.relevance}%</strong><span>phù hợp</span></div>
        </div>
        <button className="semantic-match" onClick={() => { navigate(`/reader/document/${documentPage}`); }}>
          <span className="semantic-match-title"><Icon name="sparkle" size={16} /><strong>Đoạn nội dung phù hợp</strong><Badge tone="brand">TÌM THEO NỘI DUNG</Badge></span>
          <span className="semantic-quote">“…{result.snippetBefore}<mark>{result.snippetMatch}</mark>{result.snippetAfter}…”</span>
          <span className="semantic-location"><Icon name="document" size={15} />{result.location}</span>
        </button>
        <div className="semantic-signals">
          <div className={result.available ? "available" : "unavailable"}><span><Icon name="library" size={16} />BẢN IN</span><strong>{result.copies}</strong><small>{result.shelf}</small></div>
          <div className="digital"><span><Icon name="document" size={16} />TÀI LIỆU SỐ</span><strong>{result.digital ? "Có tài liệu số" : "Chưa có tài liệu số"}</strong><small>Đọc toàn văn trực tuyến</small></div>
          <div><span>CỘNG ĐỒNG</span><strong>{result.borrows} lượt mượn</strong><small>{result.communityRating} ★ · Đánh giá bạn đọc</small></div>
        </div>
        <div className="semantic-actions">
          <Button size="sm" onClick={() => { navigate("/reader/book-detail"); }}>Xem chi tiết</Button>
          <Button variant="secondary" size="sm" icon="document" onClick={() => { navigate(`/reader/document/${documentPage}`); }}>Đọc trực tuyến</Button>
          {!result.available && <Button variant="ghost" size="sm" icon="bookmark">Đặt trước</Button>}
          <Button variant="ghost" size="sm" icon="bookmark" onClick={onSave}>{saved ? "Đã lưu" : "Lưu"}</Button>
        </div>
      </div>
    </article>
  );
}

export default function ContentSearchResultsPage({ empty = false }: { empty?: boolean }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("Tác động của trí tuệ nhân tạo đối với giáo dục đại học");
  const [saved, setSaved] = useState<number[]>([302]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["Công nghệ thông tin", "Tiếng Việt"]);
  const [filterOpen, setFilterOpen] = useState(false);
  const toggleFilter = (value: string) => setSelectedFilters((items) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);
  const toggleSave = (id: number) => setSaved((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  return (
    <div className="content-search-page">
      <section className="semantic-search-header">
        <div className="semantic-search-inner">
          <Breadcrumb items={["Trang chủ", "Kết quả tìm kiếm theo nội dung"]} />
          <div className="semantic-tabs" role="tablist" aria-label="Chế độ tìm kiếm">
            <button onClick={() => { navigate("/reader/search"); }} role="tab" aria-selected="false">Từ khóa</button>
            <button className="active" role="tab" aria-selected="true"><Icon name="sparkle" size={15} />Tìm theo nội dung</button>
          </div>
          <div className="semantic-search-box"><Icon name="sparkle" size={22} /><input aria-label="Nội dung tìm kiếm" value={query} onChange={(event) => setQuery(event.target.value)} /><Button icon="search">Tìm kiếm</Button></div>
          <div className="semantic-query-meta"><p><strong>{empty ? "0 kết quả" : "128 kết quả"}</strong> cho truy vấn của bạn</p><span><Icon name="info" size={14} />Kết quả được phân tích theo ý nghĩa và nội dung bên trong tài liệu</span></div>
        </div>
      </section>
      <main className="semantic-layout">
        <button className="mobile-filter-trigger" onClick={() => setFilterOpen(true)}><Icon name="filter" />Bộ lọc <Badge tone="brand">{selectedFilters.length}</Badge></button>
        {filterOpen && <button className="mobile-scrim" aria-label="Đóng bộ lọc" onClick={() => setFilterOpen(false)} />}
        <aside className={`semantic-filter-sidebar ${filterOpen ? "open" : ""}`}>
          <div className="semantic-filter-head"><div><p className="eyebrow">TINH CHỈNH KẾT QUẢ</p><h2>Bộ lọc</h2></div><IconButton label="Đóng bộ lọc" icon="close" onClick={() => setFilterOpen(false)} /></div>
          {contentFilterGroups.map((group) => <fieldset key={group.title}><legend>{group.title}<Icon name="chevron-down" size={15} /></legend>{group.options.map((option) => <label key={option}><input type="checkbox" checked={selectedFilters.includes(option)} onChange={() => toggleFilter(option)} /><span>{option}</span><small>{Math.floor(option.length * 2.7 + 12)}</small></label>)}</fieldset>)}
          <div className="semantic-filter-actions"><Button onClick={() => setFilterOpen(false)}>Áp dụng</Button><Button variant="ghost" onClick={() => setSelectedFilters([])}>Xóa bộ lọc</Button></div>
        </aside>
        <section className="semantic-results-main">
          <div className="semantic-toolbar"><div>{selectedFilters.slice(0, 3).map((filter) => <button key={filter} onClick={() => toggleFilter(filter)}>{filter}<Icon name="close" size={13} /></button>)}</div><label><span>Sắp xếp:</span><select defaultValue="relevance"><option value="relevance">Mức độ liên quan</option><option value="popular">Mức độ phổ biến</option><option value="newest">Năm xuất bản mới nhất</option></select><Icon name="chevron-down" size={15} /></label></div>
          {empty ? <div className="catalog-empty"><Icon name="search" size={28} /><h2>Không tìm thấy tài liệu phù hợp</h2><p>Thử thay đổi truy vấn hoặc sử dụng một mô tả rộng hơn.</p><Button variant="secondary" onClick={() => setSelectedFilters([])}>Xóa bộ lọc</Button></div> : <>
            <div className="semantic-results-list">{contentSearchResults.map((result) => <ContentSearchResultCard key={result.id} result={result} saved={saved.includes(result.id)} onSave={() => toggleSave(result.id)} />)}</div>
            <div className="results-load-more"><p>Đang hiển thị 3 trong tổng số 128 kết quả</p><Button variant="secondary">Xem thêm kết quả</Button></div>
          </>}
        </section>
      </main>
    </div>
  );
}
