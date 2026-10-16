import { useEffect, useState } from "react";
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Dropdown,
  Field,
  Icon,
  IconButton,
  Modal,
  Pagination,
  Rating,
  SearchInput,
  SelectField,
  Skeleton,
  Status,
  TextAreaField,
  Toast,
} from "./design-system";
import type { Role, Book } from "./types/library";
import { readerNavigation } from "./constants/navigation";
import { libraryTabs, circulationTabs, trainingPrograms, pipelineSteps } from "./constants/library-options";
import { detailBook } from "./data/books";
import { loanBooks, reservedBooks, shelfGroups, loanHistory } from "./data/my-library";
import { libraryNotifications } from "./data/notifications";
import { workProfileData } from "./data/profiles";
import { staffSummary, circulationData } from "./data/dashboard";
import type { CatalogRecord } from "./data/catalog";
import { catalogRecords } from "./data/catalog";
import type { ProcessingJob } from "./data/processing-jobs";
import { initialProcessingJobs } from "./data/processing-jobs";
import { initialReservationGroups } from "./data/reservations";
import { initialManagedReaders } from "./data/readers";
import { logout } from "./utils/logout";
import Brand from "./components/common/Brand";
import UserMenu from "./components/common/UserMenu";
import ShellPlaceholder from "./components/common/ShellPlaceholder";
import BookCover from "./components/books/BookCover";
import LibraryListCard from "./components/books/LibraryListCard";
import NotificationDropdown from "./components/notifications/NotificationDropdown";
import WorkspaceSidebar from "./layouts/WorkspaceSidebar";
import ReaderHome from "./pages/reader/home/ReaderHomePage";
import GuidelinesPage from "./pages/reader/guidelines/GuidelinesPage";
import SearchResultsPage from "./pages/reader/search/BookSearchPage";
import ContentSearchResultsPage from "./pages/reader/search/ContentSearchPage";
import BookDetailPage from "./pages/reader/book-detail/BookDetailPage";
import MaterialReviewPage from "./pages/reader/review/BookReviewPage";
import DocumentReader from "./pages/reader/document/DocumentPage";

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

function LoanCard({ loan }: { loan: typeof loanBooks[number] }) {
  const overdue = loan.days < 0;
  return (
    <LibraryListCard
      book={loan}
      badge={loan.type}
      badgeTone={overdue ? "error" : "neutral"}
      status={overdue ? `Quá hạn ${Math.abs(loan.days)} ngày` : `Còn ${loan.days} ngày`}
      statusHint={overdue ? "Cần trả ngay" : "Thời gian còn lại"}
      statusTone={overdue ? "error" : loan.days <= 5 ? "warning" : "success"}
      details={[
        { label: "Ngày mượn", value: loan.borrowed },
        { label: "Hạn trả", value: loan.due },
        { label: "Gia hạn", value: <Status tone={loan.renewable ? "success" : "error"}>{loan.renewable ? "Có thể gia hạn" : "Không thể gia hạn"}</Status> },
      ]}
      actions={<><Button size="sm" disabled={!loan.renewable}>Gia hạn tài liệu</Button><Button variant="ghost" size="sm">Xem chi tiết</Button></>}
    />
  );
}

function PersonalShelf({ group }: { group: string }) {
  const books = shelfGroups[group] || [];
  const [saved, setSaved] = useState<number[]>(books.map((book) => book.id));
  const status = group === "Muốn đọc" ? "Đã lưu" : group === "Đang đọc" ? "Đang đọc dở" : "Đã hoàn thành";
  const statusHint = group === "Muốn đọc" ? "Trong danh sách cá nhân" : group === "Đang đọc" ? "Tiếp tục từ lần gần nhất" : "Đã đọc toàn bộ";
  return (
    <div className="personal-shelf">
      <div className="shelf-toolbar"><p><strong>{books.length} tài liệu</strong> trong danh sách “{group}”</p><Button variant="secondary" size="sm" icon="plus">Thêm tài liệu</Button></div>
      <div className="loan-list">{books.map((book, index) => (
        <LibraryListCard
          key={book.id}
          book={book}
          badge={book.type}
          badgeTone={group === "Đã đọc" ? "success" : group === "Đang đọc" ? "info" : "brand"}
          status={status}
          statusHint={statusHint}
          statusTone={group === "Đã đọc" ? "success" : "info"}
          details={[
            { label: "Năm xuất bản", value: book.year },
            { label: "Định dạng", value: book.type === "Tài liệu số" ? "Tài liệu số" : "Bản in" },
            { label: group === "Đang đọc" ? "Tiến độ đọc" : "Đánh giá", value: group === "Đang đọc" ? `${42 + index * 23}% hoàn thành` : <Rating value={book.rating} /> },
          ]}
          actions={<><Button size="sm">{group === "Đang đọc" ? "Tiếp tục đọc" : group === "Đã đọc" ? "Đọc lại" : "Xem chi tiết"}</Button><Button variant="ghost" size="sm" icon="bookmark" onClick={() => setSaved((items) => items.filter((item) => item !== book.id))}>{saved.includes(book.id) ? "Bỏ khỏi danh sách" : "Đã xóa"}</Button></>}
        />
      ))}</div>
    </div>
  );
}

function MyLibraryPage({ initialTab = "Đang mượn" }: { initialTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [reservations, setReservations] = useState(reservedBooks);

  useEffect(() => setActiveTab(initialTab), [initialTab]);

  return (
    <div className="my-library-page">
      <main className="my-library-container">
        <Breadcrumb items={["Trang chủ", "Thư viện của tôi"]} />
        <div className="my-library-heading">
          <div><p className="eyebrow">KHÔNG GIAN CÁ NHÂN</p><h1>Thư viện của tôi</h1><p>Theo dõi tài liệu đang mượn, lượt đặt trước và các bộ sưu tập cá nhân của bạn.</p></div>
          <Button variant="secondary" icon="search" onClick={() => { window.location.hash = "#/reader/search"; }}>Tìm thêm tài liệu</Button>
        </div>

        <section className="library-summary-grid" aria-label="Tổng quan tài khoản thư viện">
          <article><span className="summary-icon summary-brand"><Icon name="book" /></span><div><small>Đang mượn</small><strong>03</strong><p>3 tài liệu đang lưu thông</p></div></article>
          <article><span className="summary-icon summary-warning"><Icon name="info" /></span><div><small>Sắp đến hạn</small><strong>02</strong><p>1 tài liệu đã quá hạn</p></div></article>
          <article><span className="summary-icon summary-info"><Icon name="bookmark" /></span><div><small>Đặt trước</small><strong>02</strong><p>1 tài liệu chờ nhận</p></div></article>
          <article><span className="summary-icon summary-error"><Icon name="error" /></span><div><small>Công nợ</small><strong>20.000đ</strong><p>Cần hoàn tất thanh toán</p></div></article>
        </section>

        <div className="library-tabs" role="tablist">
          {libraryTabs.map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab}{tab === "Đang mượn" && <span>3</span>}{tab === "Đặt trước" && <span>2</span>}</button>)}
        </div>

        {activeTab === "Đang mượn" && (
          <div className="library-tab-content">
            <div className="tab-content-heading"><div><h2>Tài liệu đang mượn</h2><p>Kiểm tra thời hạn và gia hạn các tài liệu đủ điều kiện.</p></div><Badge tone="warning">01 TÀI LIỆU QUÁ HẠN</Badge></div>
            <div className="loan-list">{loanBooks.map((loan) => <LoanCard key={loan.id} loan={loan} />)}</div>
            <section className="debt-section">
              <div className="debt-heading"><span><Icon name="error" /></span><div><h2>Công nợ thư viện</h2><p>Các khoản phí chưa hoàn tất trong tài khoản của bạn.</p></div><strong>20.000đ</strong></div>
              <div className="debt-row"><div><Badge tone="error">CHƯA THANH TOÁN</Badge><strong>Phí quá hạn tài liệu</strong><small>Phát sinh từ “Mạng máy tính và hệ thống phân tán” · 3 ngày quá hạn</small></div><div><span>20.000đ</span><Button variant="secondary" size="sm">Xem hướng dẫn thanh toán</Button></div></div>
              <p className="debt-note"><Icon name="info" size={14} />Vui lòng thanh toán tại quầy lưu thông. Một số chức năng mượn và gia hạn có thể bị giới hạn khi còn công nợ.</p>
            </section>
          </div>
        )}

        {activeTab === "Lịch sử mượn" && (
          <div className="library-tab-content">
            <div className="tab-content-heading"><div><h2>Lịch sử mượn</h2><p>Các tài liệu bạn đã mượn và hoàn trả trong 12 tháng gần đây.</p></div><Button variant="secondary" size="sm">Xuất lịch sử</Button></div>
            <div className="loan-list">{loanHistory.map((item) => (
              <LibraryListCard
                key={item.id}
                book={item}
                badge={item.type}
                badgeTone={item.returnStatus.includes("muộn") ? "warning" : "success"}
                status={item.returnStatus}
                statusHint="Đã hoàn tất lượt mượn"
                statusTone={item.returnStatus.includes("muộn") ? "warning" : "success"}
                details={[
                  { label: "Ngày mượn", value: item.borrowed },
                  { label: "Ngày trả", value: item.returned },
                  { label: "Đánh giá", value: item.historyRating ? <Rating value={item.historyRating} /> : "Chưa đánh giá" },
                ]}
                actions={<><Button variant="secondary" size="sm">{item.historyRating ? "Xem chi tiết" : "Đánh giá tài liệu"}</Button><Button variant="ghost" size="sm">Mượn lại</Button></>}
              />
            ))}</div>
          </div>
        )}

        {activeTab === "Đặt trước" && (
          <div className="library-tab-content">
            <div className="tab-content-heading"><div><h2>Tài liệu đã đặt trước</h2><p>Theo dõi vị trí hàng chờ và thời hạn nhận tài liệu.</p></div></div>
            <div className="loan-list">{reservations.map((reservation) => (
              <LibraryListCard
                key={reservation.id}
                book={reservation}
                badge={reservation.type}
                badgeTone={reservation.status === "Chờ nhận" ? "success" : "warning"}
                status={reservation.status}
                statusHint={reservation.status === "Chờ nhận" ? "Tài liệu đã sẵn sàng" : `Vị trí hàng chờ: ${reservation.position}`}
                statusTone={reservation.status === "Chờ nhận" ? "success" : "warning"}
                details={[
                  { label: "Vị trí hàng chờ", value: reservation.position },
                  { label: "Ngày đặt trước", value: reservation.reserved },
                  { label: "Hạn nhận tài liệu", value: reservation.expiration },
                ]}
                actions={<><Button size="sm" disabled={reservation.status !== "Chờ nhận"}>Xem thông tin nhận</Button><Button variant="ghost" size="sm" onClick={() => setReservations((items) => items.filter((item) => item.id !== reservation.id))}>Hủy đặt trước</Button></>}
              />
            ))}</div>
          </div>
        )}

        {["Muốn đọc", "Đang đọc", "Đã đọc"].includes(activeTab) && (
          <div className="library-tab-content">
            <div className="tab-content-heading"><div><h2>{activeTab}</h2><p>{activeTab === "Muốn đọc" ? "Các tài liệu bạn đã lưu để khám phá sau." : activeTab === "Đang đọc" ? "Các tài liệu số bạn đang đọc dở." : "Các tài liệu bạn đã hoàn thành."}</p></div></div>
            <PersonalShelf group={activeTab} />
          </div>
        )}
      </main>
    </div>
  );
}

const profileInitialContact = {
  phone: "09xx xxx 123",
  address: "Hà Nội",
};

