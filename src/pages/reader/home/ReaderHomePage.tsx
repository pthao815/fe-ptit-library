import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Icon, Rating } from "../../../design-system";
import Brand from "../../../components/common/Brand";
import HomeSection from "../../../components/common/HomeSection";
import BookCard from "../../../components/books/BookCard";
import BookCover from "../../../components/books/BookCover";
<<<<<<< HEAD
import { recommendationBooks } from "../../../data/books";
import { catalogService } from "../../../services/catalog.service";
=======
import { fieldBooks, recommendationBooks, newBooks } from "../../../data/books";
import { catalogService, getTrackedFavorites, syncFavoriteBook } from "../../../services/catalog.service";
>>>>>>> origin/main
import { searchService } from "../../../services/search.service";
import { getAccessToken, getStoredUser } from "../../../services/session";
import type { Book } from "../../../types/library";
import { mapDocumentSummaryToBook, mapRecommendationToBook } from "../../../utils/mappers";

function useHomeCatalog(departmentId?: number, latest = false) {
  const [state, setState] = useState<{ books?: Book[]; error?: string }>({});
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setState({});
    catalogService.searchDocuments({
      departmentId, page: 0, size: 4, sortBy: latest ? "createdAt" : "title",
      sortDir: latest ? "desc" : "asc",
    }).then(({ items }) => {
      if (active) setState({ books: items.map(mapDocumentSummaryToBook) });
    }).catch((error: unknown) => {
      if (active) setState({ error: error instanceof Error ? error.message : "Không tải được danh mục." });
    });
    return () => { active = false; };
  }, [departmentId, latest, revision]);

  return { ...state, retry: () => setRevision((value) => value + 1) };
}

