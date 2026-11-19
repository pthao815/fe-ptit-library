import { useRef, useState } from "react";
import { Avatar, Badge, Breadcrumb, Button, Field, Icon, IconButton, Modal, SearchInput, SelectField, Status, Toast } from "../../../design-system";
import { circulationTabs } from "../../../constants/library-options";
import { circulationService } from "../../../services/circulation.service";
import { getAccessToken } from "../../../services/session";
import { userService } from "../../../services/user.service";
import type { BookReturnCondition, FineItemDto, UserDto } from "../../../types/api";

function ReaderInformationCard({ reader }: { reader: UserDto | null }) {
  const fullName = reader?.fullName || "—";
  const userCode = reader?.userCode || "—";
  const department = reader?.departmentName || "—";
  const userTypeLabel =
    reader?.userType === "LECTURER"
      ? "Cán bộ, giảng viên"
      : reader?.userType === "RESEARCHER"
        ? "Nghiên cứu sinh"
        : "Sinh viên chính quy";
  const status = reader?.status || "—";
  const isActive = status === "ACTIVE";
  const debtAmount = reader?.debt;

  return (
    <section className="circulation-reader-card">
      <div className="reader-card-identity">
        <Avatar name={fullName} size="lg" />
        <div>
          <Badge tone={isActive ? "success" : "warning"}>
            {isActive ? "THẺ ĐANG HOẠT ĐỘNG" : status}
          </Badge>
          <h2>{fullName}</h2>
          <p>{`${userCode} · ${userTypeLabel}`}</p>
        </div>
      </div>
      <dl>
        <div><dt>Mã bạn đọc</dt><dd>{userCode}</dd></div>
        <div><dt>Loại bạn đọc</dt><dd>{userTypeLabel}</dd></div>
        <div><dt>Ngành</dt><dd>{department}</dd></div>
        <div><dt>Trạng thái thẻ</dt><dd><Status tone={isActive ? "success" : "warning"}>{isActive ? "Hoạt động" : status}</Status></dd></div>
        <div><dt>Công nợ</dt><dd><strong className="debt-value">{`${debtAmount == null ? "—" : debtAmount.toLocaleString("vi-VN") + "đ"}`}</strong></dd></div>
      </dl>
    </section>
  );
}

