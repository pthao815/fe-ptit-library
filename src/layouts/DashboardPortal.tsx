import { useEffect, useState } from "react";
import { useNavigate, useRoutes } from "react-router-dom";
import { Button, IconButton, SearchInput } from "../design-system";
import WorkspaceSidebar from "./WorkspaceSidebar";
import UserMenu from "../components/common/UserMenu";
import ShellPlaceholder from "../components/common/ShellPlaceholder";
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

export default function DashboardPortal({ role, path }: { role: "staff" | "admin"; path: string }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [active, setActive] = useState(path.endsWith("/profile") ? "Thông tin cá nhân" : path === "staff/circulation" ? "Lưu thông" : path.startsWith("staff/materials") ? "Quản lý tài liệu" : path === "staff/digital-processing" ? "Tài liệu số" : path === "staff/reservations" ? "Đặt trước" : path === "staff/readers" ? "Bạn đọc" : path === "staff/reports" ? "Thống kê & báo cáo" : "Tổng quan");
  const isStaff = role === "staff";

  useEffect(() => {
    if (path.endsWith("/profile")) setActive("Thông tin cá nhân");
    else if (path === "staff/circulation") setActive("Lưu thông");
    else if (path.startsWith("staff/materials")) setActive("Quản lý tài liệu");
    else if (path === "staff/digital-processing") setActive("Tài liệu số");
    else if (path === "staff/reservations") setActive("Đặt trước");
    else if (path === "staff/readers") setActive("Bạn đọc");
    else if (path === "staff/reports") setActive("Thống kê & báo cáo");
    else if (path === "staff") setActive("Tổng quan");
  }, [path]);

  const changeWorkspace = (label: string) => {
    setActive(label);
    if (role === "staff" && label === "Lưu thông") navigate("/staff/circulation");
    else if (role === "staff" && label === "Quản lý tài liệu") navigate("/staff/materials");
    else if (role === "staff" && label === "Tài liệu số") navigate("/staff/digital-processing");
    else if (role === "staff" && label === "Đặt trước") navigate("/staff/reservations");
    else if (role === "staff" && label === "Bạn đọc") navigate("/staff/readers");
    else if (role === "staff" && label === "Thống kê & báo cáo") navigate("/staff/reports");
    else if (role === "staff" && label === "Tổng quan") navigate("/staff");
    else if (label === "Thông tin cá nhân") navigate(role === "staff" ? "/staff/profile" : "/admin/profile");
  };

  const placeholder = (
    <ShellPlaceholder
      role={role}
      title={active}
      description={
        isStaff
          ? "Không gian vận hành tập trung cho các nghiệp vụ thư viện và phục vụ bạn đọc."
          : "Không gian kiểm soát tài khoản, cấu hình và tình trạng vận hành của hệ thống."
      }
    />
  );
  const page = useRoutes([
    { path: "profile", element: active === "Thông tin cá nhân" ? <WorkProfilePage role={role} /> : placeholder },
    ...(isStaff ? [
      { index: true, element: <StaffDashboard /> },
      { path: "circulation", element: <CirculationScreen /> },
      { path: "materials/new", element: <BibliographicRecordForm /> },
      { path: "materials/edit/:id/*", element: <BibliographicRecordForm edit /> },
      { path: "materials/*", element: <MaterialsManagementPage /> },
      { path: "digital-processing", element: <DigitalProcessingPage /> },
      { path: "reservations", element: <ReservationManagementPage /> },
      { path: "readers", element: <ReaderManagementPage /> },
      { path: "reports", element: <ReportsScreen /> },
    ] : []),
    { path: "*", element: placeholder },
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
        onLogout={() => { setMobileOpen(false); setUserOpen(false); logout(); }}
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
          <SearchInput placeholder={isStaff ? "Tìm tài liệu, bạn đọc..." : "Tìm tài khoản, cấu hình..."} />
          <div className="workspace-header-actions">
            <Button variant="ghost" size="sm" icon="sparkle">{isStaff ? "Tác vụ nhanh" : "Trạng thái hệ thống"}</Button>
            <span className="notification"><IconButton label="Thông báo" icon="bell" /><i /></span>
            <UserMenu open={userOpen} onToggle={() => setUserOpen(!userOpen)} onProfile={() => { setUserOpen(false); navigate(role === "staff" ? "/staff/profile" : "/admin/profile"); }} onLogout={() => { setUserOpen(false); logout(); }} role={role} />
          </div>
        </header>
        <main className="workspace-content-wrap">
          {page}
        </main>
      </div>
    </div>
  );
}
