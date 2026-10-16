import type * as React from "react";
import { Badge, Breadcrumb, Icon } from "../../../design-system";

const guidelineSections = [
  "Hạn mức mượn",
  "Thời hạn mượn",
  "Gia hạn",
  "Đặt trước",
  "Tài liệu không được mượn về",
  "Phạt trả muộn",
  "Hư hỏng và mất tài liệu",
  "Quy trình mượn",
  "Quy trình trả",
];

function GuidelineSection({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="guideline-section" id={`guideline-${index}`} open>
      <summary><span>{String(index).padStart(2, "0")}</span><strong>{title}</strong><Icon name="chevron-down" size={17} /></summary>
      <div className="guideline-section-content">{children}</div>
    </details>
  );
}

export default function GuidelinesPage() {
  return (
    <div className="guidelines-page">
      <section className="guidelines-hero">
        <div>
          <Breadcrumb items={["Trang chủ", "Nội quy & hướng dẫn"]} />
          <Badge tone="brand"><Icon name="library" size={14} /> THÔNG TIN BẠN ĐỌC</Badge>
          <h1>Nội quy &amp; hướng dẫn</h1>
          <p>Thông tin cần biết về hạn mức, thời hạn và quy trình sử dụng tài liệu tại Thư viện PTIT.</p>
          <div className="guidelines-meta"><span><Icon name="success" size={15} />Áp dụng cho bạn đọc Thư viện PTIT</span><span>Cập nhật: 20/06/2025</span></div>
        </div>
      </section>

      <main className="guidelines-layout">
        <aside className="guidelines-nav">
          <p>NỘI DUNG TRANG</p>
          <nav aria-label="Nội dung nội quy">{guidelineSections.map((section, index) => <button key={section} onClick={() => document.getElementById(`guideline-${index + 1}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}><span>{String(index + 1).padStart(2, "0")}</span>{section}</button>)}</nav>
          <div className="guideline-support"><Icon name="info" /><div><strong>Cần hỗ trợ?</strong><p>Liên hệ quầy lưu thông hoặc bộ phận hỗ trợ bạn đọc.</p><button>Thông tin liên hệ</button></div></div>
        </aside>

        <article className="guidelines-content">
          <GuidelineSection index={1} title="Hạn mức mượn">
            <p>Hạn mức và thời gian mượn được xác định theo nhóm bạn đọc và loại kho. Bạn đọc cần sử dụng đúng tài khoản cá nhân khi thực hiện giao dịch.</p>
            <div className="borrowing-table-wrap">
              <table className="borrowing-table">
                <thead><tr><th>Nhóm bạn đọc</th><th>Phạm vi kho</th><th>Số lượng tối đa</th><th>Thời hạn</th></tr></thead>
                <tbody>
                  <tr><td><strong>Cán bộ, giảng viên</strong></td><td>Kho thông thường</td><td><b>07 cuốn</b></td><td><b>60 ngày</b></td></tr>
                  <tr><td><strong>Sinh viên hệ chính quy</strong></td><td>Kho thông thường</td><td><b>08 cuốn</b></td><td><b>150 ngày</b></td></tr>
                  <tr><td><strong>Sinh viên hệ khác / học viên cao học / nghiên cứu sinh</strong></td><td>Kho thông thường</td><td><b>05 cuốn</b></td><td><b>150 ngày</b></td></tr>
                  <tr><td><strong>Cán bộ, giảng viên</strong></td><td><Badge tone="info">KHO MỞ</Badge></td><td><b>03 cuốn</b></td><td><b>15 ngày</b></td></tr>
                  <tr><td><strong>Học viên, sinh viên</strong></td><td><Badge tone="info">KHO MỞ</Badge></td><td><b>02 cuốn</b></td><td><b>07 ngày</b></td></tr>
                  <tr className="restricted-row"><td><strong>Người ngoài Học viện</strong></td><td>Chỉ đọc tại chỗ</td><td colSpan={2}><Badge tone="error">KHÔNG ĐƯỢC MƯỢN VỀ</Badge></td></tr>
                </tbody>
              </table>
            </div>
            <p className="guideline-note"><Icon name="info" size={15} />Số lượng trên là tổng số tài liệu được giữ đồng thời trên tài khoản bạn đọc.</p>
          </GuidelineSection>

          <GuidelineSection index={2} title="Thời hạn mượn">
            <div className="guideline-card-grid">
              <article><span><Icon name="users" /></span><div><strong>Cán bộ, giảng viên</strong><p>60 ngày với kho thông thường; 15 ngày với tài liệu kho mở.</p></div></article>
              <article><span><Icon name="book" /></span><div><strong>Sinh viên chính quy</strong><p>150 ngày với kho thông thường; 07 ngày với tài liệu kho mở.</p></div></article>
              <article><span><Icon name="document" /></span><div><strong>Học viên và nghiên cứu sinh</strong><p>150 ngày với kho thông thường; 07 ngày khi sử dụng kho mở.</p></div></article>
            </div>
            <p>Ngày hết hạn được ghi nhận trên tài khoản và biên nhận mượn. Bạn đọc nên kiểm tra mục “Thư viện của tôi” để chủ động hoàn trả đúng hạn.</p>
          </GuidelineSection>

          <GuidelineSection index={3} title="Gia hạn">
            <ul className="guideline-list">
              <li>Tài liệu chỉ được gia hạn khi chưa quá hạn và không có bạn đọc khác đặt trước.</li>
              <li>Yêu cầu gia hạn cần được thực hiện trước ngày hết hạn trên tài khoản.</li>
              <li>Thời gian gia hạn được tính từ ngày thực hiện thao tác và phụ thuộc vào nhóm bạn đọc.</li>
              <li>Tài liệu thuộc kho mở hoặc tài liệu có giới hạn đặc biệt có thể không được gia hạn.</li>
            </ul>
            <div className="inline-process"><span>01<small>Mở “Thư viện của tôi”</small></span><i /><span>02<small>Chọn tài liệu đang mượn</small></span><i /><span>03<small>Chọn “Gia hạn tài liệu”</small></span></div>
          </GuidelineSection>

          <GuidelineSection index={4} title="Đặt trước">
            <p>Bạn đọc có thể đặt trước tài liệu đang được mượn hết. Hệ thống sẽ xếp hàng theo thời điểm gửi yêu cầu và thông báo khi tài liệu sẵn sàng.</p>
            <div className="guideline-callout info"><Icon name="bookmark" /><div><strong>Thời gian giữ tài liệu</strong><p>Sau khi nhận thông báo, bạn đọc cần đến nhận trong thời hạn được ghi trên yêu cầu đặt trước. Quá thời hạn, lượt giữ sẽ được chuyển cho người tiếp theo.</p></div></div>
          </GuidelineSection>

          <GuidelineSection index={5} title="Tài liệu không được mượn về">
            <p>Các nhóm tài liệu sau chỉ được sử dụng tại phòng đọc hoặc theo hướng dẫn riêng của cán bộ thư viện:</p>
            <div className="restricted-materials">
              {["Tài liệu có dấu đỏ", "Sách tra cứu", "Luận án", "Luận văn", "Báo", "Tạp chí"].map((item) => <span key={item}><Icon name="document" size={17} />{item}</span>)}
            </div>
            <div className="guideline-callout warning"><Icon name="info" /><div><strong>Không mang tài liệu ra khỏi khu vực quy định</strong><p>Việc sao chụp hoặc sử dụng bản số phải tuân thủ pháp luật về bản quyền và quy định của Thư viện PTIT.</p></div></div>
          </GuidelineSection>

          <GuidelineSection index={6} title="Phạt trả muộn">
            <div className="late-fee-alert"><span><Icon name="error" size={24} /></span><div><small>MỨC PHÍ ÁP DỤNG</small><strong>Phí phạt trả muộn: 2.000 đồng/cuốn/ngày quá hạn.</strong><p>Phí được tính theo từng tài liệu, bắt đầu từ ngày liền sau hạn trả đến ngày tài liệu được hoàn trả.</p></div></div>
            <p>Khi còn tài liệu quá hạn hoặc công nợ chưa xử lý, tài khoản có thể bị tạm dừng quyền mượn, gia hạn và đặt trước. Bạn đọc thanh toán phí tại quầy lưu thông và nhận xác nhận hoàn tất.</p>
          </GuidelineSection>

          <GuidelineSection index={7} title="Hư hỏng và mất tài liệu">
            <ul className="guideline-list">
              <li>Thông báo ngay cho cán bộ thư viện khi phát hiện tài liệu bị rách, thiếu trang hoặc có dấu hiệu hư hỏng.</li>
              <li>Không tự ý sửa chữa, dán băng keo, ghi chú hoặc đánh dấu lên tài liệu.</li>
              <li>Trường hợp làm mất hoặc hư hỏng tài liệu, bạn đọc có trách nhiệm bồi hoàn theo giá trị và quy định hiện hành của Học viện.</li>
              <li>Mức bồi hoàn được xác định theo tình trạng, khả năng thay thế và chi phí xử lý nghiệp vụ.</li>
            </ul>
          </GuidelineSection>

          <GuidelineSection index={8} title="Quy trình mượn">
            <ol className="workflow-steps">
              <li><span>01</span><div><strong>Tra cứu tài liệu</strong><p>Tìm trên PTIT Library và kiểm tra trạng thái, vị trí kệ của bản in.</p></div></li>
              <li><span>02</span><div><strong>Lấy tài liệu tại kho</strong><p>Ghi nhận đúng mã phân loại và vị trí; giữ trật tự khi sử dụng kho mở.</p></div></li>
              <li><span>03</span><div><strong>Thực hiện giao dịch</strong><p>Xuất trình thẻ bạn đọc tại quầy hoặc sử dụng máy mượn tự động.</p></div></li>
              <li><span>04</span><div><strong>Kiểm tra biên nhận</strong><p>Xác nhận tên tài liệu, số lượng và ngày hết hạn trước khi rời thư viện.</p></div></li>
            </ol>
          </GuidelineSection>

          <GuidelineSection index={9} title="Quy trình trả">
            <ol className="workflow-steps">
              <li><span>01</span><div><strong>Kiểm tra thời hạn</strong><p>Chủ động xem hạn trả trong “Thư viện của tôi” và mang tài liệu đến thư viện.</p></div></li>
              <li><span>02</span><div><strong>Hoàn trả tài liệu</strong><p>Trả tại quầy lưu thông hoặc thiết bị trả sách theo hướng dẫn.</p></div></li>
              <li><span>03</span><div><strong>Xác nhận tình trạng</strong><p>Cán bộ thư viện kiểm tra tài liệu và cập nhật trạng thái trên hệ thống.</p></div></li>
              <li><span>04</span><div><strong>Hoàn tất công nợ</strong><p>Thanh toán phí quá hạn hoặc xử lý hư hỏng nếu có và nhận xác nhận.</p></div></li>
            </ol>
          </GuidelineSection>
        </article>
      </main>
    </div>
  );
}