function ValidationPanel() {
  return <section className="validation-panel">
    <h2>Điều kiện lưu thông</h2>
    <p>Máy chủ sẽ kiểm tra trạng thái thẻ, hạn mức và mã vạch khi lập phiếu.</p>
  </section>;
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
                <td><Status tone={item.warning ? "warning" : "neutral"}>{item.warning ? "Có lượt đặt trước" : "Chờ kiểm tra"}</Status></td>
                <td><IconButton label="Xóa" icon="close" onClick={() => onRemoveBarcode(item.barcode)} /></td>
              </tr>
            ))}
          </tbody></table></div>
          <div className="transaction-footer"><div><span>Tổng tài liệu</span><strong>{String(items.length).padStart(2, "0")} cuốn</strong></div><Button icon="success" disabled={items.length === 0} onClick={onConfirm}>Xác nhận cho mượn</Button></div>
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
  payImmediately,
  onPayImmediatelyChange,
  recentFines,
  onPayFine,
  payingFineId,
}: {
  barcode: string;
  onBarcodeChange: (val: string) => void;
  condition: string;
  onConditionChange: (val: string) => void;
  onConfirm: () => void;
  payImmediately: boolean;
  onPayImmediatelyChange: (val: boolean) => void;
  recentFines: FineItemDto[];
  onPayFine: (fineId: number) => void;
  payingFineId: number | null;
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
        <label className="staff-checkbox"><input type="checkbox" checked={payImmediately} onChange={(event) => onPayImmediatelyChange(event.target.checked)} /><span>Bạn đọc thanh toán công nợ ngay tại quầy</span></label>
        {recentFines.length > 0 && (
          <div className="debt-section">
            <p><strong>Các khoản phạt vừa phát sinh:</strong></p>
            {recentFines.map((fine) => (
              <div key={fine.fineId} className="debt-row">
                <div>
                  <Badge tone={fine.status === "PAID" ? "success" : "error"}>
                    {fine.status === "PAID" ? "ĐÃ THU" : "CHƯA THU"}
                  </Badge>
                  <strong>{fine.reason}</strong>
                  <small>{fine.barcode ? `Mã vạch: ${fine.barcode}` : ""}</small>
                </div>
                <div>
                  <span>{`${fine.fineAmount.toLocaleString("vi-VN")}đ`}</span>
                  {fine.status !== "PAID" && (
                    <Button
                      size="sm"
                      loading={payingFineId === fine.fineId}
                      onClick={() => onPayFine(fine.fineId)}
                    >
                      Thu tiền ngay
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
  const readerLookup = useRef(0);
  const [readerQuery, setReaderQuery] = useState("");
  const [readerResults, setReaderResults] = useState<UserDto[]>([]);
  const [findingReader, setFindingReader] = useState(false);
  const [hasMoreReaders, setHasMoreReaders] = useState(false);
  const [currentReader, setCurrentReader] = useState<UserDto | null>(null);
  const [loanItems, setLoanItems] = useState<ScannedBookRow[]>([]);
  const [returnBarcode, setReturnBarcode] = useState("");
  const [renewBarcode, setRenewBarcode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [returnCondition, setReturnCondition] = useState("good");
  const [payImmediately, setPayImmediately] = useState(true);
  const [recentFines, setRecentFines] = useState<FineItemDto[]>([]);
  const [payingFineId, setPayingFineId] = useState<number | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const actionLabel = confirmation === "loan" ? "Xác nhận cho mượn" : confirmation === "return" ? "Xác nhận nhận trả" : "Xác nhận gia hạn";

  const handlePayFine = async (fineId: number) => {
    if (payingFineId !== null) return;
    setPayingFineId(fineId);
    try {
      const res = await circulationService.payFine(fineId, "Thu tiền trực tiếp tại quầy lưu thông");
      setToastMsg(`Đã thu ${res.fineAmount.toLocaleString("vi-VN")}đ. Trạng thái: ${res.status}.`);
      setRecentFines((prev) =>
        prev.map((f) => (f.fineId === fineId ? { ...f, status: "PAID" as const } : f)),
      );
    } catch (err) {
      setToastMsg(err instanceof Error ? err.message : "Không thể ghi nhận thanh toán khoản phạt.");
    } finally {
      setPayingFineId(null);
    }
  };

  const resetReaderLookup = () => {
    readerLookup.current++;
    setCurrentReader(null);
    setReaderResults([]);
    setFindingReader(false);
    setHasMoreReaders(false);
    setToastMsg(null);
  };

  const handleFindReader = async () => {
    const keyword = readerQuery.trim();
    if (!keyword || !getAccessToken()) return;
    resetReaderLookup();
    const request = readerLookup.current;
    setFindingReader(true);
    try {
      const data = await userService.searchAdminUsers({ keyword, role: "READER", page: 0, size: 10 });
      if (request !== readerLookup.current) return;
      setReaderResults(data.items);
      setHasMoreReaders(data.hasNext);
      if (!data.items.length) setToastMsg("Không tìm thấy bạn đọc phù hợp.");
    } catch (error) {
      if (request === readerLookup.current) {
        setToastMsg(error instanceof Error ? error.message : "Không tải được hồ sơ bạn đọc.");
      }
    } finally {
      if (request === readerLookup.current) setFindingReader(false);
    }
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
    if (!mode || processing) return;
    if (!getAccessToken()) { setToastMsg("Vui lòng đăng nhập lại."); return; }
    if (mode === "loan" && (!currentReader || !loanItems.length)) {
      setToastMsg("Hãy tìm đúng bạn đọc và nhập mã vạch tài liệu.");
      return;
    }
    if (mode === "return" && !returnBarcode.trim() || mode === "renew" && !renewBarcode.trim()) {
      setToastMsg("Vui lòng nhập mã vạch tài liệu.");
      return;
    }
    setProcessing(true);
    try {
      if (mode === "loan" && currentReader) {
        const result = await circulationService.borrowBooks({
          userCode: currentReader.userCode,
          barcodes: loanItems.map((item) => item.barcode),
        });
        setToastMsg("Đã lập phiếu mượn cho " + result.totalBorrowed + " tài liệu.");
        setLoanItems([]);
      } else if (mode === "return") {
        const condition: BookReturnCondition = returnCondition === "lost" ? "LOST"
          : returnCondition === "light" || returnCondition === "heavy" ? "DAMAGED" : "NORMAL";
        const result = await circulationService.returnBook({ barcode: returnBarcode.trim(), condition });
        let msg = `Đã nhận trả ${result.documentTitle}. Phí phát sinh: ${result.totalFineAmount.toLocaleString("vi-VN")}đ.`;
        const generatedFines = result.generatedFines ?? [];
        if (generatedFines.length) {
          setRecentFines((prev) => [...generatedFines, ...prev]);
          if (payImmediately) {
            for (const fine of generatedFines) {
              try {
                await circulationService.payFine(fine.fineId, "Thu tiền ngay khi nhận trả sách tại quầy");
                setRecentFines((prev) =>
                  prev.map((f) => (f.fineId === fine.fineId ? { ...f, status: "PAID" as const } : f)),
                );
              } catch {
                // Keep fine unpaid if error occurs
              }
            }
            msg += " Đã tự động thu tiền công nợ tại quầy.";
          }
        }
        setToastMsg(msg);
        setReturnBarcode("");
      } else if (mode === "renew") {
        const result = await circulationService.renewLoan({ barcode: renewBarcode.trim() });
        setToastMsg(result.message || (result.renewalStatus === "SUCCESS" ? "Đã gia hạn tài liệu." : "Yêu cầu gia hạn bị từ chối."));
        setRenewBarcode("");
      }
      setConfirmation(null);
    } catch (error) {
      setToastMsg(error instanceof Error ? error.message : "Máy chủ chưa xác nhận giao dịch.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="circulation-screen">
      <div className="circulation-page-heading"><div><Breadcrumb items={["Không gian nghiệp vụ", "Lưu thông"]} /><p className="eyebrow">NGHIỆP VỤ LƯU THÔNG</p><h1>Lưu thông tài liệu</h1><p>Cho mượn, nhận trả và gia hạn tài liệu tại quầy.</p></div><Badge tone="success"><Status tone="success">Quầy 01 đang hoạt động</Status></Badge></div>
      <div className="circulation-tabs" role="tablist">{circulationTabs.map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)} role="tab" aria-selected={activeTab === tab}>{tab === "Cho mượn" ? <Icon name="book" /> : tab === "Nhận trả" ? <Icon name="arrow-left" /> : <Icon name="sparkle" />}{tab}</button>)}</div>
      <section className="circulation-search-area">
        <div className="search-type-tabs">{["Mã bạn đọc", "Tên bạn đọc"].map((type) => <button key={type} className={searchType === type ? "active" : ""} onClick={() => { setSearchType(type); resetReaderLookup(); }}>{type}</button>)}</div>
        <div className="staff-reader-search">
          <SearchInput
            value={readerQuery}
            onChange={(event) => { setReaderQuery(event.target.value); resetReaderLookup(); }}
            placeholder={searchType === "Mã bạn đọc" ? "Nhập hoặc quét mã bạn đọc..." : "Nhập họ tên bạn đọc..."}
          />
          <Button icon="search" loading={findingReader} disabled={!readerQuery.trim()} onClick={handleFindReader}>Tìm bạn đọc</Button>
        </div>
        {readerResults.length > 0 && <fieldset>
          <legend>Chọn đúng bạn đọc trước khi lập phiếu</legend>
          {readerResults.map((reader) => <label key={reader.id} style={{ display: "block" }}>
            <input type="radio" name="circulation-reader" checked={currentReader?.id === reader.id}
              onChange={() => setCurrentReader(reader)} />{" "}
            {reader.fullName} · {reader.userCode} {reader.departmentName ? "· " + reader.departmentName : ""}
          </label>)}
          {hasMoreReaders && <p>Chỉ hiển thị 10 kết quả đầu. Nhập mã bạn đọc để thu hẹp tìm kiếm.</p>}
        </fieldset>}
        <span><Icon name="info" size={14} />Có thể sử dụng máy quét mã vạch tại quầy</span>
      </section>
      {currentReader && <ReaderInformationCard reader={currentReader} />}
      <div className="circulation-content">
        {activeTab === "Cho mượn" && (
          <LoanTransaction
            items={loanItems}
            onAddBarcode={handleAddLoanBarcode}
            onRemoveBarcode={(code) =>
              setLoanItems((prev) => prev.filter((item) => item.barcode !== code))
            }
            onClear={() => setLoanItems([])}
            onConfirm={() => currentReader ? setConfirmation("loan") : setToastMsg("Hãy tìm bạn đọc trước khi lập phiếu.")}
          />
        )}
        {activeTab === "Nhận trả" && (
          <ReturnTransaction
            barcode={returnBarcode}
            onBarcodeChange={setReturnBarcode}
            condition={returnCondition}
            onConditionChange={setReturnCondition}
            onConfirm={() => setConfirmation("return")}
            payImmediately={payImmediately}
            onPayImmediatelyChange={setPayImmediately}
            recentFines={recentFines}
            onPayFine={handlePayFine}
            payingFineId={payingFineId}
          />
        )}
        {activeTab === "Gia hạn" && <section className="circulation-search-area">
          <SearchInput aria-label="Mã vạch tài liệu gia hạn" value={renewBarcode} onChange={(event) => setRenewBarcode(event.target.value)} />
          <Button disabled={!renewBarcode.trim()} onClick={() => setConfirmation("renew")}>Gia hạn</Button>
        </section>}
      </div>
      <Modal open={confirmation !== null} onClose={() => { if (!processing) setConfirmation(null); }} title={actionLabel}>
        <div className="transaction-confirmation">
          <span><Icon name={confirmation === "return" ? "arrow-left" : confirmation === "renew" ? "sparkle" : "book"} size={25} /></span>
          <div><strong>{confirmation === "loan" ? `Cho mượn ${String(loanItems.length).padStart(2, "0")} tài liệu cho ${currentReader?.fullName ?? ""}?` : confirmation === "return" ? "Nhận trả mã " + returnBarcode + "?" : "Gia hạn mã " + renewBarcode + "?"}</strong><p>Kiểm tra mã vạch và thông tin bạn đọc trước khi xác nhận.</p></div>
        </div>
        <label className="staff-checkbox confirmation-checkbox"><input type="checkbox" defaultChecked /><span>Tôi đã kiểm tra thông tin và tình trạng tài liệu</span></label>
        <div className="modal-actions"><Button variant="ghost" onClick={() => setConfirmation(null)}>Quay lại</Button><Button loading={processing} onClick={executeConfirmedTransaction}>{actionLabel}</Button></div>
      </Modal>
      {toastMsg && (
        <div className="toast-position">
          <Toast tone="info" title="Lưu thông tài liệu" onClose={() => setToastMsg(null)}>
            {toastMsg}
          </Toast>
        </div>
      )}
    </div>
  );
}