function PersonalProfilePage({ restricted = false }: { restricted?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [contact, setContact] = useState(profileInitialContact);
  const [draft, setDraft] = useState(profileInitialContact);
  const [errors, setErrors] = useState<{ phone?: string; address?: string }>({});
  const [toast, setToast] = useState(false);

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
  const saveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      phone: draft.phone.trim() ? undefined : "Vui lòng nhập số điện thoại.",
      address: draft.address.trim() ? undefined : "Vui lòng nhập địa chỉ.",
    };
    setErrors(nextErrors);
    if (nextErrors.phone || nextErrors.address) return;
    setContact(draft);
    setEditing(false);
    setToast(true);
    window.setTimeout(() => setToast(false), 3000);
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
          <Avatar name="Nguyễn Minh Anh" size="lg" />
          <div className="profile-summary-identity"><h2>Nguyễn Minh Anh</h2><p>Mã độc giả <strong>PTIT-202600128</strong></p></div>
          <div className="profile-summary-meta"><span><small>Loại độc giả</small><strong>Sinh viên</strong></span><span><small>Khoa / Chương trình</small><strong>Công nghệ thông tin</strong></span></div>
          <Badge tone={restricted ? "error" : "success"}><Status tone={restricted ? "error" : "success"}>{restricted ? "Đang bị khóa" : "Đang hoạt động"}</Status></Badge>
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
                  <Field label="Họ và tên" value="Nguyễn Minh Anh" readOnly />
                  <Field label="Mã độc giả" value="PTIT-202600128" readOnly />
                  <Field label="Ngày sinh" value="15/08/2004" readOnly />
                  <Field label="Giới tính" value="Không hiển thị" readOnly />
                  <Field label="Email" value="minhanh@example.edu.vn" readOnly />
                  <Field label="Số điện thoại" value={editing ? draft.phone : contact.phone} readOnly={!editing} onChange={(event) => { setDraft((current) => ({ ...current, phone: event.target.value })); setErrors((current) => ({ ...current, phone: undefined })); }} error={errors.phone} />
                  <Field label="Địa chỉ" value={editing ? draft.address : contact.address} readOnly={!editing} onChange={(event) => { setDraft((current) => ({ ...current, address: event.target.value })); setErrors((current) => ({ ...current, address: undefined })); }} error={errors.address} />
                  <Field label="Khoa / Chương trình đào tạo" value="Công nghệ thông tin" readOnly />
                  <Field label="Loại độc giả" value="Sinh viên" readOnly />
                </div>
                <p className="profile-permission-note"><Icon name="info" size={14} />Chỉ số điện thoại và địa chỉ có thể được cập nhật. Các thông tin còn lại do Học viện và thư viện quản lý.</p>
                {editing && <div className="profile-form-actions"><Button variant="ghost" type="button" onClick={cancelEditing}>Hủy</Button><Button type="submit">Lưu thay đổi</Button></div>}
              </form>
            </section>

            <section className="profile-card">
              <header className="profile-card-heading"><div><span><Icon name="settings" size={18} /></span><div><h2>Thông tin đăng nhập</h2><p>Phương thức xác thực đang được sử dụng cho tài khoản.</p></div></div></header>
              <dl className="profile-login-details">
                <div><dt>Tên tài khoản</dt><dd>minh.anh</dd></div>
                <div><dt>Phương thức đăng nhập</dt><dd><Badge tone="brand">Tài khoản thư viện</Badge></dd></div>
                <div><dt>Email liên kết</dt><dd>minhanh@example.edu.vn</dd></div>
                <div><dt>Mật khẩu</dt><dd><span className="masked-password" aria-label="Mật khẩu đã được ẩn">••••••••••••</span></dd></div>
              </dl>
              <div className="profile-login-action"><Button variant="secondary" size="sm">Đổi mật khẩu</Button><p>Mật khẩu hiện tại luôn được bảo mật và không thể hiển thị.</p></div>
            </section>

            <section className="profile-card recent-activity-card">
              <header className="profile-card-heading"><div><span><Icon name="document" size={18} /></span><div><h2>Hoạt động gần đây</h2><p>Một số giao dịch thư viện gần nhất của bạn.</p></div></div><Button variant="ghost" size="sm" onClick={() => { window.location.hash = "#/reader/my-library/history"; }}>Xem lịch sử mượn trả<Icon name="chevron-right" size={15} /></Button></header>
              <div className="profile-activity-list">
                <article><span className="activity-icon borrow"><Icon name="book" size={17} /></span><div><strong>Mượn tài liệu</strong><p>Nhập môn học máy</p></div><time>12/06/2026</time><Badge tone="success">Đang mượn</Badge></article>
                <article><span className="activity-icon returned"><Icon name="success" size={17} /></span><div><strong>Trả tài liệu</strong><p>Cơ sở dữ liệu</p></div><time>08/06/2026</time><Badge tone="neutral">Đã trả</Badge></article>
                <article><span className="activity-icon reserved"><Icon name="bookmark" size={17} /></span><div><strong>Đặt trước</strong><p>Trí tuệ nhân tạo – Cơ sở và ứng dụng</p></div><time>02/06/2026</time><Badge tone="warning">Đang chờ</Badge></article>
              </div>
            </section>
          </div>

          <aside className="profile-side-column">
            <section className="profile-card library-card-panel">
              <header className="profile-card-heading"><div><span><Icon name="library" size={18} /></span><div><h2>Thẻ thư viện</h2><p>Thông tin thẻ bạn đọc hiện tại.</p></div></div></header>
              <div className="reader-card-visual">
                <div><Brand compact /><Badge tone={restricted ? "error" : "success"}>{restricted ? "BỊ KHÓA" : "ĐANG HOẠT ĐỘNG"}</Badge></div>
                <span>THẺ BẠN ĐỌC</span>
                <strong>NGUYỄN MINH ANH</strong>
                <p>PTIT-202600128</p>
                <small>SINH VIÊN · CÔNG NGHỆ THÔNG TIN</small>
              </div>
              <dl className="reader-card-details">
                <div><dt>Mã thẻ</dt><dd>PTIT-202600128</dd></div>
                <div><dt>Loại độc giả</dt><dd>Sinh viên</dd></div>
                <div><dt>Trạng thái thẻ</dt><dd><Status tone={restricted ? "error" : "success"}>{restricted ? "Đang bị khóa" : "Đang hoạt động"}</Status></dd></div>
                <div><dt>Ngày cấp thẻ</dt><dd>01/09/2026</dd></div>
                <div><dt>Ngày hết hạn</dt><dd>Chưa xác định</dd></div>
              </dl>
              <p className="library-card-note"><Icon name="info" size={14} />Thông tin thẻ được quản lý bởi thư viện. Vui lòng liên hệ nhân viên thư viện nếu cần điều chỉnh thông tin thẻ.</p>
            </section>

            <section className={`profile-card account-status-card ${restricted ? "restricted" : ""}`}>
              <span className="account-status-icon"><Icon name={restricted ? "error" : "success"} size={23} /></span>
              <p className="eyebrow">TRẠNG THÁI TÀI KHOẢN</p>
              <h2>{restricted ? "Thẻ thư viện đang bị khóa" : "Đang hoạt động"}</h2>
              <p>{restricted ? "Tài khoản hiện không thể thực hiện các giao dịch mượn hoặc đặt trước tài liệu. Vui lòng liên hệ nhân viên thư viện để được hỗ trợ." : "Tài khoản hiện có thể sử dụng các chức năng thư viện theo quyền được cấp."}</p>
              {restricted && <div className="restricted-note"><Icon name="info" size={15} />Tài khoản đang bị hạn chế. Vui lòng liên hệ nhân viên thư viện.</div>}
            </section>
          </aside>
        </div>
      </main>
      {toast && <div className="toast-position"><Toast title="Cập nhật thành công" onClose={() => setToast(false)}>Thông tin cá nhân đã được cập nhật.</Toast></div>}
    </div>
  );
}

