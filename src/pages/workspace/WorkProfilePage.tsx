import { useState } from "react";
import type * as React from "react";
import { Avatar, Badge, Breadcrumb, Button, Field, Icon, Status, Toast } from "../../design-system";
import { workProfileData } from "../../data/profiles";

export default function WorkProfilePage({ role }: { role: "staff" | "admin" }) {
  const data = workProfileData[role];
  const [editing, setEditing] = useState(false);
  const [contact, setContact] = useState({ phone: data.phone, address: data.address });
  const [draft, setDraft] = useState(contact);
  const [errors, setErrors] = useState<{ phone?: string; address?: string }>({});
  const [toast, setToast] = useState(false);
  const isAdmin = role === "admin";

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
      address: !isAdmin && !draft.address.trim() ? "Vui lòng nhập địa chỉ." : undefined,
    };
    setErrors(nextErrors);
    if (nextErrors.phone || nextErrors.address) return;
    setContact(draft);
    setEditing(false);
    setToast(true);
    window.setTimeout(() => setToast(false), 3000);
  };

  return (
    <div className="work-profile-page">
      <Breadcrumb items={["Trang chủ", "Thông tin cá nhân"]} />
      <div className="work-profile-heading">
        <div><p className="eyebrow">{isAdmin ? "HỒ SƠ QUẢN TRỊ" : "HỒ SƠ NHÂN VIÊN"}</p><h1>Thông tin cá nhân</h1><p>Quản lý thông tin cá nhân và tài khoản làm việc của bạn.</p></div>
        <Badge tone={isAdmin ? "info" : "brand"}>{isAdmin ? "QUẢN TRỊ VIÊN HỆ THỐNG" : "NHÂN VIÊN THƯ VIỆN"}</Badge>
      </div>

      <section className="profile-summary-card work-profile-summary">
        <Avatar name={data.name} size="lg" />
        <div className="profile-summary-identity"><h2>{data.name}</h2><p>Mã nhân viên <strong>{data.employeeId}</strong></p></div>
        <div className="profile-summary-meta"><span><small>Chức vụ</small><strong>{data.title}</strong></span><span><small>Đơn vị công tác</small><strong>{data.department}</strong></span></div>
        <Badge tone="success"><Status tone="success">Đang hoạt động</Status></Badge>
      </section>

      <div className="work-profile-layout">
        <div className="profile-main-column">
          <section className="profile-card">
            <header className="profile-card-heading">
              <div><span><Icon name="users" size={18} /></span><div><h2>Thông tin cá nhân</h2><p>Thông tin nhân sự và liên hệ trong hệ thống.</p></div></div>
              {!editing && <Button variant="secondary" size="sm" onClick={startEditing}>Chỉnh sửa thông tin</Button>}
            </header>
            {(errors.phone || errors.address) && <div className="profile-form-alert"><Icon name="error" size={17} />Vui lòng kiểm tra lại thông tin đã nhập.</div>}
            <form className="profile-form" onSubmit={saveProfile}>
              <div className="profile-fields-grid">
                <Field label="Họ và tên" value={data.name} readOnly hint="Thông tin này do hệ thống quản lý và không thể chỉnh sửa tại đây." />
                <Field label="Mã nhân viên" value={data.employeeId} readOnly />
                <Field label="Chức vụ" value={data.title} readOnly />
                <Field label="Đơn vị công tác" value={data.department} readOnly />
                <Field label="Email công việc" value={data.email} readOnly />
                <Field label="Số điện thoại" value={editing ? draft.phone : contact.phone} readOnly={!editing} onChange={(event) => { setDraft((current) => ({ ...current, phone: event.target.value })); setErrors((current) => ({ ...current, phone: undefined })); }} error={errors.phone} />
                {!isAdmin && <Field label="Địa chỉ" value={editing ? draft.address : contact.address} readOnly={!editing} onChange={(event) => { setDraft((current) => ({ ...current, address: event.target.value })); setErrors((current) => ({ ...current, address: undefined })); }} error={errors.address} />}
                <Field label="Ngày bắt đầu công tác" value={data.startDate} readOnly />
              </div>
              <p className="profile-permission-note"><Icon name="info" size={14} />Vai trò, mã nhân viên và đơn vị công tác do hệ thống quản lý. Bạn không thể tự thay đổi quyền truy cập tại đây.</p>
              {editing && <div className="profile-form-actions"><Button variant="ghost" type="button" onClick={cancelEditing}>Hủy</Button><Button type="submit">Lưu thay đổi</Button></div>}
            </form>
          </section>

          <section className="profile-card">
            <header className="profile-card-heading"><div><span><Icon name="settings" size={18} /></span><div><h2>Bảo mật và đăng nhập</h2><p>Thông tin xác thực của tài khoản làm việc.</p></div></div></header>
            <dl className="profile-login-details">
              <div><dt>Phương thức đăng nhập</dt><dd><Badge tone={isAdmin ? "info" : "brand"}>{isAdmin ? "Đăng nhập bằng Microsoft" : "Tài khoản thư viện"}</Badge></dd></div>
              <div><dt>Email liên kết</dt><dd>{data.email}</dd></div>
              {!isAdmin && <div><dt>Mật khẩu</dt><dd><span className="masked-password" aria-label="Mật khẩu đã được ẩn">••••••••••••</span></dd></div>}
              <div><dt>Lần đăng nhập thành công gần nhất</dt><dd>{data.lastLogin}</dd></div>
            </dl>
            <div className="profile-login-action">
              {!isAdmin && <Button variant="secondary" size="sm">Đổi mật khẩu</Button>}
              <p>{isAdmin ? "Thông tin xác thực được quản lý bởi hệ thống Microsoft của Học viện." : "Mật khẩu hiện tại luôn được bảo mật và không thể hiển thị."}</p>
            </div>
          </section>
        </div>

        <aside className="profile-side-column">
          <section className="profile-card work-account-card">
            <header className="profile-card-heading"><div><span><Icon name="library" size={18} /></span><div><h2>{isAdmin ? "Thông tin tài khoản quản trị" : "Thông tin tài khoản"}</h2><p>Định danh và vai trò làm việc hiện tại.</p></div></div></header>
            <dl className="reader-card-details">
              <div><dt>Tên tài khoản</dt><dd>{data.username}</dd></div>
              <div><dt>Vai trò</dt><dd><Badge tone={isAdmin ? "info" : "brand"}>{data.title}</Badge></dd></div>
              <div><dt>Trạng thái</dt><dd><Status tone="success">Đang hoạt động</Status></dd></div>
              <div><dt>Ngày tạo tài khoản</dt><dd>{data.createdAt}</dd></div>
              <div><dt>Lần đăng nhập gần nhất</dt><dd>{data.lastLogin}</dd></div>
            </dl>
            <p className="work-role-description"><Icon name="info" size={15} />{data.roleDescription}</p>
          </section>

          <section className="profile-card work-activity-card">
            <header className="profile-card-heading"><div><span><Icon name="document" size={18} /></span><div><h2>{data.activityTitle}</h2><p>Tóm tắt các thao tác gần nhất.</p></div></div></header>
            <div className="work-activity-list">
              {data.activities.map((activity) => <article key={`${activity.title}-${activity.time}`}><span><Icon name={activity.icon} size={16} /></span><div><strong>{activity.title}</strong><p>{activity.description}</p><time>{activity.time}</time></div><Badge tone={activity.tone}>{activity.status}</Badge></article>)}
            </div>
            <button className="work-activity-link">{data.activityAction}<Icon name="chevron-right" size={14} /></button>
          </section>

          <section className="profile-card account-status-card">
            <span className="account-status-icon"><Icon name="success" size={23} /></span>
            <p className="eyebrow">TRẠNG THÁI TÀI KHOẢN</p>
            <h2>Đang hoạt động</h2>
            <p>Tài khoản đang hoạt động bình thường.</p>
          </section>
        </aside>
      </div>
      {toast && <div className="toast-position"><Toast title="Cập nhật thành công" onClose={() => setToast(false)}>Thông tin cá nhân đã được cập nhật.</Toast></div>}
    </div>
  );
}
