import { useState } from "react";
import { Avatar, Badge, Breadcrumb, Button, Field, Icon, IconButton, Modal, SearchInput, SelectField, Status } from "../../../design-system";
import { circulationTabs } from "../../../constants/library-options";

function ReaderInformationCard() {
  return (
    <section className="circulation-reader-card">
      <div className="reader-card-identity">
        <Avatar name="Trần Minh Quân" size="lg" />
        <div><Badge tone="success">THẺ ĐANG HOẠT ĐỘNG</Badge><h2>Trần Minh Quân</h2><p>CT050145 · Sinh viên hệ chính quy</p></div>
      </div>
      <dl>
        <div><dt>Mã bạn đọc</dt><dd>CT050145</dd></div>
        <div><dt>Loại bạn đọc</dt><dd>Sinh viên chính quy</dd></div>
        <div><dt>Ngành</dt><dd>Công nghệ thông tin</dd></div>
        <div><dt>Trạng thái thẻ</dt><dd><Status tone="success">Hoạt động</Status></dd></div>
        <div><dt>Đang mượn</dt><dd><strong>06 cuốn</strong></dd></div>
        <div><dt>Hạn mức</dt><dd>08 cuốn</dd></div>
        <div><dt>Công nợ</dt><dd><strong className="debt-value">20.000đ</strong></dd></div>
      </dl>
      <Button variant="ghost" size="sm">Xem hồ sơ bạn đọc</Button>
    </section>
  );
}

function ValidationPanel() {
  return (
    <section className="validation-panel">
      <div className="validation-heading"><div><p className="eyebrow">KIỂM TRA TỰ ĐỘNG</p><h2>Điều kiện lưu thông</h2></div><Badge tone="warning">2 CẢNH BÁO</Badge></div>
      <div className="validation-list">
        <div className="passed"><Icon name="success" /><span><strong>Trạng thái thẻ</strong><small>Thẻ đang hoạt động, không bị khóa</small></span><Badge tone="success">HỢP LỆ</Badge></div>
        <div className="warning"><Icon name="error" /><span><strong>Công nợ bạn đọc</strong><small>Còn công nợ quá hạn cần xử lý</small></span><Badge tone="warning">20.000đ</Badge></div>
        <div className="passed"><Icon name="success" /><span><strong>Hạn mức mượn</strong><small>Sau giao dịch: 08 / 08 cuốn</small></span><Badge tone="success">TRONG HẠN MỨC</Badge></div>
        <div className="passed"><Icon name="success" /><span><strong>Quyền mượn về</strong><small>Các tài liệu đã quét được phép mượn về</small></span><Badge tone="success">HỢP LỆ</Badge></div>
        <div className="warning"><Icon name="bookmark" /><span><strong>Trạng thái đặt trước</strong><small>01 tài liệu đang được giữ cho bạn đọc khác</small></span><Badge tone="error">CẦN KIỂM TRA</Badge></div>
      </div>
      <div className="validation-blocked-example"><Icon name="info" size={15} /><span>Hệ thống sẽ chặn xác nhận nếu thẻ bị khóa, vượt hạn mức hoặc tài liệu không được phép mượn về.</span></div>
    </section>
  );
}

function LoanTransaction({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div className="circulation-transaction-grid">
      <div className="transaction-main">
        <div className="transaction-scan">
          <div><p className="eyebrow">QUÉT TÀI LIỆU</p><h2>Thêm tài liệu cho mượn</h2><p>Quét hoặc nhập mã cá biệt để thêm vào giao dịch.</p></div>
          <div className="scan-input"><Icon name="book" /><input placeholder="Nhập mã cá biệt, ví dụ: PTIT-24-01842" aria-label="Mã cá biệt" /><Button>Thêm tài liệu</Button></div>
        </div>
        <section className="transaction-table-panel">
          <div className="transaction-panel-heading"><div><h2>Danh sách cho mượn</h2><p>02 tài liệu trong giao dịch</p></div><button>Xóa tất cả</button></div>
          <div className="transaction-table-wrap"><table className="transaction-table"><thead><tr><th>Tài liệu</th><th>Mã cá biệt</th><th>Ngày mượn</th><th>Hạn trả</th><th>Tình trạng</th><th /></tr></thead><tbody>
            <tr><td><div className="transaction-book"><span><Icon name="book" /></span><div><strong>Nhập môn Trí tuệ nhân tạo</strong><small>Nguyễn Thanh Thủy · 2024</small></div></div></td><td><code>PTIT-24-01842</code></td><td>22/06/2025</td><td><strong>19/11/2025</strong><small>150 ngày</small></td><td><Status tone="success">Được phép mượn</Status></td><td><IconButton label="Xóa" icon="close" /></td></tr>
            <tr className="transaction-warning-row"><td><div className="transaction-book"><span><Icon name="book" /></span><div><strong>Cấu trúc dữ liệu và giải thuật</strong><small>Nguyễn Đức Nghĩa · 2023</small></div></div></td><td><code>PTIT-23-01108</code></td><td>22/06/2025</td><td><strong>19/11/2025</strong><small>150 ngày</small></td><td><Status tone="warning">Có lượt đặt trước</Status></td><td><IconButton label="Xóa" icon="close" /></td></tr>
          </tbody></table></div>
          <div className="transaction-footer"><div><span>Tổng tài liệu</span><strong>02 cuốn</strong><small>Sau giao dịch: 08 / 08 cuốn</small></div><Button icon="success" onClick={onConfirm}>Xác nhận cho mượn</Button></div>
        </section>
      </div>
      <ValidationPanel />
    </div>
  );
}

