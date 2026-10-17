import { useEffect, useState } from "react";
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
