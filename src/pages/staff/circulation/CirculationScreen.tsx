import { useRef, useState } from "react";
import { Avatar, Badge, Breadcrumb, Button, EmptyState, Field, Icon, IconButton, LoadingState, Modal, SearchInput, SelectField, Status, Toast } from "../../../design-system";
import { circulationTabs } from "../../../constants/library-options";
import { circulationService } from "../../../services/circulation.service";
import { getAccessToken } from "../../../services/session";
import { userService } from "../../../services/user.service";
import type { BookReturnCondition, CopyLookupDto, FineItemDto, UserDto } from "../../../types/api";

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
  /** Kết quả tra cứu bản sách; undefined = đang tra cứu */
  copy?: CopyLookupDto;
  error?: string;
};

const COPY_STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Sẵn sàng cho mượn",
  BORROWED: "Đang được mượn",
  RESERVED: "Đang giữ đặt trước",
  DAMAGED: "Hư hỏng",
  LOST: "Đã mất",
  MAINTENANCE: "Đang bảo trì",
};

// Đánh giá một dòng trong phiếu mượn đối với bạn đọc đang chọn
function loanRowState(row: ScannedBookRow, readerCode?: string): { tone: "success" | "warning" | "error" | "neutral"; label: string; blocking: boolean } {
  if (row.error) return { tone: "error", label: row.error.startsWith("Không tìm thấy") ? "Không tìm thấy mã này" : "Lỗi tra cứu", blocking: true };
  if (!row.copy) return { tone: "neutral", label: "Đang tra cứu…", blocking: true };
  const { status, reservedFor } = row.copy;
  if (status === "AVAILABLE") return { tone: "success", label: COPY_STATUS_LABEL.AVAILABLE, blocking: false };
  if (status === "RESERVED" && reservedFor) {
    return reservedFor.userCode === readerCode
      ? { tone: "success", label: "Đang giữ cho bạn đọc này", blocking: false }
      : { tone: "warning", label: `Đang giữ cho ${reservedFor.fullName}`, blocking: true };
  }
  return { tone: "error", label: COPY_STATUS_LABEL[status] ?? status, blocking: true };
}

type ReturnLookup = { status: "idle" | "loading" | "error" | "ready"; copy?: CopyLookupDto; error?: string };

