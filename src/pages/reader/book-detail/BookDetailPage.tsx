import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Avatar, Badge, Breadcrumb, Button, Icon, Rating, Status, Toast } from "../../../design-system";
import BookCover from "../../../components/books/BookCover";
import { catalogService } from "../../../services/catalog.service";
import { circulationService } from "../../../services/circulation.service";
import { authSession } from "../../../shared/auth/auth-session";
import { getAccessToken } from "../../../services/session";
import type { DocumentDetailDto, PhysicalCopyDto, ReviewDto } from "../../../types/api";
import { safeReturnPath } from "../../../utils/portal-routes";
import type { Book } from "../../../types/library";
import { formatDateVi, mapDocumentDetailToBook } from "../../../utils/mappers";
import { describeProcessing } from "../../staff/materials/digital-copy";

const REVIEW_SAMPLE = 50;
const languages: Record<string, string> = { vi: "Tiếng Việt", en: "Tiếng Anh", fr: "Tiếng Pháp" };
const copyStatuses: Record<string, { label: string; tone: "success" | "warning" | "error" | "neutral" | "brand" }> = {
  AVAILABLE: { label: "Có sẵn", tone: "success" },
  BORROWED: { label: "Đang mượn", tone: "warning" },
  RESERVED: { label: "Đang giữ", tone: "brand" },
  LOST: { label: "Mất", tone: "error" },
  DAMAGED: { label: "Hư hỏng", tone: "error" },
  MAINTENANCE: { label: "Bảo trì", tone: "neutral" },
};
const sections = [
  { id: "detail-summary", label: "Tóm tắt" },
  { id: "detail-copies", label: "Bản giấy" },
  { id: "detail-digital", label: "Tài liệu số" },
  { id: "detail-reviews", label: "Đánh giá" },
];

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
  const isStaff = session?.role === "LIBRARIAN" || session?.role === "ADMIN";
  const [loadError, setLoadError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewCount, setReviewCount] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState<DocumentDetailDto | null>(null);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [copies, setCopies] = useState<PhysicalCopyDto[]>();
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
    catalogService.getDocumentReviews(requestedDocId, { page: 0, size: REVIEW_SAMPLE }).then((data) => {
      if (active) { setReviews(data.items); setReviewCount(data.totalElements); }
    }).catch(() => { if (active) setReviewError("Không tải được đánh giá."); });
    if (getAccessToken()) {
      catalogService.checkFavoriteStatus(requestedDocId).then((data) => {
        if (active) setSaved(data.isFavorite);
      }).catch(() => {});
    }
    // Danh sách bản giấy chỉ có API cho cán bộ thư viện
    if (isStaff) {
      catalogService.getPhysicalCopies(requestedDocId).then((data) => {
        if (active) setCopies(data);
      }).catch(() => { if (active) setCopies(undefined); });
    }
    return () => { active = false; };
  }, [requestedDocId, revision, isStaff]);

  if (loading) return <div className="book-detail-page"><main className="book-detail-container"><p role="status">Đang tải chi tiết tài liệu…</p></main></div>;
  if (loadError || !detail) return <div className="book-detail-page"><main className="book-detail-container">
    <div className="catalog-empty" role="alert">
      <Icon name="error" size={28} />
      <h2>Không mở được tài liệu</h2>
      <p>{loadError || "Không tìm thấy tài liệu."}</p>
      <div className="detail-primary-actions">
        <Button onClick={() => setRevision((value) => value + 1)}>Thử lại</Button>
        <Button variant="secondary" onClick={() => navigate(resultsPath)}>{backLabel}</Button>
      </div>
    </div>
  </main></div>;

  const currentBook: Book = mapDocumentDetailToBook(detail);
  const activeDocId = detail.id;
  const totalCopies = detail.totalPhysicalCopies;
  const availableCopies = detail.availablePhysicalCopies;
  const isAvailable = availableCopies > 0;
  const average = detail.averageRating ?? 0;
  const ratingAverage = detail.averageRating ? detail.averageRating.toFixed(1) : "—";
  const coverImage = detail.coverUrl && /^https?:\/\//i.test(detail.coverUrl) ? detail.coverUrl : undefined;
  const processing = detail.hasDigitalCopy ? describeProcessing(undefined, detail.digitalProcessingStatus) : undefined;
  const ratingShares = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((review) => Math.round(review.rating) === star).length;
    return { star, share: reviews.length ? Math.round((count / reviews.length) * 100) : 0 };
  });

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
  const writeReview = () => navigate("/reader/book-detail/review?id=" + encodeURIComponent(activeDocId), { state: { returnTo: resultsPath } });
  const jumpTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="book-detail-page">
      <main className="book-detail-container">
        <Breadcrumb items={[{ label: "Trang chủ", to: "/reader" }, { label: fromCatalog ? "Danh mục" : "Kết quả tìm kiếm", to: resultsPath }, detail.title]} />
        <section className="book-detail-hero">
          <div className="detail-cover-panel">
            {coverImage
              ? <img src={coverImage} alt={`Bìa sách ${detail.title}`} style={{ width: "100%", aspectRatio: "2 / 3", objectFit: "cover", borderRadius: 4 }} />
              : <BookCover book={currentBook} />}
            {detail.classificationNumber && <span className="detail-call-number">Mã phân loại · {detail.classificationNumber}</span>}
          </div>
          <div className="detail-information">
            <div className="detail-title-row">
              <div>
                <div className="book-meta">
                  <span>{currentBook.type}</span>
                  {detail.publicationYear && <><i /><span>{detail.publicationYear}</span></>}
                </div>
                <h1>{detail.title}</h1>
                {detail.physicalDescription && <p className="detail-subtitle">{detail.physicalDescription}</p>}
                <p className="detail-author">Tác giả: <strong>{detail.authors?.join(", ") || "Chưa cập nhật"}</strong></p>
              </div>
              <Badge tone={isAvailable ? "success" : "warning"}>
                <Status tone={isAvailable ? "success" : "warning"}>{isAvailable ? "Có sẵn" : "Hết bản trống"}</Status>
              </Badge>
            </div>
            <div className="detail-rating-row">
              <strong>{ratingAverage}</strong><Rating value={Math.round(average)} /><span>{reviewCount} đánh giá</span>
            </div>
            <dl className="bibliographic-grid">
              <div><dt>Loại tài liệu</dt><dd>{currentBook.type}</dd></div>
              <div><dt>ISBN</dt><dd>{detail.isbn || "—"}</dd></div>
              <div><dt>Ngôn ngữ</dt><dd>{detail.language ? languages[detail.language] ?? detail.language : "—"}</dd></div>
              <div><dt>Mã phân loại</dt><dd>{detail.classificationNumber || "—"}</dd></div>
              <div><dt>Nhà xuất bản</dt><dd>{detail.publisher || "—"}</dd></div>
              <div><dt>Năm xuất bản</dt><dd>{detail.publicationYear ?? "—"}</dd></div>
              {detail.origin && <div><dt>Nguồn gốc</dt><dd>{detail.origin}</dd></div>}
            </dl>
            <div className="detail-availability">
              <div className="detail-physical">
                <span><Icon name="library" />BẢN IN</span>
                <strong>{totalCopies ? `${availableCopies} / ${totalCopies} bản có sẵn` : "Chưa có bản in"}</strong>
                <small>{totalCopies ? "Mượn tại quầy thủ thư" : "Thư viện chưa nhập bản giấy"}</small>
              </div>
              <div className="detail-digital">
                <span><Icon name="document" />TÀI LIỆU SỐ</span>
                <strong>{detail.hasDigitalCopy ? "Có thể xem trực tuyến" : "Chưa có bản số"}</strong>
                <small>{detail.hasDigitalCopy ? (detail.pageCount ? `PDF · ${detail.pageCount} trang` : "PDF") : "Chỉ có bản in"}</small>
              </div>
            </div>
            <div className="detail-primary-actions">
              <Button icon="document" disabled={!detail.digitalCopyId} onClick={handleOpenDigital}>Đọc tài liệu số</Button>
              {readerActions && <Button variant="secondary" disabled={Boolean(holdStatus)} onClick={handlePlaceHold}>{holdStatus || "Đặt trước"}</Button>}
              {readerActions && <Button variant="ghost" icon="bookmark" onClick={handleToggleFavorite}>{saved ? "Đã lưu vào tủ sách" : "Lưu vào tủ sách"}</Button>}
              {isStaff && <Button variant="secondary" onClick={() => navigate(`/${session!.role === "ADMIN" ? "admin" : "staff"}/materials/edit/${activeDocId}`)}>Sửa biểu ghi</Button>}
            </div>
          </div>
        </section>

        <div className="detail-content-layout">
          <article className="detail-main-column">
            <section className="detail-section" id="detail-summary">
              <div className="detail-section-heading"><span>01</span><div><h2>Tóm tắt</h2><p>Nội dung tổng quan của tài liệu</p></div></div>
              <div className="summary-content">
                <p>{detail.abstractText || "Tài liệu chưa có tóm tắt."}</p>
                {detail.departmentNames && detail.departmentNames.length > 0 && <div className="subject-tags">
                  <strong>Khoa/ngành:</strong>
                  {detail.departmentNames.map((name) => <button type="button" key={name}>{name}</button>)}
                </div>}
              </div>
            </section>

            <section className="detail-section" id="detail-copies">
              <div className="detail-section-heading"><span>02</span><div><h2>Bản giấy</h2><p>Thông tin các bản in hiện có tại thư viện</p></div></div>
              {copies && copies.length > 0 ? (
                <div className="detail-table-wrap">
                  <table className="detail-table">
                    <thead><tr><th>Mã vạch</th><th>Mã xếp giá</th><th>Vị trí kệ</th><th>Tình trạng vật lý</th><th>Trạng thái lưu thông</th></tr></thead>
                    <tbody>{copies.map((copy) => {
                      const status = copyStatuses[copy.status ?? ""] ?? { label: copy.status || "—", tone: "neutral" as const };
                      return <tr key={copy.id}>
                        <td><strong>{copy.barcode}</strong></td>
                        <td>{copy.callNumber || "—"}</td>
                        <td>{copy.shelfLocation || "—"}</td>
                        <td>{copy.condition ? <Status tone={copy.condition === "Tốt" ? "success" : "error"}>{copy.condition}</Status> : "—"}</td>
                        <td><Badge tone={status.tone}>{status.label}</Badge></td>
                      </tr>;
                    })}</tbody>
                  </table>
                </div>
              ) : (
                <div className="summary-content">
                  <p>{totalCopies
                    ? `Thư viện có ${totalCopies} bản in, trong đó ${availableCopies} bản đang sẵn sàng cho mượn.`
                    : "Tài liệu này chưa có bản in tại thư viện."}</p>
                </div>
              )}
            </section>

            <section className="detail-section" id="detail-digital">
              <div className="detail-section-heading"><span>03</span><div><h2>Tài liệu số</h2><p>Tệp toàn văn và quyền truy cập</p></div></div>
              {detail.hasDigitalCopy && processing ? <>
                <div className="digital-file-list">
                  <article>
                    <span className="file-icon">PDF</span>
                    <div className="file-information">
                      <strong>{detail.digitalFileName || `${detail.title}.pdf`}</strong>
                      <span>{detail.pageCount ? `PDF · ${detail.pageCount} trang` : "PDF"}</span>
                    </div>
                    <Badge tone="info">XEM TRỰC TUYẾN</Badge>
                    <Status tone={processing.tone}>{processing.label}</Status>
                    <Button variant="secondary" size="sm" onClick={handleOpenDigital}>Mở tài liệu</Button>
                  </article>
                </div>
                <p className="digital-access-note"><Icon name="info" size={15} />Việc sử dụng tài liệu số tuân theo quy định bản quyền của thư viện.</p>
              </> : <div className="summary-content"><p>Tài liệu này chưa có bản số.</p></div>}
            </section>

            <section className="detail-section reviews-section" id="detail-reviews">
              <div className="detail-section-heading review-heading">
                <span>04</span><div><h2>Đánh giá từ bạn đọc</h2><p>{reviewCount} đánh giá</p></div>
                {readerActions && <Button variant="secondary" size="sm" onClick={writeReview}>Viết đánh giá</Button>}
              </div>
              {reviewCount > 0 && <div className="rating-summary">
                <div className="rating-total"><strong>{ratingAverage}</strong><Rating value={Math.round(average)} /><span>{reviewCount} đánh giá</span></div>
                <div className="rating-bars">{ratingShares.map(({ star, share }) => (
                  <div key={star}><span>{star} ★</span><i><b style={{ width: `${share}%` }} /></i><small>{share}%</small></div>
                ))}</div>
              </div>}
              {reviewError ? (
                <div className="summary-content"><p role="alert">{reviewError}</p></div>
              ) : !reviews.length ? (
                <div className="summary-content"><p>Tài liệu này chưa có đánh giá nào.</p></div>
              ) : <div className="review-list">
                {reviews.slice(0, 10).map((review) => (
                  <article key={review.id}>
                    <Avatar name="Bạn đọc PTIT" />
                    <div>
                      <div className="review-meta">
                        <strong>Bạn đọc PTIT</strong>
                        <Rating value={review.rating} />
                        <span>{formatDateVi(review.createdAt)}</span>
                      </div>
                      <p>{review.comment || "Không có nhận xét."}</p>
                    </div>
                  </article>
                ))}
              </div>}
            </section>
          </article>

          <aside className="detail-side-column">
            <Link className="btn btn-ghost btn-md" to={resultsPath}><Icon name="arrow-left" size={18} />{backLabel}</Link>
            <div className="catalog-note">
              <Icon name="library" />
              <div>
                <strong>Thông tin thư mục</strong>
                <p>Biểu ghi do Thư viện PTIT biên mục</p>
                {detail.updatedAt && <small>Cập nhật lần cuối: {formatDateVi(detail.updatedAt)}</small>}
              </div>
            </div>
            <nav className="detail-anchor-nav" aria-label="Mục lục trang">
              <p>TRONG TRANG NÀY</p>
              {sections.map((section) => <button type="button" key={section.id} onClick={() => jumpTo(section.id)}>{section.label}</button>)}
            </nav>
          </aside>
        </div>
      </main>
      {toastMessage && <div className="toast-position">
        <Toast title="Thông báo thư viện" onClose={() => setToastMessage(null)}>{toastMessage}</Toast>
      </div>}
    </div>
  );
}
