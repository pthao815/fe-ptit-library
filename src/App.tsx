import { useEffect, useState } from "react";
import {
  Button,
  Icon,
  IconButton,
  Rating,
  SearchInput,
} from "./design-system";
import type { Role, Book } from "./types/library";
import { readerNavigation } from "./constants/navigation";
import WorkProfilePage from "./pages/workspace/WorkProfilePage";
import StaffDashboard from "./pages/staff/dashboard/StaffDashboard";
import ReservationManagementPage from "./pages/staff/reservations/ReservationManagementPage";
import ReaderManagementPage from "./pages/staff/readers/ReaderManagementPage";
import { logout } from "./utils/logout";
import Brand from "./components/common/Brand";
import UserMenu from "./components/common/UserMenu";
import ShellPlaceholder from "./components/common/ShellPlaceholder";
import NotificationDropdown from "./components/notifications/NotificationDropdown";
import WorkspaceSidebar from "./layouts/WorkspaceSidebar";
import ReaderHome from "./pages/reader/home/ReaderHomePage";
import GuidelinesPage from "./pages/reader/guidelines/GuidelinesPage";
import SearchResultsPage from "./pages/reader/search/BookSearchPage";
import ContentSearchResultsPage from "./pages/reader/search/ContentSearchPage";
import BookDetailPage from "./pages/reader/book-detail/BookDetailPage";
import MaterialReviewPage from "./pages/reader/review/BookReviewPage";
import DocumentReader from "./pages/reader/document/DocumentPage";
import MyLibraryPage from "./pages/reader/my-library/MyLibraryPage";
import PersonalProfilePage from "./pages/reader/profile/PersonalProfilePage";
import NotificationDetailPage from "./pages/reader/notifications/NotificationDetailPage";
import ReportsScreen from "./pages/staff/reports/ReportsScreen";
import MaterialsManagementPage from "./pages/staff/materials/MaterialsManagementPage";
import DigitalProcessingPage from "./pages/staff/digital-processing/DigitalProcessingPage";
import CirculationScreen from "./pages/staff/circulation/CirculationScreen";
import BibliographicRecordForm from "./pages/staff/materials/BibliographicRecordForm";

function useRoleRoute() {
  const readRoute = (): { role: Role; path: string } => {
    const path = window.location.hash.replace("#/", "") || "login";
    const root = path.split("/")[0];
    return { role: root === "staff" || root === "admin" ? root : "reader", path };
  };
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const update = () => setRoute(readRoute());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  return route;
}

