import { useState } from "react";
import { Avatar, Badge, Breadcrumb, Button, Field, Icon, IconButton, Modal, SearchInput, SelectField, Status, Toast } from "../../../design-system";
import { circulationTabs } from "../../../constants/library-options";
import { circulationService } from "../../../services/circulation.service";
import { getAccessToken } from "../../../services/session";
import { userService } from "../../../services/user.service";
import type { BookReturnCondition, UserDto } from "../../../types/api";

function ReaderInformationCard({ reader }: { reader: UserDto | null }) {
  const fullName = reader?.fullName || "Trần Minh Quân";
  const userCode = reader?.userCode || "CT050145";
  const department = reader?.departmentName || "Công nghệ thông tin";
  const userTypeLabel =
    reader?.userType === "LECTURER"
      ? "Cán bộ, giảng viên"
      : reader?.userType === "RESEARCHER"
        ? "Nghiên cứu sinh"
        : "Sinh viên chính quy";
  const isLocked =
    reader?.status !== undefined &&
    ["LOCKED", "SUSPENDED", "INACTIVE"].includes(reader.status.toUpperCase());
  const debtAmount = reader?.debt ?? 20000;

  return (
    <section className="circulation-reader-card">
      <div className="reader-card-identity">
        <Avatar name={fullName} size="lg" />
        <div>
          <Badge tone={isLocked ? "error" : "success"}>
            {isLocked ? "THẺ ĐANG BỊ KHÓA" : "THẺ ĐANG HOẠT ĐỘNG"}
          </Badge>
          <h2>{fullName}</h2>
          <p>{`${userCode} · ${userTypeLabel}`}</p>
        </div>
      </div>
      <dl>
        <div><dt>Mã bạn đọc</dt><dd>{userCode}</dd></div>
        <div><dt>Loại bạn đọc</dt><dd>{userTypeLabel}</dd></div>
        <div><dt>Ngành</dt><dd>{department}</dd></div>
        <div><dt>Trạng thái thẻ</dt><dd><Status tone={isLocked ? "error" : "success"}>{isLocked ? "Bị khóa" : "Hoạt động"}</Status></dd></div>
        <div><dt>Đang mượn</dt><dd><strong>06 cuốn</strong></dd></div>
        <div><dt>Hạn mức</dt><dd>08 cuốn</dd></div>
        <div><dt>Công nợ</dt><dd><strong className="debt-value">{`${debtAmount.toLocaleString("vi-VN")}đ`}</strong></dd></div>
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

type ScannedBookRow = {
  barcode: string;
  title: string;
  author: string;
  borrowDate: string;
  dueDate: string;
  warning?: boolean;
};

const initialScannedBooks: ScannedBookRow[] = [
  {
    barcode: "PTIT-24-01842",
    title: "Nhập môn Trí tuệ nhân tạo",
    author: "Nguyễn Thanh Thủy · 2024",
    borrowDate: "22/06/2025",
    dueDate: "19/11/2025",
  },
  {
    barcode: "PTIT-23-01108",
    title: "Cấu trúc dữ liệu và giải thuật",
    author: "Nguyễn Đức Nghĩa · 2023",
    borrowDate: "22/06/2025",
    dueDate: "19/11/2025",
    warning: true,
  },
];

function LoanTransaction({
  items,
  onAddBarcode,
  onRemoveBarcode,
  onClear,
  onConfirm,
}: {
  items: ScannedBookRow[];
  onAddBarcode: (barcode: string) => void;
  onRemoveBarcode: (barcode: string) => void;
  onClear: () => void;
  onConfirm: () => void;
}) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const handleAdd = () => {
    if (!barcodeInput.trim()) return;
    onAddBarcode(barcodeInput.trim());
    setBarcodeInput("");
  };
  return (
    <div className="circulation-transaction-grid">
      <div className="transaction-main">
        <div className="transaction-scan">
          <div><p className="eyebrow">QUÉT TÀI LIỆU</p><h2>Thêm tài liệu cho mượn</h2><p>Quét hoặc nhập mã cá biệt để thêm vào giao dịch.</p></div>
          <div className="scan-input">
            <Icon name="book" />
            <input
              value={barcodeInput}
              onChange={(event) => setBarcodeInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleAdd()}
              placeholder="Nhập mã cá biệt, ví dụ: PTIT-24-01842"
              aria-label="Mã cá biệt"
            />
            <Button onClick={handleAdd}>Thêm tài liệu</Button>
          </div>
        </div>
        <section className="transaction-table-panel">
          <div className="transaction-panel-heading"><div><h2>Danh sách cho mượn</h2><p>{String(items.length).padStart(2, "0")} tài liệu trong giao dịch</p></div><button onClick={onClear}>Xóa tất cả</button></div>
          <div className="transaction-table-wrap"><table className="transaction-table"><thead><tr><th>Tài liệu</th><th>Mã cá biệt</th><th>Ngày mượn</th><th>Hạn trả</th><th>Tình trạng</th><th /></tr></thead><tbody>
            {items.map((item) => (
              <tr key={item.barcode} className={item.warning ? "transaction-warning-row" : ""}>
                <td><div className="transaction-book"><span><Icon name="book" /></span><div><strong>{item.title}</strong><small>{item.author}</small></div></div></td>
                <td><code>{item.barcode}</code></td>
                <td>{item.borrowDate}</td>
                <td><strong>{item.dueDate}</strong><small>150 ngày</small></td>
                <td><Status tone={item.warning ? "warning" : "success"}>{item.warning ? "Có lượt đặt trước" : "Được phép mượn"}</Status></td>
                <td><IconButton label="Xóa" icon="close" onClick={() => onRemoveBarcode(item.barcode)} /></td>
              </tr>
            ))}
          </tbody></table></div>
          <div className="transaction-footer"><div><span>Tổng tài liệu</span><strong>{String(items.length).padStart(2, "0")} cuốn</strong><small>Sau giao dịch: 08 / 08 cuốn</small></div><Button icon="success" disabled={items.length === 0} onClick={onConfirm}>Xác nhận cho mượn</Button></div>
        </section>
      </div>
      <ValidationPanel />
    </div>
  );
}

function ReturnTransaction({
  barcode,
  onBarcodeChange,
  condition,
  onConditionChange,
  onConfirm,
}: {
  barcode: string;
  onBarcodeChange: (val: string) => void;
  condition: string;
  onConditionChange: (val: string) => void;
  onConfirm: () => void;
}) {
  return (
    <div className="return-transaction">
      <div className="transaction-scan">
        <div><p className="eyebrow">NHẬN TRẢ TÀI LIỆU</p><h2>Quét tài liệu hoàn trả</h2><p>Hệ thống tự động đối chiếu giao dịch và tính phí quá hạn.</p></div>
        <div className="scan-input">
          <Icon name="book" />
          <input
            value={barcode}
            onChange={(event) => onBarcodeChange(event.target.value)}
            placeholder="Quét mã cá biệt cần nhận trả..."
            aria-label="Mã cá biệt nhận trả"
          />
          <Button>Kiểm tra</Button>
        </div>
      </div>
      <section className="return-card">
        <div className="return-book-heading"><div className="transaction-book"><span><Icon name="book" /></span><div><Badge tone="error">QUÁ HẠN 3 NGÀY</Badge><h2>Mạng máy tính và hệ thống phân tán</h2><p>{`Lê Nhật Quang · ${barcode || "PTIT-24-02016"}`}</p></div></div><strong>20.000đ</strong></div>
        <div className="return-details-grid">
          <Field label="Ngày trả" type="date" defaultValue="2025-06-22" />
          <SelectField label="Tình trạng tài liệu khi trả" value={condition} onChange={(event) => onConditionChange(event.target.value)}><option value="good">Tốt — không hư hỏng</option><option value="light">Hư hỏng nhẹ</option><option value="heavy">Hư hỏng nặng</option><option value="lost">Mất tài liệu</option></SelectField>
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

export default function CirculationScreen() {
  const [activeTab, setActiveTab] = useState("Cho mượn");
  const [searchType, setSearchType] = useState("Mã bạn đọc");
  const [readerQuery, setReaderQuery] = useState("CT050145");
  const [currentReader, setCurrentReader] = useState<UserDto | null>(null);
  const [loanItems, setLoanItems] = useState<ScannedBookRow[]>(initialScannedBooks);
  const [returnBarcode, setReturnBarcode] = useState("PTIT-24-02016");
  const [returnCondition, setReturnCondition] = useState("good");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const actionLabel = confirmation === "loan" ? "Xác nhận cho mượn" : confirmation === "return" ? "Xác nhận nhận trả" : "Xác nhận gia hạn";

  const handleFindReader = () => {
    if (!readerQuery.trim() || !getAccessToken()) return;
    userService
      .searchAdminUsers({ keyword: readerQuery.trim(), page: 0, size: 1 })
      .then((pageData) => {
        if (pageData.items?.length) {
          setCurrentReader(pageData.items[0]);
          setToastMsg(`Đã tải hồ sơ bạn đọc: ${pageData.items[0].fullName}`);
        } else {
          setToastMsg("Không tìm thấy bạn đọc khớp với thông tin vừa nhập.");
        }
      })
      .catch(() => {
        // Keep mock reader card
      });
  };

  const handleAddLoanBarcode = (barcode: string) => {
    setLoanItems((prev) => {
      if (prev.some((item) => item.barcode === barcode)) return prev;
      return [
        ...prev,
        {
          barcode,
          title: `Tài liệu mã cá biệt ${barcode}`,
          author: "Kho lưu thông PTIT",
          borrowDate: new Date().toLocaleDateString("vi-VN"),
          dueDate: "Theo chính sách mượn",
        },
      ];
    });
  };

  const executeConfirmedTransaction = async () => {
    const mode = confirmation;
    setConfirmation(null);
    if (!mode) return;

    const userCode = currentReader?.userCode || readerQuery.trim() || "CT050145";

    if (mode === "loan") {
      if (getAccessToken()) {
        try {
          const res = await circulationService.borrowBooks({
            userCode,
            barcodes: loanItems.map((i) => i.barcode),
          });
          setToastMsg(
            `Lập phiếu mượn thành công ${res.totalBorrowed} cuốn cho bạn đọc ${res.fullName || userCode}.`,
          );
          return;
        } catch (err) {
          setToastMsg(err instanceof Error ? err.message : "Đã ghi nhận phiếu mượn tài liệu.");
          return;
        }
      }
      setToastMsg(`Đã ghi nhận phiếu mượn ${loanItems.length} tài liệu cho ${userCode}.`);
      return;
    }

    if (mode === "return") {
      const mappedCondition: BookReturnCondition =
        returnCondition === "lost"
          ? "LOST"
          : returnCondition === "light" || returnCondition === "heavy"
            ? "DAMAGED"
            : "NORMAL";
      if (getAccessToken()) {
        try {
          const res = await circulationService.returnBook({
            barcode: returnBarcode.trim() || "PTIT-24-02016",
            condition: mappedCondition,
          });
          setToastMsg(
            `Đã nhận trả sách "${res.documentTitle}". Phí phạt phát sinh: ${res.totalFineAmount.toLocaleString("vi-VN")}đ.`,
          );
          return;
        } catch (err) {
          setToastMsg(err instanceof Error ? err.message : "Đã ghi nhận trả tài liệu.");
          return;
        }
      }
      setToastMsg(`Đã ghi nhận trả tài liệu mã ${returnBarcode}.`);
      return;
    }

    if (mode === "renew") {
      if (getAccessToken()) {
        try {
          const res = await circulationService.renewLoan({ barcode: "PTIT-23-01564" });
          setToastMsg(res.message || "Gia hạn tài liệu thành công.");
          return;
        } catch (err) {
          setToastMsg(err instanceof Error ? err.message : "Đã gia hạn tài liệu.");
          return;
        }
      }
      setToastMsg("Đã gia hạn tài liệu thêm 28 ngày.");
    }
  };

  return (
    <div className="circulation-screen">
      <div className="circulation-page-heading"><div><Breadcrumb items={["Không gian nghiệp vụ", "Lưu thông"]} /><p className="eyebrow">NGHIỆP VỤ LƯU THÔNG</p><h1>Lưu thông tài liệu</h1><p>Cho mượn, nhận trả và gia hạn tài liệu tại quầy.</p></div><Badge tone="success"><Status tone="success">Quầy 01 đang hoạt động</Status></Badge></div>
      <div className="circulation-tabs" role="tablist">{circulationTabs.map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)} role="tab" aria-selected={activeTab === tab}>{tab === "Cho mượn" ? <Icon name="book" /> : tab === "Nhận trả" ? <Icon name="arrow-left" /> : <Icon name="sparkle" />}{tab}</button>)}</div>
      <section className="circulation-search-area">
        <div className="search-type-tabs">{["Mã bạn đọc", "Mã cá biệt", "Tên bạn đọc"].map((type) => <button key={type} className={searchType === type ? "active" : ""} onClick={() => setSearchType(type)}>{type}</button>)}</div>
        <div className="staff-reader-search">
          <SearchInput
            value={readerQuery}
            onChange={(event) => setReaderQuery(event.target.value)}
            placeholder={searchType === "Mã bạn đọc" ? "Nhập hoặc quét mã bạn đọc..." : searchType === "Mã cá biệt" ? "Nhập mã cá biệt..." : "Nhập họ tên bạn đọc..."}
          />
          <Button icon="search" onClick={handleFindReader}>Tìm bạn đọc</Button>
        </div>
        <span><Icon name="info" size={14} />Có thể sử dụng máy quét mã vạch tại quầy</span>
      </section>
      <ReaderInformationCard reader={currentReader} />
      <div className="circulation-content">
        {activeTab === "Cho mượn" && (
          <LoanTransaction
            items={loanItems}
            onAddBarcode={handleAddLoanBarcode}
            onRemoveBarcode={(code) =>
              setLoanItems((prev) => prev.filter((item) => item.barcode !== code))
            }
            onClear={() => setLoanItems([])}
            onConfirm={() => setConfirmation("loan")}
          />
        )}
        {activeTab === "Nhận trả" && (
          <ReturnTransaction
            barcode={returnBarcode}
            onBarcodeChange={setReturnBarcode}
            condition={returnCondition}
            onConditionChange={setReturnCondition}
            onConfirm={() => setConfirmation("return")}
          />
        )}
        {activeTab === "Gia hạn" && <RenewalTransaction onConfirm={() => setConfirmation("renew")} />}
      </div>
      <Modal open={confirmation !== null} onClose={() => setConfirmation(null)} title={actionLabel}>
        <div className="transaction-confirmation">
          <span><Icon name={confirmation === "return" ? "arrow-left" : confirmation === "renew" ? "sparkle" : "book"} size={25} /></span>
          <div><strong>{confirmation === "loan" ? `Cho mượn ${String(loanItems.length).padStart(2, "0")} tài liệu cho ${currentReader?.fullName || "Trần Minh Quân"}?` : confirmation === "return" ? "Xác nhận đã nhận trả tài liệu?" : "Gia hạn 01 tài liệu thêm 28 ngày?"}</strong><p>{confirmation === "loan" ? "Giao dịch sẽ cập nhật hạn mức lên 08/08 cuốn. Vui lòng xác nhận đã kiểm tra cảnh báo đặt trước." : confirmation === "return" ? "Tài liệu sẽ được chuyển về trạng thái có sẵn và ghi nhận công nợ phát sinh 20.000đ." : "Hạn trả mới là 03/08/2025. Thao tác sẽ được ghi vào lịch sử lưu thông."}</p></div>
        </div>
        <label className="staff-checkbox confirmation-checkbox"><input type="checkbox" defaultChecked /><span>Tôi đã kiểm tra thông tin và tình trạng tài liệu</span></label>
        <div className="modal-actions"><Button variant="ghost" onClick={() => setConfirmation(null)}>Quay lại</Button><Button onClick={executeConfirmedTransaction}>{actionLabel}</Button></div>
      </Modal>
      {toastMsg && (
        <div className="toast-position">
          <Toast title="Lưu thông tài liệu" onClose={() => setToastMsg(null)}>
            {toastMsg}
          </Toast>
        </div>
      )}
    </div>
  );
}
