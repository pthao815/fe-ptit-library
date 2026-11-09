import { useEffect, useState } from "react";
import type * as React from "react";
import { Avatar, Badge, Breadcrumb, Button, Field, Icon, Status, Toast } from "../../design-system";
import { workProfileData } from "../../data/profiles";
import { getAccessToken, getStoredUser } from "../../services/session";
import { userService } from "../../services/user.service";
import type { UserProfileResponse } from "../../types/api";

export default function WorkProfilePage({ role }: { role: "staff" | "admin" }) {
  const data = workProfileData[role];
  const [profile, setProfile] = useState<UserProfileResponse | null>(() => {
    const cached = getStoredUser();
    if (!cached) return null;
    return {
      id: cached.id,
      fullName: cached.fullName,
      userCode: cached.userCode,
      email: cached.email,
      phone: cached.phone,
      address: cached.address,
      role: String(cached.role),
      userType: String(cached.userType),
      departmentId: cached.departmentId,
      departmentName: cached.departmentName,
      enrollmentYear: cached.enrollmentYear,
      status: cached.status,
      cardExpiry: cached.cardExpiry,
      debt: cached.debt,
    };
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contact, setContact] = useState({
    phone: profile?.phone ?? "",
    address: profile?.address ?? "",
  });
  const [draft, setDraft] = useState(contact);
  const [errors, setErrors] = useState<{ phone?: string; address?: string }>({});
  const [toast, setToast] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [revision, setRevision] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!getAccessToken()) return;
    let active = true;
    setLoadingProfile(true);
    setLoadError("");
    userService
      .getProfile()
      .then((res) => {
        if (!active) return;
        setProfile(res);
        const nextContact = {
          phone: res.phone ?? "",
          address: res.address ?? "",
        };
        setContact(nextContact);
        setDraft(nextContact);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Không tải được hồ sơ.");
      }).finally(() => { if (active) setLoadingProfile(false); });
    return () => {
      active = false;
    };
  }, [revision]);

  const displayName = profile?.fullName || "—";
  const displayEmployeeId = profile?.userCode || "—";
  const displayDepartment = profile?.departmentName || "—";
  const displayEmail = profile?.email || "—";

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
  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaveError("");
    setToast(false);
    const nextErrors = {
      phone: draft.phone.trim() ? undefined : "Vui lòng nhập số điện thoại.",
      address: !isAdmin && !draft.address.trim() ? "Vui lòng nhập địa chỉ." : undefined,
    };
    setErrors(nextErrors);
    if (nextErrors.phone || nextErrors.address) return;

    setSaving(true);
    try {
      if (!getAccessToken()) throw new Error("Phiên đăng nhập đã hết hạn.");
      const updated = await userService.updateProfile({
          phone: draft.phone.trim(),
          address: draft.address.trim(),
        });
      setProfile(updated);
      setContact({ phone: updated.phone ?? "", address: updated.address ?? "" });
      setEditing(false);
      setToast(true);
      window.setTimeout(() => setToast(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Không lưu được hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) return <p className="reader-main" role="status">Đang tải hồ sơ…</p>;
  if (loadError || !profile) return <div className="reader-main" role="alert">
    <p>{loadError || "Không tìm thấy hồ sơ."}</p>
    <Button onClick={() => setRevision((value) => value + 1)}>Thử lại</Button>
  </div>;

  return (
    <div className="work-profile-page">
      <Breadcrumb items={["Trang chủ", "Thông tin cá nhân"]} />
      <div className="work-profile-heading">
        <div><p className="eyebrow">{isAdmin ? "HỒ SƠ QUẢN TRỊ" : "HỒ SƠ NHÂN VIÊN"}</p><h1>Thông tin cá nhân</h1><p>Quản lý thông tin cá nhân và tài khoản làm việc của bạn.</p></div>
        <Badge tone={isAdmin ? "info" : "brand"}>{isAdmin ? "QUẢN TRỊ VIÊN HỆ THỐNG" : "NHÂN VIÊN THƯ VIỆN"}</Badge>
      </div>

      <section className="profile-summary-card work-profile-summary">
        <Avatar name={displayName} size="lg" />
        <div className="profile-summary-identity"><h2>{displayName}</h2><p>Mã nhân viên <strong>{displayEmployeeId}</strong></p></div>
        <div className="profile-summary-meta"><span><small>Chức vụ</small><strong>{data.title}</strong></span><span><small>Đơn vị công tác</small><strong>{displayDepartment}</strong></span></div>
        <Badge tone="success"><Status tone={profile.status === "ACTIVE" ? "success" : "neutral"}>{profile.status === "ACTIVE" ? "Đang hoạt động" : profile.status || "—"}</Status></Badge>
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
              {saveError && <p role="alert">{saveError}</p>}
              <div className="profile-fields-grid">
                <Field label="Họ và tên" value={displayName} readOnly hint="Thông tin này do hệ thống quản lý và không thể chỉnh sửa tại đây." />
                <Field label="Mã nhân viên" value={displayEmployeeId} readOnly />
                <Field label="Chức vụ" value={data.title} readOnly />
                <Field label="Đơn vị công tác" value={displayDepartment} readOnly />
                <Field label="Email công việc" value={displayEmail} readOnly />
                <Field label="Số điện thoại" value={editing ? draft.phone : contact.phone} readOnly={!editing} onChange={(event) => { setDraft((current) => ({ ...current, phone: event.target.value })); setErrors((current) => ({ ...current, phone: undefined })); }} error={errors.phone} />
                {!isAdmin && <Field label="Địa chỉ" value={editing ? draft.address : contact.address} readOnly={!editing} onChange={(event) => { setDraft((current) => ({ ...current, address: event.target.value })); setErrors((current) => ({ ...current, address: undefined })); }} error={errors.address} />}
                <Field label="Ngày bắt đầu công tác" value={data.startDate} readOnly />
              </div>
              <p className="profile-permission-note"><Icon name="info" size={14} />Vai trò, mã nhân viên và đơn vị công tác do hệ thống quản lý. Bạn không thể tự thay đổi quyền truy cập tại đây.</p>
              {editing && <div className="profile-form-actions"><Button variant="ghost" type="button" onClick={cancelEditing}>Hủy</Button><Button type="submit" loading={saving}>Lưu thay đổi</Button></div>}
            </form>
          </section>

          <section className="profile-card">
            <header className="profile-card-heading"><div><span><Icon name="settings" size={18} /></span><div><h2>Bảo mật và đăng nhập</h2><p>Thông tin xác thực của tài khoản làm việc.</p></div></div></header>
            <dl className="profile-login-details">
              <div><dt>Phương thức đăng nhập</dt><dd><Badge tone={isAdmin ? "info" : "brand"}>{"Tài khoản thư viện"}</Badge></dd></div>
              <div><dt>Email liên kết</dt><dd>{displayEmail}</dd></div>
              {!isAdmin && <div><dt>Mật khẩu</dt><dd><span className="masked-password" aria-label="Mật khẩu đã được ẩn">••••••••••••</span></dd></div>}
              <div><dt>Lần đăng nhập thành công gần nhất</dt><dd>—</dd></div>
            </dl>
            <div className="profile-login-action">
              <span>Đổi mật khẩu chưa khả dụng tại đây.</span>
              <p>{"Mật khẩu luôn được bảo mật."}</p>
            </div>
          </section>
        </div>

        <aside className="profile-side-column">
          <section className="profile-card work-account-card">
            <header className="profile-card-heading"><div><span><Icon name="library" size={18} /></span><div><h2>{isAdmin ? "Thông tin tài khoản quản trị" : "Thông tin tài khoản"}</h2><p>Định danh và vai trò làm việc hiện tại.</p></div></div></header>
            <dl className="reader-card-details">
              <div><dt>Tên tài khoản</dt><dd>{displayEmployeeId}</dd></div>
              <div><dt>Vai trò</dt><dd><Badge tone={isAdmin ? "info" : "brand"}>{data.title}</Badge></dd></div>
              <div><dt>Trạng thái</dt><dd><Status tone="success">Đang hoạt động</Status></dd></div>
              <div><dt>Ngày tạo tài khoản</dt><dd>—</dd></div>
              <div><dt>Lần đăng nhập gần nhất</dt><dd>{data.lastLogin}</dd></div>
            </dl>
            <p className="work-role-description"><Icon name="info" size={15} />{data.roleDescription}</p>
          </section>

          <section className="profile-card work-activity-card">
            <header className="profile-card-heading"><div><span><Icon name="document" size={18} /></span><div><h2>{data.activityTitle}</h2><p>Tóm tắt các thao tác gần nhất.</p></div></div></header>
            <p>Nhật ký hoạt động chưa được kết nối.</p>
          </section>

          <section className="profile-card account-status-card">
            <span className="account-status-icon"><Icon name="success" size={23} /></span>
            <p className="eyebrow">TRẠNG THÁI TÀI KHOẢN</p>
            <h2>{profile.status === "ACTIVE" ? "Đang hoạt động" : profile.status || "Chưa xác định"}</h2>
          </section>
        </aside>
      </div>
      {toast && <div className="toast-position"><Toast title="Cập nhật thành công" onClose={() => setToast(false)}>Thông tin cá nhân đã được cập nhật.</Toast></div>}
    </div>
  );
}
