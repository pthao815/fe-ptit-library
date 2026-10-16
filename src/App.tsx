import { useEffect, useState } from "react";
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Field,
  Icon,
  IconButton,
  Modal,
  Rating,
  SearchInput,
  SelectField,
  Status,
  TextAreaField,
  Toast,
} from "./design-system";
import type { Role, Book } from "./types/library";
import { readerNavigation } from "./constants/navigation";
import { circulationTabs, trainingPrograms } from "./constants/library-options";
import { detailBook } from "./data/books";
import { workProfileData } from "./data/profiles";
import StaffDashboard from "./pages/staff/dashboard/StaffDashboard";
import ReservationManagementPage from "./pages/staff/reservations/ReservationManagementPage";
import ReaderManagementPage from "./pages/staff/readers/ReaderManagementPage";
import { logout } from "./utils/logout";
import Brand from "./components/common/Brand";
import UserMenu from "./components/common/UserMenu";
import ShellPlaceholder from "./components/common/ShellPlaceholder";
import BookCover from "./components/books/BookCover";
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
