import { workspacePaths } from "../constants/navigation";
import { useState } from "react";
import { Link, Navigate, useNavigate, useRoutes } from "react-router-dom";
import { Icon, IconButton, SearchInput, type IconName } from "../design-system";
import WorkspaceSidebar from "./WorkspaceSidebar";
import UserMenu from "../components/common/UserMenu";
import { logout } from "../utils/logout";
import WorkProfilePage from "../pages/workspace/WorkProfilePage";
import StaffDashboard from "../pages/staff/dashboard/StaffDashboard";
import CirculationScreen from "../pages/staff/circulation/CirculationScreen";
import BibliographicRecordForm from "../pages/staff/materials/BibliographicRecordForm";
import MaterialsManagementPage from "../pages/staff/materials/MaterialsManagementPage";
import DigitalProcessingPage from "../pages/staff/digital-processing/DigitalProcessingPage";
import ReservationManagementPage from "../pages/staff/reservations/ReservationManagementPage";
import ReaderManagementPage from "../pages/staff/readers/ReaderManagementPage";
import NotificationManagementPage from "../pages/staff/notifications/NotificationManagementPage";
import ReportsScreen from "../pages/staff/reports/ReportsScreen";
import SettingsWorkspace from "../features/library-settings/components/SettingsWorkspace";

// Lối tắt trên trang chủ quản trị
const ADMIN_SHORTCUTS: { label: string; icon: IconName; description: string }[] = [
  { label: "Chính sách mượn trả", icon: "settings", description: "Hạn mức, thời hạn mượn theo từng nhóm bạn đọc" },
  { label: "Loại hình phạt", icon: "shield", description: "Danh mục vi phạm, đơn vị tính và mức phí" },
  { label: "Cấu hình tra cứu", icon: "search", description: "Cấu hình bóc tách và chỉ mục tìm kiếm mặc định" },
  { label: "Quản lý tài liệu", icon: "book", description: "Biên mục, bản giấy và tài liệu số" },
  { label: "Bạn đọc", icon: "users", description: "Hồ sơ bạn đọc và trạng thái thẻ thư viện" },
  { label: "Thông báo", icon: "bell", description: "Soạn và gửi thông báo tới bạn đọc hoặc toàn hệ thống" },
];

export default function DashboardPortal({ role, path }: { role: "staff" | "admin"; path: string }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const isStaff = role === "staff";
  const section = path.split("/")[1] ?? "";
  const active =
    section === "policies" || section === "penalty-types"
      ? "Chính sách & Hình phạt"
      : Object.keys(workspacePaths).find((label) => workspacePaths[label] === section) ?? "";
  const changeWorkspace = (label: string) => {
    const segment = workspacePaths[label];
    if (segment !== undefined) navigate(segment ? "/" + role + "/" + segment : "/" + role);
  };
  const page = useRoutes([
    { path: "materials/new", element: <BibliographicRecordForm /> },
    { path: "materials/edit/:id", element: <BibliographicRecordForm edit /> },
    { path: "materials", element: <MaterialsManagementPage /> },
    { path: "policies", element: <SettingsWorkspace key={`${role}-policies`} kind="policies" portal={role} /> },
    { path: "penalty-types", element: <SettingsWorkspace key={`${role}-penalty-types`} kind="penalty-types" portal={role} /> },
    { path: "search-configs", element: <SettingsWorkspace key={`${role}-search-configs`} kind="search-configs" portal={role} /> },
    { path: "readers", element: <ReaderManagementPage /> },
    { path: "notifications", element: <NotificationManagementPage /> },
    { path: "profile", element: <WorkProfilePage role={role} /> },
    ...(isStaff ? [
      { index: true, element: <StaffDashboard /> },
      { path: "circulation", element: <CirculationScreen /> },
      { path: "digital-processing", element: <DigitalProcessingPage /> },
      { path: "reservations", element: <ReservationManagementPage /> },
      { path: "reports", element: <ReportsScreen /> },
    ] : []),
    ...(!isStaff ? [
      { index: true, element: <section className="materials-page admin-home">
        <div className="materials-page-heading">
          <div>
            <p className="eyebrow">QUẢN TRỊ HỆ THỐNG</p>
            <h1>Không gian quản trị</h1>
            <p>Cấu hình chính sách, tra cứu và quản lý dữ liệu dùng chung của thư viện.</p>
          </div>
        </div>
        <nav className="admin-home-grid" aria-label="Chức năng quản trị">
          {ADMIN_SHORTCUTS.map((item) =>
            <Link className="admin-home-card" key={item.label} to={"/admin/" + workspacePaths[item.label]}>
              <span className="admin-home-icon"><Icon name={item.icon} size={20} /></span>
              <span className="admin-home-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
              <Icon name="chevron-right" size={16} />
            </Link>)}
        </nav>
      </section> },
      { path: "workspace", element: <Navigate replace to="/admin" /> },
    ] : []),
  ]);

  return (
    <div className={`workspace-portal ${collapsed ? "sidebar-collapsed" : ""}`}>
      <WorkspaceSidebar
        role={role}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        active={active}
        onActiveChange={changeWorkspace}
        onCollapse={() => setCollapsed(!collapsed)}
        onMobileClose={() => setMobileOpen(false)}
        onLogout={() => { setMobileOpen(false); setUserOpen(false); logout(navigate); }}
      />
      {mobileOpen && <button className="mobile-scrim" aria-label="Đóng điều hướng" onClick={() => setMobileOpen(false)} />}
      <div className="workspace-main">
        <header className="workspace-header">
          <div className="workspace-header-left">
            <IconButton label="Mở điều hướng" icon="menu" onClick={() => setMobileOpen(true)} />
            <div>
              <strong>{isStaff ? "Cổng nghiệp vụ thư viện" : "Cổng quản trị hệ thống"}</strong>
              <small>{isStaff ? "PTIT Library Staff" : "PTIT Library Administration"}</small>
            </div>
          </div>
          <form role="search" onSubmit={(event) => {
            event.preventDefault();
            const keyword = String(new FormData(event.currentTarget).get("keyword") ?? "").trim();
            navigate("/" + role + "/materials?" + new URLSearchParams({ q: keyword }));
          }}><SearchInput name="keyword" placeholder="Tìm tài liệu..." /></form>
          <div className="workspace-header-actions">
            <UserMenu open={userOpen} onToggle={() => setUserOpen(!userOpen)} onProfile={() => { setUserOpen(false); navigate(role === "staff" ? "/staff/profile" : "/admin/profile"); }} onLogout={() => { setUserOpen(false); logout(navigate); }} role={role} />
          </div>
        </header>
        <main className="workspace-content-wrap">
          {page}
        </main>
      </div>
    </div>
  );
}