function NotificationDetailPage({ notificationId }: { notificationId: string }) {
  const notification = libraryNotifications[notificationId];
  const [read, setRead] = useState(notification ? !notification.unread : true);
  const [loadState, setLoadState] = useState<"ready" | "loading" | "error">(notificationId === "loading" ? "loading" : notificationId === "error" ? "error" : "ready");

  useEffect(() => {
    if (!notification?.unread) return;
    const timer = window.setTimeout(() => setRead(true), 350);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const retry = () => {
    setLoadState("loading");
    window.setTimeout(() => setLoadState(notification ? "ready" : "error"), 700);
  };

  if (loadState === "loading") {
    return <div className="notification-detail-page"><main className="notification-detail-container"><div className="notification-skeleton"><Skeleton className="notification-skeleton-line short" /><Skeleton className="notification-skeleton-line title" /><Skeleton className="notification-skeleton-card" /><Skeleton className="notification-skeleton-card tall" /></div></main></div>;
  }
  if (loadState === "error") {
    return <div className="notification-detail-page"><main className="notification-detail-container"><div className="notification-state"><span className="error"><Icon name="error" size={28} /></span><h1>Không thể tải thông báo</h1><p>Đã xảy ra lỗi khi tải dữ liệu. Vui lòng kiểm tra kết nối và thử lại.</p><Button variant="secondary" onClick={retry}>Thử lại</Button></div></main></div>;
  }
  if (!notification) {
    return <div className="notification-detail-page"><main className="notification-detail-container"><div className="notification-state"><span><Icon name="info" size={28} /></span><h1>Không tìm thấy thông báo</h1><p>Thông báo không tồn tại hoặc bạn không có quyền truy cập nội dung này.</p><Button variant="secondary" onClick={() => { window.location.hash = "#/reader"; }}>Quay lại trang chủ</Button></div></main></div>;
  }

  return (
    <div className="notification-detail-page">
      <main className="notification-detail-container">
        <Breadcrumb items={["Trang chủ", "Thông báo", "Chi tiết thông báo"]} />
        <button className="back-notifications" onClick={() => window.history.back()}><Icon name="arrow-left" size={16} />Tất cả thông báo</button>
        <div className="notification-page-heading">
          <div><p className="eyebrow">TRUNG TÂM THÔNG BÁO</p><h1>Chi tiết thông báo</h1></div>
          <div><Badge tone={read ? "neutral" : "brand"}>{read ? "ĐÃ ĐỌC" : "CHƯA ĐỌC"}</Badge><span>{notification.sentAt}</span></div>
        </div>

        <article className={`notification-detail-card ${notification.unread && !read ? "unread" : ""}`}>
          <header>
            <span className={`notification-detail-icon ${notification.tone}`}><Icon name={notification.icon} size={24} /></span>
            <div><Badge tone={notification.tone}>{notification.category}</Badge><h2>{notification.title}</h2><p>Gửi lúc {notification.sentAt} · {notification.relativeTime}</p></div>
            {notification.unread && !read && <i className="unread-dot" aria-label="Chưa đọc" />}
          </header>
          <div className="notification-detail-body">
            {notification.expired && <div className="expired-notice"><Icon name="info" size={17} /><div><strong>Thông báo đã hết hiệu lực</strong><p>Hành động liên quan không còn khả dụng.</p></div></div>}
            <p>{notification.intro}</p>
            <section><h3>Thông tin chi tiết</h3><dl>{notification.details.map((detail) => <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl></section>
            <p className="notification-sample-note"><Icon name="info" size={14} />Thông tin trên là dữ liệu mẫu dùng để minh họa giao diện.</p>
          </div>
          {notification.actionLabel && !notification.expired && <footer><Button onClick={() => { window.location.hash = notification.actionPath || "#/reader"; }}>{notification.actionLabel}</Button><Button variant="ghost" onClick={() => window.history.back()}>Quay lại</Button></footer>}
        </article>

        <section className="notification-related">
          <header><span><Icon name="document" size={18} /></span><div><h2>Thông tin liên quan</h2><p>Đối tượng được đề cập trong thông báo này.</p></div></header>
          <div><div><strong>{notification.relatedTitle}</strong><span>{notification.relatedSubtitle}</span></div><Badge tone={notification.expired ? "neutral" : notification.tone}>{notification.details.find((detail) => detail.label.includes("Trạng thái"))?.value || notification.category}</Badge></div>
        </section>
      </main>
    </div>
  );
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

function CirculationChart() {
  const max = 200;
  return (
    <div className="circulation-chart">
      <div className="chart-y-axis"><span>200</span><span>150</span><span>100</span><span>50</span><span>0</span></div>
      <div className="chart-plot">
        <div className="chart-grid"><i /><i /><i /><i /><i /></div>
        <div className="chart-columns">
          {circulationData.map((item) => (
            <div className="chart-day" key={item.day}>
              <div className="chart-bars">
                <span className={`bar bar-borrowed h-${Math.round(item.borrowed / max * 10)}`} title={`${item.borrowed} lượt mượn`} />
                <span className={`bar bar-returned h-${Math.round(item.returned / max * 10)}`} title={`${item.returned} lượt trả`} />
                <span className={`bar bar-overdue h-${Math.max(1, Math.round(item.overdue / max * 10))}`} title={`${item.overdue} quá hạn`} />
              </div>
              <small>{item.day}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReaderInformationCard() {
  return (
    <section className="circulation-reader-card">
      <div className="reader-card-identity">
        <Avatar name="Trần Minh Quân" size="lg" />
        <div><Badge tone="success">THẺ ĐANG HOẠT ĐỘNG</Badge><h2>Trần Minh Quân</h2><p>CT050145 · Sinh viên hệ chính quy</p></div>
      </div>
      <dl>
        <div><dt>Mã bạn đọc</dt><dd>CT050145</dd></div>
        <div><dt>Loại bạn đọc</dt><dd>Sinh viên chính quy</dd></div>
        <div><dt>Ngành</dt><dd>Công nghệ thông tin</dd></div>
        <div><dt>Trạng thái thẻ</dt><dd><Status tone="success">Hoạt động</Status></dd></div>
        <div><dt>Đang mượn</dt><dd><strong>06 cuốn</strong></dd></div>
        <div><dt>Hạn mức</dt><dd>08 cuốn</dd></div>
        <div><dt>Công nợ</dt><dd><strong className="debt-value">20.000đ</strong></dd></div>
      </dl>
      <Button variant="ghost" size="sm">Xem hồ sơ bạn đọc</Button>
    </section>
  );
}

function ValidationPanel() {
  return (
    <section className="validation-panel">
      <div className="validation-heading"><div><p className="eyebrow">KIỂM TRA TỰ ĐỘNG</p><h2>Điều kiện lưu thông</h2></div><Badge tone="warning">2 CẢNH BÁO</Badge></div>
      <div className="validation-list">
        <div className="passed"><Icon name="success" /><span><strong>Trạng thái thẻ</strong><small>Thẻ đang hoạt động, không bị khóa</small></span><Badge tone="success">HỢP LỆ</Badge></div>
        <div className="warning"><Icon name="error" /><span><strong>Công nợ bạn đọc</strong><small>Còn công nợ quá hạn cần xử lý</small></span><Badge tone="warning">20.000đ</Badge></div>
        <div className="passed"><Icon name="success" /><span><strong>Hạn mức mượn</strong><small>Sau giao dịch: 08 / 08 cuốn</small></span><Badge tone="success">TRONG HẠN MỨC</Badge></div>
        <div className="passed"><Icon name="success" /><span><strong>Quyền mượn về</strong><small>Các tài liệu đã quét được phép mượn về</small></span><Badge tone="success">HỢP LỆ</Badge></div>
        <div className="warning"><Icon name="bookmark" /><span><strong>Trạng thái đặt trước</strong><small>01 tài liệu đang được giữ cho bạn đọc khác</small></span><Badge tone="error">CẦN KIỂM TRA</Badge></div>
      </div>
      <div className="validation-blocked-example"><Icon name="info" size={15} /><span>Hệ thống sẽ chặn xác nhận nếu thẻ bị khóa, vượt hạn mức hoặc tài liệu không được phép mượn về.</span></div>
    </section>
  );
}

function LoanTransaction({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div className="circulation-transaction-grid">
      <div className="transaction-main">
        <div className="transaction-scan">
          <div><p className="eyebrow">QUÉT TÀI LIỆU</p><h2>Thêm tài liệu cho mượn</h2><p>Quét hoặc nhập mã cá biệt để thêm vào giao dịch.</p></div>
          <div className="scan-input"><Icon name="book" /><input placeholder="Nhập mã cá biệt, ví dụ: PTIT-24-01842" aria-label="Mã cá biệt" /><Button>Thêm tài liệu</Button></div>
        </div>
        <section className="transaction-table-panel">
          <div className="transaction-panel-heading"><div><h2>Danh sách cho mượn</h2><p>02 tài liệu trong giao dịch</p></div><button>Xóa tất cả</button></div>
          <div className="transaction-table-wrap"><table className="transaction-table"><thead><tr><th>Tài liệu</th><th>Mã cá biệt</th><th>Ngày mượn</th><th>Hạn trả</th><th>Tình trạng</th><th /></tr></thead><tbody>
            <tr><td><div className="transaction-book"><span><Icon name="book" /></span><div><strong>Nhập môn Trí tuệ nhân tạo</strong><small>Nguyễn Thanh Thủy · 2024</small></div></div></td><td><code>PTIT-24-01842</code></td><td>22/06/2025</td><td><strong>19/11/2025</strong><small>150 ngày</small></td><td><Status tone="success">Được phép mượn</Status></td><td><IconButton label="Xóa" icon="close" /></td></tr>
            <tr className="transaction-warning-row"><td><div className="transaction-book"><span><Icon name="book" /></span><div><strong>Cấu trúc dữ liệu và giải thuật</strong><small>Nguyễn Đức Nghĩa · 2023</small></div></div></td><td><code>PTIT-23-01108</code></td><td>22/06/2025</td><td><strong>19/11/2025</strong><small>150 ngày</small></td><td><Status tone="warning">Có lượt đặt trước</Status></td><td><IconButton label="Xóa" icon="close" /></td></tr>
          </tbody></table></div>
          <div className="transaction-footer"><div><span>Tổng tài liệu</span><strong>02 cuốn</strong><small>Sau giao dịch: 08 / 08 cuốn</small></div><Button icon="success" onClick={onConfirm}>Xác nhận cho mượn</Button></div>
        </section>
      </div>
      <ValidationPanel />
    </div>
  );
}

function ReturnTransaction({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div className="return-transaction">
      <div className="transaction-scan">
        <div><p className="eyebrow">NHẬN TRẢ TÀI LIỆU</p><h2>Quét tài liệu hoàn trả</h2><p>Hệ thống tự động đối chiếu giao dịch và tính phí quá hạn.</p></div>
        <div className="scan-input"><Icon name="book" /><input placeholder="Quét mã cá biệt cần nhận trả..." aria-label="Mã cá biệt nhận trả" /><Button>Kiểm tra</Button></div>
      </div>
      <section className="return-card">
        <div className="return-book-heading"><div className="transaction-book"><span><Icon name="book" /></span><div><Badge tone="error">QUÁ HẠN 3 NGÀY</Badge><h2>Mạng máy tính và hệ thống phân tán</h2><p>Lê Nhật Quang · PTIT-24-02016</p></div></div><strong>20.000đ</strong></div>
        <div className="return-details-grid">
          <Field label="Ngày trả" type="date" defaultValue="2025-06-22" />
          <SelectField label="Tình trạng tài liệu khi trả" defaultValue="good"><option value="good">Tốt — không hư hỏng</option><option value="light">Hư hỏng nhẹ</option><option value="heavy">Hư hỏng nặng</option><option value="lost">Mất tài liệu</option></SelectField>
          <Field label="Tiền phạt quá hạn" defaultValue="20.000đ" readOnly />
          <SelectField label="Hư hỏng / mất" defaultValue="none"><option value="none">Không phát sinh</option><option value="damage">Lập biên bản hư hỏng</option><option value="lost">Lập biên bản mất tài liệu</option></SelectField>
        </div>
        <div className="return-debt-summary"><div><Icon name="error" /><span><strong>Công nợ phát sinh</strong><small>Phí trả muộn: 2.000đ/cuốn/ngày · Phí tồn trước đó: 14.000đ</small></span></div><strong>20.000đ</strong></div>
        <label className="staff-checkbox"><input type="checkbox" /><span>Bạn đọc thanh toán công nợ ngay tại quầy</span></label>
        <div className="return-actions"><Button variant="ghost">Hủy giao dịch</Button><Button icon="success" onClick={onConfirm}>Nhận trả</Button></div>
      </section>
    </div>
  );
}

function RenewalTransaction({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div className="renewal-transaction">
      <section className="transaction-table-panel">
        <div className="transaction-panel-heading"><div><h2>Tài liệu đang mượn</h2><p>Chọn các tài liệu đủ điều kiện để gia hạn.</p></div><Badge tone="info">06 TÀI LIỆU</Badge></div>
        <div className="transaction-table-wrap"><table className="transaction-table renewal-table"><thead><tr><th><input type="checkbox" aria-label="Chọn tất cả" /></th><th>Tài liệu</th><th>Ngày mượn</th><th>Hạn trả hiện tại</th><th>Hạn trả mới</th><th>Điều kiện</th></tr></thead><tbody>
          <tr><td><input type="checkbox" defaultChecked aria-label="Chọn tài liệu" /></td><td><div className="transaction-book"><span><Icon name="book" /></span><div><strong>Nhập môn Khoa học dữ liệu</strong><small>PTIT-23-01564</small></div></div></td><td>08/06/2025</td><td>06/07/2025</td><td><strong className="new-due-date">03/08/2025</strong></td><td><Status tone="success">Có thể gia hạn</Status></td></tr>
          <tr><td><input type="checkbox" disabled aria-label="Không thể chọn" /></td><td><div className="transaction-book"><span><Icon name="book" /></span><div><strong>Mạng máy tính và hệ thống phân tán</strong><small>PTIT-24-02016</small></div></div></td><td>28/05/2025</td><td><strong className="overdue-date">25/06/2025</strong></td><td>—</td><td><Status tone="error">Đang quá hạn</Status></td></tr>
          <tr><td><input type="checkbox" disabled aria-label="Không thể chọn" /></td><td><div className="transaction-book"><span><Icon name="book" /></span><div><strong>Cấu trúc dữ liệu và giải thuật</strong><small>PTIT-23-01108</small></div></div></td><td>12/06/2025</td><td>10/07/2025</td><td>—</td><td><Status tone="warning">Có người đặt trước</Status></td></tr>
        </tbody></table></div>
        <div className="transaction-footer"><div><span>Đã chọn</span><strong>01 tài liệu</strong><small>Thời hạn gia hạn: 28 ngày</small></div><Button icon="success" onClick={onConfirm}>Gia hạn</Button></div>
      </section>
    </div>
  );
}

function CirculationScreen() {
  const [activeTab, setActiveTab] = useState("Cho mượn");
  const [searchType, setSearchType] = useState("Mã bạn đọc");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const actionLabel = confirmation === "loan" ? "Xác nhận cho mượn" : confirmation === "return" ? "Xác nhận nhận trả" : "Xác nhận gia hạn";

  return (
    <div className="circulation-screen">
      <div className="circulation-page-heading"><div><Breadcrumb items={["Không gian nghiệp vụ", "Lưu thông"]} /><p className="eyebrow">NGHIỆP VỤ LƯU THÔNG</p><h1>Lưu thông tài liệu</h1><p>Cho mượn, nhận trả và gia hạn tài liệu tại quầy.</p></div><Badge tone="success"><Status tone="success">Quầy 01 đang hoạt động</Status></Badge></div>
      <div className="circulation-tabs" role="tablist">{circulationTabs.map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)} role="tab" aria-selected={activeTab === tab}>{tab === "Cho mượn" ? <Icon name="book" /> : tab === "Nhận trả" ? <Icon name="arrow-left" /> : <Icon name="sparkle" />}{tab}</button>)}</div>
      <section className="circulation-search-area">
        <div className="search-type-tabs">{["Mã bạn đọc", "Mã cá biệt", "Tên bạn đọc"].map((type) => <button key={type} className={searchType === type ? "active" : ""} onClick={() => setSearchType(type)}>{type}</button>)}</div>
        <div className="staff-reader-search"><SearchInput placeholder={searchType === "Mã bạn đọc" ? "Nhập hoặc quét mã bạn đọc..." : searchType === "Mã cá biệt" ? "Nhập mã cá biệt..." : "Nhập họ tên bạn đọc..."} /><Button icon="search">Tìm bạn đọc</Button></div>
        <span><Icon name="info" size={14} />Có thể sử dụng máy quét mã vạch tại quầy</span>
      </section>
      <ReaderInformationCard />
      <div className="circulation-content">
        {activeTab === "Cho mượn" && <LoanTransaction onConfirm={() => setConfirmation("loan")} />}
        {activeTab === "Nhận trả" && <ReturnTransaction onConfirm={() => setConfirmation("return")} />}
        {activeTab === "Gia hạn" && <RenewalTransaction onConfirm={() => setConfirmation("renew")} />}
      </div>
      <Modal open={confirmation !== null} onClose={() => setConfirmation(null)} title={actionLabel}>
        <div className="transaction-confirmation">
          <span><Icon name={confirmation === "return" ? "arrow-left" : confirmation === "renew" ? "sparkle" : "book"} size={25} /></span>
          <div><strong>{confirmation === "loan" ? "Cho mượn 02 tài liệu cho Trần Minh Quân?" : confirmation === "return" ? "Xác nhận đã nhận trả tài liệu?" : "Gia hạn 01 tài liệu thêm 28 ngày?"}</strong><p>{confirmation === "loan" ? "Giao dịch sẽ cập nhật hạn mức lên 08/08 cuốn. Vui lòng xác nhận đã kiểm tra cảnh báo đặt trước." : confirmation === "return" ? "Tài liệu sẽ được chuyển về trạng thái có sẵn và ghi nhận công nợ phát sinh 20.000đ." : "Hạn trả mới là 03/08/2025. Thao tác sẽ được ghi vào lịch sử lưu thông."}</p></div>
        </div>
        <label className="staff-checkbox confirmation-checkbox"><input type="checkbox" /><span>Tôi đã kiểm tra thông tin và tình trạng tài liệu</span></label>
        <div className="modal-actions"><Button variant="ghost" onClick={() => setConfirmation(null)}>Quay lại</Button><Button onClick={() => setConfirmation(null)}>{actionLabel}</Button></div>
      </Modal>
    </div>
  );
}

function MaterialsManagementPage() {
  const [searchType, setSearchType] = useState("Nhan đề");
  const [selected, setSelected] = useState<number[]>([]);
  const [actionMenu, setActionMenu] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogRecord | null>(null);
  const allSelected = selected.length === catalogRecords.length;
  const toggleRow = (id: number) => setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  return (
    <div className="materials-page">
      <div className="materials-page-heading">
        <div><Breadcrumb items={["Không gian nghiệp vụ", "Quản lý tài liệu"]} /><p className="eyebrow">QUẢN LÝ BIỂU GHI</p><h1>Quản lý tài liệu</h1><p>Biên mục, kiểm soát và cập nhật kho tài liệu thư viện.</p></div>
        <div className="materials-top-actions"><Button variant="ghost" icon="document">Xuất dữ liệu</Button><Button variant="secondary" icon="plus">Nhập dữ liệu hàng loạt</Button><Button icon="plus" onClick={() => { window.location.hash = "#/staff/materials/new"; }}>Thêm tài liệu</Button></div>
      </div>

      <section className="materials-search-panel">
        <div className="catalog-search-types">{["Nhan đề", "Tác giả", "ISBN", "Mã biểu ghi"].map((type) => <button key={type} className={searchType === type ? "active" : ""} onClick={() => setSearchType(type)}>{type}</button>)}</div>
        <div className="catalog-search-row"><SearchInput placeholder={`Tìm theo ${searchType.toLowerCase()}...`} /><Button icon="search">Tìm kiếm</Button></div>
        <div className="catalog-filter-grid">
          <label><span>Dạng tài liệu</span><select defaultValue="all"><option value="all">Tất cả dạng tài liệu</option><option>Sách chuyên khảo</option><option>Giáo trình</option><option>Luận án, luận văn</option></select><Icon name="chevron-down" size={14} /></label>
          <label><span>Ngành đào tạo</span><select defaultValue="all"><option value="all">Tất cả ngành</option><option>Công nghệ thông tin</option><option>Điện tử viễn thông</option><option>Quản trị kinh doanh</option></select><Icon name="chevron-down" size={14} /></label>
          <label><span>Ngôn ngữ</span><select defaultValue="all"><option value="all">Tất cả ngôn ngữ</option><option>Tiếng Việt</option><option>Tiếng Anh</option></select><Icon name="chevron-down" size={14} /></label>
          <label><span>Năm xuất bản</span><select defaultValue="all"><option value="all">Tất cả các năm</option><option>2025</option><option>2024</option><option>2023</option></select><Icon name="chevron-down" size={14} /></label>
          <label><span>Trạng thái</span><select defaultValue="all"><option value="all">Tất cả trạng thái</option><option>Đã xuất bản</option><option>Bản nháp</option><option>Cần bổ sung</option></select><Icon name="chevron-down" size={14} /></label>
          <label className="digital-filter"><input type="checkbox" /><span><strong>Có tài liệu số</strong><small>Chỉ hiện biểu ghi có tệp số</small></span></label>
        </div>
      </section>

      <section className="catalog-table-panel">
        <div className="catalog-table-toolbar">
          <div><h2>Danh sách biểu ghi</h2><p>48.632 biểu ghi · Cập nhật 5 phút trước</p></div>
          {selected.length > 0 ? <div className="bulk-actions"><strong>Đã chọn {selected.length}</strong><Button variant="ghost" size="sm">Đổi trạng thái</Button><Button variant="ghost" size="sm">Xuất dữ liệu</Button><Button variant="danger" size="sm" onClick={() => setSelected([])}>Xóa đã chọn</Button></div> : <Button variant="ghost" size="sm" icon="filter">Tùy chỉnh cột</Button>}
        </div>
        <div className="catalog-table-wrap">
          <table className="catalog-table">
            <thead><tr><th><input type="checkbox" aria-label="Chọn tất cả" checked={allSelected} onChange={() => setSelected(allSelected ? [] : catalogRecords.map((item) => item.id))} /></th><th>Cover</th><th>Nhan đề</th><th>Tác giả</th><th>ISBN</th><th>Dạng tài liệu</th><th>Số bản</th><th>Tài liệu số</th><th>Trạng thái</th><th>Actions</th></tr></thead>
            <tbody>{catalogRecords.map((record) => (
              <tr key={record.id} className={selected.includes(record.id) ? "selected-row" : ""}>
                <td><input type="checkbox" aria-label={`Chọn ${record.title}`} checked={selected.includes(record.id)} onChange={() => toggleRow(record.id)} /></td>
                <td><div className="catalog-cover"><BookCover book={record} /></div></td>
                <td><div className="catalog-title-cell"><strong>{record.title}</strong><small>{record.recordCode} · {record.code}</small></div></td>
                <td>{record.author}</td>
                <td><code>{record.isbn}</code></td>
                <td><Badge>{record.type}</Badge></td>
                <td><button className="copy-count"><strong>{record.copies}</strong><small>Bản cá biệt</small></button></td>
                <td>{record.digitalFiles > 0 ? <button className="digital-count"><Icon name="document" size={15} /><span><strong>{record.digitalFiles} tệp</strong><small>Đã xử lý</small></span></button> : <span className="no-digital">Chưa có</span>}</td>
                <td><Badge tone={record.recordStatus === "Đã xuất bản" ? "success" : record.recordStatus === "Bản nháp" ? "warning" : "error"}>{record.recordStatus}</Badge></td>
                <td><div className="catalog-row-actions"><Button variant="ghost" size="sm">Xem</Button><Button variant="ghost" size="sm" onClick={() => { window.location.hash = `#/staff/materials/edit/${record.id}`; }}>Sửa</Button><div className="catalog-more-wrap"><IconButton label="Thêm thao tác" icon="more" onClick={() => setActionMenu(actionMenu === record.id ? null : record.id)} /><Dropdown open={actionMenu === record.id}><button><Icon name="library" />Bản cá biệt</button><button><Icon name="document" />Tài liệu số</button><hr /><button className="danger" onClick={() => { setDeleteTarget(record); setActionMenu(null); }}><Icon name="error" />Xóa biểu ghi</button></Dropdown></div></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="catalog-pagination"><p>Hiển thị 1–6 trong tổng số 48.632 biểu ghi</p><Pagination /></div>
      </section>

      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Xóa biểu ghi thư mục">
        <div className="catalog-delete-warning"><span><Icon name="error" size={24} /></span><div><strong>Bạn có chắc muốn xóa biểu ghi này?</strong><p>{deleteTarget?.title}</p></div></div>
        <p className="delete-explanation">Biểu ghi chỉ có thể xóa khi không còn bản cá biệt đang lưu thông hoặc tài liệu số được liên kết. Thao tác này sẽ được ghi vào nhật ký hệ thống.</p>
        <div className="modal-actions"><Button variant="ghost" onClick={() => setDeleteTarget(null)}>Hủy</Button><Button variant="danger" onClick={() => setDeleteTarget(null)}>Xóa biểu ghi</Button></div>
      </Modal>
    </div>
  );
}

type CopyRow = {
  id: number;
  barcode: string;
  shelf: string;
  condition: string;
  circulation: string;
  received: string;
};

type DigitalFileRow = {
  id: number;
  name: string;
  size: string;
  access: string;
  status: string;
};

function BibliographicRecordForm({ edit = false }: { edit?: boolean }) {
  const [form, setForm] = useState({
    title: edit ? "Trí tuệ nhân tạo: Nền tảng và ứng dụng" : "",
    subtitle: edit ? "Nguyên lý, thuật toán và các bài toán thực tiễn" : "",
    author: edit ? "Nguyễn Thanh Thủy" : "",
    type: edit ? "Sách chuyên khảo" : "",
    isbn: edit ? "978-604-80-8932-1" : "",
    language: edit ? "Tiếng Việt" : "",
    classification: edit ? "005.1 NG-T 2024" : "",
    publicationPlace: edit ? "Hà Nội" : "",
    year: edit ? "2024" : "",
    physicalDescription: edit ? "386 trang : minh họa ; 24 cm" : "",
    summary: edit ? "Tài liệu trình bày các nền tảng quan trọng của trí tuệ nhân tạo, từ biểu diễn tri thức, tìm kiếm, học máy đến các ứng dụng trong giáo dục, y tế và công nghiệp." : "",
  });
  const [programs, setPrograms] = useState<string[]>(edit ? ["Công nghệ thông tin", "Khoa học máy tính", "An toàn thông tin"] : []);
  const [copies, setCopies] = useState<CopyRow[]>(edit ? [
    { id: 1, barcode: "PTIT-24-01842", shelf: "A2-03", condition: "Tốt", circulation: "Có sẵn", received: "2024-08-12" },
    { id: 2, barcode: "PTIT-24-01843", shelf: "A2-03", condition: "Tốt", circulation: "Đang mượn", received: "2024-08-12" },
  ] : [{ id: 1, barcode: "", shelf: "", condition: "Tốt", circulation: "Có sẵn", received: "2025-06-22" }]);
  const [digitalFiles, setDigitalFiles] = useState<DigitalFileRow[]>(edit ? [
    { id: 1, name: "tri-tue-nhan-tao-nen-tang-va-ung-dung.pdf", size: "24.8 MB", access: "Chỉ xem trực tuyến", status: "Đã xử lý" },
  ] : []);
  const [restricted, setRestricted] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedMessage, setSavedMessage] = useState("");

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };
  const updateCopy = (id: number, key: keyof CopyRow, value: string) => setCopies((items) => items.map((copy) => copy.id === id ? { ...copy, [key]: value } : copy));
  const validate = (draft = false) => {
    if (draft) {
      setSavedMessage("Bản nháp đã được lưu lúc 10:24");
      return;
    }
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = "Vui lòng nhập nhan đề tài liệu.";
    if (!form.author.trim()) nextErrors.author = "Vui lòng nhập ít nhất một tác giả.";
    if (!form.type) nextErrors.type = "Vui lòng chọn dạng tài liệu.";
    if (!form.language) nextErrors.language = "Vui lòng chọn ngôn ngữ.";
    if (!form.year) nextErrors.year = "Vui lòng nhập năm xuất bản.";
    else if (!/^\d{4}$/.test(form.year)) nextErrors.year = "Năm xuất bản phải gồm 4 chữ số.";
    if (programs.length === 0) nextErrors.programs = "Chọn ít nhất một ngành đào tạo phù hợp.";
    if (copies.some((copy) => !copy.barcode.trim())) nextErrors.copies = "Mỗi bản cá biệt cần có mã cá biệt.";
    if (restricted && !restrictionReason) nextErrors.restriction = "Vui lòng chọn lý do không cho phép mượn về.";
    setErrors(nextErrors);
    setSavedMessage(Object.keys(nextErrors).length === 0 ? "Tài liệu đã được lưu thành công." : "");
    if (Object.keys(nextErrors).length > 0) document.querySelector(".record-form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="record-form-page">
      <div className="record-form-heading">
        <div><Breadcrumb items={["Quản lý tài liệu", edit ? "Chỉnh sửa biểu ghi" : "Thêm tài liệu"]} /><p className="eyebrow">BIÊN MỤC TÀI LIỆU</p><h1>{edit ? "Chỉnh sửa biểu ghi thư mục" : "Thêm biểu ghi thư mục"}</h1><p>{edit ? "BIB-0001842 · Cập nhật lần cuối 18/06/2025 bởi Nguyễn Minh Anh" : "Tạo biểu ghi dùng chung cho bản in và tài liệu số."}</p></div>
        <Badge tone={edit ? "success" : "warning"}>{edit ? "ĐÃ XUẤT BẢN" : "BẢN GHI MỚI"}</Badge>
      </div>

      {Object.values(errors).some(Boolean) && <div className="form-error-summary"><Icon name="error" /><div><strong>Không thể lưu tài liệu</strong><p>Vui lòng kiểm tra các trường được đánh dấu bên dưới.</p></div></div>}
      {savedMessage && <div className="form-success-summary"><Icon name="success" /><span>{savedMessage}</span></div>}

      <div className="record-form-layout">
        <main className="record-form-main">
          <section className="record-form-section">
            <header><span>01</span><div><h2>Thông tin thư mục</h2><p>Thông tin mô tả và định danh chính của tài liệu.</p></div><Badge tone="error">BẮT BUỘC</Badge></header>
            <div className="bibliographic-form-grid">
              <Field fieldClassName="span-2" label="Nhan đề *" value={form.title} onChange={(event) => updateForm("title", event.target.value)} error={errors.title} placeholder="Nhập nhan đề chính của tài liệu" />
              <Field fieldClassName="span-2" label="Phụ đề" value={form.subtitle} onChange={(event) => updateForm("subtitle", event.target.value)} placeholder="Nhập phụ đề nếu có" />
              <Field fieldClassName="span-2" label="Tác giả *" value={form.author} onChange={(event) => updateForm("author", event.target.value)} error={errors.author} placeholder="Nhập tên tác giả hoặc cơ quan" />
              <SelectField label="Dạng tài liệu *" value={form.type} onChange={(event) => updateForm("type", event.target.value)} error={errors.type}><option value="">Chọn dạng tài liệu</option><option>Sách chuyên khảo</option><option>Giáo trình</option><option>Sách tham khảo</option><option>Luận án</option><option>Tài liệu hội thảo</option></SelectField>
              <Field label="ISBN" value={form.isbn} onChange={(event) => updateForm("isbn", event.target.value)} placeholder="978-604-..." />
              <SelectField label="Ngôn ngữ *" value={form.language} onChange={(event) => updateForm("language", event.target.value)} error={errors.language}><option value="">Chọn ngôn ngữ</option><option>Tiếng Việt</option><option>Tiếng Anh</option><option>Tiếng Pháp</option></SelectField>
              <Field label="Ký hiệu phân loại" value={form.classification} onChange={(event) => updateForm("classification", event.target.value)} placeholder="VD: 005.1 NG-T 2024" />
              <Field label="Nơi xuất bản" value={form.publicationPlace} onChange={(event) => updateForm("publicationPlace", event.target.value)} placeholder="Hà Nội" />
              <Field label="Năm xuất bản *" value={form.year} onChange={(event) => updateForm("year", event.target.value)} error={errors.year} placeholder="YYYY" />
              <Field fieldClassName="span-2" label="Mô tả vật lý" value={form.physicalDescription} onChange={(event) => updateForm("physicalDescription", event.target.value)} placeholder="Số trang, minh họa, kích thước..." />
              <TextAreaField fieldClassName="span-2" label="Tóm tắt" value={form.summary} onChange={(event) => updateForm("summary", event.target.value)} rows={5} placeholder="Nhập tóm tắt nội dung tài liệu..." hint={`${form.summary.length}/2.000 ký tự`} />
              <div className="cover-upload span-2">
                <span className="field-label">Ảnh bìa</span>
                <div>{edit ? <BookCover book={detailBook} /> : <span className="cover-placeholder"><Icon name="book" size={28} /></span>}<label><Icon name="plus" /><strong>{edit ? "Thay ảnh bìa" : "Tải ảnh bìa lên"}</strong><small>JPG hoặc PNG · Tối đa 5 MB · Tỷ lệ khuyến nghị 2:3</small><input type="file" accept="image/png,image/jpeg" /></label></div>
              </div>
            </div>
          </section>

          <section className="record-form-section">
            <header><span>02</span><div><h2>Ngành đào tạo</h2><p>Một biểu ghi có thể thuộc nhiều ngành đào tạo.</p></div><Badge>{programs.length} ĐÃ CHỌN</Badge></header>
            <div className="program-selector">
              <div className="selected-programs">{programs.length > 0 ? programs.map((program) => <button key={program} onClick={() => setPrograms((items) => items.filter((item) => item !== program))}>{program}<Icon name="close" size={13} /></button>) : <span>Chưa chọn ngành đào tạo</span>}</div>
              <div className="program-options">{trainingPrograms.filter((program) => !programs.includes(program)).map((program) => <button key={program} onClick={() => { setPrograms((items) => [...items, program]); setErrors((current) => ({ ...current, programs: "" })); }}><Icon name="plus" size={14} />{program}</button>)}</div>
              {errors.programs && <p className="section-error"><Icon name="error" size={14} />{errors.programs}</p>}
            </div>
          </section>

          <section className="record-form-section">
            <header><span>03</span><div><h2>Bản cá biệt</h2><p>Quản lý các bản in vật lý thuộc biểu ghi.</p></div><Button variant="secondary" size="sm" icon="plus" onClick={() => setCopies((items) => [...items, { id: Date.now(), barcode: "", shelf: "", condition: "Tốt", circulation: "Có sẵn", received: "2025-06-22" }])}>Thêm bản cá biệt</Button></header>
            <div className="copy-editor-wrap"><table className="copy-editor"><thead><tr><th>Mã cá biệt *</th><th>Vị trí kệ</th><th>Tình trạng vật lý</th><th>Trạng thái lưu thông</th><th>Ngày nhập kho</th><th /></tr></thead><tbody>{copies.map((copy) => <tr key={copy.id}><td><input value={copy.barcode} onChange={(event) => { updateCopy(copy.id, "barcode", event.target.value); setErrors((current) => ({ ...current, copies: "" })); }} placeholder="PTIT-YY-XXXXX" /></td><td><input value={copy.shelf} onChange={(event) => updateCopy(copy.id, "shelf", event.target.value)} placeholder="A2-03" /></td><td><select value={copy.condition} onChange={(event) => updateCopy(copy.id, "condition", event.target.value)}><option>Tốt</option><option>Hư hỏng nhẹ</option><option>Hư hỏng nặng</option></select></td><td><select value={copy.circulation} onChange={(event) => updateCopy(copy.id, "circulation", event.target.value)}><option>Có sẵn</option><option>Đang mượn</option><option>Đang giữ</option><option>Không lưu thông</option></select></td><td><input type="date" value={copy.received} onChange={(event) => updateCopy(copy.id, "received", event.target.value)} /></td><td><IconButton label="Xóa bản" icon="close" disabled={copies.length === 1} onClick={() => setCopies((items) => items.filter((item) => item.id !== copy.id))} /></td></tr>)}</tbody></table></div>
            {errors.copies && <p className="section-error copy-error"><Icon name="error" size={14} />{errors.copies}</p>}
          </section>

          <section className="record-form-section">
            <header><span>04</span><div><h2>Tài liệu số</h2><p>Tải lên và thiết lập quyền truy cập tệp PDF.</p></div><Badge tone="info">{digitalFiles.length} TỆP</Badge></header>
            <label className="digital-upload-zone"><input type="file" accept=".pdf" onChange={(event) => event.target.files?.[0] && setDigitalFiles((items) => [...items, { id: Date.now(), name: event.target.files![0].name, size: `${(event.target.files![0].size / 1024 / 1024).toFixed(1)} MB`, access: "Chỉ xem trực tuyến", status: "Đang xử lý" }])} /><span><Icon name="document" size={26} /></span><strong>Kéo thả tệp PDF hoặc chọn từ máy tính</strong><small>PDF · Tối đa 200 MB mỗi tệp</small><Button variant="secondary" size="sm" type="button">Chọn tệp</Button></label>
            {digitalFiles.length > 0 && <div className="digital-file-editor">{digitalFiles.map((file) => <article key={file.id}><span className="file-icon">PDF</span><div><strong>{file.name}</strong><small>{file.size}</small></div><label><span>Mức truy cập</span><select value={file.access} onChange={(event) => setDigitalFiles((items) => items.map((item) => item.id === file.id ? { ...item, access: event.target.value } : item))}><option>Chỉ xem trực tuyến</option><option>Cho phép tải</option></select></label><Status tone={file.status === "Đã xử lý" ? "success" : "warning"}>{file.status}</Status><IconButton label="Xóa tệp" icon="close" onClick={() => setDigitalFiles((items) => items.filter((item) => item.id !== file.id))} /></article>)}</div>}
          </section>

          <section className="record-form-section">
            <header><span>05</span><div><h2>Giới hạn mượn</h2><p>Thiết lập hạn chế lưu thông cho biểu ghi.</p></div></header>
            <div className="borrowing-restriction">
              <label className="restriction-toggle"><input type="checkbox" checked={restricted} onChange={(event) => { setRestricted(event.target.checked); if (!event.target.checked) setRestrictionReason(""); }} /><span><strong>Không cho phép mượn về</strong><small>Tài liệu chỉ được sử dụng tại phòng đọc hoặc khu vực được chỉ định.</small></span></label>
              {restricted && <div className="restriction-reasons"><p>Lý do hạn chế *</p><div>{["Dấu đỏ", "Sách tra cứu", "Luận án", "Luận văn", "Báo", "Tạp chí"].map((reason) => <label key={reason} className={restrictionReason === reason ? "selected" : ""}><input type="radio" name="restriction" value={reason} checked={restrictionReason === reason} onChange={() => { setRestrictionReason(reason); setErrors((current) => ({ ...current, restriction: "" })); }} />{reason}</label>)}</div>{errors.restriction && <p className="section-error"><Icon name="error" size={14} />{errors.restriction}</p>}</div>}
            </div>
          </section>
        </main>

        <aside className="record-form-aside">
          <div><p>TRẠNG THÁI BIỂU GHI</p><Status tone={edit ? "success" : "warning"}>{edit ? "Đã xuất bản" : "Chưa lưu"}</Status><dl><div><dt>Người tạo</dt><dd>Nguyễn Minh Anh</dd></div><div><dt>Ngày tạo</dt><dd>{edit ? "12/08/2024" : "22/06/2025"}</dd></div><div><dt>Mã biểu ghi</dt><dd>{edit ? "BIB-0001842" : "Tạo sau khi lưu"}</dd></div></dl></div>
          <div className="form-checklist"><p>KIỂM TRA NHANH</p><span className={form.title ? "complete" : ""}><Icon name={form.title ? "success" : "info"} size={14} />Thông tin cơ bản</span><span className={programs.length ? "complete" : ""}><Icon name={programs.length ? "success" : "info"} size={14} />Ngành đào tạo</span><span className={copies.every((copy) => copy.barcode) ? "complete" : ""}><Icon name={copies.every((copy) => copy.barcode) ? "success" : "info"} size={14} />Bản cá biệt</span><span className={digitalFiles.length ? "complete" : ""}><Icon name={digitalFiles.length ? "success" : "info"} size={14} />Tài liệu số</span></div>
        </aside>
      </div>

      <div className="record-form-actions"><div>{savedMessage ? <Status tone="success">{savedMessage}</Status> : <span><Icon name="info" size={14} />Các trường có dấu * là bắt buộc</span>}</div><Button variant="ghost" onClick={() => { window.location.hash = "#/staff/materials"; }}>Hủy</Button><Button variant="secondary" onClick={() => validate(true)}>Lưu nháp</Button><Button onClick={() => validate(false)}>Lưu tài liệu</Button></div>
    </div>
  );
}

function DigitalProcessingPage() {
  const [jobs, setJobs] = useState(initialProcessingJobs);
  const [detailJob, setDetailJob] = useState<ProcessingJob | null>(null);
  const retry = (id: number) => setJobs((items) => items.map((item) => item.id === id ? { ...item, status: "Đang chờ", progress: 0, stage: "Đã thêm lại vào hàng đợi", completed: "—" } : item));
  const counts = {
    waiting: jobs.filter((job) => job.status === "Đang chờ").length,
    processing: jobs.filter((job) => job.status === "Đang xử lý").length,
    complete: jobs.filter((job) => job.status === "Hoàn thành").length,
    error: jobs.filter((job) => job.status === "Lỗi").length,
  };

  return (
    <div className="digital-processing-page">
      <div className="processing-page-heading">
        <div><Breadcrumb items={["Không gian nghiệp vụ", "Tài liệu số", "Trạng thái xử lý"]} /><p className="eyebrow">XỬ LÝ NỘI DUNG SỐ</p><h1>Trạng thái xử lý tài liệu số</h1><p>Theo dõi pipeline trích xuất nội dung và lập chỉ mục tìm kiếm.</p></div>
        <div><Button variant="secondary" icon="settings">Cấu hình xử lý</Button><Button icon="plus">Thêm tệp xử lý</Button></div>
      </div>

      <section className="processing-summary-grid">
        <article><span className="processing-summary-icon waiting"><Icon name="more" /></span><div><small>Đang chờ</small><strong>{counts.waiting}</strong><p>Trong hàng đợi</p></div></article>
        <article><span className="processing-summary-icon processing"><Icon name="sparkle" /></span><div><small>Đang xử lý</small><strong>{counts.processing}</strong><p>Đang chạy pipeline</p></div></article>
        <article><span className="processing-summary-icon complete"><Icon name="success" /></span><div><small>Hoàn thành</small><strong>{counts.complete}</strong><p>Trong phiên hôm nay</p></div></article>
        <article><span className="processing-summary-icon failed"><Icon name="error" /></span><div><small>Lỗi</small><strong>{counts.error}</strong><p>Cần kiểm tra</p></div></article>
      </section>

      <section className="processing-table-panel">
        <div className="processing-table-heading"><div><h2>Danh sách tác vụ</h2><p>{jobs.length} tệp · Cập nhật tự động mỗi 30 giây</p></div><div><SelectField label="Trạng thái" defaultValue="all"><option value="all">Tất cả trạng thái</option><option>Đang chờ</option><option>Đang xử lý</option><option>Hoàn thành</option><option>Lỗi</option></SelectField><IconButton label="Làm mới" icon="sparkle" /></div></div>
        <div className="processing-table-wrap"><table className="processing-table"><thead><tr><th>Tài liệu</th><th>File</th><th>Dung lượng</th><th>Trạng thái</th><th>Tiến độ</th><th>Thời gian bắt đầu</th><th>Thời gian hoàn thành</th><th>Actions</th></tr></thead><tbody>
          {jobs.map((job) => <tr key={job.id}>
            <td><div className="processing-title"><span><Icon name="document" /></span><div><strong>{job.title}</strong><small>{job.record}</small></div></div></td>
            <td><div className="processing-file"><strong>{job.file}</strong>{job.status === "Lỗi" && <small className="file-error">Không thể trích xuất văn bản</small>}</div></td>
            <td>{job.size}</td>
            <td><Badge tone={job.status === "Hoàn thành" ? "success" : job.status === "Lỗi" ? "error" : job.status === "Đang xử lý" ? "info" : "warning"}>{job.status}</Badge></td>
            <td><div className="job-progress"><div><i className={`progress-value progress-${job.progress}`} /></div><span>{job.progress}%</span><small>{job.stage}</small></div></td>
            <td>{job.started}</td>
            <td>{job.completed}</td>
            <td><div className="processing-actions"><Button variant="ghost" size="sm" onClick={() => setDetailJob(job)}>Chi tiết</Button>{job.status === "Lỗi" && <Button variant="secondary" size="sm" onClick={() => retry(job.id)}>Xử lý lại</Button>}</div></td>
          </tr>)}
        </tbody></table></div>
        <div className="processing-footnote"><span><Icon name="info" size={14} />Pipeline đang sử dụng cấu hình mặc định · 2 tác vụ chạy song song</span><Pagination /></div>
      </section>

      <Modal open={detailJob !== null} onClose={() => setDetailJob(null)} title="Chi tiết xử lý tài liệu">
        {detailJob && <div className="processing-detail">
          <div className="processing-detail-file"><span className="file-icon">PDF</span><div><strong>{detailJob.file}</strong><small>{detailJob.title} · {detailJob.size}</small></div><Badge tone={detailJob.status === "Lỗi" ? "error" : detailJob.status === "Hoàn thành" ? "success" : "info"}>{detailJob.status}</Badge></div>
          {detailJob.status === "Lỗi" && <div className="processing-error-detail"><Icon name="error" /><div><strong>Không thể trích xuất văn bản</strong><p>Tệp có thể là bản scan chất lượng thấp hoặc được bảo vệ. Kiểm tra OCR và quyền truy cập trước khi xử lý lại.</p></div></div>}
          <div className="pipeline-heading"><p>PIPELINE XỬ LÝ</p><span>{detailJob.progress}% hoàn thành</span></div>
          <ol className="pipeline-steps">
            {pipelineSteps.map((step, index) => {
              const failed = detailJob.status === "Lỗi" && index === 1;
              const completedJob = detailJob.status === "Hoàn thành";
              const status = completedJob ? "complete" : failed ? "failed" : detailJob.status === "Đang chờ" ? index === 0 ? "waiting" : "waiting" : step.status;
              return <li key={step.title} className={status}><span>{status === "complete" ? <Icon name="success" size={15} /> : status === "failed" ? <Icon name="error" size={15} /> : String(index + 1).padStart(2, "0")}</span><div><strong>{step.title}</strong><p>{failed ? "Không đọc được lớp văn bản trong tệp PDF" : step.description}</p></div><small>{status === "complete" ? "Hoàn thành" : status === "processing" ? "Đang xử lý" : status === "failed" ? "Lỗi" : "Đang chờ"}</small></li>;
            })}
          </ol>
          <div className="processing-technical-meta"><div><span>Job ID</span><strong>JOB-{detailJob.id}-2025</strong></div><div><span>Worker</span><strong>worker-index-02</strong></div><div><span>Ưu tiên</span><strong>Tiêu chuẩn</strong></div></div>
          <div className="modal-actions"><Button variant="ghost" onClick={() => setDetailJob(null)}>Đóng</Button>{detailJob.status === "Lỗi" && <Button onClick={() => { retry(detailJob.id); setDetailJob(null); }}>Xử lý lại</Button>}</div>
        </div>}
      </Modal>
    </div>
  );
}

function ReservationManagementPage() {
  const [groups, setGroups] = useState(initialReservationGroups);
  const [searchType, setSearchType] = useState("Tài liệu");
  const [action, setAction] = useState<{ type: "ready" | "cancel" | "transfer"; groupId: number; readerId: number } | null>(null);
  const targetGroup = groups.find((group) => group.id === action?.groupId);
  const targetReader = targetGroup?.queue.find((reader) => reader.id === action?.readerId);

  const executeAction = () => {
    if (!action) return;
    setGroups((items) => items.map((group) => {
      if (group.id !== action.groupId) return group;
      if (action.type === "cancel") return { ...group, queue: group.queue.filter((reader) => reader.id !== action.readerId) };
      if (action.type === "ready") return { ...group, available: false, copies: "1 bản đang được giữ", queue: group.queue.map((reader) => reader.id === action.readerId ? { ...reader, status: "Đã sẵn sàng", holdUntil: "10/10/2026 · 17:00" } : reader) };
      const remaining = group.queue.filter((reader) => reader.id !== action.readerId);
      return { ...group, queue: remaining, copies: remaining.length ? "Chuyển giữ cho lượt tiếp theo" : group.copies };
    }));
    setAction(null);
  };

  const actionTitle = action?.type === "ready" ? "Xác nhận tài liệu sẵn sàng" : action?.type === "transfer" ? "Chuyển lượt đặt trước" : "Hủy lượt đặt trước";

  return (
    <div className="reservation-management-page">
      <div className="reservation-page-heading">
        <div><Breadcrumb items={["Không gian nghiệp vụ", "Đặt trước"]} /><p className="eyebrow">LƯU THÔNG TÀI LIỆU</p><h1>Quản lý đặt trước</h1><p>Theo dõi hàng đợi và xử lý tài liệu sẵn sàng theo đúng thứ tự đăng ký.</p></div>
        <Button variant="secondary" icon="settings">Thiết lập thời gian giữ</Button>
      </div>

      <section className="reservation-search-panel">
        <div className="reservation-search-types">{["Tài liệu", "Mã bạn đọc", "Tên bạn đọc"].map((type) => <button key={type} className={searchType === type ? "active" : ""} onClick={() => setSearchType(type)}>{type}</button>)}</div>
        <SearchInput placeholder={searchType === "Tài liệu" ? "Tìm theo nhan đề, ISBN hoặc mã biểu ghi..." : searchType === "Mã bạn đọc" ? "Nhập mã bạn đọc..." : "Nhập tên bạn đọc..."} />
        <Button icon="search">Tìm kiếm</Button>
      </section>

      <div className="queue-policy-note">
        <span><Icon name="info" /></span>
        <div><strong>Hàng đợi áp dụng nguyên tắc đến trước, phục vụ trước</strong><p>Thứ tự được xác định tự động theo thời gian đăng ký và không thể kéo thả hoặc sắp xếp thủ công. Chỉ chuyển lượt khi người đứng đầu từ chối, hết thời gian giữ hoặc không còn đủ điều kiện.</p></div>
        <Badge tone="info">FIFO</Badge>
      </div>

      <div className="reservation-queue-toolbar"><div><h2>Hàng đợi theo tài liệu</h2><p>{groups.length} tài liệu · {groups.reduce((total, group) => total + group.queue.length, 0)} lượt đang được quản lý</p></div><label><span>Hiển thị</span><select defaultValue="all"><option value="all">Tất cả hàng đợi</option><option>Có bản sẵn sàng</option><option>Đang giữ</option><option>Chưa có bản</option></select><Icon name="chevron-down" size={14} /></label></div>

      <div className="reservation-group-list">
        {groups.map((group) => (
          <section className="reservation-group-card" key={group.id}>
            <header>
              <div className="reservation-book-cover"><BookCover book={{ ...detailBook, title: group.title, author: group.author, cover: group.cover }} /></div>
              <div className="reservation-book-info"><div><Badge tone={group.available ? "success" : "neutral"}>{group.available ? "CÓ BẢN SẴN SÀNG" : "CHƯA CÓ BẢN"}</Badge><span>{group.record}</span></div><h2>{group.title}</h2><p>{group.author}</p></div>
              <div className={`reservation-copy-status ${group.available ? "available" : ""}`}><Icon name="library" /><span><small>Tình trạng bản</small><strong>{group.copies}</strong></span></div>
              <div className="queue-total"><small>Hàng đợi</small><strong>{String(group.queue.length).padStart(2, "0")}</strong><span>người</span></div>
            </header>
            {group.queue.length > 0 ? <ol className="reservation-queue">
              {group.queue.map((reader, index) => {
                const isFirst = index === 0;
                return <li key={reader.id} className={`${isFirst ? "first" : ""} ${reader.status === "Đã sẵn sàng" ? "ready" : ""}`}>
                  <span className="queue-position">{index + 1}</span>
                  <Avatar name={reader.name} />
                  <div className="queue-reader"><div><strong>{reader.name}</strong>{isFirst && <Badge tone="brand">ƯU TIÊN TIẾP THEO</Badge>}</div><small>{reader.code}</small></div>
                  <dl><div><dt>Đăng ký</dt><dd>{reader.registered}</dd></div><div><dt>Trạng thái</dt><dd><Status tone={reader.status === "Đã sẵn sàng" ? "success" : "warning"}>{reader.status}</Status></dd></div>{reader.holdUntil && <div className="hold-expiration"><dt>Giữ đến</dt><dd>{reader.holdUntil}</dd></div>}</dl>
                  <div className="queue-actions">
                    {isFirst && group.available && reader.status === "Đang chờ" && <Button size="sm" icon="success" onClick={() => setAction({ type: "ready", groupId: group.id, readerId: reader.id })}>Xác nhận sẵn sàng</Button>}
                    {isFirst && reader.status === "Đã sẵn sàng" && <Button variant="secondary" size="sm" onClick={() => setAction({ type: "transfer", groupId: group.id, readerId: reader.id })}>Chuyển lượt</Button>}
                    <Button variant="ghost" size="sm" onClick={() => setAction({ type: "cancel", groupId: group.id, readerId: reader.id })}>Hủy</Button>
                  </div>
                </li>;
              })}
            </ol> : <div className="empty-queue"><Icon name="users" /><span><strong>Hàng đợi đã trống</strong><small>Không còn bạn đọc chờ tài liệu này.</small></span></div>}
          </section>
        ))}
      </div>

      <Modal open={action !== null} onClose={() => setAction(null)} title={actionTitle}>
        <div className={`queue-confirmation ${action?.type === "cancel" ? "danger" : ""}`}><span><Icon name={action?.type === "ready" ? "success" : action?.type === "transfer" ? "chevron-right" : "error"} size={24} /></span><div><strong>{targetReader?.name}</strong><p>{targetGroup?.title}</p></div></div>
        <p className="queue-confirmation-text">{action?.type === "ready" ? "Hệ thống sẽ thông báo cho bạn đọc và giữ bản tài liệu đến 10/10/2026 lúc 17:00." : action?.type === "transfer" ? "Lượt hiện tại sẽ kết thúc và quyền nhận tài liệu được chuyển cho người tiếp theo trong hàng đợi. Không thể hoàn tác." : "Lượt đặt trước sẽ bị hủy và các vị trí phía sau tự động được dịch lên theo đúng thứ tự đăng ký."}</p>
        {action?.type === "transfer" && <div className="transfer-policy"><Icon name="info" size={15} /><span>Chỉ thực hiện khi bạn đọc từ chối, hết hạn giữ hoặc không còn đủ điều kiện.</span></div>}
        <div className="modal-actions"><Button variant="ghost" onClick={() => setAction(null)}>Quay lại</Button><Button variant={action?.type === "cancel" ? "danger" : "primary"} onClick={executeAction}>{actionTitle}</Button></div>
      </Modal>
    </div>
  );
}

function ReaderManagementPage() {
  const [readers, setReaders] = useState(initialManagedReaders);
  const [selectedReaderId, setSelectedReaderId] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState("Tổng quan");
  const [cardAction, setCardAction] = useState<{ id: number; lock: boolean } | null>(null);
  const selectedReader = readers.find((reader) => reader.id === selectedReaderId) || null;
  const actionReader = readers.find((reader) => reader.id === cardAction?.id);

  const executeCardAction = () => {
    if (!cardAction) return;
    setReaders((items) => items.map((reader) => reader.id === cardAction.id ? {
      ...reader,
      cardStatus: cardAction.lock ? "Bị khóa" : "Hoạt động",
      lockReason: cardAction.lock ? "Khóa thủ công bởi nhân viên thư viện để kiểm tra vi phạm." : undefined,
      lockUntil: cardAction.lock ? "Đến khi được nhân viên mở khóa" : undefined,
    } : reader));
    setCardAction(null);
  };

  return (
    <div className="reader-management-page">
      <div className="reader-management-heading">
        <div><Breadcrumb items={["Không gian nghiệp vụ", "Bạn đọc"]} /><p className="eyebrow">QUẢN LÝ BẠN ĐỌC</p><h1>Quản lý bạn đọc</h1><p>Tra cứu hồ sơ, kiểm soát trạng thái thẻ và lịch sử sử dụng thư viện.</p></div>
        <div><Button variant="secondary" icon="document">Xuất danh sách</Button><Button icon="plus">Thêm bạn đọc</Button></div>
      </div>

      <section className="reader-search-filters">
        <div className="reader-management-search"><SearchInput placeholder="Tìm theo mã bạn đọc, họ tên, email..." /><Button icon="search">Tìm kiếm</Button></div>
        <div className="reader-filter-row">
          <label><span>Loại bạn đọc</span><select defaultValue="all"><option value="all">Tất cả loại bạn đọc</option><option>Sinh viên chính quy</option><option>Cán bộ, giảng viên</option><option>Học viên cao học</option><option>Nghiên cứu sinh</option></select><Icon name="chevron-down" size={14} /></label>
          <label><span>Ngành</span><select defaultValue="all"><option value="all">Tất cả ngành</option><option>Công nghệ thông tin</option><option>Khoa học máy tính</option><option>An toàn thông tin</option><option>Điện tử viễn thông</option></select><Icon name="chevron-down" size={14} /></label>
          <label><span>Trạng thái thẻ</span><select defaultValue="all"><option value="all">Tất cả trạng thái</option><option>Hoạt động</option><option>Bị khóa</option><option>Sắp hết hạn</option></select><Icon name="chevron-down" size={14} /></label>
          <Button variant="ghost" size="sm">Xóa bộ lọc</Button>
        </div>
      </section>

      <section className="reader-table-panel">
        <div className="reader-table-heading"><div><h2>Danh sách bạn đọc</h2><p>8.947 bạn đọc đang hoạt động</p></div><Badge tone="error">01 THẺ BỊ KHÓA</Badge></div>
        <div className="reader-management-table-wrap"><table className="reader-management-table"><thead><tr><th>Mã bạn đọc</th><th>Họ tên</th><th>Loại bạn đọc</th><th>Ngành đào tạo</th><th>Trạng thái thẻ</th><th>Đang mượn</th><th>Công nợ</th><th>Actions</th></tr></thead><tbody>
          {readers.map((reader) => <tr key={reader.id}>
            <td><code>{reader.code}</code></td>
            <td><div className="managed-reader-cell"><Avatar name={reader.name} size="sm" /><div><strong>{reader.name}</strong><small>{reader.email}</small></div></div></td>
            <td><Badge>{reader.type}</Badge></td>
            <td>{reader.program}</td>
            <td><Status tone={reader.cardStatus === "Hoạt động" ? "success" : reader.cardStatus === "Bị khóa" ? "error" : "warning"}>{reader.cardStatus}</Status></td>
            <td><strong>{reader.loans}</strong><small> tài liệu</small></td>
            <td><strong className={reader.debt > 0 ? "reader-debt" : ""}>{reader.debt.toLocaleString("vi-VN")}đ</strong></td>
            <td><div className="managed-reader-actions"><Button variant="ghost" size="sm" onClick={() => { setSelectedReaderId(reader.id); setDetailTab("Tổng quan"); }}>Xem hồ sơ</Button><Button variant={reader.cardStatus === "Bị khóa" ? "secondary" : "ghost"} size="sm" onClick={() => setCardAction({ id: reader.id, lock: reader.cardStatus !== "Bị khóa" })}>{reader.cardStatus === "Bị khóa" ? "Mở khóa" : "Khóa thẻ"}</Button><Button variant="ghost" size="sm" onClick={() => { setSelectedReaderId(reader.id); setDetailTab("Lịch sử mượn"); }}>Lịch sử mượn</Button></div></td>
          </tr>)}
        </tbody></table></div>
        <div className="reader-table-pagination"><span>Hiển thị 1–6 trong tổng số 9.214 bạn đọc</span><Pagination /></div>
      </section>

      <Modal open={selectedReader !== null} onClose={() => setSelectedReaderId(null)} title="Hồ sơ bạn đọc" eyebrow="THÔNG TIN BẠN ĐỌC" className="reader-detail-modal">
        {selectedReader && <div className="reader-profile">
          <div className="reader-profile-header">
            <Avatar name={selectedReader.name} size="lg" />
            <div><div><h2>{selectedReader.name}</h2><Badge tone={selectedReader.cardStatus === "Hoạt động" ? "success" : selectedReader.cardStatus === "Bị khóa" ? "error" : "warning"}>{selectedReader.cardStatus}</Badge></div><p>{selectedReader.code} · {selectedReader.type}</p></div>
            <Button variant={selectedReader.cardStatus === "Bị khóa" ? "secondary" : "danger"} size="sm" onClick={() => setCardAction({ id: selectedReader.id, lock: selectedReader.cardStatus !== "Bị khóa" })}>{selectedReader.cardStatus === "Bị khóa" ? "Mở khóa thẻ" : "Khóa thẻ"}</Button>
          </div>
          {selectedReader.cardStatus === "Bị khóa" && <div className="reader-lock-alert"><Icon name="error" /><div><strong>Thẻ bạn đọc đang bị khóa</strong><p>{selectedReader.lockReason}</p><span>Thời hạn khóa: {selectedReader.lockUntil}</span></div></div>}
          <div className="reader-profile-tabs">{["Tổng quan", "Đang mượn", "Lịch sử mượn", "Đặt trước", "Vi phạm & công nợ"].map((tab) => <button key={tab} className={detailTab === tab ? "active" : ""} onClick={() => setDetailTab(tab)}>{tab}</button>)}</div>
          {detailTab === "Tổng quan" && <div className="reader-profile-overview">
            <dl className="reader-personal-info"><div><dt>Họ và tên</dt><dd>{selectedReader.name}</dd></div><div><dt>Mã bạn đọc</dt><dd>{selectedReader.code}</dd></div><div><dt>Loại bạn đọc</dt><dd>{selectedReader.type}</dd></div><div><dt>Ngành đào tạo</dt><dd>{selectedReader.program}</dd></div><div><dt>Email</dt><dd>{selectedReader.email}</dd></div><div><dt>Số điện thoại</dt><dd>{selectedReader.phone}</dd></div><div><dt>Ngày sinh</dt><dd>{selectedReader.birthDate}</dd></div><div><dt>Hạn thẻ</dt><dd>{selectedReader.cardExpiry}</dd></div></dl>
            <div className="reader-profile-stats"><article><span>Đang mượn</span><strong>{selectedReader.loans}</strong><small>/ 08 tài liệu</small></article><article><span>Đặt trước</span><strong>02</strong><small>1 lượt chờ nhận</small></article><article><span>Công nợ</span><strong className={selectedReader.debt ? "negative" : ""}>{selectedReader.debt.toLocaleString("vi-VN")}đ</strong><small>{selectedReader.debt ? "Chưa thanh toán" : "Không có công nợ"}</small></article><article><span>Vi phạm</span><strong>{selectedReader.cardStatus === "Bị khóa" ? "02" : "00"}</strong><small>Trong 12 tháng</small></article></div>
          </div>}
          {detailTab === "Đang mượn" && <div className="profile-data-table"><table><thead><tr><th>Tài liệu</th><th>Ngày mượn</th><th>Hạn trả</th><th>Trạng thái</th></tr></thead><tbody><tr><td><strong>Mạng máy tính và hệ thống phân tán</strong><small>PTIT-24-02016</small></td><td>28/05/2025</td><td>25/06/2025</td><td><Badge tone="error">Quá hạn 3 ngày</Badge></td></tr><tr><td><strong>Nhập môn Khoa học dữ liệu</strong><small>PTIT-23-01564</small></td><td>08/06/2025</td><td>06/07/2025</td><td><Badge tone="success">Trong hạn</Badge></td></tr></tbody></table></div>}
          {detailTab === "Lịch sử mượn" && <div className="profile-data-table"><table><thead><tr><th>Tài liệu</th><th>Ngày mượn</th><th>Ngày trả</th><th>Kết quả</th></tr></thead><tbody><tr><td><strong>Học máy: Từ lý thuyết đến thực hành</strong></td><td>03/04/2025</td><td>28/04/2025</td><td><Status tone="success">Đúng hạn</Status></td></tr><tr><td><strong>An toàn thông tin trong kỷ nguyên số</strong></td><td>14/01/2025</td><td>08/02/2025</td><td><Status tone="warning">Muộn 2 ngày</Status></td></tr></tbody></table></div>}
          {detailTab === "Đặt trước" && <div className="profile-reservations"><article><span><Icon name="bookmark" /></span><div><strong>Machine Learning cơ bản</strong><p>Đăng ký 02/10/2026 · Vị trí hàng đợi: 01</p></div><Badge tone="warning">Đang chờ</Badge></article><article><span><Icon name="bookmark" /></span><div><strong>Cấu trúc dữ liệu và giải thuật</strong><p>Giữ đến 10/10/2026 · 17:00</p></div><Badge tone="success">Đã sẵn sàng</Badge></article></div>}
          {detailTab === "Vi phạm & công nợ" && <div className="profile-violations"><div className="profile-debt-total"><span><Icon name="error" /></span><div><small>TỔNG CÔNG NỢ</small><strong>{selectedReader.debt.toLocaleString("vi-VN")}đ</strong></div><Button variant="secondary" size="sm">Ghi nhận thanh toán</Button></div><article><Badge tone="error">CHƯA XỬ LÝ</Badge><div><strong>Trả tài liệu quá hạn trên 30 ngày</strong><p>Ghi nhận ngày 20/06/2025 · Tài liệu PTIT-24-02016</p></div><span>60.000đ</span></article><article><Badge tone="warning">NHẮC NHỞ</Badge><div><strong>Trả tài liệu muộn 2 ngày</strong><p>Ghi nhận ngày 10/04/2025 · Đã hoàn trả</p></div><span>4.000đ</span></article></div>}
        </div>}
      </Modal>

      <Modal open={cardAction !== null} onClose={() => setCardAction(null)} title={cardAction?.lock ? "Khóa thẻ bạn đọc" : "Mở khóa thẻ bạn đọc"}>
        <div className={`card-action-confirmation ${cardAction?.lock ? "lock" : "unlock"}`}><span><Icon name={cardAction?.lock ? "error" : "success"} size={24} /></span><div><strong>{actionReader?.name}</strong><p>{actionReader?.code}</p></div></div>
        {cardAction?.lock ? <><SelectField label="Lý do khóa thẻ" defaultValue="violation"><option value="violation">Vi phạm quy định thư viện</option><option value="debt">Công nợ chưa xử lý</option><option value="lost">Báo mất thẻ</option><option value="other">Lý do khác</option></SelectField><SelectField label="Thời hạn khóa" defaultValue="manual"><option value="manual">Đến khi nhân viên mở khóa</option><option value="7">07 ngày</option><option value="30">30 ngày</option><option value="permanent">Không thời hạn</option></SelectField></> : <p className="unlock-note">Bạn đọc sẽ được khôi phục quyền mượn, gia hạn và đặt trước sau khi mở khóa.</p>}
        <div className="modal-actions"><Button variant="ghost" onClick={() => setCardAction(null)}>Hủy</Button><Button variant={cardAction?.lock ? "danger" : "primary"} onClick={executeCardAction}>{cardAction?.lock ? "Khóa thẻ" : "Mở khóa"}</Button></div>
      </Modal>
    </div>
  );
}

function ReportsScreen() {
  const [view, setView] = useState<"circulation" | "demand">("circulation");
  return (
    <div className="reports-page">
      <div className="reports-heading">
        <div><Breadcrumb items={["Không gian nghiệp vụ", "Thống kê & báo cáo"]} /><p className="eyebrow">PHÂN TÍCH VẬN HÀNH</p><h1>Thống kê &amp; báo cáo</h1><p>Dữ liệu tổng hợp phục vụ đánh giá hoạt động và phát triển nguồn lực thư viện.</p></div>
        <Button icon="document">Xuất báo cáo</Button>
      </div>

      <section className="report-filter-bar">
        <label><span>Khoảng thời gian</span><select defaultValue="30"><option value="7">7 ngày gần đây</option><option value="30">30 ngày gần đây</option><option value="90">3 tháng gần đây</option><option value="365">12 tháng gần đây</option></select><Icon name="chevron-down" size={14} /></label>
        <label><span>Ngành đào tạo</span><select defaultValue="all"><option value="all">Tất cả ngành đào tạo</option><option>Công nghệ thông tin</option><option>Điện tử viễn thông</option><option>Quản trị kinh doanh</option></select><Icon name="chevron-down" size={14} /></label>
        <label><span>Dạng tài liệu</span><select defaultValue="all"><option value="all">Tất cả dạng tài liệu</option><option>Giáo trình</option><option>Sách chuyên khảo</option><option>Luận án, luận văn</option></select><Icon name="chevron-down" size={14} /></label>
        <Button variant="secondary">Áp dụng</Button>
        <button className="report-reset">Đặt lại</button>
      </section>

      <section className="report-kpi-grid">
        <article><span className="report-kpi-icon brand"><Icon name="book" /></span><div><small>Tổng lượt mượn</small><strong>3.842</strong><p><b>+8,4%</b> so với kỳ trước</p></div></article>
        <article><span className="report-kpi-icon info"><Icon name="arrow-left" /></span><div><small>Tổng lượt trả</small><strong>3.615</strong><p><b>+5,2%</b> so với kỳ trước</p></div></article>
        <article><span className="report-kpi-icon error"><Icon name="error" /></span><div><small>Quá hạn</small><strong>186</strong><p className="negative"><b>+12,1%</b> cần chú ý</p></div></article>
        <article><span className="report-kpi-icon success"><Icon name="users" /></span><div><small>Bạn đọc hoạt động</small><strong>2.947</strong><p><b>+4,8%</b> so với kỳ trước</p></div></article>
      </section>

      <div className="report-view-tabs">
        <button className={view === "circulation" ? "active" : ""} onClick={() => setView("circulation")}><Icon name="dashboard" />Lưu thông tài liệu<span>4 biểu đồ</span></button>
        <button className={view === "demand" ? "active" : ""} onClick={() => setView("demand")}><Icon name="search" />Nhu cầu &amp; tình trạng kho<span>3 báo cáo</span></button>
      </div>

      {view === "circulation" ? (
        <div className="report-view-content">
          <section className="report-panel report-trend-panel">
            <header><div><h2>Lượt mượn theo thời gian</h2><p>Xu hướng mượn và trả trong 30 ngày gần đây</p></div><div className="chart-legend"><span><i className="legend-borrowed" />Lượt mượn</span><span><i className="legend-returned" />Lượt trả</span></div></header>
            <div className="report-line-chart">
              <div className="line-y-axis"><span>200</span><span>150</span><span>100</span><span>50</span><span>0</span></div>
              <svg viewBox="0 0 800 230" role="img" aria-label="Biểu đồ lượt mượn và trả theo thời gian">
                <g className="line-grid"><line x1="20" y1="20" x2="790" y2="20" /><line x1="20" y1="65" x2="790" y2="65" /><line x1="20" y1="110" x2="790" y2="110" /><line x1="20" y1="155" x2="790" y2="155" /><line x1="20" y1="200" x2="790" y2="200" /></g>
                <polyline className="borrow-line" points="20,145 90,125 160,134 230,92 300,106 370,81 440,98 510,61 580,77 650,45 720,67 790,35" />
                <polyline className="return-line" points="20,158 90,142 160,118 230,126 300,97 370,109 440,78 510,91 580,62 650,74 720,48 790,57" />
                <g className="borrow-points">{[[20,145],[90,125],[160,134],[230,92],[300,106],[370,81],[440,98],[510,61],[580,77],[650,45],[720,67],[790,35]].map(([x,y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" />)}</g>
              </svg>
              <div className="line-x-axis"><span>24/05</span><span>30/05</span><span>05/06</span><span>11/06</span><span>17/06</span><span>22/06</span></div>
            </div>
          </section>

          <div className="report-two-column">
            <section className="report-panel">
              <header><div><h2>Lượt mượn theo ngành đào tạo</h2><p>Tỷ trọng theo hồ sơ bạn đọc</p></div></header>
              <div className="horizontal-chart">
                {[["Công nghệ thông tin", "1.248", "w-92"], ["Điện tử viễn thông", "986", "w-74"], ["Quản trị kinh doanh", "642", "w-51"], ["An toàn thông tin", "518", "w-42"], ["Công nghệ đa phương tiện", "448", "w-35"]].map(([label, value, width]) => <div key={label}><span>{label}</span><div><i className={width} /></div><strong>{value}</strong></div>)}
              </div>
            </section>
            <section className="report-panel">
              <header><div><h2>Lượt mượn theo dạng tài liệu</h2><p>Phân bổ 3.842 lượt mượn</p></div></header>
              <div className="document-type-chart">
                <div className="report-donut"><span><strong>3.842</strong><small>Lượt mượn</small></span></div>
                <div className="donut-legend"><div><i className="donut-a" /><span>Giáo trình</span><strong>42%</strong></div><div><i className="donut-b" /><span>Sách chuyên khảo</span><strong>28%</strong></div><div><i className="donut-c" /><span>Sách tham khảo</span><strong>18%</strong></div><div><i className="donut-d" /><span>Khác</span><strong>12%</strong></div></div>
              </div>
            </section>
          </div>

          <section className="report-panel report-ranking">
            <header><div><h2>Tài liệu mượn nhiều nhất</h2><p>Top 5 tài liệu theo số lượt lưu thông</p></div><Button variant="ghost" size="sm">Xem danh sách đầy đủ</Button></header>
            <div className="ranking-list">{[
              ["01", "Nhập môn Trí tuệ nhân tạo", "Nguyễn Thanh Thủy", "286", "4.8"],
              ["02", "Cấu trúc dữ liệu và giải thuật", "Nguyễn Đức Nghĩa", "243", "4.7"],
              ["03", "Mạng máy tính và hệ thống phân tán", "Lê Nhật Quang", "218", "4.5"],
              ["04", "An toàn thông tin trong kỷ nguyên số", "Phạm Văn Cường", "194", "4.4"],
              ["05", "Nhập môn Khoa học dữ liệu", "Trần Đức Khánh", "176", "4.6"],
            ].map(([rank, title, author, loans, rating]) => <div key={rank}><span>{rank}</span><div><strong>{title}</strong><small>{author}</small></div><div className="ranking-meter"><i className={`rank-${rank}`} /></div><b>{loans}<small> lượt</small></b><em>{rating} ★</em></div>)}</div>
          </section>
        </div>
      ) : (
        <div className="report-view-content">
          <div className="report-two-column demand-grid">
            <section className="report-panel">
              <header><div><h2>Tài liệu ít được mượn</h2><p>Không phát sinh hoặc có rất ít lượt mượn trong 12 tháng</p></div><Badge tone="warning">184 TÀI LIỆU</Badge></header>
              <div className="low-circulation-list">{[
                ["Kỹ thuật truyền dẫn quang nâng cao", "0 lượt", "18 tháng"],
                ["Mô hình toán trong kinh tế vi mô", "1 lượt", "11 tháng"],
                ["Ngôn ngữ lập trình Prolog", "2 lượt", "9 tháng"],
                ["Hệ thống thông tin địa lý", "2 lượt", "8 tháng"],
              ].map(([title, count, period]) => <article key={title}><span><Icon name="book" /></span><div><strong>{title}</strong><small>Lần mượn gần nhất: {period} trước</small></div><Badge>{count}</Badge></article>)}</div>
            </section>
            <section className="report-panel inventory-report">
              <header><div><h2>Tình trạng kho</h2><p>Phân bổ 52.184 bản cá biệt</p></div></header>
              <div className="inventory-report-total"><strong>52.184</strong><span>Tổng số bản</span></div>
              <div className="inventory-report-bar"><i className="inv-available" /><i className="inv-borrowed" /><i className="inv-damaged" /><i className="inv-audit" /></div>
              <div className="inventory-report-legend"><div><i className="inventory-available" /><span>Có sẵn</span><strong>49.862</strong><small>95,55%</small></div><div><i className="inventory-borrowed" /><span>Đang mượn</span><strong>1.284</strong><small>2,46%</small></div><div><i className="inventory-damaged" /><span>Hư hỏng</span><strong>892</strong><small>1,71%</small></div><div><i className="inventory-audit" /><span>Cần kiểm kê</span><strong>146</strong><small>0,28%</small></div></div>
            </section>
          </div>

          <section className="report-panel report-query-panel">
            <header><div><h2>Truy vấn không có kết quả</h2><p>Các nhu cầu tìm kiếm chưa được đáp ứng</p></div><Badge tone="warning">CẦN PHÂN TÍCH</Badge></header>
            <div className="report-query-table-wrap"><table><thead><tr><th>Query</th><th>Số lần tìm</th><th>Thời gian gần nhất</th><th>Xu hướng</th></tr></thead><tbody>
              <tr><td><strong>“mạng 6G và truyền thông lượng tử”</strong></td><td><b>28</b></td><td>22/06/2025 · 09:18</td><td><Badge tone="error">TĂNG NHANH</Badge></td></tr>
              <tr><td><strong>“AI tạo sinh trong thiết kế vi mạch”</strong></td><td><b>21</b></td><td>21/06/2025 · 16:42</td><td><Badge tone="warning">TĂNG</Badge></td></tr>
              <tr><td><strong>“giáo trình rust tiếng Việt”</strong></td><td><b>17</b></td><td>20/06/2025 · 14:05</td><td><Badge>ỔN ĐỊNH</Badge></td></tr>
              <tr><td><strong>“bảo mật cho thiết bị y tế IoT”</strong></td><td><b>12</b></td><td>19/06/2025 · 11:26</td><td><Badge>ỔN ĐỊNH</Badge></td></tr>
            </tbody></table></div>
          </section>
        </div>
      )}
    </div>
  );
}

function StaffDashboard() {
  const [dateRange, setDateRange] = useState("7 ngày");
  return (
    <div className="staff-dashboard">
      <div className="staff-dashboard-heading">
        <div><Breadcrumb items={["Không gian nghiệp vụ", "Tổng quan"]} /><p className="eyebrow">VẬN HÀNH THƯ VIỆN</p><h1>Dashboard thư viện</h1><p>Dữ liệu cập nhật lúc 09:42, ngày 22/06/2025</p></div>
        <div className="date-filter" role="group" aria-label="Khoảng thời gian">
          {["Hôm nay", "7 ngày", "30 ngày", "3 tháng", "Tùy chọn"].map((item) => <button key={item} className={dateRange === item ? "active" : ""} onClick={() => setDateRange(item)}>{item === "Tùy chọn" && <Icon name="filter" size={14} />}{item}</button>)}
        </div>
      </div>

      <section className="staff-summary-grid" aria-label="Chỉ số vận hành">
        {staffSummary.map((item) => <article key={item.label}><span className={`staff-metric-icon ${item.tone}`}><Icon name={item.icon} /></span><div><small>{item.label}</small><strong>{item.value}</strong><p className={item.tone === "error" ? "negative" : ""}>{item.change}</p></div></article>)}
      </section>

      <section className="staff-dashboard-grid">
        <article className="staff-panel circulation-panel">
          <header className="staff-panel-heading"><div><h2>Lưu thông tài liệu</h2><p>Số lượt giao dịch theo ngày</p></div><div className="chart-legend"><span><i className="legend-borrowed" />Mượn</span><span><i className="legend-returned" />Trả</span><span><i className="legend-overdue" />Quá hạn</span></div></header>
          <CirculationChart />
          <div className="chart-summary"><div><small>Tổng lượt mượn</small><strong>904</strong><span>+8,4%</span></div><div><small>Tổng lượt trả</small><strong>825</strong><span>+5,2%</span></div><div><small>Phát sinh quá hạn</small><strong>109</strong><span className="negative">+12,1%</span></div></div>
        </article>

        <aside className="staff-panel alerts-panel">
          <header className="staff-panel-heading"><div><h2>Cảnh báo vận hành</h2><p>4 nhóm cần chú ý</p></div><Badge tone="error">16 VIỆC</Badge></header>
          <div className="operational-alerts">
            <button><span className="alert-icon error"><Icon name="error" /></span><div><strong>Quá hạn nhiều</strong><p>12 bạn đọc quá hạn trên 30 ngày</p></div><b>12</b><Icon name="chevron-right" size={15} /></button>
            <button><span className="alert-icon error"><Icon name="document" /></span><div><strong>Tài liệu số xử lý lỗi</strong><p>3 tệp không thể trích xuất nội dung</p></div><b>3</b><Icon name="chevron-right" size={15} /></button>
            <button><span className="alert-icon warning"><Icon name="bookmark" /></span><div><strong>Hàng đợi đặt trước</strong><p>38 lượt đang chờ xử lý</p></div><b>38</b><Icon name="chevron-right" size={15} /></button>
            <button><span className="alert-icon info"><Icon name="library" /></span><div><strong>Tài liệu cần kiểm kê</strong><p>146 bản chưa xác nhận vị trí</p></div><b>146</b><Icon name="chevron-right" size={15} /></button>
          </div>
        </aside>
      </section>

      <section className="staff-dashboard-grid lower-grid">
        <article className="staff-panel popular-panel">
          <header className="staff-panel-heading"><div><h2>Tài liệu được mượn nhiều nhất</h2><p>Xếp hạng trong {dateRange.toLowerCase()} gần đây</p></div><Button variant="ghost" size="sm">Xem báo cáo<Icon name="chevron-right" size={15} /></Button></header>
          <div className="staff-table-wrap"><table className="staff-data-table"><thead><tr><th>Tài liệu</th><th>Lượt mượn</th><th>Đánh giá</th><th>Tình trạng</th></tr></thead><tbody>
            <tr><td><div className="staff-book-cell"><span>01</span><div><strong>Nhập môn Trí tuệ nhân tạo</strong><small>Nguyễn Thanh Thủy · 2024</small></div></div></td><td><b>86</b></td><td><Rating value={5} /><small>4.8</small></td><td><Status tone="success">3 / 5 bản có sẵn</Status></td></tr>
            <tr><td><div className="staff-book-cell"><span>02</span><div><strong>Cấu trúc dữ liệu và giải thuật</strong><small>Nguyễn Đức Nghĩa · 2023</small></div></div></td><td><b>73</b></td><td><Rating value={5} /><small>4.7</small></td><td><Status tone="warning">1 / 8 bản có sẵn</Status></td></tr>
            <tr><td><div className="staff-book-cell"><span>03</span><div><strong>Mạng máy tính và hệ thống phân tán</strong><small>Lê Nhật Quang · 2024</small></div></div></td><td><b>68</b></td><td><Rating value={4} /><small>4.5</small></td><td><Status tone="error">Hết bản có sẵn</Status></td></tr>
            <tr><td><div className="staff-book-cell"><span>04</span><div><strong>An toàn thông tin trong kỷ nguyên số</strong><small>Phạm Văn Cường · 2022</small></div></div></td><td><b>54</b></td><td><Rating value={4} /><small>4.4</small></td><td><Status tone="success">2 / 4 bản có sẵn</Status></td></tr>
          </tbody></table></div>
        </article>

        <article className="staff-panel inventory-panel">
          <header className="staff-panel-heading"><div><h2>Tình trạng kho</h2><p>Phân bổ 52.184 bản cá biệt</p></div><Button variant="ghost" size="sm">Chi tiết</Button></header>
          <div className="inventory-total"><div><small>TỔNG SỐ BẢN</small><strong>52.184</strong></div><span><i className="inventory-available" /><i className="inventory-borrowed" /><i className="inventory-damaged" /><i className="inventory-audit" /></span></div>
          <div className="inventory-list">
            <div><span><i className="inventory-available" />Có sẵn</span><strong>49.862</strong><small>95,55%</small></div>
            <div><span><i className="inventory-borrowed" />Đang mượn</span><strong>1.284</strong><small>2,46%</small></div>
            <div><span><i className="inventory-damaged" />Hư hỏng</span><strong>892</strong><small>1,71%</small></div>
            <div><span><i className="inventory-audit" />Cần kiểm kê</span><strong>146</strong><small>0,28%</small></div>
          </div>
        </article>
      </section>

      <section className="staff-panel no-query-panel">
        <header className="staff-panel-heading"><div><h2>Truy vấn không có kết quả</h2><p>Các nhu cầu bạn đọc chưa được đáp ứng trong 7 ngày qua</p></div><Badge tone="warning">CẦN PHÂN TÍCH</Badge></header>
        <div className="staff-table-wrap"><table className="staff-data-table query-table"><thead><tr><th>Truy vấn tìm kiếm</th><th>Số lượt tìm</th><th>Lần tìm gần nhất</th><th>Hành động đề xuất</th><th /></tr></thead><tbody>
          <tr><td><strong>“mạng 6G và truyền thông lượng tử”</strong></td><td><b>28</b></td><td>Hôm nay, 09:18</td><td><span className="suggested-action">Xem xét bổ sung tài liệu</span></td><td><IconButton label="Xem chi tiết" icon="chevron-right" /></td></tr>
          <tr><td><strong>“AI tạo sinh trong thiết kế vi mạch”</strong></td><td><b>21</b></td><td>Hôm qua, 16:42</td><td><span className="suggested-action">Kiểm tra từ khóa chủ đề</span></td><td><IconButton label="Xem chi tiết" icon="chevron-right" /></td></tr>
          <tr><td><strong>“giáo trình rust tiếng Việt”</strong></td><td><b>17</b></td><td>20/06/2025, 14:05</td><td><span className="suggested-action">Đề xuất mua bổ sung</span></td><td><IconButton label="Xem chi tiết" icon="chevron-right" /></td></tr>
          <tr><td><strong>“bảo mật cho thiết bị y tế IoT”</strong></td><td><b>12</b></td><td>19/06/2025, 11:26</td><td><span className="suggested-action">Mở rộng chỉ mục nội dung</span></td><td><IconButton label="Xem chi tiết" icon="chevron-right" /></td></tr>
        </tbody></table></div>
      </section>
    </div>
  );
}

function WorkProfilePage({ role }: { role: "staff" | "admin" }) {
  const data = workProfileData[role];
  const [editing, setEditing] = useState(false);
  const [contact, setContact] = useState({ phone: data.phone, address: data.address });
  const [draft, setDraft] = useState(contact);
  const [errors, setErrors] = useState<{ phone?: string; address?: string }>({});
  const [toast, setToast] = useState(false);
  const isAdmin = role === "admin";

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
  const saveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      phone: draft.phone.trim() ? undefined : "Vui lòng nhập số điện thoại.",
      address: !isAdmin && !draft.address.trim() ? "Vui lòng nhập địa chỉ." : undefined,
    };
    setErrors(nextErrors);
    if (nextErrors.phone || nextErrors.address) return;
    setContact(draft);
    setEditing(false);
    setToast(true);
    window.setTimeout(() => setToast(false), 3000);
  };

  return (
    <div className="work-profile-page">
      <Breadcrumb items={["Trang chủ", "Thông tin cá nhân"]} />
      <div className="work-profile-heading">
        <div><p className="eyebrow">{isAdmin ? "HỒ SƠ QUẢN TRỊ" : "HỒ SƠ NHÂN VIÊN"}</p><h1>Thông tin cá nhân</h1><p>Quản lý thông tin cá nhân và tài khoản làm việc của bạn.</p></div>
        <Badge tone={isAdmin ? "info" : "brand"}>{isAdmin ? "QUẢN TRỊ VIÊN HỆ THỐNG" : "NHÂN VIÊN THƯ VIỆN"}</Badge>
      </div>

      <section className="profile-summary-card work-profile-summary">
        <Avatar name={data.name} size="lg" />
        <div className="profile-summary-identity"><h2>{data.name}</h2><p>Mã nhân viên <strong>{data.employeeId}</strong></p></div>
        <div className="profile-summary-meta"><span><small>Chức vụ</small><strong>{data.title}</strong></span><span><small>Đơn vị công tác</small><strong>{data.department}</strong></span></div>
        <Badge tone="success"><Status tone="success">Đang hoạt động</Status></Badge>
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
              <div className="profile-fields-grid">
                <Field label="Họ và tên" value={data.name} readOnly hint="Thông tin này do hệ thống quản lý và không thể chỉnh sửa tại đây." />
                <Field label="Mã nhân viên" value={data.employeeId} readOnly />
                <Field label="Chức vụ" value={data.title} readOnly />
                <Field label="Đơn vị công tác" value={data.department} readOnly />
                <Field label="Email công việc" value={data.email} readOnly />
                <Field label="Số điện thoại" value={editing ? draft.phone : contact.phone} readOnly={!editing} onChange={(event) => { setDraft((current) => ({ ...current, phone: event.target.value })); setErrors((current) => ({ ...current, phone: undefined })); }} error={errors.phone} />
                {!isAdmin && <Field label="Địa chỉ" value={editing ? draft.address : contact.address} readOnly={!editing} onChange={(event) => { setDraft((current) => ({ ...current, address: event.target.value })); setErrors((current) => ({ ...current, address: undefined })); }} error={errors.address} />}
                <Field label="Ngày bắt đầu công tác" value={data.startDate} readOnly />
              </div>
              <p className="profile-permission-note"><Icon name="info" size={14} />Vai trò, mã nhân viên và đơn vị công tác do hệ thống quản lý. Bạn không thể tự thay đổi quyền truy cập tại đây.</p>
              {editing && <div className="profile-form-actions"><Button variant="ghost" type="button" onClick={cancelEditing}>Hủy</Button><Button type="submit">Lưu thay đổi</Button></div>}
            </form>
          </section>

          <section className="profile-card">
            <header className="profile-card-heading"><div><span><Icon name="settings" size={18} /></span><div><h2>Bảo mật và đăng nhập</h2><p>Thông tin xác thực của tài khoản làm việc.</p></div></div></header>
            <dl className="profile-login-details">
              <div><dt>Phương thức đăng nhập</dt><dd><Badge tone={isAdmin ? "info" : "brand"}>{isAdmin ? "Đăng nhập bằng Microsoft" : "Tài khoản thư viện"}</Badge></dd></div>
              <div><dt>Email liên kết</dt><dd>{data.email}</dd></div>
              {!isAdmin && <div><dt>Mật khẩu</dt><dd><span className="masked-password" aria-label="Mật khẩu đã được ẩn">••••••••••••</span></dd></div>}
              <div><dt>Lần đăng nhập thành công gần nhất</dt><dd>{data.lastLogin}</dd></div>
            </dl>
            <div className="profile-login-action">
              {!isAdmin && <Button variant="secondary" size="sm">Đổi mật khẩu</Button>}
              <p>{isAdmin ? "Thông tin xác thực được quản lý bởi hệ thống Microsoft của Học viện." : "Mật khẩu hiện tại luôn được bảo mật và không thể hiển thị."}</p>
            </div>
          </section>
        </div>

        <aside className="profile-side-column">
          <section className="profile-card work-account-card">
            <header className="profile-card-heading"><div><span><Icon name="library" size={18} /></span><div><h2>{isAdmin ? "Thông tin tài khoản quản trị" : "Thông tin tài khoản"}</h2><p>Định danh và vai trò làm việc hiện tại.</p></div></div></header>
            <dl className="reader-card-details">
              <div><dt>Tên tài khoản</dt><dd>{data.username}</dd></div>
              <div><dt>Vai trò</dt><dd><Badge tone={isAdmin ? "info" : "brand"}>{data.title}</Badge></dd></div>
              <div><dt>Trạng thái</dt><dd><Status tone="success">Đang hoạt động</Status></dd></div>
              <div><dt>Ngày tạo tài khoản</dt><dd>{data.createdAt}</dd></div>
              <div><dt>Lần đăng nhập gần nhất</dt><dd>{data.lastLogin}</dd></div>
            </dl>
            <p className="work-role-description"><Icon name="info" size={15} />{data.roleDescription}</p>
          </section>

          <section className="profile-card work-activity-card">
            <header className="profile-card-heading"><div><span><Icon name="document" size={18} /></span><div><h2>{data.activityTitle}</h2><p>Tóm tắt các thao tác gần nhất.</p></div></div></header>
            <div className="work-activity-list">
              {data.activities.map((activity) => <article key={`${activity.title}-${activity.time}`}><span><Icon name={activity.icon} size={16} /></span><div><strong>{activity.title}</strong><p>{activity.description}</p><time>{activity.time}</time></div><Badge tone={activity.tone}>{activity.status}</Badge></article>)}
            </div>
            <button className="work-activity-link">{data.activityAction}<Icon name="chevron-right" size={14} /></button>
          </section>

          <section className="profile-card account-status-card">
            <span className="account-status-icon"><Icon name="success" size={23} /></span>
            <p className="eyebrow">TRẠNG THÁI TÀI KHOẢN</p>
            <h2>Đang hoạt động</h2>
            <p>Tài khoản đang hoạt động bình thường.</p>
          </section>
        </aside>
      </div>
      {toast && <div className="toast-position"><Toast title="Cập nhật thành công" onClose={() => setToast(false)}>Thông tin cá nhân đã được cập nhật.</Toast></div>}
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
