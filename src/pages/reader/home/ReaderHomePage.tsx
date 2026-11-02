import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Badge, Button, Icon, Rating } from "../../../design-system";
import Brand from "../../../components/common/Brand";
import HomeSection from "../../../components/common/HomeSection";
import BookCard from "../../../components/books/BookCard";
import BookCover from "../../../components/books/BookCover";
import { fieldBooks, recommendationBooks, newBooks } from "../../../data/books";
import { catalogService } from "../../../services/catalog.service";
import { searchService } from "../../../services/search.service";
import { getAccessToken } from "../../../services/session";
import type { Book } from "../../../types/library";
import { mapDocumentSummaryToBook, mapRecommendationToBook } from "../../../utils/mappers";

export default function ReaderHome() {
  const navigate = useNavigate();
  const [searchMode, setSearchMode] = useState<"keyword" | "content">("keyword");
  const [searchInput, setSearchInput] = useState("");
  const [saved, setSaved] = useState<number[]>([2]);
  const [hiddenRecommendations, setHiddenRecommendations] = useState<number[]>([]);
  const [majorBooks, setMajorBooks] = useState<Book[]>(fieldBooks);
  const [latestBooks, setLatestBooks] = useState<Book[]>(newBooks);
  const [recommendations, setRecommendations] = useState(recommendationBooks);

  useEffect(() => {
    let active = true;

    catalogService
      .searchDocuments({ page: 0, size: 8 })
      .then((pageData) => {
        if (!active || !pageData.items?.length) return;
        const mapped = pageData.items.map((dto, index) => mapDocumentSummaryToBook(dto, index));
        setMajorBooks(mapped.slice(0, 4));
        if (mapped.length > 4) {
          setLatestBooks(mapped.slice(4, 8));
        } else {
          setLatestBooks(mapped);
        }
      })
      .catch(() => {
        // Keep mock books when backend is offline
      });

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
    setSaved((items) =>
      items.includes(book.id) ? items.filter((item) => item !== book.id) : [...items, book.id],
    );
    if (book.documentId && getAccessToken()) {
      catalogService.toggleFavorite(book.documentId).catch(() => {
        // Ignore error on optimistic toggle
      });
    }
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
        <HomeSection
          eyebrow="DÀNH RIÊNG CHO BẠN"
          title="Tài liệu dành cho ngành của bạn"
          subtitle="Được chọn dựa trên ngành đào tạo trong hồ sơ của bạn."
          action="Xem tất cả"
        >
          <div className="book-grid">
            {majorBooks.map((book) => <BookCard key={book.id} book={book} saved={saved.includes(book.id)} onSave={() => toggleSave(book)} />)}
          </div>
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

        <HomeSection title="Tài liệu mới bổ sung" subtitle="Những tài liệu vừa được cập nhật vào bộ sưu tập thư viện." action="Khám phá tài liệu mới">
          <div className="book-grid">
            {latestBooks.map((book) => <BookCard key={book.id} book={book} saved={saved.includes(book.id)} onSave={() => toggleSave(book)} />)}
          </div>
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
