import { useEffect, useState } from "react";
import { useNavigate, useRoutes } from "react-router-dom";
import { IconButton, SearchInput } from "../design-system";
import { readerNavigation } from "../constants/navigation";
import { logout } from "../utils/logout";
import Brand from "../components/common/Brand";
import UserMenu from "../components/common/UserMenu";
import ShellPlaceholder from "../components/common/ShellPlaceholder";
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

  const page = useRoutes([
    { path: "profile/*", element: <PersonalProfilePage restricted={path.endsWith("/restricted")} /> },
    { path: "notifications/:notificationId/*", element: <NotificationDetailPage notificationId={path.split("/")[2] || ""} /> },
    { path: "book-detail/review/*", element: <MaterialReviewPage mode={path.endsWith("/edit") ? "edit" : path.endsWith("/login-required") ? "logged-out" : path.endsWith("/error") ? "error" : "create"} /> },
    { path: "guidelines", element: <GuidelinesPage /> },
    { path: "my-library/*", element: <MyLibraryPage initialTab={path.endsWith("/history") ? "Lịch sử mượn" : path.endsWith("/reservations") ? "Đặt trước" : "Đang mượn"} /> },
    { path: "book-detail", element: <BookDetailPage /> },
    { path: "search", element: <SearchResultsPage empty={false} /> },
    { path: "search-empty", element: <SearchResultsPage empty /> },
    { path: "content-search", element: <ContentSearchResultsPage empty={false} /> },
    { path: "content-search-empty", element: <ContentSearchResultsPage empty /> },
    { path: "*", element: active === "Trang chủ" ? <ReaderHome /> : (
        <main className="reader-main">
          <ShellPlaceholder
            role="reader"
            title={active}
            description="Không gian khám phá tri thức, tài liệu học thuật và các bộ sưu tập dành riêng cho bạn."
          />
        </main>
      ) },
  ]);

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
                  if (item === "Tủ sách của tôi") navigate("/reader/my-library");
                  else if (item === "Lịch sử mượn") navigate("/reader/my-library/history");
                  else if (item === "Trang chủ") navigate("/reader");
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
            <UserMenu open={userOpen} onToggle={() => setUserOpen(!userOpen)} onProfile={() => { setUserOpen(false); navigate("/reader/profile"); }} onLogout={() => { setUserOpen(false); logout(navigate); }} role="reader" />
          </div>
        </div>
      </header>
      {mobileOpen && <button className="mobile-scrim" aria-label="Đóng điều hướng" onClick={() => setMobileOpen(false)} />}
      {page}
    </div>
  );
}
