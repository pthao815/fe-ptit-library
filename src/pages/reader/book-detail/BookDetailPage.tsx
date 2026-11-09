import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Avatar, Badge, Breadcrumb, Button, Rating, Toast } from "../../../design-system";
import BookCover from "../../../components/books/BookCover";
import { catalogService } from "../../../services/catalog.service";
import { circulationService } from "../../../services/circulation.service";
import { authSession } from "../../../shared/auth/auth-session";
import { getAccessToken } from "../../../services/session";
import type { DocumentDetailDto, ReviewDto } from "../../../types/api";
import { safeReturnPath } from "../../../utils/portal-routes";
import type { Book } from "../../../types/library";
import { formatDateVi, mapDocumentDetailToBook } from "../../../utils/mappers";

export default function BookDetailPage() {
  const [searchParams] = useSearchParams();
  const requestedDocId = searchParams.get("id") ?? "";
  return <DocumentDetail key={requestedDocId} requestedDocId={requestedDocId} />;
}

function DocumentDetail({ requestedDocId }: { requestedDocId: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useSyncExternalStore(authSession.subscribe, authSession.getSnapshot);
  const returnTo = safeReturnPath(location.state?.returnTo, session?.role);
  const fromCatalog = returnTo && /^\/(staff|admin)\/materials(?:\?|$)/.test(returnTo);
  const resultsPath = fromCatalog || returnTo?.startsWith("/reader/search") ? returnTo! : "/reader/search";
  const backLabel = fromCatalog ? "Quay lại danh mục" : "Quay lại kết quả tìm kiếm";
  const readerActions = !session || session.role === "READER";
  const [loadError, setLoadError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewCount, setReviewCount] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState<DocumentDetailDto | null>(null);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [saved, setSaved] = useState(false);
  const [holdStatus, setHoldStatus] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    setReviewError("");
    if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(requestedDocId)) {
      setLoadError("Hãy chọn tài liệu có UUID hợp lệ từ kết quả tìm kiếm.");
      setLoading(false);
      return;
    }
    catalogService.getDocumentDetails(requestedDocId).then((data) => {
      if (active) setDetail(data);
    }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : "Không tải được chi tiết tài liệu.");
    }).finally(() => { if (active) setLoading(false); });
    catalogService.getDocumentReviews(requestedDocId, { page: 0, size: 10 }).then((data) => {
      if (active) { setReviews(data.items); setReviewCount(data.totalElements); }
    }).catch(() => { if (active) setReviewError("Không tải được đánh giá."); });
    if (getAccessToken()) {
      catalogService.checkFavoriteStatus(requestedDocId).then((data) => {
        if (active) setSaved(data.isFavorite);
      }).catch(() => {});
    }
    return () => { active = false; };
  }, [requestedDocId, revision]);

  if (loading) return <p role="status">Đang tải chi tiết tài liệu…</p>;
  if (loadError || !detail) return <div role="alert">
    <p>{loadError || "Không tìm thấy tài liệu."}</p>
    <Button onClick={() => setRevision((value) => value + 1)}>Thử lại</Button>{" "}
    <Button onClick={() => navigate(resultsPath)}>Về trang tìm kiếm</Button>
  </div>;

  const currentBook: Book = mapDocumentDetailToBook(detail);
  const activeDocId = detail.id;
  const totalCopies = detail.totalPhysicalCopies;
  const availableCopies = detail.availablePhysicalCopies;
  const isAvailable = availableCopies > 0;
  const ratingAverage = detail.averageRating?.toFixed(1) ?? "—";

  const handleToggleFavorite = async () => {
    if (!getAccessToken()) return setToastMessage("Vui lòng đăng nhập để lưu tài liệu.");
    try {
      const response = await catalogService.toggleFavorite(activeDocId);
      setSaved(response.isFavorite);
      setToastMessage(response.isFavorite ? "Đã lưu tài liệu." : "Đã bỏ lưu tài liệu.");
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Không lưu được tài liệu.");
    }
  };
  const handlePlaceHold = async () => {
    if (!getAccessToken()) return setToastMessage("Vui lòng đăng nhập để đặt trước.");
    try {
      const response = await circulationService.placeHold({ documentId: activeDocId });
      setHoldStatus("Vị trí hàng chờ #" + response.queuePosition);
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Không đặt trước được tài liệu.");
    }
  };
  const handleOpenDigital = () => {
    if (detail.digitalCopyId) {
      window.open(catalogService.getDigitalDownloadUrl(detail.digitalCopyId), "_blank", "noopener");
    }
  };

  return (
    <div className="book-detail-page">
      <main className="book-detail-container">
        <Link className="btn btn-ghost" to={resultsPath}>{backLabel}</Link>
        <Breadcrumb items={[{ label: "Trang chủ", to: "/reader" }, { label: fromCatalog ? "Danh mục" : "Kết quả tìm kiếm", to: resultsPath }, currentBook.title]} />
        <section className="book-detail-hero">
          <div className="detail-cover-panel"><BookCover book={currentBook} /></div>
          <div className="detail-information">
            <h1>{detail.title}</h1>
            <p>Tác giả: {detail.authors?.join(", ") || "Chưa cập nhật"}</p>
            <Badge tone={isAvailable ? "success" : "warning"}>{isAvailable ? "Có sẵn" : "Hết bản trống"}</Badge>
            <dl className="bibliographic-grid">
              <div><dt>Loại tài liệu</dt><dd>{currentBook.type}</dd></div>
              <div><dt>ISBN</dt><dd>{detail.isbn || "—"}</dd></div>
              <div><dt>Ngôn ngữ</dt><dd>{detail.language || "—"}</dd></div>
              <div><dt>Mã phân loại</dt><dd>{detail.classificationNumber || "—"}</dd></div>
              <div><dt>Nhà xuất bản</dt><dd>{detail.publisher || "—"}</dd></div>
              <div><dt>Năm xuất bản</dt><dd>{detail.publicationYear ?? "—"}</dd></div>
            </dl>
            <p>Bản giấy: {availableCopies}/{totalCopies} bản có sẵn.</p>
            <p>{detail.hasDigitalCopy ? (detail.pageCount ? "PDF · " + detail.pageCount + " trang" : "Có bản PDF") : "Chưa có bản số."}</p>
            <div className="detail-primary-actions">
              <Button icon="document" disabled={!detail.digitalCopyId} onClick={handleOpenDigital}>Đọc tài liệu số</Button>
              {readerActions && <Button variant="secondary" disabled={Boolean(holdStatus)} onClick={handlePlaceHold}>{holdStatus || "Đặt trước"}</Button>}
              {readerActions && <Button variant="ghost" icon="bookmark" onClick={handleToggleFavorite}>{saved ? "Đã lưu vào tủ sách" : "Lưu vào tủ sách"}</Button>}
            </div>
          </div>
        </section>
        <section className="detail-section">
          <h2>Tóm tắt</h2><p>{detail.abstractText || "Chưa có tóm tắt."}</p>
          <div className="subject-tags">{detail.departmentNames?.map((name) => <span key={name}>{name}</span>)}</div>
        </section>
        <section className="detail-section reviews-section">
          <h2>Đánh giá từ bạn đọc</h2>
          <p>{ratingAverage} · {reviewCount} đánh giá</p>
          {readerActions && <Button variant="secondary" onClick={() => navigate("/reader/book-detail/review?id=" + encodeURIComponent(activeDocId), { state: { returnTo: resultsPath } })}>Viết đánh giá</Button>}
          <div className="review-list">
            {reviewError ? <p role="alert">{reviewError}</p> : reviews.length ? reviews.map((review) => (
              <article key={review.id}><Avatar name="Bạn đọc" /><div>
                <Rating value={review.rating} /><span>{formatDateVi(review.createdAt)}</span>
                <p>{review.comment || "—"}</p>
              </div></article>
            )) : <p>Chưa có đánh giá.</p>}
          </div>
        </section>
      </main>
      {toastMessage && <div className="toast-position">
        <Toast title="Thông báo thư viện" onClose={() => setToastMessage(null)}>{toastMessage}</Toast>
      </div>}
    </div>
  );
}
