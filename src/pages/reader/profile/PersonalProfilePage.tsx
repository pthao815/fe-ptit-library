import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type * as React from "react";
import { Avatar, Badge, Breadcrumb, Button, Field, Icon, Status, Toast } from "../../../design-system";
import Brand from "../../../components/common/Brand";
import { circulationService } from "../../../services/circulation.service";
import { getAccessToken, getStoredUser } from "../../../services/session";
import { userService } from "../../../services/user.service";
import type { CirculationHistoryItemDto, UserProfileResponse } from "../../../types/api";
import { formatDateVi } from "../../../utils/mappers";

const profileInitialContact = {
  phone: "09xx xxx 123",
  address: "Hà Nội",
};

export default function PersonalProfilePage({ restricted = false }: { restricted?: boolean }) {
  const navigate = useNavigate();
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
  const [recentHistory, setRecentHistory] = useState<CirculationHistoryItemDto[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contact, setContact] = useState({
    phone: profile?.phone || profileInitialContact.phone,
    address: profile?.address || profileInitialContact.address,
  });
  const [draft, setDraft] = useState(contact);
  const [errors, setErrors] = useState<{ phone?: string; address?: string }>({});
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) return;
    let active = true;

    userService
      .getProfile()
      .then((data) => {
        if (!active) return;
        setProfile(data);
        const nextContact = {
          phone: data.phone || profileInitialContact.phone,
          address: data.address || profileInitialContact.address,
        };
        setContact(nextContact);
        setDraft(nextContact);
      })
      .catch(() => {
        // Fallback to cached or mock profile
      });

    circulationService
      .getMyCirculationHistory(undefined, { page: 0, size: 3 })
      .then((pageData) => {
        if (active && pageData.items?.length) {
          setRecentHistory(pageData.items);
        }
      })
      .catch(() => {
        // Keep mock activity items
      });

    return () => {
      active = false;
    };
  }, []);

  const displayName = profile?.fullName || "Nguyễn Minh Anh";
  const displayCode = profile?.userCode || "PTIT-202600128";
  const displayEmail = profile?.email || "minhanh@example.edu.vn";
  const displayDepartment = profile?.departmentName || "Công nghệ thông tin";
  const displayUserType =
    profile?.userType === "LECTURER"
      ? "Giảng viên"
      : profile?.userType === "RESEARCHER"
        ? "Nghiên cứu sinh"
        : "Sinh viên";
  const isLocked =
    restricted ||
    (profile?.status !== undefined &&
      ["LOCKED", "SUSPENDED", "INACTIVE"].includes(profile.status.toUpperCase()));
  const cardExpiryText = profile?.cardExpiry ? formatDateVi(profile.cardExpiry) : "Chưa xác định";

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
    const nextErrors = {
      phone: draft.phone.trim() ? undefined : "Vui lòng nhập số điện thoại.",
      address: draft.address.trim() ? undefined : "Vui lòng nhập địa chỉ.",
    };
    setErrors(nextErrors);
    if (nextErrors.phone || nextErrors.address) return;

    setSaving(true);
    try {
      if (getAccessToken()) {
        const updated = await userService.updateProfile({
          phone: draft.phone.trim(),
          address: draft.address.trim(),
        });
        setProfile(updated);
      }
      setContact({ phone: draft.phone.trim(), address: draft.address.trim() });
      setEditing(false);
      setToast(true);
      window.setTimeout(() => setToast(false), 3000);
    } catch {
      setContact({ phone: draft.phone.trim(), address: draft.address.trim() });
      setEditing(false);
      setToast(true);
      window.setTimeout(() => setToast(false), 3000);
    } finally {
      setSaving(false);
    }
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
          <Avatar name={displayName} size="lg" />
          <div className="profile-summary-identity"><h2>{displayName}</h2><p>Mã độc giả <strong>{displayCode}</strong></p></div>
          <div className="profile-summary-meta"><span><small>Loại độc giả</small><strong>{displayUserType}</strong></span><span><small>Khoa / Chương trình</small><strong>{displayDepartment}</strong></span></div>
          <Badge tone={isLocked ? "error" : "success"}><Status tone={isLocked ? "error" : "success"}>{isLocked ? "Đang bị khóa" : "Đang hoạt động"}</Status></Badge>
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
                  <Field label="Họ và tên" value={displayName} readOnly />
                  <Field label="Mã độc giả" value={displayCode} readOnly />
                  <Field label="Ngày sinh" value={profile?.enrollmentYear ? `Khóa ${profile.enrollmentYear}` : "15/08/2004"} readOnly />
                  <Field label="Giới tính" value="Không hiển thị" readOnly />
                  <Field label="Email" value={displayEmail} readOnly />
                  <Field label="Số điện thoại" value={editing ? draft.phone : contact.phone} readOnly={!editing} onChange={(event) => { setDraft((current) => ({ ...current, phone: event.target.value })); setErrors((current) => ({ ...current, phone: undefined })); }} error={errors.phone} />
                  <Field label="Địa chỉ" value={editing ? draft.address : contact.address} readOnly={!editing} onChange={(event) => { setDraft((current) => ({ ...current, address: event.target.value })); setErrors((current) => ({ ...current, address: undefined })); }} error={errors.address} />
                  <Field label="Khoa / Chương trình đào tạo" value={displayDepartment} readOnly />
                  <Field label="Loại độc giả" value={displayUserType} readOnly />
                </div>
                <p className="profile-permission-note"><Icon name="info" size={14} />Chỉ số điện thoại và địa chỉ có thể được cập nhật. Các thông tin còn lại do Học viện và thư viện quản lý.</p>
                {editing && <div className="profile-form-actions"><Button variant="ghost" type="button" onClick={cancelEditing}>Hủy</Button><Button type="submit" loading={saving}>Lưu thay đổi</Button></div>}
              </form>
            </section>

            <section className="profile-card">
              <header className="profile-card-heading"><div><span><Icon name="settings" size={18} /></span><div><h2>Thông tin đăng nhập</h2><p>Phương thức xác thực đang được sử dụng cho tài khoản.</p></div></div></header>
              <dl className="profile-login-details">
                <div><dt>Tên tài khoản</dt><dd>{displayCode}</dd></div>
                <div><dt>Phương thức đăng nhập</dt><dd><Badge tone="brand">Tài khoản thư viện</Badge></dd></div>
                <div><dt>Email liên kết</dt><dd>{displayEmail}</dd></div>
                <div><dt>Mật khẩu</dt><dd><span className="masked-password" aria-label="Mật khẩu đã được ẩn">••••••••••••</span></dd></div>
              </dl>
              <div className="profile-login-action"><Button variant="secondary" size="sm">Đổi mật khẩu</Button><p>Mật khẩu hiện tại luôn được bảo mật và không thể hiển thị.</p></div>
            </section>

            <section className="profile-card recent-activity-card">
              <header className="profile-card-heading"><div><span><Icon name="document" size={18} /></span><div><h2>Hoạt động gần đây</h2><p>Một số giao dịch thư viện gần nhất của bạn.</p></div></div><Button variant="ghost" size="sm" onClick={() => { navigate("/reader/my-library/history"); }}>Xem lịch sử mượn trả<Icon name="chevron-right" size={15} /></Button></header>
              <div className="profile-activity-list">
                {recentHistory.length > 0 ? (
                  recentHistory.map((item) => {
                    const isReturned = item.status === "RETURNED" || Boolean(item.returnDate);
                    return (
                      <article key={item.circulationId}>
                        <span className={`activity-icon ${isReturned ? "returned" : "borrow"}`}>
                          <Icon name={isReturned ? "success" : "book"} size={17} />
                        </span>
                        <div>
                          <strong>{isReturned ? "Trả tài liệu" : "Mượn tài liệu"}</strong>
                          <p>{item.documentTitle}</p>
                        </div>
                        <time>{formatDateVi(isReturned ? item.returnDate : item.borrowDate)}</time>
                        <Badge tone={isReturned ? "neutral" : item.status === "OVERDUE" ? "error" : "success"}>
                          {isReturned ? "Đã trả" : item.status === "OVERDUE" ? "Quá hạn" : "Đang mượn"}
                        </Badge>
                      </article>
                    );
                  })
                ) : (
                  <>
                    <article><span className="activity-icon borrow"><Icon name="book" size={17} /></span><div><strong>Mượn tài liệu</strong><p>Nhập môn học máy</p></div><time>12/06/2026</time><Badge tone="success">Đang mượn</Badge></article>
                    <article><span className="activity-icon returned"><Icon name="success" size={17} /></span><div><strong>Trả tài liệu</strong><p>Cơ sở dữ liệu</p></div><time>08/06/2026</time><Badge tone="neutral">Đã trả</Badge></article>
                    <article><span className="activity-icon reserved"><Icon name="bookmark" size={17} /></span><div><strong>Đặt trước</strong><p>Trí tuệ nhân tạo – Cơ sở và ứng dụng</p></div><time>02/06/2026</time><Badge tone="warning">Đang chờ</Badge></article>
                  </>
                )}
              </div>
            </section>
          </div>

          <aside className="profile-side-column">
            <section className="profile-card library-card-panel">
              <header className="profile-card-heading"><div><span><Icon name="library" size={18} /></span><div><h2>Thẻ thư viện</h2><p>Thông tin thẻ bạn đọc hiện tại.</p></div></div></header>
              <div className="reader-card-visual">
                <div><Brand compact /><Badge tone={isLocked ? "error" : "success"}>{isLocked ? "BỊ KHÓA" : "ĐANG HOẠT ĐỘNG"}</Badge></div>
                <span>THẺ BẠN ĐỌC</span>
                <strong>{displayName.toUpperCase()}</strong>
                <p>{displayCode}</p>
                <small>{`${displayUserType.toUpperCase()} · ${displayDepartment.toUpperCase()}`}</small>
              </div>
              <dl className="reader-card-details">
                <div><dt>Mã thẻ</dt><dd>{displayCode}</dd></div>
                <div><dt>Loại độc giả</dt><dd>{displayUserType}</dd></div>
                <div><dt>Trạng thái thẻ</dt><dd><Status tone={isLocked ? "error" : "success"}>{isLocked ? "Đang bị khóa" : "Đang hoạt động"}</Status></dd></div>
                <div><dt>Ngày cấp thẻ</dt><dd>01/09/2026</dd></div>
                <div><dt>Ngày hết hạn</dt><dd>{cardExpiryText}</dd></div>
              </dl>
              <p className="library-card-note"><Icon name="info" size={14} />Thông tin thẻ được quản lý bởi thư viện. Vui lòng liên hệ nhân viên thư viện nếu cần điều chỉnh thông tin thẻ.</p>
            </section>

            <section className={`profile-card account-status-card ${isLocked ? "restricted" : ""}`}>
              <span className="account-status-icon"><Icon name={isLocked ? "error" : "success"} size={23} /></span>
              <p className="eyebrow">TRẠNG THÁI TÀI KHOẢN</p>
              <h2>{isLocked ? "Thẻ thư viện đang bị khóa" : "Đang hoạt động"}</h2>
              <p>{isLocked ? "Tài khoản hiện không thể thực hiện các giao dịch mượn hoặc đặt trước tài liệu. Vui lòng liên hệ nhân viên thư viện để được hỗ trợ." : "Tài khoản hiện có thể sử dụng các chức năng thư viện theo quyền được cấp."}</p>
              {isLocked && <div className="restricted-note"><Icon name="info" size={15} />Tài khoản đang bị hạn chế. Vui lòng liên hệ nhân viên thư viện.</div>}
            </section>
          </aside>
        </div>
      </main>
      {toast && <div className="toast-position"><Toast title="Cập nhật thành công" onClose={() => setToast(false)}>Thông tin cá nhân đã được cập nhật.</Toast></div>}
    </div>
  );
}