function ReaderPortal({ path }: { path: string }) {
  const [active, setActive] = useState(path.startsWith("reader/my-library/history") ? "Lịch sử mượn" : path.startsWith("reader/my-library") ? "Tủ sách của tôi" : "Trang chủ");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    if (path.startsWith("reader/profile")) setActive("");
    else if (path.startsWith("reader/my-library/history")) setActive("Lịch sử mượn");
    else if (path.startsWith("reader/my-library")) setActive("Tủ sách của tôi");
    else if (path.includes("search") || path === "reader/guidelines") setActive("");
    else if (path === "reader") setActive("Trang chủ");
  }, [path]);

  return (
    <div className="reader-portal">
      <header className="reader-header">
        <div className="reader-header-inner">
          <IconButton label="Mở điều hướng" icon="menu" onClick={() => setMobileOpen(true)} />
          <Brand />
          <nav className={`reader-nav ${mobileOpen ? "open" : ""}`} aria-label="Điều hướng bạn đọc">
            <div className="reader-mobile-head">
              <Brand compact />
              <IconButton label="Đóng điều hướng" icon="close" onClick={() => setMobileOpen(false)} />
            </div>
            {readerNavigation.map((item) => (
              <button
                key={item}
                className={active === item ? "active" : ""}
                onClick={() => {
                  setActive(item);
                  setMobileOpen(false);
                  if (item === "Tủ sách của tôi") window.location.hash = "#/reader/my-library";
                  else if (item === "Lịch sử mượn") window.location.hash = "#/reader/my-library/history";
                  else if (item === "Trang chủ") window.location.hash = "#/reader";
                }}
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="reader-actions">
            <SearchInput className="reader-search" placeholder="Tìm tài liệu..." />
            <span className="notification">
              <IconButton label="Thông báo" icon="bell" onClick={() => setNotificationsOpen(!notificationsOpen)} />
              <i />
              <NotificationDropdown open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
            </span>
            <UserMenu open={userOpen} onToggle={() => setUserOpen(!userOpen)} onProfile={() => { setUserOpen(false); window.location.hash = "#/reader/profile"; }} onLogout={() => { setUserOpen(false); logout(); }} role="reader" />
          </div>
        </div>
      </header>
      {mobileOpen && <button className="mobile-scrim" aria-label="Đóng điều hướng" onClick={() => setMobileOpen(false)} />}
      {path.startsWith("reader/profile") ? <PersonalProfilePage restricted={path.endsWith("/restricted")} /> : path.startsWith("reader/notifications/") ? <NotificationDetailPage notificationId={path.split("/")[2] || ""} /> : path.startsWith("reader/book-detail/review") ? <MaterialReviewPage mode={path.endsWith("/edit") ? "edit" : path.endsWith("/login-required") ? "logged-out" : path.endsWith("/error") ? "error" : "create"} /> : path === "reader/guidelines" ? <GuidelinesPage /> : path.startsWith("reader/my-library") ? <MyLibraryPage initialTab={path.endsWith("/history") ? "Lịch sử mượn" : path.endsWith("/reservations") ? "Đặt trước" : "Đang mượn"} /> : path === "reader/book-detail" ? <BookDetailPage /> : path === "reader/search" || path === "reader/search-empty" ? <SearchResultsPage empty={path === "reader/search-empty"} /> : path === "reader/content-search" || path === "reader/content-search-empty" ? <ContentSearchResultsPage empty={path === "reader/content-search-empty"} /> : active === "Trang chủ" ? <ReaderHome /> : (
        <main className="reader-main">
          <ShellPlaceholder
            role="reader"
            title={active}
            description="Không gian khám phá tri thức, tài liệu học thuật và các bộ sưu tập dành riêng cho bạn."
          />
        </main>
      )}
    </div>
  );
}

function DashboardPortal({ role, path }: { role: "staff" | "admin"; path: string }) {
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
    if (role === "staff" && label === "Lưu thông") window.location.hash = "#/staff/circulation";
    else if (role === "staff" && label === "Quản lý tài liệu") window.location.hash = "#/staff/materials";
    else if (role === "staff" && label === "Tài liệu số") window.location.hash = "#/staff/digital-processing";
    else if (role === "staff" && label === "Đặt trước") window.location.hash = "#/staff/reservations";
    else if (role === "staff" && label === "Bạn đọc") window.location.hash = "#/staff/readers";
    else if (role === "staff" && label === "Thống kê & báo cáo") window.location.hash = "#/staff/reports";
    else if (role === "staff" && label === "Tổng quan") window.location.hash = "#/staff";
    else if (label === "Thông tin cá nhân") window.location.hash = role === "staff" ? "#/staff/profile" : "#/admin/profile";
  };

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
            <UserMenu open={userOpen} onToggle={() => setUserOpen(!userOpen)} onProfile={() => { setUserOpen(false); window.location.hash = role === "staff" ? "#/staff/profile" : "#/admin/profile"; }} onLogout={() => { setUserOpen(false); logout(); }} role={role} />
          </div>
        </header>
        <main className="workspace-content-wrap">
          {active === "Thông tin cá nhân" ? <WorkProfilePage role={role} /> : isStaff && active === "Tổng quan" ? <StaffDashboard /> : isStaff && active === "Lưu thông" ? <CirculationScreen /> : isStaff && path === "staff/materials/new" ? <BibliographicRecordForm /> : isStaff && path.startsWith("staff/materials/edit/") ? <BibliographicRecordForm edit /> : isStaff && active === "Quản lý tài liệu" ? <MaterialsManagementPage /> : isStaff && active === "Tài liệu số" ? <DigitalProcessingPage /> : isStaff && active === "Đặt trước" ? <ReservationManagementPage /> : isStaff && active === "Bạn đọc" ? <ReaderManagementPage /> : isStaff && active === "Thống kê & báo cáo" ? <ReportsScreen /> : (
            <ShellPlaceholder
              role={role}
              title={active}
              description={
                isStaff
                  ? "Không gian vận hành tập trung cho các nghiệp vụ thư viện và phục vụ bạn đọc."
                  : "Không gian kiểm soát tài khoản, cấu hình và tình trạng vận hành của hệ thống."
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}

type LoginMessage =
  | { tone: "error" | "info"; text: string }
  | null;

function MicrosoftMark() {
  return <span className="microsoft-mark" aria-hidden="true"><i /><i /><i /><i /></span>;
}

function LoginPage() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ account?: string; password?: string }>({});
  const [message, setMessage] = useState<LoginMessage>(null);
  const [loading, setLoading] = useState<"library" | "microsoft" | null>(null);

  const submitLibraryLogin = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      account: account.trim() ? undefined : "Vui lòng nhập tài khoản.",
      password: password ? undefined : "Vui lòng nhập mật khẩu.",
    };
    setErrors(nextErrors);
    setMessage(null);
    if (nextErrors.account || nextErrors.password) return;
    setLoading("library");
    window.setTimeout(() => {
      setLoading(null);
      setMessage({ tone: "error", text: "Tài khoản hoặc mật khẩu không chính xác." });
    }, 800);
  };

  const startMicrosoftLogin = () => {
    setMessage(null);
    setLoading("microsoft");
    window.setTimeout(() => {
      setLoading(null);
      setMessage({ tone: "error", text: "Không thể đăng nhập bằng tài khoản Microsoft. Vui lòng thử lại hoặc sử dụng phương thức đăng nhập khác." });
    }, 800);
  };

  return (
    <div className="login-page">
      <section className="login-brand-panel" aria-label="Giới thiệu PTIT Library">
        <div className="login-brand-top"><Brand /></div>
        <div className="login-brand-content">
          <div className="login-illustration" aria-hidden="true">
            <span className="illustration-orbit orbit-one" />
            <span className="illustration-orbit orbit-two" />
            <div className="illustration-search"><Icon name="search" size={22} /></div>
            <div className="illustration-document"><Icon name="document" size={28} /><i /><i /><i /></div>
            <div className="illustration-library">
              <span><Icon name="library" size={38} /></span>
              <div><i /><i /><i /><i /></div>
            </div>
            <div className="illustration-books"><i /><i /><i /></div>
            <span className="illustration-dot dot-one" />
            <span className="illustration-dot dot-two" />
            <span className="illustration-dot dot-three" />
          </div>
          <p className="eyebrow">HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG</p>
          <h1>Khám phá tri thức.<br />Kết nối tương lai.</h1>
          <p>Truy cập nguồn tài liệu học thuật, khám phá tri thức và quản lý hoạt động thư viện trên một nền tảng duy nhất.</p>
        </div>
        <div className="login-brand-note"><Icon name="library" size={16} /><span>Thư viện số thông minh dành cho cộng đồng PTIT</span></div>
      </section>

      <section className="login-form-panel">
        <div className="login-mobile-brand"><Brand compact /></div>
        <main className="login-card">
          <div className="login-heading">
            <p className="eyebrow">ĐĂNG NHẬP HỆ THỐNG</p>
            <h2>Chào mừng đến với PTIT Library</h2>
            <p>Đăng nhập để tiếp tục sử dụng thư viện số.</p>
          </div>

          {message && <div className={`login-message ${message.tone}`} role={message.tone === "error" ? "alert" : "status"}><Icon name={message.tone === "error" ? "error" : "info"} size={18} /><span>{message.text}</span></div>}

          <form className="login-form" onSubmit={submitLibraryLogin} noValidate>
            <label className={`login-field ${errors.account ? "has-error" : ""}`}>
              <span>Tài khoản</span>
              <span className="login-input-wrap"><Icon name="users" size={18} /><input value={account} onChange={(event) => { setAccount(event.target.value); setErrors((current) => ({ ...current, account: undefined })); }} autoComplete="username" placeholder="Nhập tài khoản thư viện" aria-invalid={Boolean(errors.account)} aria-describedby={errors.account ? "account-error" : undefined} /></span>
              {errors.account && <small id="account-error"><Icon name="error" size={13} />{errors.account}</small>}
            </label>
            <label className={`login-field ${errors.password ? "has-error" : ""}`}>
              <span>Mật khẩu</span>
              <span className="login-input-wrap"><Icon name="settings" size={18} /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })); }} autoComplete="current-password" placeholder="Nhập mật khẩu" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "password-error" : undefined} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}><Icon name={showPassword ? "eye-off" : "eye"} size={18} /></button></span>
              {errors.password && <small id="password-error"><Icon name="error" size={13} />{errors.password}</small>}
            </label>
            <div className="login-options">
              <label><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Ghi nhớ đăng nhập</span></label>
              <button type="button" onClick={() => setMessage({ tone: "info", text: "Vui lòng liên hệ nhân viên thư viện để được hỗ trợ khôi phục mật khẩu." })}>Quên mật khẩu?</button>
            </div>
            <Button className="login-submit" type="submit" loading={loading === "library"} disabled={loading !== null}>Đăng nhập</Button>
            <p className="login-helper"><Icon name="info" size={14} />Tài khoản và mật khẩu ban đầu được cấp bởi nhân viên thư viện.</p>
          </form>

          <div className="login-divider"><span>HOẶC</span></div>

          <Button className="microsoft-login" variant="secondary" type="button" loading={loading === "microsoft"} disabled={loading !== null} onClick={startMicrosoftLogin}>
            {loading !== "microsoft" && <MicrosoftMark />}
            Đăng nhập bằng tài khoản Microsoft
          </Button>
          <p className="microsoft-helper">Sử dụng tài khoản Outlook do Học viện cấp để đăng nhập. Khả năng truy cập phụ thuộc vào cấu hình Microsoft của hệ thống và chính sách tài khoản của Học viện.</p>

          <div className="login-assistance">
            <span><Icon name="info" size={18} /></span>
            <div><strong>Chưa có thông tin đăng nhập?</strong><p>Vui lòng liên hệ nhân viên thư viện để được cấp tài khoản hoặc hỗ trợ truy cập.</p><button type="button">Hướng dẫn đăng nhập</button></div>
          </div>
        </main>
        <footer className="login-footer">
          <p>© PTIT Library – Học viện Công nghệ Bưu chính Viễn thông</p>
          <nav aria-label="Liên kết hỗ trợ"><button>Hướng dẫn sử dụng</button><button>Quy định thư viện</button></nav>
        </footer>
      </section>
    </div>
  );
}

export default function App() {
  const { role, path } = useRoleRoute();
  if (path === "login") return <LoginPage />;
  if (role === "staff") return <DashboardPortal role="staff" path={path} />;
  if (role === "admin") return <DashboardPortal role="admin" path={path} />;
  if (path.startsWith("reader/document")) {
    const requestedPage = Number(path.split("/")[2]) || 42;
    return <DocumentReader initialPage={requestedPage} />;
  }
  return <ReaderPortal path={path} />;
}
