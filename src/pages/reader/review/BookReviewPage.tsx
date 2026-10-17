import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type * as React from "react";
import { Badge, Button, Field, Icon, Modal, Rating, TextAreaField } from "../../../design-system";
import BookCover from "../../../components/books/BookCover";
import { detailBook } from "../../../data/books";
import { reviewLabels } from "../../../constants/library-options";

function ReviewStarInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="review-star-input" role="radiogroup" aria-label="Điểm đánh giá tổng thể">
      <div>{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" className={star <= value ? "selected" : ""} role="radio" aria-checked={value === star} aria-label={`${star} sao – ${reviewLabels[star - 1]}`} onClick={() => onChange(star)}>★</button>)}</div>
      <strong>{value ? `${value}/5 · ${reviewLabels[value - 1]}` : "Chọn từ 1 đến 5 sao"}</strong>
    </div>
  );
}

export default function MaterialReviewPage({ mode = "create" }: { mode?: "create" | "edit" | "logged-out" | "error" }) {
  const navigate = useNavigate();
  const preset = mode === "edit" || mode === "error";
  const [rating, setRating] = useState(preset ? 4 : 0);
  const [title, setTitle] = useState(preset ? "Tài liệu hữu ích và dễ tiếp cận" : "");
  const [content, setContent] = useState(preset ? "Nội dung được trình bày rõ ràng, có hệ thống và hữu ích cho quá trình học tập. Một số phần chuyên sâu cần đọc thêm tài liệu tham khảo để hiểu đầy đủ hơn." : "");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [systemError, setSystemError] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const dirty = rating > 0 || title.length > 0 || content.length > 0;
  const valid = rating > 0 && content.trim().length >= 20 && content.length <= 2000;

  useEffect(() => {
    const confirmLeave = (event: BeforeUnloadEvent) => {
      if (!dirty || submitted) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", confirmLeave);
    return () => window.removeEventListener("beforeunload", confirmLeave);
  }, [dirty, submitted]);

  const cancel = () => {
    if (dirty && !submitted) setLeaveOpen(true);
    else navigate("/reader/book-detail");
  };
  const submitReview = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    setSystemError(false);
    if (!valid) return;
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      if (mode === "error") setSystemError(true);
      else setSubmitted(true);
    }, 850);
  };

  return (
    <div className="material-review-page">
      <main className="material-review-container">
        <nav className="review-page-breadcrumb" aria-label="Đường dẫn">
          <button onClick={() => { navigate("/reader"); }}>Trang chủ</button><Icon name="chevron-right" size={14} />
          <button onClick={() => { navigate("/reader/search"); }}>Tìm kiếm</button><Icon name="chevron-right" size={14} />
          <button onClick={() => { navigate("/reader/book-detail"); }}>Chi tiết tài liệu</button><Icon name="chevron-right" size={14} />
          <span>Đánh giá tài liệu</span>
        </nav>
        <div className="material-review-heading">
          <div><p className="eyebrow">CHIA SẺ CẢM NHẬN HỌC THUẬT</p><h1>{preset ? "Chỉnh sửa đánh giá của bạn" : "Đánh giá tài liệu"}</h1><p>Chia sẻ nhận xét khách quan để giúp cộng đồng độc giả lựa chọn tài liệu phù hợp.</p></div>
          <Badge tone="brand">{preset ? "ĐANG CHỈNH SỬA" : "ĐÁNH GIÁ MỚI"}</Badge>
        </div>

        <section className="reviewed-material-card">
          <BookCover book={detailBook} compact />
          <div className="reviewed-material-info">
            <div className="book-meta"><span>{detailBook.type}</span><i /><span>{detailBook.year}</span></div>
            <h2>{detailBook.title}</h2>
            <p>Tác giả: <strong>{detailBook.author}</strong></p>
            <dl><div><dt>Nhà xuất bản</dt><dd>Thông tin và Truyền thông</dd></div><div><dt>Năm xuất bản</dt><dd>{detailBook.year}</dd></div></dl>
          </div>
          <div className="reviewed-material-rating"><strong>4.3</strong><Rating value={4} /><span>28 lượt đánh giá</span></div>
          <small>Dữ liệu minh họa cho giao diện</small>
        </section>

        {mode === "logged-out" ? (
          <section className="review-login-required">
            <span><Icon name="users" size={28} /></span><p className="eyebrow">YÊU CẦU ĐĂNG NHẬP</p><h2>Đăng nhập để đánh giá tài liệu</h2><p>Bạn cần đăng nhập bằng tài khoản PTIT Library trước khi gửi đánh giá. Sau khi đăng nhập, bạn có thể quay lại đúng tài liệu này.</p>
            <Button onClick={() => { window.sessionStorage.setItem("ptit-library-return-url", "/reader/book-detail/review"); navigate("/login"); }}>Đăng nhập</Button>
          </section>
        ) : submitted ? (
          <section className="review-submit-success">
            <span><Icon name="success" size={30} /></span><p className="eyebrow">THÀNH CÔNG</p><h2>{preset ? "Đánh giá đã được cập nhật" : "Đánh giá của bạn đã được gửi"}</h2>
            <div><Button onClick={() => { navigate("/reader/book-detail"); }}>Quay lại chi tiết tài liệu</Button><Button variant="secondary" onClick={() => setSubmitted(false)}>Chỉnh sửa đánh giá</Button></div>
          </section>
        ) : (
          <form className="material-review-form" onSubmit={submitReview}>
            <div className="review-form-section rating-section">
              <div className="review-field-heading"><span>01</span><div><h2>Điểm đánh giá tổng thể <em>*</em></h2><p>Chọn mức điểm phản ánh trải nghiệm của bạn với tài liệu.</p></div></div>
              <ReviewStarInput value={rating} onChange={(value) => { setRating(value); setTouched(true); }} />
              {touched && !rating && <p className="review-validation"><Icon name="error" size={14} />Vui lòng chọn số sao đánh giá.</p>}
            </div>

            <div className="review-form-section">
              <div className="review-field-heading"><span>02</span><div><h2>Tiêu đề đánh giá</h2><p>Không bắt buộc · Tối đa 100 ký tự</p></div></div>
              <Field label="Tiêu đề" placeholder="Tóm tắt cảm nhận của bạn về tài liệu" value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} />
              <p className="review-character-count">{title.length}/100 ký tự</p>
            </div>

            <div className="review-form-section">
              <div className="review-field-heading"><span>03</span><div><h2>Nội dung đánh giá <em>*</em></h2><p>Tối thiểu 20 và tối đa 2.000 ký tự</p></div></div>
              <div className="material-review-textarea"><TextAreaField label="Nhận xét của bạn" placeholder="Chia sẻ cảm nhận của bạn về nội dung, tính chính xác, cách trình bày và mức độ hữu ích của tài liệu đối với việc học tập hoặc nghiên cứu..." value={content} maxLength={2000} onBlur={() => setTouched(true)} onChange={(event) => setContent(event.target.value)} error={touched && content.trim().length < 20 ? "Nội dung đánh giá cần có ít nhất 20 ký tự." : undefined} /><span>{content.length}/2.000 ký tự</span></div>
              <div className="review-writing-prompts"><strong>Gợi ý nội dung</strong><ul><li>Nội dung có chính xác và dễ hiểu không?</li><li>Tài liệu có hữu ích cho học tập hoặc nghiên cứu không?</li><li>Bạn có khuyến nghị tài liệu này cho độc giả khác không?</li></ul></div>
            </div>

            <div className="review-academic-note"><Icon name="info" size={17} /><p>Vui lòng đưa ra nhận xét khách quan, tôn trọng tác giả và tập trung vào nội dung tài liệu. Không chia sẻ thông tin cá nhân hoặc nội dung vi phạm quy định.</p></div>
            {systemError && <div className="review-system-error" role="alert"><Icon name="error" size={18} /><div><strong>Không thể gửi đánh giá</strong><p>Đã xảy ra lỗi hệ thống. Nội dung của bạn vẫn được giữ nguyên, vui lòng thử lại.</p></div></div>}
            <div className="material-review-actions"><Button variant="secondary" type="button" onClick={cancel}>Hủy</Button><Button type="submit" loading={loading} disabled={!valid || loading}>{preset ? "Cập nhật đánh giá" : "Gửi đánh giá"}</Button></div>
          </form>
        )}
      </main>

      <Modal open={leaveOpen} onClose={() => setLeaveOpen(false)} title="Rời khỏi trang đánh giá?" eyebrow="NỘI DUNG CHƯA ĐƯỢC GỬI">
        <p className="review-leave-message">Nội dung bạn đã nhập chưa được gửi và sẽ không được lưu. Bạn có chắc chắn muốn rời trang?</p>
        <div className="modal-actions"><Button variant="ghost" onClick={() => setLeaveOpen(false)}>Tiếp tục viết</Button><Button variant="danger" onClick={() => { setLeaveOpen(false); navigate("/reader/book-detail"); }}>Rời khỏi trang</Button></div>
      </Modal>
    </div>
  );
}
