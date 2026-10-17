import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Avatar, Badge, Breadcrumb, Button, Icon, Rating, Status } from "../../../design-system";
import BookCover from "../../../components/books/BookCover";
import BookCard from "../../../components/books/BookCard";
import HomeSection from "../../../components/common/HomeSection";
import { detailBook, relatedSimilar, relatedBorrowed } from "../../../data/books";

export default function BookDetailPage() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [relatedSaved, setRelatedSaved] = useState<number[]>([]);
  const toggleRelatedSave = (id: number) => setRelatedSaved((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  return (
    <div className="book-detail-page">
      <main className="book-detail-container">
        <Breadcrumb items={["Trang chủ", "Kết quả tìm kiếm", detailBook.title]} />
        <section className="book-detail-hero">
          <div className="detail-cover-panel">
            <BookCover book={detailBook} />
            <span className="detail-call-number">Mã phân loại · {detailBook.code}</span>
          </div>
          <div className="detail-information">
            <div className="detail-title-row">
              <div>
                <div className="book-meta"><span>{detailBook.type}</span><i /><span>Tái bản lần thứ 2</span></div>
                <h1>{detailBook.title}</h1>
                <p className="detail-subtitle">Nền tảng, phương pháp và kinh nghiệm triển khai trong bối cảnh chuyển đổi số</p>
                <p className="detail-author">Tác giả: <strong>{detailBook.author}</strong></p>
              </div>
              <Badge tone="success"><Status tone="success">Có sẵn</Status></Badge>
            </div>
            <div className="detail-rating-row">
              <strong>4.7</strong><Rating value={5} /><span>38 đánh giá</span><i /><span>124 lượt mượn</span>
            </div>
            <dl className="bibliographic-grid">
              <div><dt>Loại tài liệu</dt><dd>Sách chuyên khảo</dd></div>
              <div><dt>ISBN</dt><dd>978-604-80-8932-1</dd></div>
              <div><dt>Ngôn ngữ</dt><dd>Tiếng Việt</dd></div>
              <div><dt>Mã phân loại</dt><dd>378.173 NG-H 2024</dd></div>
              <div><dt>Nhà xuất bản</dt><dd>Thông tin và Truyền thông</dd></div>
              <div><dt>Năm xuất bản</dt><dd>2024</dd></div>
            </dl>
            <div className="detail-availability">
              <div className="detail-physical"><span><Icon name="library" />BẢN IN</span><strong>3 / 5 bản có sẵn</strong><small>Kệ A2-03 · Phòng đọc tầng 2</small></div>
              <div className="detail-digital"><span><Icon name="document" />TÀI LIỆU SỐ</span><strong>Có thể xem trực tuyến</strong><small>Toàn văn · Quyền truy cập PTIT</small></div>
            </div>
            <div className="detail-primary-actions">
              <Button icon="document" onClick={() => { navigate("/reader/document/1"); }}>Đọc tài liệu số</Button>
              <Button variant="secondary" icon="bookmark">Đặt trước</Button>
              <Button variant="ghost" icon="bookmark" onClick={() => setSaved(!saved)}>{saved ? "Đã lưu vào tủ sách" : "Lưu vào tủ sách"}</Button>
            </div>
          </div>
        </section>

        <div className="detail-content-layout">
          <article className="detail-main-column">
            <section className="detail-section">
              <div className="detail-section-heading"><span>01</span><div><h2>Tóm tắt</h2><p>Nội dung tổng quan của tài liệu</p></div></div>
              <div className="summary-content">
                <p>Cuốn sách trình bày một cách hệ thống những nền tảng lý luận và thực tiễn về ứng dụng trí tuệ nhân tạo trong giáo dục đại học. Tác giả phân tích sự thay đổi của hoạt động dạy, học và quản trị nhà trường khi các công nghệ học máy, xử lý ngôn ngữ tự nhiên và phân tích dữ liệu học tập được đưa vào sử dụng.</p>
                <p>Nội dung tài liệu tập trung vào ba nhóm vấn đề chính: thiết kế trải nghiệm học tập cá nhân hóa; hỗ trợ giảng viên trong xây dựng nội dung và đánh giá người học; ứng dụng dữ liệu để nâng cao chất lượng quản trị đại học. Các nghiên cứu tình huống tại Việt Nam và quốc tế giúp người đọc nhận diện điều kiện triển khai, rủi ro đạo đức và yêu cầu bảo vệ dữ liệu cá nhân.</p>
                <p>Đây là tài liệu tham khảo dành cho giảng viên, cán bộ quản lý giáo dục, nghiên cứu viên và sinh viên quan tâm đến chuyển đổi số, công nghệ giáo dục và tương lai của giáo dục đại học.</p>
                <div className="subject-tags"><strong>Chủ đề:</strong><button>Trí tuệ nhân tạo</button><button>Giáo dục đại học</button><button>Chuyển đổi số</button><button>Công nghệ giáo dục</button></div>
              </div>
            </section>

            <section className="detail-section">
              <div className="detail-section-heading"><span>02</span><div><h2>Bản cá biệt</h2><p>Thông tin các bản in hiện có tại thư viện</p></div></div>
              <div className="detail-table-wrap">
                <table className="detail-table">
                  <thead><tr><th>Mã cá biệt</th><th>Vị trí kệ</th><th>Tình trạng vật lý</th><th>Trạng thái lưu thông</th></tr></thead>
                  <tbody>
                    <tr><td><strong>PTIT-24-01842</strong></td><td>A2-03</td><td><Status tone="success">Tốt</Status></td><td><Badge tone="success">Có sẵn</Badge></td></tr>
                    <tr><td><strong>PTIT-24-01843</strong></td><td>A2-03</td><td><Status tone="success">Tốt</Status></td><td><Badge tone="warning">Đang mượn</Badge><small>Đến 28/06/2025</small></td></tr>
                    <tr><td><strong>PTIT-24-01844</strong></td><td>A2-03</td><td><Status tone="success">Tốt</Status></td><td><Badge tone="brand">Đang giữ</Badge><small>Đến 25/06/2025</small></td></tr>
                    <tr><td><strong>PTIT-24-01845</strong></td><td>Kho dự trữ</td><td><Status tone="error">Hư hỏng nhẹ</Status></td><td><Badge>Không lưu thông</Badge></td></tr>
                    <tr><td><strong>PTIT-24-01846</strong></td><td>A2-03</td><td><Status tone="success">Tốt</Status></td><td><Badge tone="success">Có sẵn</Badge></td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="detail-section">
              <div className="detail-section-heading"><span>03</span><div><h2>Tài liệu số</h2><p>Tệp toàn văn và quyền truy cập</p></div></div>
              <div className="digital-file-list">
                <article><span className="file-icon">PDF</span><div className="file-information"><strong>tri-tue-nhan-tao-trong-giao-duc-dai-hoc.pdf</strong><span>PDF · 18.6 MB · 286 trang</span></div><Badge tone="info">CHỈ XEM TRỰC TUYẾN</Badge><Status tone="success">Đã xử lý</Status><Button variant="secondary" size="sm">Mở tài liệu</Button></article>
                <article><span className="file-icon">EPUB</span><div className="file-information"><strong>tri-tue-nhan-tao-giao-duc.epub</strong><span>EPUB · 6.2 MB · Phiên bản dễ tiếp cận</span></div><Badge tone="success">CÓ THỂ TẢI XUỐNG</Badge><Status tone="success">Đã xử lý</Status><Button variant="secondary" size="sm">Tải xuống</Button></article>
              </div>
              <p className="digital-access-note"><Icon name="info" size={15} />Bạn cần đăng nhập bằng tài khoản PTIT để truy cập toàn văn. Việc sử dụng tài liệu tuân theo quy định bản quyền của thư viện.</p>
            </section>

            <section className="detail-section reviews-section">
              <div className="detail-section-heading review-heading"><span>04</span><div><h2>Đánh giá từ bạn đọc</h2><p>38 đánh giá đã được xác thực</p></div><Button variant="secondary" size="sm" onClick={() => { navigate("/reader/book-detail/review"); }}>Viết đánh giá</Button></div>
              <div className="rating-summary">
                <div className="rating-total"><strong>4.7</strong><Rating value={5} /><span>38 đánh giá</span></div>
                <div className="rating-bars">{[["5", "78%", "rating-bar-78"], ["4", "17%", "rating-bar-17"], ["3", "5%", "rating-bar-5"], ["2", "0%", "rating-bar-0"], ["1", "0%", "rating-bar-0"]].map(([star, width, barClass]) => <div key={star}><span>{star} ★</span><i><b className={barClass} /></i><small>{width}</small></div>)}</div>
              </div>
              <div className="review-list">
                <article><Avatar name="Trần Minh Quân" /><div><div className="review-meta"><strong>Trần Minh Quân</strong><Rating value={5} /><span>12/05/2025</span></div><p>Tài liệu có cấu trúc rõ ràng, các ví dụ triển khai tại trường đại học Việt Nam rất hữu ích cho nghiên cứu của tôi. Phần đạo đức AI được trình bày cân bằng và có chiều sâu.</p></div></article>
                <article><Avatar name="Lê Thảo Nguyên" /><div><div className="review-meta"><strong>Lê Thảo Nguyên</strong><Rating value={4} /><span>28/04/2025</span></div><p>Nội dung phù hợp với giảng viên và sinh viên ngành Công nghệ giáo dục. Một số chương mang tính tổng quan nhưng danh mục tài liệu tham khảo rất đầy đủ.</p></div></article>
              </div>
            </section>
          </article>
          <aside className="detail-side-column">
            <div className="catalog-note"><Icon name="library" /><div><strong>Thông tin thư mục</strong><p>Bản ghi được kiểm duyệt bởi Thư viện PTIT</p><small>Cập nhật lần cuối: 18/06/2025</small></div></div>
            <nav className="detail-anchor-nav" aria-label="Mục lục trang"><p>TRONG TRANG NÀY</p><button>Tóm tắt</button><button>Bản cá biệt</button><button>Tài liệu số</button><button>Đánh giá</button></nav>
          </aside>
        </div>

        <section className="related-section">
          <HomeSection title="Có nội dung tương đồng" subtitle="Được phân tích từ chủ đề và nội dung toàn văn của tài liệu." action="Xem thêm">
            <div className="related-book-grid">{relatedSimilar.map((book) => <BookCard key={book.id} book={book} saved={relatedSaved.includes(book.id)} onSave={() => toggleRelatedSave(book.id)} />)}</div>
          </HomeSection>
          <HomeSection title="Bạn đọc khác thường mượn cùng" subtitle="Dựa trên hành vi mượn và đọc của cộng đồng PTIT." action="Xem thêm">
            <div className="related-book-grid">{relatedBorrowed.map((book) => <BookCard key={book.id} book={book} saved={relatedSaved.includes(book.id)} onSave={() => toggleRelatedSave(book.id)} />)}</div>
          </HomeSection>
        </section>
      </main>
    </div>
  );
}