function formatViDate(iso?: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function LoanTransaction({
  items,
  readerCode,
  onAddBarcode,
  onRemoveBarcode,
  onClear,
  onConfirm,
}: {
  items: ScannedBookRow[];
  readerCode?: string;
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
          {items.length === 0 ? (
            <EmptyState
              size="sm"
              icon="book"
              title="Chưa có tài liệu trong giao dịch"
              description="Quét hoặc nhập mã cá biệt ở ô phía trên để thêm tài liệu cần cho mượn."
            />
          ) : (
            <div className="transaction-table-wrap"><table className="transaction-table"><thead><tr><th>Tài liệu</th><th>Mã cá biệt</th><th>Vị trí</th><th>Tình trạng</th><th /></tr></thead><tbody>
              {items.map((item) => {
                const state = loanRowState(item, readerCode);
                const copy = item.copy;
                const byline = copy ? [copy.authors.join(", "), copy.publicationYear].filter(Boolean).join(" · ") : "";
                return (
                  <tr key={item.barcode} className={state.blocking && item.copy ? "transaction-warning-row" : ""}>
                    <td><div className="transaction-book"><span><Icon name="book" /></span><div><strong>{copy?.documentTitle ?? (item.error ? "Không tra cứu được" : "Đang tra cứu…")}</strong><small>{byline || "—"}</small></div></div></td>
                    <td><code>{item.barcode}</code></td>
                    <td>{copy ? [copy.shelfLocation, copy.callNumber].filter(Boolean).join(" · ") || "—" : "—"}</td>
                    <td><Status tone={state.tone}>{state.label}</Status></td>
                    <td><IconButton label="Xóa" icon="close" onClick={() => onRemoveBarcode(item.barcode)} /></td>
                  </tr>
                );
              })}
            </tbody></table></div>
          )}
          <div className="transaction-footer">
            <div><span>Tổng tài liệu</span><strong>{String(items.length).padStart(2, "0")} cuốn</strong>{items.some((item) => loanRowState(item, readerCode).blocking) && <small>Bỏ các tài liệu không sẵn sàng trước khi xác nhận</small>}</div>
            <Button icon="success" disabled={items.length === 0 || items.some((item) => loanRowState(item, readerCode).blocking)} onClick={onConfirm}>Xác nhận cho mượn</Button>
          </div>
        </section>
      </div>
      <ValidationPanel />
    </div>
  );
}

function ReturnTransaction({
  barcode,
  onBarcodeChange,
  lookup,
  onLookup,
  onCancel,
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
  lookup: ReturnLookup;
  onLookup: () => void;
  onCancel: () => void;
  condition: string;
  onConditionChange: (val: string) => void;
  onConfirm: () => void;
  payImmediately: boolean;
  onPayImmediatelyChange: (val: boolean) => void;
  recentFines: FineItemDto[];
  onPayFine: (fineId: number) => void;
  payingFineId: number | null;
}) {
  const copy = lookup.copy;
  const loan = copy?.activeLoan;
  const overdueFine = loan?.estimatedOverdueFine ?? 0;
  return (
    <div className="return-transaction">
      <div className="transaction-scan">
        <div><p className="eyebrow">NHẬN TRẢ TÀI LIỆU</p><h2>Quét tài liệu hoàn trả</h2><p>Hệ thống tự động đối chiếu giao dịch và tính phí quá hạn.</p></div>
        <form className="scan-input" onSubmit={(event) => { event.preventDefault(); onLookup(); }}>
          <Icon name="book" />
          <input
            value={barcode}
            onChange={(event) => onBarcodeChange(event.target.value)}
            placeholder="Quét mã cá biệt cần nhận trả..."
            aria-label="Mã cá biệt nhận trả"
          />
          <Button type="submit" loading={lookup.status === "loading"} disabled={!barcode.trim()}>Kiểm tra</Button>
        </form>
      </div>
      {lookup.status === "idle" ? (
        <EmptyState surface="card" icon="arrow-left" title="Quét mã cá biệt để bắt đầu" description="Hệ thống sẽ hiện bạn đọc đang mượn, hạn trả và phí quá hạn dự kiến trước khi bạn xác nhận nhận trả." />
      ) : lookup.status === "loading" ? (
        <LoadingState surface="card" title="Đang tra cứu bản sách…" />
      ) : lookup.status === "error" ? (
        <EmptyState surface="card" tone="error" title="Không tra cứu được bản sách" description={lookup.error ?? "Kiểm tra lại mã cá biệt."} />
      ) : copy && !loan ? (
        <EmptyState surface="card" icon="book" title={copy.documentTitle} description={`Mã ${copy.barcode} hiện không có lượt mượn nào đang mở (${COPY_STATUS_LABEL[copy.status] ?? copy.status}).`} />
      ) : copy && loan && (
      <section className="return-card">
        <div className="return-book-heading"><div className="transaction-book"><span><Icon name="book" /></span><div>{loan.overdueDays > 0 ? <Badge tone="error">{`QUÁ HẠN ${loan.overdueDays} NGÀY`}</Badge> : <Badge tone="success">TRONG HẠN</Badge>}<h2>{copy.documentTitle}</h2><p>{`${loan.fullName} · ${loan.userCode} · ${copy.barcode}`}</p></div></div><strong>{`${overdueFine.toLocaleString("vi-VN")}đ`}</strong></div>
        <div className="return-details-grid">
          <Field label="Ngày mượn" value={formatViDate(loan.borrowDate)} readOnly />
          <Field label="Hạn trả" value={`${formatViDate(loan.dueDate)}${loan.renewalsCount ? ` · đã gia hạn ${loan.renewalsCount} lần` : ""}`} readOnly />
          <SelectField label="Tình trạng tài liệu khi trả" value={condition} onChange={(event) => onConditionChange(event.target.value)}><option value="good">Tốt — không hư hỏng</option><option value="light">Hư hỏng nhẹ</option><option value="heavy">Hư hỏng nặng</option><option value="lost">Mất tài liệu</option></SelectField>
          <Field label="Tiền phạt quá hạn (dự kiến)" value={`${overdueFine.toLocaleString("vi-VN")}đ`} readOnly />
        </div>
        <div className="return-debt-summary"><div><Icon name="error" /><span><strong>Công nợ phát sinh khi nhận trả</strong><small>{condition === "good" ? "Chỉ tính phí quá hạn (nếu có)." : "Phí hư hỏng / mất sách được cộng thêm theo danh mục loại hình phạt."}</small></span></div><strong>{`${overdueFine.toLocaleString("vi-VN")}đ${condition === "good" ? "" : " +"}`}</strong></div>
        <label className="staff-checkbox"><input type="checkbox" checked={payImmediately} onChange={(event) => onPayImmediatelyChange(event.target.checked)} /><span>Bạn đọc thanh toán công nợ ngay tại quầy</span></label>
        <div className="return-actions"><Button variant="ghost" onClick={onCancel}>Hủy giao dịch</Button><Button icon="success" onClick={onConfirm}>Nhận trả</Button></div>
      </section>
      )}
      {recentFines.length > 0 && <section className="return-card">
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
      </section>}
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
  const [returnLookup, setReturnLookup] = useState<ReturnLookup>({ status: "idle" });
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
    if (loanItems.some((item) => item.barcode.toLowerCase() === barcode.toLowerCase())) return;
    setLoanItems((prev) => [...prev, { barcode }]);
    circulationService
      .lookupCopy(barcode)
      .then((copy) => setLoanItems((prev) => prev.map((item) => (item.barcode === barcode ? { barcode: copy.barcode, copy } : item))))
      .catch((error: unknown) => setLoanItems((prev) => prev.map((item) => (item.barcode === barcode
        ? { barcode, error: error instanceof Error ? error.message : "Không tra cứu được mã này" }
        : item))));
  };

  const returnLookupSeq = useRef(0);
  const handleReturnLookup = async () => {
    const code = returnBarcode.trim();
    if (!code) return;
    const seq = ++returnLookupSeq.current;
    setReturnLookup({ status: "loading" });
    try {
      const copy = await circulationService.lookupCopy(code);
      if (seq === returnLookupSeq.current) setReturnLookup({ status: "ready", copy });
    } catch (error) {
      if (seq === returnLookupSeq.current) setReturnLookup({ status: "error", error: error instanceof Error ? error.message : undefined });
    }
  };
  const resetReturn = () => {
    returnLookupSeq.current++;
    setReturnBarcode("");
    setReturnLookup({ status: "idle" });
    setReturnCondition("good");
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
        resetReturn();
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
        <form
          className="staff-reader-search"
          onSubmit={(event) => {
            event.preventDefault();
            void handleFindReader();
          }}
        >
          <SearchInput
            value={readerQuery}
            onChange={(event) => { setReaderQuery(event.target.value); resetReaderLookup(); }}
            placeholder={searchType === "Mã bạn đọc" ? "Nhập hoặc quét mã bạn đọc..." : "Nhập họ tên bạn đọc..."}
          />
          <Button type="submit" icon="search" loading={findingReader} disabled={!readerQuery.trim()}>Tìm bạn đọc</Button>
        </form>
        <span><Icon name="info" size={14} />Có thể sử dụng máy quét mã vạch tại quầy</span>
        {readerResults.length > 0 && (
          <fieldset className="reader-lookup-results">
            <legend>Chọn đúng bạn đọc trước khi lập phiếu ({readerResults.length} kết quả)</legend>
            <div className="reader-lookup-list">
              {readerResults.map((reader) => {
                const selected = currentReader?.id === reader.id;
                return (
                  <label key={reader.id} className={`reader-lookup-option ${selected ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="circulation-reader"
                      checked={selected}
                      onChange={() => setCurrentReader(reader)}
                    />
                    <span className="reader-lookup-copy">
                      <strong>{reader.fullName}</strong>
                      <small>
                        <code>{reader.userCode}</code>
                        {reader.departmentName ? ` · ${reader.departmentName}` : ""}
                      </small>
                    </span>
                    <Status tone={reader.status === "ACTIVE" ? "success" : "error"}>
                      {reader.status === "ACTIVE" ? "Hoạt động" : reader.status}
                    </Status>
                  </label>
                );
              })}
            </div>
            {hasMoreReaders && (
              <p className="reader-lookup-note">Chỉ hiển thị 10 kết quả đầu. Nhập mã bạn đọc để thu hẹp tìm kiếm.</p>
            )}
          </fieldset>
        )}
      </section>
      {currentReader && <ReaderInformationCard reader={currentReader} />}
      <div className="circulation-content">
        {activeTab === "Cho mượn" && (
          <LoanTransaction
            items={loanItems}
            readerCode={currentReader?.userCode}
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
            onBarcodeChange={(value) => { setReturnBarcode(value); if (returnLookup.status !== "idle") { returnLookupSeq.current++; setReturnLookup({ status: "idle" }); } }}
            lookup={returnLookup}
            onLookup={handleReturnLookup}
            onCancel={resetReturn}
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
          <div><strong>{confirmation === "loan" ? `Cho mượn ${String(loanItems.length).padStart(2, "0")} tài liệu cho ${currentReader?.fullName ?? ""}?` : confirmation === "return" ? `Nhận trả "${returnLookup.copy?.documentTitle ?? returnBarcode}" (${returnBarcode})?` : "Gia hạn mã " + renewBarcode + "?"}</strong><p>Kiểm tra mã vạch và thông tin bạn đọc trước khi xác nhận.</p></div>
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