export default function ReaderHome() {
  const navigate = useNavigate();
  const [searchMode, setSearchMode] = useState<"keyword" | "content">("keyword");
  const [searchInput, setSearchInput] = useState("");
  const [saved, setSaved] = useState<number[]>(() => {
    const tracked = getTrackedFavorites();
    return tracked.length > 0 ? tracked.map((b) => b.id) : [2];
  });
  const [hiddenRecommendations, setHiddenRecommendations] = useState<number[]>([]);
  const [catalogSaved, setCatalogSaved] = useState<Record<string, boolean>>({});
  const [catalogActionError, setCatalogActionError] = useState("");
  const pendingFavorites = useRef(new Set<string>());
  const departmentId = getStoredUser()?.departmentId;
  const majorBooks = useHomeCatalog(departmentId);
  const latestBooks = useHomeCatalog(undefined, true);
  const [recommendations, setRecommendations] = useState(recommendationBooks);

  useEffect(() => {
    let active = true;

    if (getAccessToken()) {
      searchService
        .getMyRecommendations(3)
        .then((items) => {
          if (active && items?.length) {
            setRecommendations(items.map((dto, index) => mapRecommendationToBook(dto, index)));
          }
        })
        .catch(() => {
          // Keep mock recommendations
        });
    }

    return () => {
      active = false;
    };
  }, []);

  const toggleSave = (book: Book) => {
    const wasSaved = saved.includes(book.id);
    const nextSaved = wasSaved ? saved.filter((item) => item !== book.id) : [...saved, book.id];
    setSaved(nextSaved);

    if (book.documentId && getAccessToken()) {
      catalogService
        .toggleFavorite(book.documentId)
        .then((res) => {
          syncFavoriteBook(book, res.isFavorite);
          if (res.isFavorite !== !wasSaved) {
            setSaved((items) =>
              res.isFavorite
                ? (items.includes(book.id) ? items : [...items, book.id])
                : items.filter((item) => item !== book.id),
            );
          }
        })
        .catch(() => {
          // Revert optimistic state when API call fails
          setSaved((items) =>
            wasSaved
              ? (items.includes(book.id) ? items : [...items, book.id])
              : items.filter((item) => item !== book.id),
          );
        });
    } else {
      syncFavoriteBook(book, !wasSaved);
    }
  };

  async function toggleCatalogFavorite(documentId: string) {
    if (!getAccessToken()) {
      setCatalogActionError("Vui lòng đăng nhập để lưu tài liệu.");
      return;
    }
    if (pendingFavorites.current.has(documentId)) return;
    pendingFavorites.current.add(documentId);
    setCatalogActionError("");
    try {
      const result = await catalogService.toggleFavorite(documentId);
      setCatalogSaved((current) => ({ ...current, [documentId]: result.isFavorite }));
    } catch (error) {
      setCatalogActionError(error instanceof Error ? error.message : "Không cập nhật được tài liệu đã lưu.");
    } finally {
      pendingFavorites.current.delete(documentId);
    }
  }

  const renderCatalog = (catalog: ReturnType<typeof useHomeCatalog>) => {
    if (catalog.error) return <p role="alert">{catalog.error} <Button size="sm" onClick={catalog.retry}>Thử lại</Button></p>;
    if (!catalog.books) return <p role="status">Đang tải tài liệu…</p>;
    if (!catalog.books.length) return <p>Chưa có tài liệu.</p>;
    return <div className="book-grid">
      {catalog.books.map((book) => <BookCard key={book.documentId ?? book.id} book={book}
        detailPath={book.documentId ? "/reader/book-detail?id=" + encodeURIComponent(book.documentId) : undefined}
        saved={Boolean(book.documentId && catalogSaved[book.documentId])}
        onSave={() => { if (book.documentId) void toggleCatalogFavorite(book.documentId); }} />)}
    </div>;
  };

  const handleHeroSearch = () => {
    const q = searchInput.trim();
    const targetPath = searchMode === "content" ? "/reader/content-search" : "/reader/search";
    navigate(q ? `${targetPath}?q=${encodeURIComponent(q)}` : targetPath);
  };

  return (
    <div className="reader-home">
      <section className="reader-hero">
        <div className="reader-hero-inner">
          <Badge tone="brand"><Icon name="sparkle" size={14} /> KHÔNG GIAN TRI THỨC PTIT</Badge>
          <h1>Khám phá kho tri thức</h1>
          <p>Tìm kiếm tài liệu theo từ khóa hoặc mô tả nội dung bạn đang quan tâm.</p>
          <div className="search-mode" role="tablist" aria-label="Chế độ tìm kiếm">
            <button className={searchMode === "keyword" ? "active" : ""} onClick={() => setSearchMode("keyword")} role="tab" aria-selected={searchMode === "keyword"}><Icon name="search" size={17} />Từ khóa</button>
            <button className={searchMode === "content" ? "active" : ""} onClick={() => setSearchMode("content")} role="tab" aria-selected={searchMode === "content"}><Icon name="sparkle" size={17} />Nội dung</button>
          </div>
          <div className={`hero-search ${searchMode === "content" ? "content-mode" : ""}`}>
            <Icon name={searchMode === "content" ? "sparkle" : "search"} size={23} />
            <input
              aria-label="Nội dung tìm kiếm"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleHeroSearch()}
              placeholder={searchMode === "content" ? "Mô tả chủ đề hoặc dán một đoạn văn bản bạn quan tâm..." : "Bạn muốn tìm hiểu điều gì?"}
            />
            <Button icon="search" onClick={handleHeroSearch}>Tìm kiếm</Button>
          </div>
          <div className="search-support">
            <span>{searchMode === "content" ? "Bạn có thể dùng câu hỏi tự nhiên, mô tả chủ đề hoặc một đoạn trích." : "Gợi ý: trí tuệ nhân tạo, mạng máy tính, xử lý tín hiệu..."}</span>
            <button onClick={() => navigate("/reader/search")}><Icon name="filter" size={15} />Tìm kiếm nâng cao</button>
          </div>
        </div>
      </section>

      <main className="reader-home-content">
        {catalogActionError && <p role="alert">{catalogActionError}</p>}
        <HomeSection
          title={departmentId ? "Tài liệu theo khoa/ngành" : "Khám phá danh mục"}
          action="Xem tất cả"
          onAction={() => navigate(departmentId ? "/reader/search?departmentId=" + departmentId : "/reader/search")}
        >
          {renderCatalog(majorBooks)}
        </HomeSection>

        <HomeSection
          eyebrow="ĐỀ XUẤT CÁ NHÂN HÓA"
          title="Gợi ý dành cho bạn"
          subtitle="Các tài liệu được lựa chọn từ ngành học và hành vi đọc của bạn."
        >
          <div className="recommendation-grid">
            {recommendations.filter((book) => !hiddenRecommendations.includes(book.id)).map((book) => (
              <article className="recommendation-card" key={book.id}>
                <BookCover book={book} compact />
                <div className="recommendation-body">
                  <div className="relevance"><Icon name="sparkle" size={14} /><strong>{book.relevance}% phù hợp</strong></div>
                  <h3>{book.title}</h3>
                  <p>{book.author}</p>
                  <Rating value={book.rating} />
                  <div className="recommendation-reason"><Icon name="info" size={15} />{book.reason}</div>
                  <div className="recommendation-actions">
                    <Button variant={saved.includes(book.id) ? "secondary" : "ghost"} size="sm" icon="bookmark" onClick={() => toggleSave(book)}>{saved.includes(book.id) ? "Đã lưu" : "Lưu"}</Button>
                    <button onClick={() => setHiddenRecommendations((items) => [...items, book.id])}>Không quan tâm</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </HomeSection>

        <HomeSection title="Tài liệu mới bổ sung" subtitle="Những tài liệu vừa được cập nhật vào bộ sưu tập thư viện." action="Khám phá tài liệu mới" onAction={() => navigate("/reader/search")}>
          {renderCatalog(latestBooks)}
        </HomeSection>

        <HomeSection title="Thông báo thư viện" action="Xem tất cả thông báo">
          <div className="notice-list">
            <article className="notice-item notice-warning"><span><Icon name="book" /></span><div><Badge tone="warning">SẮP ĐẾN HẠN</Badge><h3>01 tài liệu cần trả trước ngày 28/06/2025</h3><p>Giáo trình “Cấu trúc dữ liệu và giải thuật” sắp đến hạn trả.</p></div><Icon name="chevron-right" /></article>
            <article className="notice-item notice-success"><span><Icon name="bookmark" /></span><div><Badge tone="success">ĐÃ SẴN SÀNG</Badge><h3>Sách đặt trước của bạn đã sẵn sàng</h3><p>Vui lòng nhận tài liệu tại quầy lưu thông trong vòng 48 giờ.</p></div><Icon name="chevron-right" /></article>
            <article className="notice-item"><span><Icon name="bell" /></span><div><Badge tone="info">THƯ VIỆN</Badge><h3>Điều chỉnh thời gian phục vụ cuối tuần</h3><p>Thư viện mở cửa từ 08:00 đến 17:00 vào thứ Bảy tuần này.</p></div><Icon name="chevron-right" /></article>
            <article className="notice-item notice-error"><span><Icon name="error" /></span><div><Badge tone="error">CÔNG NỢ</Badge><h3>Bạn có một khoản phí cần xử lý</h3><p>Phí quá hạn tài liệu hiện tại là 20.000đ. Liên hệ quầy để được hỗ trợ.</p></div><Icon name="chevron-right" /></article>
          </div>
        </HomeSection>
      </main>

      <footer className="reader-footer">
        <div><Brand compact /><p>Học viện Công nghệ Bưu chính Viễn thông</p></div>
        <nav aria-label="Liên kết chân trang"><button onClick={() => { navigate("/reader/guidelines"); }}>Hướng dẫn sử dụng</button><button onClick={() => { navigate("/reader/guidelines"); }}>Quy định thư viện</button><button>Liên hệ hỗ trợ</button></nav>
        <small>© 2025 PTIT Library</small>
      </footer>
    </div>
  );
}