function ReturnTransaction({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div className="return-transaction">
      <div className="transaction-scan">
        <div><p className="eyebrow">NHẬN TRẢ TÀI LIỆU</p><h2>Quét tài liệu hoàn trả</h2><p>Hệ thống tự động đối chiếu giao dịch và tính phí quá hạn.</p></div>
        <div className="scan-input"><Icon name="book" /><input placeholder="Quét mã cá biệt cần nhận trả..." aria-label="Mã cá biệt nhận trả" /><Button>Kiểm tra</Button></div>
      </div>
      <section className="return-card">
        <div className="return-book-heading"><div className="transaction-book"><span><Icon name="book" /></span><div><Badge tone="error">QUÁ HẠN 3 NGÀY</Badge><h2>Mạng máy tính và hệ thống phân tán</h2><p>Lê Nhật Quang · PTIT-24-02016</p></div></div><strong>20.000đ</strong></div>
        <div className="return-details-grid">
          <Field label="Ngày trả" type="date" defaultValue="2025-06-22" />
          <SelectField label="Tình trạng tài liệu khi trả" defaultValue="good"><option value="good">Tốt — không hư hỏng</option><option value="light">Hư hỏng nhẹ</option><option value="heavy">Hư hỏng nặng</option><option value="lost">Mất tài liệu</option></SelectField>
          <Field label="Tiền phạt quá hạn" defaultValue="20.000đ" readOnly />
          <SelectField label="Hư hỏng / mất" defaultValue="none"><option value="none">Không phát sinh</option><option value="damage">Lập biên bản hư hỏng</option><option value="lost">Lập biên bản mất tài liệu</option></SelectField>
        </div>
        <div className="return-debt-summary"><div><Icon name="error" /><span><strong>Công nợ phát sinh</strong><small>Phí trả muộn: 2.000đ/cuốn/ngày · Phí tồn trước đó: 14.000đ</small></span></div><strong>20.000đ</strong></div>
        <label className="staff-checkbox"><input type="checkbox" /><span>Bạn đọc thanh toán công nợ ngay tại quầy</span></label>
        <div className="return-actions"><Button variant="ghost">Hủy giao dịch</Button><Button icon="success" onClick={onConfirm}>Nhận trả</Button></div>
      </section>
    </div>
  );
}

function RenewalTransaction({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div className="renewal-transaction">
      <section className="transaction-table-panel">
        <div className="transaction-panel-heading"><div><h2>Tài liệu đang mượn</h2><p>Chọn các tài liệu đủ điều kiện để gia hạn.</p></div><Badge tone="info">06 TÀI LIỆU</Badge></div>
        <div className="transaction-table-wrap"><table className="transaction-table renewal-table"><thead><tr><th><input type="checkbox" aria-label="Chọn tất cả" /></th><th>Tài liệu</th><th>Ngày mượn</th><th>Hạn trả hiện tại</th><th>Hạn trả mới</th><th>Điều kiện</th></tr></thead><tbody>
          <tr><td><input type="checkbox" defaultChecked aria-label="Chọn tài liệu" /></td><td><div className="transaction-book"><span><Icon name="book" /></span><div><strong>Nhập môn Khoa học dữ liệu</strong><small>PTIT-23-01564</small></div></div></td><td>08/06/2025</td><td>06/07/2025</td><td><strong className="new-due-date">03/08/2025</strong></td><td><Status tone="success">Có thể gia hạn</Status></td></tr>
          <tr><td><input type="checkbox" disabled aria-label="Không thể chọn" /></td><td><div className="transaction-book"><span><Icon name="book" /></span><div><strong>Mạng máy tính và hệ thống phân tán</strong><small>PTIT-24-02016</small></div></div></td><td>28/05/2025</td><td><strong className="overdue-date">25/06/2025</strong></td><td>—</td><td><Status tone="error">Đang quá hạn</Status></td></tr>
          <tr><td><input type="checkbox" disabled aria-label="Không thể chọn" /></td><td><div className="transaction-book"><span><Icon name="book" /></span><div><strong>Cấu trúc dữ liệu và giải thuật</strong><small>PTIT-23-01108</small></div></div></td><td>12/06/2025</td><td>10/07/2025</td><td>—</td><td><Status tone="warning">Có người đặt trước</Status></td></tr>
        </tbody></table></div>
        <div className="transaction-footer"><div><span>Đã chọn</span><strong>01 tài liệu</strong><small>Thời hạn gia hạn: 28 ngày</small></div><Button icon="success" onClick={onConfirm}>Gia hạn</Button></div>
      </section>
    </div>
  );
}

