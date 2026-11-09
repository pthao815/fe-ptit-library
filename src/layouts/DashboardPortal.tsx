import { workspacePaths } from "../constants/navigation";
import { useState } from "react";
import { Link, Navigate, useNavigate, useRoutes } from "react-router-dom";
import { IconButton, SearchInput } from "../design-system";
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
import ReportsScreen from "../pages/staff/reports/ReportsScreen";
import SettingsWorkspace from "../features/library-settings/components/SettingsWorkspace";

export default function DashboardPortal({ role, path }: { role: "staff" | "admin"; path: string }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const isStaff = role === "staff";
  const section = path.split("/")[1] ?? "";
  const active = Object.keys(workspacePaths).find((label) => workspacePaths[label] === section) ?? "";
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
    { path: "profile", element: <WorkProfilePage role={role} /> },
    ...(isStaff ? [
      { index: true, element: <StaffDashboard /> },
      { path: "circulation", element: <CirculationScreen /> },
      { path: "digital-processing", element: <DigitalProcessingPage /> },
      { path: "reservations", element: <ReservationManagementPage /> },
      { path: "readers", element: <ReaderManagementPage /> },
      { path: "reports", element: <ReportsScreen /> },
    ] : []),
    ...(!isStaff ? [
      { index: true, element: <section className="materials-page">
        <h1>Không gian quản trị</h1>
        <nav className="detail-primary-actions" aria-label="Chức năng quản trị">
          {["Chính sách mượn trả", "Loại hình phạt", "Cấu hình tra cứu", "Quản lý tài liệu"].map((label) =>
            <Link className="btn btn-secondary" key={label} to={"/admin/" + workspacePaths[label]}>{label}</Link>)}
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
          {["digital-processing", "reservations", "reports"].includes(section) && <p role="status">Màn hình xem trước có thể hiển thị dữ liệu minh họa.</p>}
          {page}
        </main>
      </div>
    </div>
  );
}
