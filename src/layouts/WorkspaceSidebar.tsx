import { Icon, IconButton } from "../design-system";
import Brand from "../components/common/Brand";
import { staffNavigation, adminNavigation } from "../constants/navigation";

export default function WorkspaceSidebar({
  role,
  collapsed,
  mobileOpen,
  active,
  onActiveChange,
  onCollapse,
  onMobileClose,
  onLogout,
}: {
  role: "staff" | "admin";
  collapsed: boolean;
  mobileOpen: boolean;
  active: string;
  onActiveChange: (label: string) => void;
  onCollapse: () => void;
  onMobileClose: () => void;
  onLogout: () => void;
}) {
  const navigation = role === "staff" ? staffNavigation : adminNavigation;
  return (
    <aside className={`workspace-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="workspace-brand-row">
        <Brand />
        <IconButton label="Đóng điều hướng" icon="close" onClick={onMobileClose} />
      </div>
      <div className="workspace-label">
        <small>{role === "staff" ? "KHÔNG GIAN NGHIỆP VỤ" : "KHÔNG GIAN QUẢN TRỊ"}</small>
        <strong>{role === "staff" ? "Thư viện" : "Hệ thống"}</strong>
      </div>
      <nav className="workspace-nav" aria-label={role === "staff" ? "Điều hướng nhân viên" : "Điều hướng quản trị"}>
        <p>ĐIỀU HƯỚNG CHÍNH</p>
        {navigation.map((item) => (
          <button
            key={item.label}
            className={active === item.label ? "active" : ""}
            title={collapsed ? item.label : undefined}
            onClick={() => {
              onActiveChange(item.label);
              onMobileClose();
            }}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <nav className="workspace-nav workspace-nav-bottom" aria-label="Tùy chọn tài khoản">
        <button className={active === "Thông tin cá nhân" ? "active" : ""} onClick={() => { onActiveChange("Thông tin cá nhân"); onMobileClose(); }}><Icon name="users" /><span>Tài khoản</span></button>
        <button><Icon name="settings" /><span>Cài đặt</span></button>
        <button className="logout" onClick={onLogout}><Icon name="arrow-left" /><span>Đăng xuất</span></button>
      </nav>
      <button className="collapse-control" onClick={onCollapse} aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}>
        <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={17} />
      </button>
    </aside>
  );
}
