import { useLocation, useNavigate } from "react-router-dom";
import { Badge, Button, Icon, Status } from "../../../design-system";
import BookCover from "../../../components/books/BookCover";
import { parseMarkedSnippet, type UnifiedSearchItem } from "./search-options";

function HighlightText({ text, query }: { text: string; query: string }) {
  const normalized = query.trim();
  if (!normalized) return <>{text}</>;
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === normalized.toLowerCase() ? (
          <mark key={`${part}-${index}`}>{part}</mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

interface SearchResultCardProps {
  item: UnifiedSearchItem;
  query: string;
  saved: boolean;
  onSave: () => void;
}

export default function SearchResultCard({
  item,
  query,
  saved,
  onSave,
}: SearchResultCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const detailUrl = `/reader/book-detail?id=${encodeURIComponent(item.documentId)}`;
  const returnState = { state: { returnTo: location.pathname + location.search } };
  const snippetParts = item.mode === "smart" ? parseMarkedSnippet(item.snippet) : [];

  return (
    <article className="search-result-card">
      <div className="result-cover-column">
        <BookCover book={item.book} />
        <Badge tone="brand">{item.docTypeLabel}</Badge>
      </div>

      <div className="result-main">
        <div className="result-heading-row">
          <div className="result-title-block">
            <div className="book-meta">
              <span>{item.docTypeLabel}</span>
              <i />
              <span>{item.year}</span>
              {item.languageLabel && (
                <>
                  <i />
                  <span>{item.languageLabel}</span>
                </>
              )}
            </div>
            <h2>
              <HighlightText text={item.title} query={query} />
            </h2>
            <p className="result-author">
              {item.mode === "smart" ? (
                <>Định dạng: <strong>Tài liệu số toàn văn</strong></>
              ) : (
                <>Tác giả: <strong>{item.author}</strong></>
              )}
            </p>
          </div>

          {item.mode === "smart" && typeof item.matchScore === "number" && (
            <div className="relevance-score" title="Mức độ phù hợp với truy vấn">
              <strong>{item.matchScore}%</strong>
              <span>Phù hợp</span>
            </div>
          )}
        </div>

        {item.mode === "smart" ? (
          <div className="content-match">
            <div className="content-match-label">
              <Icon name="sparkle" size={14} />
              <strong>Đoạn nội dung phù hợp</strong>
              <Badge tone="brand">TÌM KIẾM THÔNG MINH</Badge>
            </div>
            <blockquote>
              {snippetParts.length > 0 ? (
                <>
                  …
                  {snippetParts.map((part, idx) =>
                    part.marked ? <mark key={idx}>{part.text}</mark> : <span key={idx}>{part.text}</span>,
                  )}
                  …
                </>
              ) : (
                "Tài liệu khớp với truy vấn tìm kiếm thông minh của bạn."
              )}
            </blockquote>
            {item.matchLocation && (
              <span className="match-location">
                <Icon name="document" size={14} />
                {item.matchLocation}
              </span>
            )}
          </div>
        ) : (
          <>
            <div className="result-bibliography">
              <span>
                <small>Đơn vị phát hành</small>
                <strong>{item.publisher || "—"}</strong>
              </span>
              <span>
                <small>Năm xuất bản</small>
                <strong>{item.year}</strong>
              </span>
            </div>
            <p className="result-description">{item.description || "Chưa có tóm tắt."}</p>
          </>
        )}

        <div className="result-status-row">
          {item.mode === "keyword" ? (
            <>
              <Status tone={item.available ? "success" : "warning"}>
                {item.available ? "Có bản trống" : "Đang mượn hết"}
              </Status>
              <span className="copy-count">{item.copies ?? 0} bản có sẵn</span>
              <Badge tone={item.digital ? "info" : "neutral"}>
                {item.digital ? "Có bản điện tử" : "Không có bản điện tử"}
              </Badge>
            </>
          ) : (
            <>
              <Status tone="success">Có thể đọc trực tuyến</Status>
              <Badge tone="info">Đã lập chỉ mục nội dung</Badge>
            </>
          )}
        </div>
      </div>

      <div className="result-side">
        <div className="result-side-status">
          {item.mode === "smart" ? (
            <>
              <span className="available">
                <Icon name="sparkle" size={18} />
              </span>
              <strong>{item.pageNumber ? `Trang ${item.pageNumber}` : "Bản số PDF"}</strong>
              <small>Khớp trực tiếp trong nội dung</small>
            </>
          ) : (
            <>
              <span className={item.available ? "available" : "unavailable"}>
                <Icon name={item.available ? "success" : "info"} size={18} />
              </span>
              <strong>{item.available ? "Có thể mượn" : "Chưa có bản trống"}</strong>
              <small>{item.available ? "Sẵn sàng tại thư viện" : "Đặt trước khi có bản"}</small>
            </>
          )}
        </div>

        <div className="result-actions">
          <Button size="sm" onClick={() => navigate(detailUrl, returnState)}>
            Xem chi tiết
          </Button>
          {item.mode === "smart" && item.pageNumber && (
            <Button
              variant="secondary"
              size="sm"
              icon="document"
              // Mở trình đọc đúng tài liệu, đúng trang, kèm truy vấn để tô sáng đoạn khớp
              onClick={() =>
                navigate(
                  `/reader/document/${encodeURIComponent(item.documentId)}?${new URLSearchParams({
                    page: String(item.pageNumber),
                    q: query,
                  })}`,
                  returnState,
                )
              }
            >
              Đọc trang {item.pageNumber}
            </Button>
          )}
          <Button variant={saved ? "secondary" : "ghost"} size="sm" icon="bookmark" onClick={onSave}>
            {saved ? "Đã lưu vào tủ sách" : "Lưu vào tủ sách"}
          </Button>
        </div>
      </div>
    </article>
  );
}
