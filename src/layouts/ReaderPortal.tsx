import { useState, useSyncExternalStore } from "react";
import { Link, useLocation, useNavigate, useRoutes } from "react-router-dom";
import { IconButton, SearchInput } from "../design-system";
import { readerNavigation } from "../constants/navigation";
import { logout } from "../utils/logout";
import Brand from "../components/common/Brand";
import UserMenu from "../components/common/UserMenu";
import { authSession } from "../shared/auth/auth-session";
import NotificationDropdown from "../components/notifications/NotificationDropdown";
import ReaderHome from "../pages/reader/home/ReaderHomePage";
import GuidelinesPage from "../pages/reader/guidelines/GuidelinesPage";
import SearchResultsPage from "../pages/reader/search/BookSearchPage";
import ContentSearchResultsPage from "../pages/reader/search/ContentSearchPage";
import BookDetailPage from "../pages/reader/book-detail/BookDetailPage";
import MaterialReviewPage from "../pages/reader/review/BookReviewPage";
import MyLibraryPage from "../pages/reader/my-library/MyLibraryPage";
import PersonalProfilePage from "../pages/reader/profile/PersonalProfilePage";
import NotificationDetailPage from "../pages/reader/notifications/NotificationDetailPage";

export default function ReaderPortal({ path }: { path: string }) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { session } = useSyncExternalStore(authSession.subscribe, authSession.getSnapshot);
  const isReader = session?.role === "READER";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const page = useRoutes([
    { path: "profile/*", element: <PersonalProfilePage restricted={path.endsWith("/restricted")} /> },
    { path: "notifications", element: <NotificationDetailPage key="notification-list" /> },
    { path: "notifications/:notificationId", element: <NotificationDetailPage key={path} notificationId={path.split("/")[2]} /> },
    { path: "book-detail/review/*", element: <MaterialReviewPage key={path + search} mode={path.endsWith("/edit") ? "edit" : path.endsWith("/login-required") ? "logged-out" : path.endsWith("/error") ? "error" : "create"} /> },
    { path: "guidelines", element: <GuidelinesPage /> },
    { path: "my-library/*", element: <MyLibraryPage initialTab={path.endsWith("/history") ? "Lịch sử mượn" : path.endsWith("/reservations") ? "Đặt trước" : "Đang mượn"} /> },
    { path: "book-detail", element: <BookDetailPage /> },
    { path: "search", element: <SearchResultsPage empty={false} /> },
    { path: "search-empty", element: <SearchResultsPage empty /> },
    { path: "content-search", element: <ContentSearchResultsPage empty={false} /> },
    { path: "content-search-empty", element: <ContentSearchResultsPage empty /> },
    { index: true, element: <ReaderHome /> },
  ]);

  return (
    <div className="reader-portal">
      <header className={mobileOpen ? "reader-header menu-open" : "reader-header"}>
        <div className="reader-header-inner">
          <IconButton label="Mở điều hướng" icon="menu" onClick={() => setMobileOpen(true)} />
          <Brand />
          <nav className={`reader-nav ${mobileOpen ? "open" : ""}`} aria-label="Điều hướng bạn đọc">
            <div className="reader-mobile-head">
              <Brand compact />
              <IconButton label="Đóng điều hướng" icon="close" onClick={() => setMobileOpen(false)} />
            </div>
            {readerNavigation.filter((item) => isReader || !item.path.includes("/my-library")).map((item) => {
              const active = item.path === "/" + path
                || item.path === "/reader/search" && /^reader\/(search|content-search|book-detail)/.test(path)
                || item.path === "/reader/my-library" && path === "reader/my-library/reservations";
              return <button key={item.path} className={active ? "active" : ""} aria-current={active ? "page" : undefined}
                onClick={() => { setMobileOpen(false); navigate(item.path); }}>{item.label}</button>;
            })}
          </nav>
          <div className="reader-actions">
            <form role="search" onSubmit={(event) => {
              event.preventDefault();
              const keyword = String(new FormData(event.currentTarget).get("keyword") ?? "").trim();
              navigate("/reader/search?" + new URLSearchParams({ q: keyword }));
            }}><SearchInput name="keyword" className="reader-search" placeholder="Tìm tài liệu..." /></form>
            {isReader && <span className="notification">
              <IconButton label="Thông báo" icon="bell" onClick={() => setNotificationsOpen(!notificationsOpen)} />
              <i />
              <NotificationDropdown open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
            </span>}
            {isReader && <UserMenu open={userOpen} onToggle={() => setUserOpen(!userOpen)} onProfile={() => { setUserOpen(false); navigate("/reader/profile"); }} onLogout={() => { setUserOpen(false); logout(navigate); }} role="reader" />}
            {!isReader && <Link className="btn btn-secondary" to={session ? session.role === "ADMIN" ? "/admin" : "/staff" : "/login"}>{session ? "Về cổng nghiệp vụ" : "Đăng nhập"}</Link>}
          </div>
        </div>
      </header>
      {mobileOpen && <button className="mobile-scrim" aria-label="Đóng điều hướng" onClick={() => setMobileOpen(false)} />}
      {page}
    </div>
  );
}
