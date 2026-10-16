import { useState } from "react";
import { Avatar, Badge, Breadcrumb, Button, Icon, Modal, Pagination, SearchInput, SelectField, Status } from "../../../design-system";
import { initialManagedReaders } from "../../../data/readers";

export default function ReaderManagementPage() {
  const [readers, setReaders] = useState(initialManagedReaders);
  const [selectedReaderId, setSelectedReaderId] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState("Tổng quan");
  const [cardAction, setCardAction] = useState<{ id: number; lock: boolean } | null>(null);
  const selectedReader = readers.find((reader) => reader.id === selectedReaderId) || null;
  const actionReader = readers.find((reader) => reader.id === cardAction?.id);

  const executeCardAction = () => {
    if (!cardAction) return;
    setReaders((items) => items.map((reader) => reader.id === cardAction.id ? {
      ...reader,
      cardStatus: cardAction.lock ? "Bị khóa" : "Hoạt động",
      lockReason: cardAction.lock ? "Khóa thủ công bởi nhân viên thư viện để kiểm tra vi phạm." : undefined,
      lockUntil: cardAction.lock ? "Đến khi được nhân viên mở khóa" : undefined,
    } : reader));
    setCardAction(null);
  };

  return (
    <div className="reader-management-page">
      <div className="reader-management-heading">
        <div><Breadcrumb items={["Không gian nghiệp vụ", "Bạn đọc"]} /><p className="eyebrow">QUẢN LÝ BẠN ĐỌC</p><h1>Quản lý bạn đọc</h1><p>Tra cứu hồ sơ, kiểm soát trạng thái thẻ và lịch sử sử dụng thư viện.</p></div>
        <div><Button variant="secondary" icon="document">Xuất danh sách</Button><Button icon="plus">Thêm bạn đọc</Button></div>
      </div>

      <section className="reader-search-filters">
        <div className="reader-management-search"><SearchInput placeholder="Tìm theo mã bạn đọc, họ tên, email..." /><Button icon="search">Tìm kiếm</Button></div>
        <div className="reader-filter-row">
          <label><span>Loại bạn đọc</span><select defaultValue="all"><option value="all">Tất cả loại bạn đọc</option><option>Sinh viên chính quy</option><option>Cán bộ, giảng viên</option><option>Học viên cao học</option><option>Nghiên cứu sinh</option></select><Icon name="chevron-down" size={14} /></label>
          <label><span>Ngành</span><select defaultValue="all"><option value="all">Tất cả ngành</option><option>Công nghệ thông tin</option><option>Khoa học máy tính</option><option>An toàn thông tin</option><option>Điện tử viễn thông</option></select><Icon name="chevron-down" size={14} /></label>
          <label><span>Trạng thái thẻ</span><select defaultValue="all"><option value="all">Tất cả trạng thái</option><option>Hoạt động</option><option>Bị khóa</option><option>Sắp hết hạn</option></select><Icon name="chevron-down" size={14} /></label>
          <Button variant="ghost" size="sm">Xóa bộ lọc</Button>
        </div>
      </section>

      <section className="reader-table-panel">
        <div className="reader-table-heading"><div><h2>Danh sách bạn đọc</h2><p>8.947 bạn đọc đang hoạt động</p></div><Badge tone="error">01 THẺ BỊ KHÓA</Badge></div>
        <div className="reader-management-table-wrap"><table className="reader-management-table"><thead><tr><th>Mã bạn đọc</th><th>Họ tên</th><th>Loại bạn đọc</th><th>Ngành đào tạo</th><th>Trạng thái thẻ</th><th>Đang mượn</th><th>Công nợ</th><th>Actions</th></tr></thead><tbody>
          {readers.map((reader) => <tr key={reader.id}>
            <td><code>{reader.code}</code></td>
            <td><div className="managed-reader-cell"><Avatar name={reader.name} size="sm" /><div><strong>{reader.name}</strong><small>{reader.email}</small></div></div></td>
            <td><Badge>{reader.type}</Badge></td>
            <td>{reader.program}</td>
            <td><Status tone={reader.cardStatus === "Hoạt động" ? "success" : reader.cardStatus === "Bị khóa" ? "error" : "warning"}>{reader.cardStatus}</Status></td>
            <td><strong>{reader.loans}</strong><small> tài liệu</small></td>
            <td><strong className={reader.debt > 0 ? "reader-debt" : ""}>{reader.debt.toLocaleString("vi-VN")}đ</strong></td>
            <td><div className="managed-reader-actions"><Button variant="ghost" size="sm" onClick={() => { setSelectedReaderId(reader.id); setDetailTab("Tổng quan"); }}>Xem hồ sơ</Button><Button variant={reader.cardStatus === "Bị khóa" ? "secondary" : "ghost"} size="sm" onClick={() => setCardAction({ id: reader.id, lock: reader.cardStatus !== "Bị khóa" })}>{reader.cardStatus === "Bị khóa" ? "Mở khóa" : "Khóa thẻ"}</Button><Button variant="ghost" size="sm" onClick={() => { setSelectedReaderId(reader.id); setDetailTab("Lịch sử mượn"); }}>Lịch sử mượn</Button></div></td>
          </tr>)}
        </tbody></table></div>
        <div className="reader-table-pagination"><span>Hiển thị 1–6 trong tổng số 9.214 bạn đọc</span><Pagination /></div>
      </section>

      <Modal open={selectedReader !== null} onClose={() => setSelectedReaderId(null)} title="Hồ sơ bạn đọc" eyebrow="THÔNG TIN BẠN ĐỌC" className="reader-detail-modal">
        {selectedReader && <div className="reader-profile">
          <div className="reader-profile-header">
            <Avatar name={selectedReader.name} size="lg" />
            <div><div><h2>{selectedReader.name}</h2><Badge tone={selectedReader.cardStatus === "Hoạt động" ? "success" : selectedReader.cardStatus === "Bị khóa" ? "error" : "warning"}>{selectedReader.cardStatus}</Badge></div><p>{selectedReader.code} · {selectedReader.type}</p></div>
            <Button variant={selectedReader.cardStatus === "Bị khóa" ? "secondary" : "danger"} size="sm" onClick={() => setCardAction({ id: selectedReader.id, lock: selectedReader.cardStatus !== "Bị khóa" })}>{selectedReader.cardStatus === "Bị khóa" ? "Mở khóa thẻ" : "Khóa thẻ"}</Button>
          </div>
          {selectedReader.cardStatus === "Bị khóa" && <div className="reader-lock-alert"><Icon name="error" /><div><strong>Thẻ bạn đọc đang bị khóa</strong><p>{selectedReader.lockReason}</p><span>Thời hạn khóa: {selectedReader.lockUntil}</span></div></div>}
          <div className="reader-profile-tabs">{["Tổng quan", "Đang mượn", "Lịch sử mượn", "Đặt trước", "Vi phạm & công nợ"].map((tab) => <button key={tab} className={detailTab === tab ? "active" : ""} onClick={() => setDetailTab(tab)}>{tab}</button>)}</div>
          {detailTab === "Tổng quan" && <div className="reader-profile-overview">
            <dl className="reader-personal-info"><div><dt>Họ và tên</dt><dd>{selectedReader.name}</dd></div><div><dt>Mã bạn đọc</dt><dd>{selectedReader.code}</dd></div><div><dt>Loại bạn đọc</dt><dd>{selectedReader.type}</dd></div><div><dt>Ngành đào tạo</dt><dd>{selectedReader.program}</dd></div><div><dt>Email</dt><dd>{selectedReader.email}</dd></div><div><dt>Số điện thoại</dt><dd>{selectedReader.phone}</dd></div><div><dt>Ngày sinh</dt><dd>{selectedReader.birthDate}</dd></div><div><dt>Hạn thẻ</dt><dd>{selectedReader.cardExpiry}</dd></div></dl>
            <div className="reader-profile-stats"><article><span>Đang mượn</span><strong>{selectedReader.loans}</strong><small>/ 08 tài liệu</small></article><article><span>Đặt trước</span><strong>02</strong><small>1 lượt chờ nhận</small></article><article><span>Công nợ</span><strong className={selectedReader.debt ? "negative" : ""}>{selectedReader.debt.toLocaleString("vi-VN")}đ</strong><small>{selectedReader.debt ? "Chưa thanh toán" : "Không có công nợ"}</small></article><article><span>Vi phạm</span><strong>{selectedReader.cardStatus === "Bị khóa" ? "02" : "00"}</strong><small>Trong 12 tháng</small></article></div>
          </div>}
          {detailTab === "Đang mượn" && <div className="profile-data-table"><table><thead><tr><th>Tài liệu</th><th>Ngày mượn</th><th>Hạn trả</th><th>Trạng thái</th></tr></thead><tbody><tr><td><strong>Mạng máy tính và hệ thống phân tán</strong><small>PTIT-24-02016</small></td><td>28/05/2025</td><td>25/06/2025</td><td><Badge tone="error">Quá hạn 3 ngày</Badge></td></tr><tr><td><strong>Nhập môn Khoa học dữ liệu</strong><small>PTIT-23-01564</small></td><td>08/06/2025</td><td>06/07/2025</td><td><Badge tone="success">Trong hạn</Badge></td></tr></tbody></table></div>}
          {detailTab === "Lịch sử mượn" && <div className="profile-data-table"><table><thead><tr><th>Tài liệu</th><th>Ngày mượn</th><th>Ngày trả</th><th>Kết quả</th></tr></thead><tbody><tr><td><strong>Học máy: Từ lý thuyết đến thực hành</strong></td><td>03/04/2025</td><td>28/04/2025</td><td><Status tone="success">Đúng hạn</Status></td></tr><tr><td><strong>An toàn thông tin trong kỷ nguyên số</strong></td><td>14/01/2025</td><td>08/02/2025</td><td><Status tone="warning">Muộn 2 ngày</Status></td></tr></tbody></table></div>}
          {detailTab === "Đặt trước" && <div className="profile-reservations"><article><span><Icon name="bookmark" /></span><div><strong>Machine Learning cơ bản</strong><p>Đăng ký 02/10/2026 · Vị trí hàng đợi: 01</p></div><Badge tone="warning">Đang chờ</Badge></article><article><span><Icon name="bookmark" /></span><div><strong>Cấu trúc dữ liệu và giải thuật</strong><p>Giữ đến 10/10/2026 · 17:00</p></div><Badge tone="success">Đã sẵn sàng</Badge></article></div>}
          {detailTab === "Vi phạm & công nợ" && <div className="profile-violations"><div className="profile-debt-total"><span><Icon name="error" /></span><div><small>TỔNG CÔNG NỢ</small><strong>{selectedReader.debt.toLocaleString("vi-VN")}đ</strong></div><Button variant="secondary" size="sm">Ghi nhận thanh toán</Button></div><article><Badge tone="error">CHƯA XỬ LÝ</Badge><div><strong>Trả tài liệu quá hạn trên 30 ngày</strong><p>Ghi nhận ngày 20/06/2025 · Tài liệu PTIT-24-02016</p></div><span>60.000đ</span></article><article><Badge tone="warning">NHẮC NHỞ</Badge><div><strong>Trả tài liệu muộn 2 ngày</strong><p>Ghi nhận ngày 10/04/2025 · Đã hoàn trả</p></div><span>4.000đ</span></article></div>}
        </div>}
      </Modal>

      <Modal open={cardAction !== null} onClose={() => setCardAction(null)} title={cardAction?.lock ? "Khóa thẻ bạn đọc" : "Mở khóa thẻ bạn đọc"}>
        <div className={`card-action-confirmation ${cardAction?.lock ? "lock" : "unlock"}`}><span><Icon name={cardAction?.lock ? "error" : "success"} size={24} /></span><div><strong>{actionReader?.name}</strong><p>{actionReader?.code}</p></div></div>
        {cardAction?.lock ? <><SelectField label="Lý do khóa thẻ" defaultValue="violation"><option value="violation">Vi phạm quy định thư viện</option><option value="debt">Công nợ chưa xử lý</option><option value="lost">Báo mất thẻ</option><option value="other">Lý do khác</option></SelectField><SelectField label="Thời hạn khóa" defaultValue="manual"><option value="manual">Đến khi nhân viên mở khóa</option><option value="7">07 ngày</option><option value="30">30 ngày</option><option value="permanent">Không thời hạn</option></SelectField></> : <p className="unlock-note">Bạn đọc sẽ được khôi phục quyền mượn, gia hạn và đặt trước sau khi mở khóa.</p>}
        <div className="modal-actions"><Button variant="ghost" onClick={() => setCardAction(null)}>Hủy</Button><Button variant={cardAction?.lock ? "danger" : "primary"} onClick={executeCardAction}>{cardAction?.lock ? "Khóa thẻ" : "Mở khóa"}</Button></div>
      </Modal>
    </div>
  );
}
