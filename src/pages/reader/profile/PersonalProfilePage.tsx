import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type * as React from "react";
import { Avatar, Badge, Breadcrumb, Button, Field, Icon, Status, Toast } from "../../../design-system";
import Brand from "../../../components/common/Brand";

const profileInitialContact = {
  phone: "09xx xxx 123",
  address: "Hà Nội",
};

export default function PersonalProfilePage({ restricted = false }: { restricted?: boolean }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [contact, setContact] = useState(profileInitialContact);
  const [draft, setDraft] = useState(profileInitialContact);
  const [errors, setErrors] = useState<{ phone?: string; address?: string }>({});
  const [toast, setToast] = useState(false);

  const startEditing = () => {
    setDraft(contact);
    setErrors({});
    setEditing(true);
  };
  const cancelEditing = () => {
    setDraft(contact);
    setErrors({});
    setEditing(false);
  };
  const saveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      phone: draft.phone.trim() ? undefined : "Vui lòng nhập số điện thoại.",
      address: draft.address.trim() ? undefined : "Vui lòng nhập địa chỉ.",
    };
    setErrors(nextErrors);
    if (nextErrors.phone || nextErrors.address) return;
    setContact(draft);
    setEditing(false);
    setToast(true);
    window.setTimeout(() => setToast(false), 3000);
  };

  return (
    <div className="profile-page">
      <main className="profile-container">
        <Breadcrumb items={["Trang chủ", "Thông tin cá nhân"]} />
        <div className="profile-page-heading">
          <div className="profile-heading-icon"><Icon name="users" size={23} /></div>
          <div><p className="eyebrow">TÀI KHOẢN BẠN ĐỌC</p><h1>Thông tin cá nhân</h1><p>Quản lý thông tin tài khoản và thẻ thư viện của bạn.</p></div>
        </div>

        <section className="profile-summary-card">
          <Avatar name="Nguyễn Minh Anh" size="lg" />
          <div className="profile-summary-identity"><h2>Nguyễn Minh Anh</h2><p>Mã độc giả <strong>PTIT-202600128</strong></p></div>
          <div className="profile-summary-meta"><span><small>Loại độc giả</small><strong>Sinh viên</strong></span><span><small>Khoa / Chương trình</small><strong>Công nghệ thông tin</strong></span></div>
          <Badge tone={restricted ? "error" : "success"}><Status tone={restricted ? "error" : "success"}>{restricted ? "Đang bị khóa" : "Đang hoạt động"}</Status></Badge>
        </section>

        <div className="profile-layout">
          <div className="profile-main-column">
            <section className="profile-card">
              <header className="profile-card-heading">
                <div><span><Icon name="users" size={18} /></span><div><h2>Thông tin cá nhân</h2><p>Thông tin định danh và liên hệ trong hệ thống thư viện.</p></div></div>
                {!editing && <Button variant="secondary" size="sm" onClick={startEditing}>Chỉnh sửa thông tin</Button>}
              </header>
              {(errors.phone || errors.address) && <div className="profile-form-alert"><Icon name="error" size={17} /><span>Vui lòng kiểm tra lại thông tin đã nhập.</span></div>}
              <form className="profile-form" onSubmit={saveProfile}>
                <div className="profile-fields-grid">
                  <Field label="Họ và tên" value="Nguyễn Minh Anh" readOnly />
                  <Field label="Mã độc giả" value="PTIT-202600128" readOnly />
                  <Field label="Ngày sinh" value="15/08/2004" readOnly />
                  <Field label="Giới tính" value="Không hiển thị" readOnly />
                  <Field label="Email" value="minhanh@example.edu.vn" readOnly />
                  <Field label="Số điện thoại" value={editing ? draft.phone : contact.phone} readOnly={!editing} onChange={(event) => { setDraft((current) => ({ ...current, phone: event.target.value })); setErrors((current) => ({ ...current, phone: undefined })); }} error={errors.phone} />
                  <Field label="Địa chỉ" value={editing ? draft.address : contact.address} readOnly={!editing} onChange={(event) => { setDraft((current) => ({ ...current, address: event.target.value })); setErrors((current) => ({ ...current, address: undefined })); }} error={errors.address} />
                  <Field label="Khoa / Chương trình đào tạo" value="Công nghệ thông tin" readOnly />
                  <Field label="Loại độc giả" value="Sinh viên" readOnly />
                </div>
                <p className="profile-permission-note"><Icon name="info" size={14} />Chỉ số điện thoại và địa chỉ có thể được cập nhật. Các thông tin còn lại do Học viện và thư viện quản lý.</p>
                {editing && <div className="profile-form-actions"><Button variant="ghost" type="button" onClick={cancelEditing}>Hủy</Button><Button type="submit">Lưu thay đổi</Button></div>}
              </form>
            </section>

            <section className="profile-card">
              <header className="profile-card-heading"><div><span><Icon name="settings" size={18} /></span><div><h2>Thông tin đăng nhập</h2><p>Phương thức xác thực đang được sử dụng cho tài khoản.</p></div></div></header>
              <dl className="profile-login-details">
                <div><dt>Tên tài khoản</dt><dd>minh.anh</dd></div>
                <div><dt>Phương thức đăng nhập</dt><dd><Badge tone="brand">Tài khoản thư viện</Badge></dd></div>
                <div><dt>Email liên kết</dt><dd>minhanh@example.edu.vn</dd></div>
                <div><dt>Mật khẩu</dt><dd><span className="masked-password" aria-label="Mật khẩu đã được ẩn">••••••••••••</span></dd></div>
              </dl>
              <div className="profile-login-action"><Button variant="secondary" size="sm">Đổi mật khẩu</Button><p>Mật khẩu hiện tại luôn được bảo mật và không thể hiển thị.</p></div>
            </section>

            <section className="profile-card recent-activity-card">
              <header className="profile-card-heading"><div><span><Icon name="document" size={18} /></span><div><h2>Hoạt động gần đây</h2><p>Một số giao dịch thư viện gần nhất của bạn.</p></div></div><Button variant="ghost" size="sm" onClick={() => { navigate("/reader/my-library/history"); }}>Xem lịch sử mượn trả<Icon name="chevron-right" size={15} /></Button></header>
              <div className="profile-activity-list">
                <article><span className="activity-icon borrow"><Icon name="book" size={17} /></span><div><strong>Mượn tài liệu</strong><p>Nhập môn học máy</p></div><time>12/06/2026</time><Badge tone="success">Đang mượn</Badge></article>
                <article><span className="activity-icon returned"><Icon name="success" size={17} /></span><div><strong>Trả tài liệu</strong><p>Cơ sở dữ liệu</p></div><time>08/06/2026</time><Badge tone="neutral">Đã trả</Badge></article>
                <article><span className="activity-icon reserved"><Icon name="bookmark" size={17} /></span><div><strong>Đặt trước</strong><p>Trí tuệ nhân tạo – Cơ sở và ứng dụng</p></div><time>02/06/2026</time><Badge tone="warning">Đang chờ</Badge></article>
              </div>
            </section>
          </div>

          <aside className="profile-side-column">
            <section className="profile-card library-card-panel">
              <header className="profile-card-heading"><div><span><Icon name="library" size={18} /></span><div><h2>Thẻ thư viện</h2><p>Thông tin thẻ bạn đọc hiện tại.</p></div></div></header>
              <div className="reader-card-visual">
                <div><Brand compact /><Badge tone={restricted ? "error" : "success"}>{restricted ? "BỊ KHÓA" : "ĐANG HOẠT ĐỘNG"}</Badge></div>
                <span>THẺ BẠN ĐỌC</span>
                <strong>NGUYỄN MINH ANH</strong>
                <p>PTIT-202600128</p>
                <small>SINH VIÊN · CÔNG NGHỆ THÔNG TIN</small>
              </div>
              <dl className="reader-card-details">
                <div><dt>Mã thẻ</dt><dd>PTIT-202600128</dd></div>
                <div><dt>Loại độc giả</dt><dd>Sinh viên</dd></div>
                <div><dt>Trạng thái thẻ</dt><dd><Status tone={restricted ? "error" : "success"}>{restricted ? "Đang bị khóa" : "Đang hoạt động"}</Status></dd></div>
                <div><dt>Ngày cấp thẻ</dt><dd>01/09/2026</dd></div>
                <div><dt>Ngày hết hạn</dt><dd>Chưa xác định</dd></div>
              </dl>
              <p className="library-card-note"><Icon name="info" size={14} />Thông tin thẻ được quản lý bởi thư viện. Vui lòng liên hệ nhân viên thư viện nếu cần điều chỉnh thông tin thẻ.</p>
            </section>

            <section className={`profile-card account-status-card ${restricted ? "restricted" : ""}`}>
              <span className="account-status-icon"><Icon name={restricted ? "error" : "success"} size={23} /></span>
              <p className="eyebrow">TRẠNG THÁI TÀI KHOẢN</p>
              <h2>{restricted ? "Thẻ thư viện đang bị khóa" : "Đang hoạt động"}</h2>
              <p>{restricted ? "Tài khoản hiện không thể thực hiện các giao dịch mượn hoặc đặt trước tài liệu. Vui lòng liên hệ nhân viên thư viện để được hỗ trợ." : "Tài khoản hiện có thể sử dụng các chức năng thư viện theo quyền được cấp."}</p>
              {restricted && <div className="restricted-note"><Icon name="info" size={15} />Tài khoản đang bị hạn chế. Vui lòng liên hệ nhân viên thư viện.</div>}
            </section>
          </aside>
        </div>
      </main>
      {toast && <div className="toast-position"><Toast title="Cập nhật thành công" onClose={() => setToast(false)}>Thông tin cá nhân đã được cập nhật.</Toast></div>}
    </div>
  );
}