export default function CirculationScreen() {
  const [activeTab, setActiveTab] = useState("Cho mượn");
  const [searchType, setSearchType] = useState("Mã bạn đọc");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const actionLabel = confirmation === "loan" ? "Xác nhận cho mượn" : confirmation === "return" ? "Xác nhận nhận trả" : "Xác nhận gia hạn";

  return (
    <div className="circulation-screen">
      <div className="circulation-page-heading"><div><Breadcrumb items={["Không gian nghiệp vụ", "Lưu thông"]} /><p className="eyebrow">NGHIỆP VỤ LƯU THÔNG</p><h1>Lưu thông tài liệu</h1><p>Cho mượn, nhận trả và gia hạn tài liệu tại quầy.</p></div><Badge tone="success"><Status tone="success">Quầy 01 đang hoạt động</Status></Badge></div>
      <div className="circulation-tabs" role="tablist">{circulationTabs.map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)} role="tab" aria-selected={activeTab === tab}>{tab === "Cho mượn" ? <Icon name="book" /> : tab === "Nhận trả" ? <Icon name="arrow-left" /> : <Icon name="sparkle" />}{tab}</button>)}</div>
      <section className="circulation-search-area">
        <div className="search-type-tabs">{["Mã bạn đọc", "Mã cá biệt", "Tên bạn đọc"].map((type) => <button key={type} className={searchType === type ? "active" : ""} onClick={() => setSearchType(type)}>{type}</button>)}</div>
        <div className="staff-reader-search"><SearchInput placeholder={searchType === "Mã bạn đọc" ? "Nhập hoặc quét mã bạn đọc..." : searchType === "Mã cá biệt" ? "Nhập mã cá biệt..." : "Nhập họ tên bạn đọc..."} /><Button icon="search">Tìm bạn đọc</Button></div>
        <span><Icon name="info" size={14} />Có thể sử dụng máy quét mã vạch tại quầy</span>
      </section>
      <ReaderInformationCard />
      <div className="circulation-content">
        {activeTab === "Cho mượn" && <LoanTransaction onConfirm={() => setConfirmation("loan")} />}
        {activeTab === "Nhận trả" && <ReturnTransaction onConfirm={() => setConfirmation("return")} />}
        {activeTab === "Gia hạn" && <RenewalTransaction onConfirm={() => setConfirmation("renew")} />}
      </div>
      <Modal open={confirmation !== null} onClose={() => setConfirmation(null)} title={actionLabel}>
        <div className="transaction-confirmation">
          <span><Icon name={confirmation === "return" ? "arrow-left" : confirmation === "renew" ? "sparkle" : "book"} size={25} /></span>
          <div><strong>{confirmation === "loan" ? "Cho mượn 02 tài liệu cho Trần Minh Quân?" : confirmation === "return" ? "Xác nhận đã nhận trả tài liệu?" : "Gia hạn 01 tài liệu thêm 28 ngày?"}</strong><p>{confirmation === "loan" ? "Giao dịch sẽ cập nhật hạn mức lên 08/08 cuốn. Vui lòng xác nhận đã kiểm tra cảnh báo đặt trước." : confirmation === "return" ? "Tài liệu sẽ được chuyển về trạng thái có sẵn và ghi nhận công nợ phát sinh 20.000đ." : "Hạn trả mới là 03/08/2025. Thao tác sẽ được ghi vào lịch sử lưu thông."}</p></div>
        </div>
        <label className="staff-checkbox confirmation-checkbox"><input type="checkbox" /><span>Tôi đã kiểm tra thông tin và tình trạng tài liệu</span></label>
        <div className="modal-actions"><Button variant="ghost" onClick={() => setConfirmation(null)}>Quay lại</Button><Button onClick={() => setConfirmation(null)}>{actionLabel}</Button></div>
      </Modal>
    </div>
  );
}
