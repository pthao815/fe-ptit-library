import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, EmptyState, Icon, IconButton, LoadingState, Rating, Toast } from "../../../design-system";
import Brand from "../../../components/common/Brand";
import HomeSection from "../../../components/common/HomeSection";
import BookCard from "../../../components/books/BookCard";
import BookCover from "../../../components/books/BookCover";
import { recommendationBooks } from "../../../data/books";
import { catalogService, getTrackedFavorites, syncFavoriteBook } from "../../../services/catalog.service";
import { recommendationService } from "../../../services/recommendation.service";
import { getAccessToken, getStoredUser } from "../../../services/session";
import type { Book } from "../../../types/library";
import { mapDocumentSummaryToBook, mapMessageQueueToNotification, mapRecommendationToBook } from "../../../utils/mappers";
import { notificationService } from "../../../services/analytics.service";
import type { LibraryNotification } from "../../../data/notifications";

const NOTICE_TONE: Record<LibraryNotification["tone"], string> = { warning: "notice-warning", success: "notice-success", brand: "" };

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
    return tracked.length > 0 ? tracked.map((b) => b.id) : [];
  });
  const [hiddenRecommendations, setHiddenRecommendations] = useState<number[]>([]);
  const [catalogSaved, setCatalogSaved] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const item of getTrackedFavorites()) {
      if (item.documentId) map[item.documentId.toLowerCase()] = true;
    }
    return map;
  });
  const [savingDocIds, setSavingDocIds] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ tone: "success" | "info" | "error"; title: string; text: string } | null>(null);
  const pendingFavorites = useRef(new Set<string>());
  const recommendationTrackRef = useRef<HTMLDivElement | null>(null);
  const departmentId = getStoredUser()?.departmentId;
  const majorBooks = useHomeCatalog(departmentId);
  const latestBooks = useHomeCatalog(undefined, true);
  const [recommendations, setRecommendations] = useState(recommendationBooks);
  const [notices, setNotices] = useState<{ status: "loading" | "error" | "ready"; items: LibraryNotification[] }>({ status: "loading", items: [] });

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!getAccessToken()) return;
    let active = true;
    catalogService
      .getMyFavorites({ page: 0, size: 100 })
      .then((page) => {
        if (!active) return;
        const map: Record<string, boolean> = {};
        for (const item of page.items) {
          const id = item.documentId || item.id;
          if (id) map[id.toLowerCase()] = true;
        }
        setCatalogSaved(map);
      })
      .catch(() => {
        // Keep tracked favorites fallback when API call fails
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!getAccessToken()) return;
    let active = true;
    notificationService
      .getMyNotifications({ page: 0, size: 4 })
      .then((page) => { if (active) setNotices({ status: "ready", items: page.items.map(mapMessageQueueToNotification) }); })
      .catch(() => { if (active) setNotices({ status: "error", items: [] }); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    if (getAccessToken()) {
      recommendationService
        .getMyRecommendations(10)
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

  async function toggleCatalogFavorite(book: Book) {
    const documentId = book.documentId;
    if (!documentId) return;
    if (!getAccessToken()) {
      setToast({
        tone: "info",
        title: "Cần đăng nhập",
        text: "Vui lòng đăng nhập để lưu tài liệu vào tủ sách yêu thích.",
      });
      return;
    }
    const key = documentId.toLowerCase();
    if (pendingFavorites.current.has(key)) return;
    pendingFavorites.current.add(key);
    const wasSaved = Boolean(catalogSaved[key]);
    setSavingDocIds((current) => ({ ...current, [key]: true }));
    setCatalogSaved((current) => ({ ...current, [key]: !wasSaved }));
    try {
      const result = await catalogService.toggleFavorite(documentId);
      setCatalogSaved((current) => ({ ...current, [key]: result.isFavorite }));
      syncFavoriteBook(book, result.isFavorite);
      setSaved((items) =>
        result.isFavorite
          ? (items.includes(book.id) ? items : [...items, book.id])
          : items.filter((item) => item !== book.id),
      );
      setToast({
        tone: result.isFavorite ? "success" : "info",
        title: result.isFavorite ? "Đã lưu tài liệu" : "Đã bỏ lưu tài liệu",
        text: result.isFavorite
          ? `Đã thêm “${book.title}” vào tủ sách yêu thích.`
          : `Đã xóa “${book.title}” khỏi tủ sách yêu thích.`,
      });
    } catch (error) {
      setCatalogSaved((current) => ({ ...current, [key]: wasSaved }));
      setToast({
        tone: "error",
        title: "Không cập nhật được tủ sách",
        text: error instanceof Error ? error.message : "Không cập nhật được tài liệu đã lưu.",
      });
    } finally {
      pendingFavorites.current.delete(key);
      setSavingDocIds((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  }

  const renderCatalog = (catalog: ReturnType<typeof useHomeCatalog>) => {
    if (catalog.error) {
      return (
        <EmptyState
          surface="card"
          tone="error"
          title="Không tải được danh mục tài liệu"
          description={catalog.error}
          action={<Button size="sm" onClick={catalog.retry}>Thử lại</Button>}
        />
      );
    }
    if (!catalog.books) return <LoadingState variant="cards" count={4} title="Đang tải tài liệu…" />;
    if (!catalog.books.length) {
      return (
        <EmptyState
          surface="card"
          icon="book"
          title="Chưa có tài liệu nào"
          description="Danh mục này hiện chưa có biểu ghi nào để hiển thị."
          action={<Button variant="secondary" size="sm" onClick={() => navigate("/reader/search")}>Khám phá kho tài liệu</Button>}
        />
      );
    }
    return <div className="book-grid">
      {catalog.books.map((book) => {
        const key = book.documentId?.toLowerCase() ?? "";
        return (
          <BookCard
            key={book.documentId ?? book.id}
            book={book}
            detailPath={book.documentId ? "/reader/book-detail?id=" + encodeURIComponent(book.documentId) : undefined}
            saved={Boolean(key && catalogSaved[key])}
            saving={Boolean(key && savingDocIds[key])}
            onSave={() => { void toggleCatalogFavorite(book); }}
          />
        );
      })}
    </div>;
  };

  const handleHeroSearch = () => {
    const q = searchInput.trim();
    const params = new URLSearchParams();
    if (searchMode === "content") params.set("mode", "smart");
    if (q) params.set("q", q);
    const search = params.toString();
    navigate(search ? `/reader/search?${search}` : "/reader/search");
  };

  const visibleRecommendations = recommendations.filter(
    (book) => !hiddenRecommendations.includes(book.id),
  );

  const scrollRecommendations = (direction: -1 | 1) => {
    const track = recommendationTrackRef.current;
    if (!track) return;
    const distance = Math.max(320, Math.round(track.clientWidth * 0.85)) * direction;
    track.scrollBy({ left: distance, behavior: "smooth" });
  };

  return (
    <div className="reader-home">
      <section className="reader-hero">
        <div className="reader-hero-inner">
          <Badge tone="brand"><Icon name="sparkle" size={14} /> KHÔNG GIAN TRI THỨC PTIT</Badge>
          <h1>Khám phá kho tri thức</h1>
          <p>Tìm kiếm tài liệu theo từ khóa hoặc tìm kiếm thông minh theo nội dung bạn đang quan tâm.</p>
          <div className="search-mode" role="tablist" aria-label="Chế độ tìm kiếm">
            <button className={searchMode === "keyword" ? "active" : ""} onClick={() => setSearchMode("keyword")} role="tab" aria-selected={searchMode === "keyword"}><Icon name="search" size={17} />Tìm theo từ khóa</button>
            <button className={searchMode === "content" ? "active" : ""} onClick={() => setSearchMode("content")} role="tab" aria-selected={searchMode === "content"}><Icon name="sparkle" size={17} />Tìm kiếm thông minh</button>
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
          <div className="recommendation-carousel">
            {visibleRecommendations.length > 3 && (
              <IconButton
                className="recommendation-nav-btn prev"
                label="Xem gợi ý trước"
                icon="chevron-left"
                onClick={() => scrollRecommendations(-1)}
              />
            )}
            <div className="recommendation-grid" ref={recommendationTrackRef}>
              {visibleRecommendations.map((book) => {
                const detailPath = book.documentId
                  ? `/reader/book-detail?id=${encodeURIComponent(book.documentId)}`
                  : undefined;
                return (
                  <article
                    className={`recommendation-card ${detailPath ? "clickable-card" : ""}`}
                    key={book.id}
                    onClick={(event) => {
                      if (!detailPath) return;
                      if ((event.target as HTMLElement).closest("button, a, input, select")) return;
                      navigate(detailPath);
                    }}
                  >
                    {detailPath ? (
                      <Link to={detailPath} style={{ display: "flex", flexShrink: 0 }} aria-label={`Xem chi tiết ${book.title}`}>
                        <BookCover book={book} compact />
                      </Link>
                    ) : (
                      <BookCover book={book} compact />
                    )}
                    <div className="recommendation-body">
                      <div className="relevance"><Icon name="sparkle" size={14} /><strong>{book.relevance}% phù hợp</strong></div>
                      <h3>{detailPath ? <Link to={detailPath}>{book.title}</Link> : book.title}</h3>
                      <p>{book.author}</p>
                      <Rating value={book.rating} />
                      <div className="recommendation-reason"><Icon name="info" size={15} />{book.reason}</div>
                      <div className="recommendation-actions">
                        {(() => {
                          const docKey = book.documentId?.toLowerCase();
                          const isSaved = docKey ? Boolean(catalogSaved[docKey]) : saved.includes(book.id);
                          return (
                            <Button
                              variant={isSaved ? "secondary" : "ghost"}
                              size="sm"
                              icon="bookmark"
                              disabled={Boolean(docKey && savingDocIds[docKey])}
                              onClick={() => (book.documentId ? void toggleCatalogFavorite(book) : toggleSave(book))}
                            >
                              {isSaved ? "Đã lưu" : "Lưu"}
                            </Button>
                          );
                        })()}
                        <button onClick={() => setHiddenRecommendations((items) => [...items, book.id])}>Không quan tâm</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {visibleRecommendations.length > 3 && (
              <IconButton
                className="recommendation-nav-btn next"
                label="Xem gợi ý tiếp theo"
                icon="chevron-right"
                onClick={() => scrollRecommendations(1)}
              />
            )}
          </div>
        </HomeSection>

        <HomeSection title="Tài liệu mới bổ sung" subtitle="Những tài liệu vừa được cập nhật vào bộ sưu tập thư viện." action="Khám phá tài liệu mới" onAction={() => navigate("/reader/search")}>
          {renderCatalog(latestBooks)}
        </HomeSection>

        {getAccessToken() && (
          <HomeSection title="Thông báo thư viện" action="Xem tất cả thông báo" onAction={() => navigate("/reader/notifications")}>
            {notices.status === "loading" ? (
              <LoadingState surface="card" title="Đang tải thông báo…" />
            ) : notices.status === "error" ? (
              <EmptyState surface="card" tone="error" title="Không tải được thông báo" description="Vui lòng thử lại sau." />
            ) : !notices.items.length ? (
              <EmptyState surface="card" icon="bell" title="Chưa có thông báo nào" description="Nhắc hạn trả, sách đặt trước sẵn sàng… sẽ hiện tại đây." />
            ) : (
              <div className="notice-list">
                {notices.items.map((item) => (
                  <Link key={item.id} className={`notice-item ${NOTICE_TONE[item.tone]}`} to={`/reader/notifications/${item.id}`}>
                    <span><Icon name={item.icon} /></span>
                    <div><Badge tone={item.tone === "brand" ? "info" : item.tone}>{item.category}</Badge><h3>{item.title}</h3><p>{item.intro}</p></div>
                    <Icon name="chevron-right" />
                  </Link>
                ))}
              </div>
            )}
          </HomeSection>
        )}
      </main>

      <footer className="reader-footer">
        <div><Brand compact to="/reader" /><p>Học viện Công nghệ Bưu chính Viễn thông</p></div>
        <nav aria-label="Liên kết chân trang"><button onClick={() => { navigate("/reader/guidelines"); }}>Hướng dẫn sử dụng</button><button onClick={() => { navigate("/reader/guidelines"); }}>Quy định thư viện</button><button>Liên hệ hỗ trợ</button></nav>
        <small>© 2025 PTIT Library</small>
      </footer>

      {toast && (
        <div className="toast-position">
          <Toast tone={toast.tone} title={toast.title} onClose={() => setToast(null)}>
            {toast.text}
          </Toast>
        </div>
      )}
    </div>
  );
}
