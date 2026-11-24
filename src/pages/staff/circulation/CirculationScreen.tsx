import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  EmptyState,
  Field,
  Icon,
  IconButton,
  LoadingState,
  Modal,
  SearchInput,
  SelectField,
  Status,
  Toast,
} from "../../../design-system";
import { circulationTabs } from "../../../constants/library-options";
import { circulationService } from "../../../services/circulation.service";
import { getAccessToken } from "../../../services/session";
import { userService } from "../../../services/user.service";
import type {
  BookReturnCondition,
  CirculationHistoryItemDto,
  CopyLookupDto,
  FineItemDto,
  PenaltyTypeResponse,
  UserDto,
} from "../../../types/api";
import BookCopyPickerModal from "./BookCopyPickerModal";
import ReaderPickerModal from "./ReaderPickerModal";

const COPY_STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Sẵn sàng cho mượn",
  BORROWED: "Đang được mượn",
  RESERVED: "Đang giữ đặt trước",
  DAMAGED: "Hư hỏng",
  LOST: "Đã mất",
  MAINTENANCE: "Đang bảo trì",
};

const READER_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Hoạt động",
  LOCKED: "Bị khóa",
  EXPIRED: "Hết hạn",
  INACTIVE: "Ngừng hoạt động",
};

type ScannedBookRow = {
  barcode: string;
  copy: CopyLookupDto;
};

type ReturnQueueItem = {
  barcode: string;
  circulationId?: number;
  documentTitle: string;
  borrowerName: string;
  borrowerCode: string;
  borrowDate: string;
  dueDate: string;
  renewalsCount: number;
  overdueDays: number;
  estimatedOverdueFine: number;
  condition: BookReturnCondition;
  returnNote: string;
  additionalPenaltyTypeId: string;
  additionalFineAmount: string;
  additionalFineNote: string;
};

type ToastState = {
  tone: "success" | "error" | "info" | "warning";
  text: string;
};

function formatViDate(iso?: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function computeOverdueDays(dueDateIso?: string | null): number {
  if (!dueDateIso) return 0;
  const due = new Date(dueDateIso);
  if (Number.isNaN(due.getTime())) return 0;
  const now = new Date();
  if (now.getTime() <= due.getTime()) return 0;
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((today.getTime() - dueDay.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(1, diffDays);
}

function getPenaltyPrice(penaltyTypes: PenaltyTypeResponse[], code: string, fallback: number): number {
  const found = penaltyTypes.find((item) => item.code.toUpperCase() === code.toUpperCase());
  return found && Number.isFinite(found.unitPrice) ? found.unitPrice : fallback;
}

function parseNonNegativeInt(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return 0;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed);
}

function estimateReturnItemFines(item: ReturnQueueItem, penaltyTypes: PenaltyTypeResponse[]) {
  const damagedPrice = getPenaltyPrice(penaltyTypes, "DAMAGED", 50000);
  const lostPrice = getPenaltyPrice(penaltyTypes, "LOST", 200000);
  const overdueFine = Math.max(0, item.estimatedOverdueFine);
  const conditionFine =
    item.condition === "DAMAGED" ? damagedPrice : item.condition === "LOST" ? lostPrice : 0;
  const additionalFine = parseNonNegativeInt(item.additionalFineAmount);
  return {
    overdueFine,
    conditionFine,
    additionalFine,
    total: overdueFine + conditionFine + additionalFine,
  };
}

function loanRowState(
  row: ScannedBookRow,
  readerCode?: string,
): { tone: "success" | "warning" | "error" | "neutral"; label: string; blocking: boolean } {
  const { status, reservedFor } = row.copy;
  if (status === "AVAILABLE") {
    return { tone: "success", label: COPY_STATUS_LABEL.AVAILABLE, blocking: false };
  }
  if (status === "RESERVED" && reservedFor) {
    return reservedFor.userCode === readerCode
      ? { tone: "success", label: "Đang giữ cho bạn đọc này", blocking: false }
      : { tone: "warning", label: `Đang giữ cho ${reservedFor.fullName}`, blocking: true };
  }
  return { tone: "error", label: COPY_STATUS_LABEL[status] ?? status, blocking: true };
}

function ReaderInformationCard({
  reader,
  activeLoansCount,
  onChangeReader,
  onClearReader,
}: {
  reader: UserDto;
  activeLoansCount: number | null;
  onChangeReader: () => void;
  onClearReader: () => void;
}) {
  const fullName = reader.fullName || "—";
  const userCode = reader.userCode || "—";
  const department = reader.departmentName || "—";
  const userTypeLabel =
    reader.userType === "LECTURER"
      ? "Cán bộ, giảng viên"
      : reader.userType === "RESEARCHER"
        ? "Nghiên cứu sinh"
        : reader.userType === "STAFF"
          ? "Nhân viên"
          : "Sinh viên chính quy";
  const status = reader.status || "—";
  const isActive = status === "ACTIVE";
  const debtAmount = reader.debt;

  return (
    <section className="circulation-reader-card">
      <div className="reader-card-identity">
        <Avatar name={fullName} size="lg" />
        <div>
          <Badge tone={isActive ? "success" : "warning"}>
            {isActive ? "THẺ ĐANG HOẠT ĐỘNG" : READER_STATUS_LABEL[status] ?? status}
          </Badge>
          <h2>{fullName}</h2>
          <p>{`${userCode} · ${userTypeLabel}`}</p>
        </div>
      </div>
      <dl>
        <div><dt>Mã bạn đọc</dt><dd>{userCode}</dd></div>
        <div><dt>Ngành</dt><dd>{department}</dd></div>
        <div>
          <dt>Đang mượn</dt>
          <dd>{activeLoansCount === null ? "…" : `${activeLoansCount} cuốn`}</dd>
        </div>
        <div>
          <dt>Trạng thái thẻ</dt>
          <dd>
            <Status tone={isActive ? "success" : status === "LOCKED" ? "error" : "warning"}>
              {READER_STATUS_LABEL[status] ?? status}
            </Status>
          </dd>
        </div>
        <div>
          <dt>Công nợ</dt>
          <dd>
            <strong className="debt-value">
              {debtAmount == null ? "—" : `${debtAmount.toLocaleString("vi-VN")}đ`}
            </strong>
          </dd>
        </div>
      </dl>
      <div className="reader-card-actions">
        <Button variant="secondary" size="sm" onClick={onChangeReader}>Đổi bạn đọc</Button>
        <IconButton label="Bỏ chọn bạn đọc" icon="close" onClick={onClearReader} />
      </div>
    </section>
  );
}

function LoanTransaction({
  items,
  readerCode,
  addingBarcode,
  scanError,
  onClearScanError,
  onAddBarcode,
  onOpenBookPicker,
  onRemoveBarcode,
  onClear,
  onConfirm,
}: {
  items: ScannedBookRow[];
  readerCode?: string;
  addingBarcode: boolean;
  scanError: string | null;
  onClearScanError: () => void;
  onAddBarcode: (barcode: string) => Promise<boolean>;
  onOpenBookPicker: () => void;
  onRemoveBarcode: (barcode: string) => void;
  onClear: () => void;
  onConfirm: () => void;
}) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const hasBlockingItems = items.some((item) => loanRowState(item, readerCode).blocking);

  const handleAdd = async () => {
    const trimmed = barcodeInput.trim();
    if (!trimmed || addingBarcode) return;
    const added = await onAddBarcode(trimmed);
    if (added) setBarcodeInput("");
  };

  return (
    <div className="transaction-main">
      <div className="transaction-scan">
        <div>
          <p className="eyebrow">QUÉT HOẶC CHỌN TÀI LIỆU</p>
          <h2>Thêm tài liệu cho mượn</h2>
          <p>Quét mã cá biệt hoặc mở cửa sổ tìm sách để chọn bản sách vật lý còn sẵn trên kệ.</p>
        </div>
        <div className="transaction-scan-controls">
          <form
            className="scan-input"
            onSubmit={(event) => {
              event.preventDefault();
              void handleAdd();
            }}
          >
            <Icon name="book" />
            <input
              value={barcodeInput}
              onChange={(event) => {
                setBarcodeInput(event.target.value);
                if (scanError) onClearScanError();
              }}
              placeholder="Nhập mã cá biệt, ví dụ: PTIT-24-01842"
              aria-label="Mã cá biệt cho mượn"
            />
            <Button type="submit" loading={addingBarcode} disabled={!barcodeInput.trim()}>
              Thêm tài liệu
            </Button>
          </form>
          <Button type="button" variant="secondary" icon="search" onClick={onOpenBookPicker}>
            Tìm sách
          </Button>
        </div>
        {scanError && (
          <div className="scan-inline-error" role="alert">
            <Icon name="error" size={16} />
            <span>{scanError}</span>
          </div>
        )}
      </div>

      <section className="transaction-table-panel">
        <div className="transaction-panel-heading">
          <div>
            <h2>Danh sách cho mượn</h2>
            <p>{String(items.length).padStart(2, "0")} tài liệu trong giao dịch</p>
          </div>
          {items.length > 0 && <button type="button" onClick={onClear}>Xóa tất cả</button>}
        </div>
        {items.length === 0 ? (
          <EmptyState
            size="sm"
            icon="book"
            title="Chưa có tài liệu trong giao dịch"
            description="Quét mã cá biệt hợp lệ hoặc nhấn “Tìm sách” để chọn tài liệu cho mượn."
            action={
              <Button variant="secondary" size="sm" icon="search" onClick={onOpenBookPicker}>
                Tìm sách trong kho
              </Button>
            }
          />
        ) : (
          <div className="transaction-table-wrap">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Tài liệu</th>
                  <th>Mã cá biệt</th>
                  <th>Vị trí</th>
                  <th>Tình trạng</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const state = loanRowState(item, readerCode);
                  const { copy } = item;
                  const byline = [copy.authors.join(", "), copy.publicationYear].filter(Boolean).join(" · ");
                  return (
                    <tr key={item.barcode} className={state.blocking ? "transaction-warning-row" : ""}>
                      <td>
                        <div className="transaction-book">
                          <span><Icon name="book" /></span>
                          <div>
                            <strong>{copy.documentTitle}</strong>
                            <small>{byline || "—"}</small>
                          </div>
                        </div>
                      </td>
                      <td><code>{item.barcode}</code></td>
                      <td>{[copy.shelfLocation, copy.callNumber].filter(Boolean).join(" · ") || "—"}</td>
                      <td><Status tone={state.tone}>{state.label}</Status></td>
                      <td><IconButton label="Xóa" icon="close" onClick={() => onRemoveBarcode(item.barcode)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="transaction-footer">
          <div>
            <span>Tổng tài liệu</span>
            <strong>{String(items.length).padStart(2, "0")} cuốn</strong>
            {hasBlockingItems && <small>Bỏ các tài liệu không sẵn sàng trước khi xác nhận</small>}
          </div>
          <Button icon="success" disabled={items.length === 0 || hasBlockingItems} onClick={onConfirm}>
            Xác nhận cho mượn
          </Button>
        </div>
      </section>
    </div>
  );
}

function ReturnTransaction({
  currentReader,
  activeLoans,
  loadingActiveLoans,
  activeLoansError,
  onReloadActiveLoans,
  onOpenReaderPicker,
  returnItems,
  penaltyTypes,
  addingReturnBarcode,
  returnScanError,
  onClearReturnScanError,
  onAddReturnBarcode,
  onToggleLoanSelection,
  onToggleSelectAllLoans,
  onUpdateReturnItem,
  onRemoveReturnItem,
  onClearReturnItems,
  onConfirm,
  payImmediately,
  onPayImmediatelyChange,
  recentFines,
  onPayFine,
  payingFineId,
}: {
  currentReader: UserDto | null;
  activeLoans: CirculationHistoryItemDto[];
  loadingActiveLoans: boolean;
  activeLoansError: string | null;
  onReloadActiveLoans: () => void;
  onOpenReaderPicker: () => void;
  returnItems: ReturnQueueItem[];
  penaltyTypes: PenaltyTypeResponse[];
  addingReturnBarcode: boolean;
  returnScanError: string | null;
  onClearReturnScanError: () => void;
  onAddReturnBarcode: (barcode: string) => Promise<boolean>;
  onToggleLoanSelection: (loan: CirculationHistoryItemDto) => void;
  onToggleSelectAllLoans: () => void;
  onUpdateReturnItem: (barcode: string, patch: Partial<ReturnQueueItem>) => void;
  onRemoveReturnItem: (barcode: string) => void;
  onClearReturnItems: () => void;
  onConfirm: () => void;
  payImmediately: boolean;
  onPayImmediatelyChange: (val: boolean) => void;
  recentFines: FineItemDto[];
  onPayFine: (fineId: number) => void;
  payingFineId: number | null;
}) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const overduePrice = getPenaltyPrice(penaltyTypes, "OVERDUE", 5000);
  const damagedPrice = getPenaltyPrice(penaltyTypes, "DAMAGED", 50000);
  const lostPrice = getPenaltyPrice(penaltyTypes, "LOST", 200000);

  const selectedBarcodes = useMemo(
    () => new Set(returnItems.map((item) => item.barcode.toLowerCase())),
    [returnItems],
  );

  const allReaderLoansSelected =
    activeLoans.length > 0 &&
    activeLoans.every((loan) => selectedBarcodes.has(loan.barcode.toLowerCase()));

  const totals = useMemo(() => {
    return returnItems.reduce(
      (acc, item) => {
        const breakdown = estimateReturnItemFines(item, penaltyTypes);
        acc.overdue += breakdown.overdueFine;
        acc.condition += breakdown.conditionFine;
        acc.additional += breakdown.additionalFine;
        acc.total += breakdown.total;
        return acc;
      },
      { overdue: 0, condition: 0, additional: 0, total: 0 },
    );
  }, [returnItems, penaltyTypes]);

  const selectableAdditionalPenalties = useMemo(
    () => penaltyTypes.filter((pt) => pt.code.toUpperCase() !== "OVERDUE"),
    [penaltyTypes],
  );

  const handleScanAdd = async () => {
    const trimmed = barcodeInput.trim();
    if (!trimmed || addingReturnBarcode) return;
    const added = await onAddReturnBarcode(trimmed);
    if (added) setBarcodeInput("");
  };

  return (
    <div className="return-transaction">
      {currentReader ? (
        <section className="transaction-table-panel">
          <div className="transaction-panel-heading">
            <div>
              <h2>Tài liệu đang mượn của {currentReader.fullName}</h2>
              <p>
                {loadingActiveLoans
                  ? "Đang tải danh sách tài liệu đang mượn…"
                  : `${activeLoans.length} cuốn đang mượn · Tích chọn một hoặc nhiều cuốn để nhận trả`}
              </p>
            </div>
            {activeLoans.length > 0 && (
              <Button variant="secondary" size="sm" onClick={onToggleSelectAllLoans}>
                {allReaderLoansSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </Button>
            )}
          </div>

          {activeLoansError ? (
            <EmptyState
              size="sm"
              tone="error"
              title="Không tải được danh sách đang mượn"
              description={activeLoansError}
              action={<Button size="sm" onClick={onReloadActiveLoans}>Thử lại</Button>}
            />
          ) : loadingActiveLoans ? (
            <LoadingState size="sm" variant="table" count={3} title="Đang tải danh sách tài liệu đang mượn…" />
          ) : activeLoans.length === 0 ? (
            <EmptyState
              size="sm"
              icon="book"
              title="Bạn đọc hiện không mượn tài liệu nào"
              description="Bạn vẫn có thể quét trực tiếp mã cá biệt của cuốn sách khác ở ô bên dưới."
            />
          ) : (
            <div className="transaction-table-wrap">
              <table className="transaction-table">
                <thead>
                  <tr>
                    <th className="checkbox-col">Chọn</th>
                    <th>Tài liệu</th>
                    <th>Mã cá biệt</th>
                    <th>Ngày mượn</th>
                    <th>Hạn trả</th>
                    <th>Trạng thái</th>
                    <th>Phí quá hạn dự kiến</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLoans.map((loan) => {
                    const checked = selectedBarcodes.has(loan.barcode.toLowerCase());
                    const overdueDays = computeOverdueDays(loan.dueDate);
                    const estOverdue = overdueDays * overduePrice;
                    return (
                      <tr
                        key={loan.circulationId}
                        className={`clickable-row ${checked ? "selected-return-row" : ""}`}
                        onClick={() => onToggleLoanSelection(loan)}
                      >
                        <td className="checkbox-col">
                          <input
                            type="checkbox"
                            checked={checked}
                            aria-label={`Chọn trả ${loan.documentTitle}`}
                            onChange={() => onToggleLoanSelection(loan)}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </td>
                        <td>
                          <div className="transaction-book">
                            <span><Icon name="book" /></span>
                            <div>
                              <strong>{loan.documentTitle}</strong>
                              <small>{loan.shelfLocation || loan.callNumber || "—"}</small>
                            </div>
                          </div>
                        </td>
                        <td><code>{loan.barcode}</code></td>
                        <td>{formatViDate(loan.borrowDate)}</td>
                        <td className={overdueDays > 0 ? "overdue-date" : undefined}>
                          {formatViDate(loan.dueDate)}
                        </td>
                        <td>
                          <Status tone={overdueDays > 0 ? "error" : "success"}>
                            {overdueDays > 0 ? `Quá hạn ${overdueDays} ngày` : "Trong hạn"}
                          </Status>
                        </td>
                        <td className={estOverdue > 0 ? "reader-debt" : undefined}>
                          {estOverdue > 0 ? `${estOverdue.toLocaleString("vi-VN")}đ` : "0đ"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <div className="return-reader-prompt">
          <div>
            <Icon name="users" size={18} />
            <div>
              <strong>Chọn bạn đọc để hiện toàn bộ danh sách đang mượn</strong>
              <p>Chọn bạn đọc để tick nhanh nhiều cuốn cần trả, hoặc quét trực tiếp mã cá biệt ở ô bên dưới.</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" icon="search" onClick={onOpenReaderPicker}>
            Chọn bạn đọc
          </Button>
        </div>
      )}

      <div className="transaction-scan">
        <div>
          <p className="eyebrow">QUÉT NHANH MÃ CÁ BIỆT</p>
          <h2>Thêm sách vào danh sách trả</h2>
          <p>Quét hoặc nhập mã cá biệt của cuốn sách đang được mượn để thêm trực tiếp vào phiếu nhận trả.</p>
        </div>
        <form
          className="scan-input"
          onSubmit={(event) => {
            event.preventDefault();
            void handleScanAdd();
          }}
        >
          <Icon name="book" />
          <input
            value={barcodeInput}
            onChange={(event) => {
              setBarcodeInput(event.target.value);
              if (returnScanError) onClearReturnScanError();
            }}
            placeholder="Quét mã cá biệt cần nhận trả..."
            aria-label="Mã cá biệt nhận trả"
          />
          <Button type="submit" loading={addingReturnBarcode} disabled={!barcodeInput.trim()}>
            Thêm vào danh sách
          </Button>
        </form>
        {returnScanError && (
          <div className="scan-inline-error" role="alert">
            <Icon name="error" size={16} />
            <span>{returnScanError}</span>
          </div>
        )}
      </div>

      <section className="return-card">
        <div className="transaction-panel-heading">
          <div>
            <h2>Danh sách nhận trả &amp; xử lý phạt</h2>
            <p>
              {returnItems.length > 0
                ? `${String(returnItems.length).padStart(2, "0")} tài liệu sẵn sàng nhận trả · Có thể chọn tình trạng và thêm phạt bổ sung cho từng cuốn`
                : "Chưa chọn tài liệu nào để nhận trả"}
            </p>
          </div>
          {returnItems.length > 0 && (
            <button type="button" onClick={onClearReturnItems}>Xóa danh sách</button>
          )}
        </div>

        {returnItems.length === 0 ? (
          <EmptyState
            size="sm"
            icon="arrow-left"
            title="Chưa có sách trong danh sách nhận trả"
            description="Chọn tài liệu từ danh sách đang mượn của bạn đọc phía trên hoặc quét mã cá biệt để thêm vào đây."
          />
        ) : (
          <>
            <div className="return-queue-list">
              {returnItems.map((item) => {
                const breakdown = estimateReturnItemFines(item, penaltyTypes);
                return (
                  <article key={item.barcode} className="return-queue-item">
                    <div className="return-queue-item-head">
                      <div className="transaction-book">
                        <span><Icon name="book" /></span>
                        <div>
                          <div className="return-queue-badges">
                            {item.overdueDays > 0 ? (
                              <Badge tone="error">{`QUÁ HẠN ${item.overdueDays} NGÀY`}</Badge>
                            ) : (
                              <Badge tone="success">TRONG HẠN</Badge>
                            )}
                            <code>{item.barcode}</code>
                          </div>
                          <strong>{item.documentTitle}</strong>
                          <small>
                            {item.borrowerName} ({item.borrowerCode}) · Mượn {formatViDate(item.borrowDate)} · Hạn trả {formatViDate(item.dueDate)}
                          </small>
                        </div>
                      </div>
                      <div className="return-queue-item-total">
                        <div>
                          <small>Dự kiến phạt</small>
                          <strong className={breakdown.total > 0 ? "debt-value" : undefined}>
                            {`${breakdown.total.toLocaleString("vi-VN")}đ`}
                          </strong>
                        </div>
                        <IconButton
                          label={`Bỏ ${item.documentTitle} khỏi danh sách trả`}
                          icon="close"
                          onClick={() => onRemoveReturnItem(item.barcode)}
                        />
                      </div>
                    </div>

                    <div className="return-item-fields">
                      <SelectField
                        label="Tình trạng khi trả"
                        value={item.condition}
                        onChange={(event) =>
                          onUpdateReturnItem(item.barcode, {
                            condition: event.target.value as BookReturnCondition,
                          })
                        }
                      >
                        <option value="NORMAL">Tốt — không hư hỏng (0đ)</option>
                        <option value="DAMAGED">{`Hư hỏng (+${damagedPrice.toLocaleString("vi-VN")}đ)`}</option>
                        <option value="LOST">{`Mất tài liệu (+${lostPrice.toLocaleString("vi-VN")}đ)`}</option>
                      </SelectField>

                      <Field
                        label="Ghi chú nhận trả"
                        value={item.returnNote}
                        onChange={(event) =>
                          onUpdateReturnItem(item.barcode, { returnNote: event.target.value })
                        }
                        placeholder="Ghi chú tình trạng sách (tùy chọn)..."
                      />
                    </div>

                    <div className="return-item-fine-row">
                      <SelectField
                        label="Phạt bổ sung tại quầy"
                        value={item.additionalPenaltyTypeId}
                        onChange={(event) => {
                          const nextVal = event.target.value;
                          if (!nextVal) {
                            onUpdateReturnItem(item.barcode, {
                              additionalPenaltyTypeId: "",
                              additionalFineAmount: "",
                              additionalFineNote: "",
                            });
                            return;
                          }
                          if (nextVal === "CUSTOM") {
                            onUpdateReturnItem(item.barcode, { additionalPenaltyTypeId: "CUSTOM" });
                            return;
                          }
                          const matched = penaltyTypes.find((pt) => String(pt.id) === nextVal);
                          onUpdateReturnItem(item.barcode, {
                            additionalPenaltyTypeId: nextVal,
                            additionalFineAmount:
                              matched && matched.unitPrice > 0
                                ? String(matched.unitPrice)
                                : item.additionalFineAmount,
                          });
                        }}
                      >
                        <option value="">Không có phạt bổ sung</option>
                        {selectableAdditionalPenalties.map((pt) => (
                          <option key={pt.id} value={String(pt.id)}>
                            {`${pt.name} (${pt.unitPrice.toLocaleString("vi-VN")}đ/${pt.unitName})`}
                          </option>
                        ))}
                        <option value="CUSTOM">Phạt khác (nhập số tiền tùy chỉnh)</option>
                      </SelectField>

                      <Field
                        label="Số tiền phạt thêm (VNĐ)"
                        type="number"
                        min={0}
                        step={1000}
                        value={item.additionalFineAmount}
                        onChange={(event) => {
                          const val = event.target.value;
                          onUpdateReturnItem(item.barcode, {
                            additionalFineAmount: val,
                            additionalPenaltyTypeId:
                              val && !item.additionalPenaltyTypeId ? "CUSTOM" : item.additionalPenaltyTypeId,
                          });
                        }}
                        placeholder="0"
                      />

                      <Field
                        label="Lý do phạt bổ sung"
                        value={item.additionalFineNote}
                        onChange={(event) =>
                          onUpdateReturnItem(item.barcode, { additionalFineNote: event.target.value })
                        }
                        placeholder="VD: Làm bẩn bìa, ghi chú lên trang..."
                      />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="return-debt-summary">
              <div>
                <Icon name="error" />
                <span>
                  <strong>Tổng công nợ dự kiến cho {returnItems.length} tài liệu</strong>
                  <small>
                    {`Quá hạn: ${totals.overdue.toLocaleString("vi-VN")}đ · Hư hỏng/mất: ${totals.condition.toLocaleString("vi-VN")}đ · Phạt bổ sung: ${totals.additional.toLocaleString("vi-VN")}đ`}
                  </small>
                </span>
              </div>
              <strong>{`${totals.total.toLocaleString("vi-VN")}đ`}</strong>
            </div>

            <label className="staff-checkbox">
              <input
                type="checkbox"
                checked={payImmediately}
                onChange={(event) => onPayImmediatelyChange(event.target.checked)}
              />
              <span>Bạn đọc thanh toán toàn bộ công nợ phát sinh ngay tại quầy</span>
            </label>

            <div className="return-actions">
              <Button variant="ghost" onClick={onClearReturnItems}>Bỏ chọn tất cả</Button>
              <Button icon="success" onClick={onConfirm}>
                {`Nhận trả (${returnItems.length} cuốn)`}
              </Button>
            </div>
          </>
        )}
      </section>

      {recentFines.length > 0 && (
        <section className="return-card">
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
        </section>
      )}
    </div>
  );
}

export default function CirculationScreen() {
  const [activeTab, setActiveTab] = useState("Cho mượn");
  const readerLookupSeq = useRef(0);
  const [readerQuery, setReaderQuery] = useState("");
  const [findingReader, setFindingReader] = useState(false);
  const [readerPickerOpen, setReaderPickerOpen] = useState(false);
  const [readerPickerInitialQuery, setReaderPickerInitialQuery] = useState("");
  const [currentReader, setCurrentReader] = useState<UserDto | null>(null);

  const [activeLoans, setActiveLoans] = useState<CirculationHistoryItemDto[]>([]);
  const [loadingActiveLoans, setLoadingActiveLoans] = useState(false);
  const [activeLoansError, setActiveLoansError] = useState<string | null>(null);
  const activeLoansSeq = useRef(0);

  const [penaltyTypes, setPenaltyTypes] = useState<PenaltyTypeResponse[]>([]);

  const [loanItems, setLoanItems] = useState<ScannedBookRow[]>([]);
  const [addingLoanBarcode, setAddingLoanBarcode] = useState(false);
  const [loanScanError, setLoanScanError] = useState<string | null>(null);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);

  const [returnItems, setReturnItems] = useState<ReturnQueueItem[]>([]);
  const [addingReturnBarcode, setAddingReturnBarcode] = useState(false);
  const [returnScanError, setReturnScanError] = useState<string | null>(null);
  const [payImmediately, setPayImmediately] = useState(true);
  const [recentFines, setRecentFines] = useState<FineItemDto[]>([]);
  const [payingFineId, setPayingFineId] = useState<number | null>(null);

  const [renewBarcode, setRenewBarcode] = useState("");
  const [renewTargetTitle, setRenewTargetTitle] = useState<string | null>(null);

  const [processing, setProcessing] = useState(false);
  const [confirmation, setConfirmation] = useState<"loan" | "return" | "renew" | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!getAccessToken()) return;
    let active = true;
    circulationService
      .getPenaltyTypes()
      .then((types) => {
        if (active) setPenaltyTypes(types);
      })
      .catch(() => {
        // Fallback to default estimates if penalty-types fails to load
      });
    return () => { active = false; };
  }, []);

  const loadReaderActiveLoans = useCallback(async (userId: string) => {
    const seq = ++activeLoansSeq.current;
    setLoadingActiveLoans(true);
    setActiveLoansError(null);
    try {
      const page = await circulationService.getUserCirculationHistory(userId, "BORROWING", {
        page: 0,
        size: 50,
      });
      if (seq === activeLoansSeq.current) {
        setActiveLoans(page.items);
      }
    } catch (error) {
      if (seq === activeLoansSeq.current) {
        setActiveLoans([]);
        setActiveLoansError(error instanceof Error ? error.message : "Không tải được danh sách tài liệu đang mượn.");
      }
    } finally {
      if (seq === activeLoansSeq.current) {
        setLoadingActiveLoans(false);
      }
    }
  }, []);

  const handleSelectReader = useCallback(
    (reader: UserDto) => {
      setCurrentReader(reader);
      setReaderQuery("");
      setReturnItems([]);
      setReturnScanError(null);
      void loadReaderActiveLoans(reader.id);
    },
    [loadReaderActiveLoans],
  );

  const handleClearReader = () => {
    activeLoansSeq.current++;
    setCurrentReader(null);
    setActiveLoans([]);
    setActiveLoansError(null);
    setLoadingActiveLoans(false);
    setReturnItems([]);
  };

  const handleQuickFindReader = async () => {
    const keyword = readerQuery.trim();
    if (!getAccessToken()) return;
    if (!keyword) {
      setReaderPickerInitialQuery("");
      setReaderPickerOpen(true);
      return;
    }
    const seq = ++readerLookupSeq.current;
    setFindingReader(true);
    try {
      const data = await userService.searchAdminUsers({ keyword, role: "READER", page: 0, size: 10 });
      if (seq !== readerLookupSeq.current) return;
      if (data.items.length === 0) {
        setToast({ tone: "error", text: `Không tìm thấy bạn đọc khớp với "${keyword}".` });
        return;
      }
      const exactCodeMatch = data.items.find(
        (reader) => reader.userCode.toLowerCase() === keyword.toLowerCase(),
      );
      if (data.items.length === 1 || exactCodeMatch) {
        handleSelectReader(exactCodeMatch ?? data.items[0]);
        return;
      }
      setReaderPickerInitialQuery(keyword);
      setReaderPickerOpen(true);
    } catch (error) {
      if (seq === readerLookupSeq.current) {
        setToast({
          tone: "error",
          text: error instanceof Error ? error.message : "Không tải được hồ sơ bạn đọc.",
        });
      }
    } finally {
      if (seq === readerLookupSeq.current) setFindingReader(false);
    }
  };

  const handleAddLoanBarcode = async (rawBarcode: string): Promise<boolean> => {
    const code = rawBarcode.trim();
    if (!code) return false;
    if (loanItems.some((item) => item.barcode.toLowerCase() === code.toLowerCase())) {
      setLoanScanError(`Mã cá biệt "${code}" đã có trong danh sách cho mượn.`);
      return false;
    }
    setAddingLoanBarcode(true);
    setLoanScanError(null);
    try {
      const copy = await circulationService.lookupCopy(code);
      if (loanItems.some((item) => item.barcode.toLowerCase() === copy.barcode.toLowerCase())) {
        setLoanScanError(`Mã cá biệt "${copy.barcode}" đã có trong danh sách cho mượn.`);
        return false;
      }

      const isAvailable = copy.status === "AVAILABLE";
      const isReservedForReader =
        copy.status === "RESERVED" &&
        Boolean(currentReader?.userCode) &&
        copy.reservedFor?.userCode === currentReader?.userCode;

      if (!isAvailable && !isReservedForReader) {
        const reason =
          copy.status === "RESERVED" && copy.reservedFor
            ? `Mã ${copy.barcode} (${copy.documentTitle}) đang giữ đặt trước cho ${copy.reservedFor.fullName} (${copy.reservedFor.userCode}).`
            : copy.activeLoan
              ? `Mã ${copy.barcode} (${copy.documentTitle}) đang được mượn bởi ${copy.activeLoan.fullName} (${copy.activeLoan.userCode}).`
              : `Mã ${copy.barcode} (${copy.documentTitle}) hiện ở trạng thái "${COPY_STATUS_LABEL[copy.status] ?? copy.status}", không thể cho mượn.`;
        setLoanScanError(reason);
        setToast({ tone: "error", text: reason });
        return false;
      }

      setLoanItems((prev) => [...prev, { barcode: copy.barcode, copy }]);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : `Không tra cứu được mã cá biệt "${code}".`;
      setLoanScanError(message);
      setToast({ tone: "error", text: message });
      return false;
    } finally {
      setAddingLoanBarcode(false);
    }
  };

  const handlePickCopyFromModal = (copy: CopyLookupDto) => {
    setLoanItems((prev) => {
      if (prev.some((item) => item.barcode.toLowerCase() === copy.barcode.toLowerCase())) return prev;
      return [...prev, { barcode: copy.barcode, copy }];
    });
    setLoanScanError(null);
  };

  const buildReturnItemFromLoan = useCallback(
    (loan: CirculationHistoryItemDto, reader: UserDto): ReturnQueueItem => {
      const overdueDays = computeOverdueDays(loan.dueDate);
      const overduePrice = getPenaltyPrice(penaltyTypes, "OVERDUE", 5000);
      return {
        barcode: loan.barcode,
        circulationId: loan.circulationId,
        documentTitle: loan.documentTitle,
        borrowerName: reader.fullName,
        borrowerCode: reader.userCode,
        borrowDate: loan.borrowDate,
        dueDate: loan.dueDate,
        renewalsCount: loan.renewalsCount,
        overdueDays,
        estimatedOverdueFine: overdueDays * overduePrice,
        condition: "NORMAL",
        returnNote: "",
        additionalPenaltyTypeId: "",
        additionalFineAmount: "",
        additionalFineNote: "",
      };
    },
    [penaltyTypes],
  );

  const handleToggleLoanSelection = (loan: CirculationHistoryItemDto) => {
    if (!currentReader) return;
    setReturnItems((prev) => {
      const exists = prev.some((item) => item.barcode.toLowerCase() === loan.barcode.toLowerCase());
      if (exists) {
        return prev.filter((item) => item.barcode.toLowerCase() !== loan.barcode.toLowerCase());
      }
      return [...prev, buildReturnItemFromLoan(loan, currentReader)];
    });
  };

  const handleToggleSelectAllLoans = () => {
    if (!currentReader || activeLoans.length === 0) return;
    const selectedSet = new Set(returnItems.map((item) => item.barcode.toLowerCase()));
    const allSelected = activeLoans.every((loan) => selectedSet.has(loan.barcode.toLowerCase()));
    if (allSelected) {
      const readerBarcodes = new Set(activeLoans.map((loan) => loan.barcode.toLowerCase()));
      setReturnItems((prev) => prev.filter((item) => !readerBarcodes.has(item.barcode.toLowerCase())));
    } else {
      setReturnItems((prev) => {
        const existing = new Set(prev.map((item) => item.barcode.toLowerCase()));
        const additions = activeLoans
          .filter((loan) => !existing.has(loan.barcode.toLowerCase()))
          .map((loan) => buildReturnItemFromLoan(loan, currentReader));
        return [...prev, ...additions];
      });
    }
  };

  const handleAddReturnBarcode = async (rawBarcode: string): Promise<boolean> => {
    const code = rawBarcode.trim();
    if (!code) return false;
    if (returnItems.some((item) => item.barcode.toLowerCase() === code.toLowerCase())) {
      setReturnScanError(`Mã cá biệt "${code}" đã có trong danh sách nhận trả.`);
      return false;
    }
    setAddingReturnBarcode(true);
    setReturnScanError(null);
    try {
      const copy = await circulationService.lookupCopy(code);
      if (!copy.activeLoan) {
        const msg = `Mã ${copy.barcode} (${copy.documentTitle}) hiện không có lượt mượn nào đang mở (${COPY_STATUS_LABEL[copy.status] ?? copy.status}).`;
        setReturnScanError(msg);
        setToast({ tone: "error", text: msg });
        return false;
      }
      const loan = copy.activeLoan;
      const newItem: ReturnQueueItem = {
        barcode: copy.barcode,
        circulationId: loan.circulationId,
        documentTitle: copy.documentTitle,
        borrowerName: loan.fullName,
        borrowerCode: loan.userCode,
        borrowDate: loan.borrowDate,
        dueDate: loan.dueDate,
        renewalsCount: loan.renewalsCount,
        overdueDays: loan.overdueDays,
        estimatedOverdueFine: loan.estimatedOverdueFine,
        condition: "NORMAL",
        returnNote: "",
        additionalPenaltyTypeId: "",
        additionalFineAmount: "",
        additionalFineNote: "",
      };
      setReturnItems((prev) => {
        if (prev.some((item) => item.barcode.toLowerCase() === copy.barcode.toLowerCase())) return prev;
        return [...prev, newItem];
      });
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : `Không tra cứu được mã cá biệt "${code}".`;
      setReturnScanError(msg);
      setToast({ tone: "error", text: msg });
      return false;
    } finally {
      setAddingReturnBarcode(false);
    }
  };

  const handleUpdateReturnItem = (barcode: string, patch: Partial<ReturnQueueItem>) => {
    setReturnItems((prev) =>
      prev.map((item) => (item.barcode === barcode ? { ...item, ...patch } : item)),
    );
  };

  const handlePayFine = async (fineId: number) => {
    if (payingFineId !== null) return;
    setPayingFineId(fineId);
    try {
      const res = await circulationService.payFine(fineId, "Thu tiền trực tiếp tại quầy lưu thông");
      setToast({
        tone: "success",
        text: `Đã thu ${res.fineAmount.toLocaleString("vi-VN")}đ. Trạng thái: ${res.status}.`,
      });
      setRecentFines((prev) =>
        prev.map((f) => (f.fineId === fineId ? { ...f, status: "PAID" as const } : f)),
      );
    } catch (err) {
      setToast({
        tone: "error",
        text: err instanceof Error ? err.message : "Không thể ghi nhận thanh toán khoản phạt.",
      });
    } finally {
      setPayingFineId(null);
    }
  };

  const actionLabel =
    confirmation === "loan"
      ? "Xác nhận cho mượn"
      : confirmation === "return"
        ? `Xác nhận nhận trả (${returnItems.length} cuốn)`
        : "Xác nhận gia hạn";

  const executeConfirmedTransaction = async () => {
    const mode = confirmation;
    if (!mode || processing) return;
    if (!getAccessToken()) {
      setToast({ tone: "error", text: "Vui lòng đăng nhập lại." });
      return;
    }
    if (mode === "loan" && (!currentReader || !loanItems.length)) {
      setToast({ tone: "warning", text: "Hãy chọn bạn đọc và thêm tài liệu cho mượn." });
      return;
    }
    if (mode === "return" && !returnItems.length) {
      setToast({ tone: "warning", text: "Chưa có tài liệu nào trong danh sách nhận trả." });
      return;
    }
    if (mode === "renew" && !renewBarcode.trim()) {
      setToast({ tone: "warning", text: "Vui lòng nhập hoặc chọn mã vạch tài liệu cần gia hạn." });
      return;
    }

    setProcessing(true);
    try {
      if (mode === "loan" && currentReader) {
        const result = await circulationService.borrowBooks({
          userCode: currentReader.userCode,
          barcodes: loanItems.map((item) => item.barcode),
        });
        const warningText = result.warnings?.length ? ` Lưu ý: ${result.warnings.join(" ")}` : "";
        setToast({
          tone: "success",
          text: `Đã lập phiếu mượn ${result.totalBorrowed} tài liệu cho ${currentReader.fullName}.${warningText}`,
        });
        setLoanItems([]);
        setLoanScanError(null);
        void loadReaderActiveLoans(currentReader.id);
      } else if (mode === "return") {
        const succeededBarcodes = new Set<string>();
        const failedMessages: string[] = [];
        const allGeneratedFines: FineItemDto[] = [];
        let totalFinesAmount = 0;

        for (const item of returnItems) {
          const parsedAdditionalAmount = parseNonNegativeInt(item.additionalFineAmount);
          const numericPenaltyId =
            item.additionalPenaltyTypeId && item.additionalPenaltyTypeId !== "CUSTOM"
              ? Number(item.additionalPenaltyTypeId)
              : undefined;

          try {
            const result = await circulationService.returnBook({
              barcode: item.barcode,
              condition: item.condition,
              returnNote: item.returnNote.trim() || undefined,
              additionalPenaltyTypeId:
                numericPenaltyId && Number.isSafeInteger(numericPenaltyId) ? numericPenaltyId : undefined,
              additionalFineAmount: parsedAdditionalAmount > 0 ? parsedAdditionalAmount : undefined,
              additionalFineNote: item.additionalFineNote.trim() || undefined,
            });
            succeededBarcodes.add(item.barcode.toLowerCase());
            totalFinesAmount += result.totalFineAmount ?? 0;
            if (result.generatedFines?.length) {
              allGeneratedFines.push(...result.generatedFines);
            }
          } catch (error) {
            failedMessages.push(
              `${item.barcode}: ${error instanceof Error ? error.message : "Lỗi nhận trả"}`,
            );
          }
        }

        let paidCount = 0;
        if (allGeneratedFines.length > 0) {
          const updatedFines: FineItemDto[] = [];
          for (const fine of allGeneratedFines) {
            if (payImmediately) {
              try {
                await circulationService.payFine(fine.fineId, "Thu tiền ngay khi nhận trả sách tại quầy");
                paidCount++;
                updatedFines.push({ ...fine, status: "PAID" });
                continue;
              } catch {
                // Keep fine unpaid if payment call fails
              }
            }
            updatedFines.push(fine);
          }
          setRecentFines((prev) => [...updatedFines, ...prev]);
        }

        if (succeededBarcodes.size > 0) {
          setReturnItems((prev) =>
            prev.filter((item) => !succeededBarcodes.has(item.barcode.toLowerCase())),
          );
          if (currentReader) {
            void loadReaderActiveLoans(currentReader.id);
          }
        }

        if (failedMessages.length === 0) {
          const fineSummary =
            totalFinesAmount > 0
              ? ` Tổng phí phát sinh: ${totalFinesAmount.toLocaleString("vi-VN")}đ${paidCount > 0 ? ` (đã thu ${paidCount}/${allGeneratedFines.length} khoản)` : ""}.`
              : " Không có phí phạt phát sinh.";
          setToast({
            tone: "success",
            text: `Đã nhận trả thành công ${succeededBarcodes.size} tài liệu.${fineSummary}`,
          });
        } else {
          setToast({
            tone: succeededBarcodes.size > 0 ? "warning" : "error",
            text: `Nhận trả thành công ${succeededBarcodes.size}/${returnItems.length} cuốn. Lỗi: ${failedMessages.join("; ")}`,
          });
        }
      } else if (mode === "renew") {
        const result = await circulationService.renewLoan({ barcode: renewBarcode.trim() });
        setToast({
          tone: result.renewalStatus === "SUCCESS" ? "success" : "warning",
          text:
            result.message ||
            (result.renewalStatus === "SUCCESS"
              ? "Đã gia hạn tài liệu thành công."
              : "Yêu cầu gia hạn bị từ chối."),
        });
        setRenewBarcode("");
        setRenewTargetTitle(null);
        if (currentReader) {
          void loadReaderActiveLoans(currentReader.id);
        }
      }
      setConfirmation(null);
    } catch (error) {
      setToast({
        tone: "error",
        text: error instanceof Error ? error.message : "Máy chủ chưa xác nhận giao dịch.",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="circulation-screen">
      <div className="circulation-page-heading">
        <div>
          <Breadcrumb items={["Không gian nghiệp vụ", "Lưu thông"]} />
          <p className="eyebrow">NGHIỆP VỤ LƯU THÔNG</p>
          <h1>Lưu thông tài liệu</h1>
          <p>Cho mượn, nhận trả nhiều tài liệu, xử lý phạt bổ sung và gia hạn tại quầy.</p>
        </div>
        <Badge tone="success"><Status tone="success">Quầy 01 đang hoạt động</Status></Badge>
      </div>

      <div className="circulation-tabs" role="tablist">
        {circulationTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
          >
            {tab === "Cho mượn" ? (
              <Icon name="book" />
            ) : tab === "Nhận trả" ? (
              <Icon name="arrow-left" />
            ) : (
              <Icon name="sparkle" />
            )}
            {tab}
          </button>
        ))}
      </div>

      <section className="circulation-search-area circulation-reader-toolbar">
        <form
          className="staff-reader-search"
          onSubmit={(event) => {
            event.preventDefault();
            void handleQuickFindReader();
          }}
        >
          <SearchInput
            value={readerQuery}
            onChange={(event) => setReaderQuery(event.target.value)}
            placeholder="Nhập hoặc quét mã bạn đọc, họ tên, email..."
          />
          <Button type="submit" icon="search" loading={findingReader}>
            Tìm bạn đọc
          </Button>
          <Button
            type="button"
            variant="secondary"
            icon="users"
            onClick={() => {
              setReaderPickerInitialQuery(readerQuery.trim());
              setReaderPickerOpen(true);
            }}
          >
            Chọn bạn đọc
          </Button>
        </form>
        <span>
          <Icon name="info" size={14} />
          Quét mã khớp 1 bạn đọc sẽ tự chọn; nếu có nhiều kết quả sẽ mở cửa sổ chọn nhanh.
        </span>
      </section>

      {currentReader && (
        <ReaderInformationCard
          reader={currentReader}
          activeLoansCount={loadingActiveLoans ? null : activeLoans.length}
          onChangeReader={() => {
            setReaderPickerInitialQuery("");
            setReaderPickerOpen(true);
          }}
          onClearReader={handleClearReader}
        />
      )}

      <div className="circulation-content">
        {activeTab === "Cho mượn" && (
          <LoanTransaction
            items={loanItems}
            readerCode={currentReader?.userCode}
            addingBarcode={addingLoanBarcode}
            scanError={loanScanError}
            onClearScanError={() => setLoanScanError(null)}
            onAddBarcode={handleAddLoanBarcode}
            onOpenBookPicker={() => setBookPickerOpen(true)}
            onRemoveBarcode={(code) =>
              setLoanItems((prev) => prev.filter((item) => item.barcode !== code))
            }
            onClear={() => {
              setLoanItems([]);
              setLoanScanError(null);
            }}
            onConfirm={() =>
              currentReader
                ? setConfirmation("loan")
                : setToast({ tone: "warning", text: "Hãy chọn bạn đọc trước khi lập phiếu cho mượn." })
            }
          />
        )}

        {activeTab === "Nhận trả" && (
          <ReturnTransaction
            currentReader={currentReader}
            activeLoans={activeLoans}
            loadingActiveLoans={loadingActiveLoans}
            activeLoansError={activeLoansError}
            onReloadActiveLoans={() => {
              if (currentReader) void loadReaderActiveLoans(currentReader.id);
            }}
            onOpenReaderPicker={() => {
              setReaderPickerInitialQuery("");
              setReaderPickerOpen(true);
            }}
            returnItems={returnItems}
            penaltyTypes={penaltyTypes}
            addingReturnBarcode={addingReturnBarcode}
            returnScanError={returnScanError}
            onClearReturnScanError={() => setReturnScanError(null)}
            onAddReturnBarcode={handleAddReturnBarcode}
            onToggleLoanSelection={handleToggleLoanSelection}
            onToggleSelectAllLoans={handleToggleSelectAllLoans}
            onUpdateReturnItem={handleUpdateReturnItem}
            onRemoveReturnItem={(barcode) =>
              setReturnItems((prev) => prev.filter((item) => item.barcode !== barcode))
            }
            onClearReturnItems={() => setReturnItems([])}
            onConfirm={() => setConfirmation("return")}
            payImmediately={payImmediately}
            onPayImmediatelyChange={setPayImmediately}
            recentFines={recentFines}
            onPayFine={handlePayFine}
            payingFineId={payingFineId}
          />
        )}

        {activeTab === "Gia hạn" && (
          <div className="transaction-main">
            <div className="transaction-scan">
              <div>
                <p className="eyebrow">GIA HẠN TÀI LIỆU</p>
                <h2>Gia hạn nhanh theo mã cá biệt</h2>
                <p>Nhập mã cá biệt hoặc chọn trực tiếp từ danh sách tài liệu đang mượn của bạn đọc bên dưới.</p>
              </div>
              <form
                className="scan-input"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!renewBarcode.trim()) return;
                  setRenewTargetTitle(null);
                  setConfirmation("renew");
                }}
              >
                <Icon name="sparkle" />
                <input
                  value={renewBarcode}
                  onChange={(event) => setRenewBarcode(event.target.value)}
                  placeholder="Nhập hoặc quét mã cá biệt cần gia hạn..."
                  aria-label="Mã vạch tài liệu gia hạn"
                />
                <Button type="submit" disabled={!renewBarcode.trim()}>Gia hạn</Button>
              </form>
            </div>

            {currentReader && (
              <section className="transaction-table-panel">
                <div className="transaction-panel-heading">
                  <div>
                    <h2>Tài liệu đang mượn của {currentReader.fullName}</h2>
                    <p>Nhấn “Gia hạn” trên từng lượt mượn còn hạn để cộng thêm ngày theo chính sách.</p>
                  </div>
                </div>
                {loadingActiveLoans ? (
                  <LoadingState size="sm" variant="table" count={3} title="Đang tải danh sách đang mượn…" />
                ) : activeLoans.length === 0 ? (
                  <EmptyState
                    size="sm"
                    icon="book"
                    title="Bạn đọc hiện không có tài liệu đang mượn"
                    description="Các tài liệu đang mượn sẽ xuất hiện tại đây để thao tác gia hạn nhanh."
                  />
                ) : (
                  <div className="transaction-table-wrap">
                    <table className="transaction-table">
                      <thead>
                        <tr>
                          <th>Tài liệu</th>
                          <th>Mã cá biệt</th>
                          <th>Hạn trả hiện tại</th>
                          <th>Số lần đã gia hạn</th>
                          <th>Trạng thái</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeLoans.map((loan) => {
                          const overdueDays = computeOverdueDays(loan.dueDate);
                          return (
                            <tr key={loan.circulationId}>
                              <td>
                                <div className="transaction-book">
                                  <span><Icon name="book" /></span>
                                  <div>
                                    <strong>{loan.documentTitle}</strong>
                                    <small>{loan.shelfLocation || loan.callNumber || "—"}</small>
                                  </div>
                                </div>
                              </td>
                              <td><code>{loan.barcode}</code></td>
                              <td className={overdueDays > 0 ? "overdue-date" : undefined}>
                                {formatViDate(loan.dueDate)}
                              </td>
                              <td>{loan.renewalsCount} lần</td>
                              <td>
                                <Status tone={overdueDays > 0 ? "error" : "success"}>
                                  {overdueDays > 0 ? `Quá hạn ${overdueDays} ngày` : "Trong hạn"}
                                </Status>
                              </td>
                              <td>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={overdueDays > 0}
                                  onClick={() => {
                                    setRenewBarcode(loan.barcode);
                                    setRenewTargetTitle(loan.documentTitle);
                                    setConfirmation("renew");
                                  }}
                                >
                                  {overdueDays > 0 ? "Quá hạn" : "Gia hạn"}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      <ReaderPickerModal
        open={readerPickerOpen}
        initialQuery={readerPickerInitialQuery}
        selectedReaderId={currentReader?.id}
        onClose={() => setReaderPickerOpen(false)}
        onSelect={handleSelectReader}
      />

      <BookCopyPickerModal
        open={bookPickerOpen}
        readerCode={currentReader?.userCode}
        addedBarcodes={loanItems.map((item) => item.barcode)}
        onClose={() => setBookPickerOpen(false)}
        onPickCopy={handlePickCopyFromModal}
      />

      <Modal
        open={confirmation !== null}
        onClose={() => {
          if (!processing) setConfirmation(null);
        }}
        title={actionLabel}
      >
        <div className="transaction-confirmation">
          <span>
            <Icon
              name={
                confirmation === "return"
                  ? "arrow-left"
                  : confirmation === "renew"
                    ? "sparkle"
                    : "book"
              }
              size={25}
            />
          </span>
          <div>
            <strong>
              {confirmation === "loan"
                ? `Cho mượn ${String(loanItems.length).padStart(2, "0")} tài liệu cho ${currentReader?.fullName ?? ""}?`
                : confirmation === "return"
                  ? `Nhận trả ${String(returnItems.length).padStart(2, "0")} tài liệu đã chọn?`
                  : renewTargetTitle
                    ? `Gia hạn "${renewTargetTitle}" (${renewBarcode})?`
                    : `Gia hạn tài liệu mã ${renewBarcode}?`}
            </strong>
            <p>
              {confirmation === "return"
                ? `Các khoản phạt quá hạn, hư hỏng/mất và phạt bổ sung sẽ được ghi nhận vào hệ thống${payImmediately ? " và tự động đánh dấu đã thu tại quầy." : "."}`
                : "Kiểm tra mã cá biệt và thông tin bạn đọc trước khi xác nhận."}
            </p>
          </div>
        </div>
        {confirmation === "return" && returnItems.length > 0 && (
          <ul className="confirmation-return-summary">
            {returnItems.map((item) => {
              const est = estimateReturnItemFines(item, penaltyTypes);
              return (
                <li key={item.barcode}>
                  <span>
                    <strong>{item.documentTitle}</strong>
                    <small>{item.barcode}</small>
                  </span>
                  <span>{est.total > 0 ? `${est.total.toLocaleString("vi-VN")}đ` : "0đ"}</span>
                </li>
              );
            })}
          </ul>
        )}
        <label className="staff-checkbox confirmation-checkbox">
          <input type="checkbox" defaultChecked />
          <span>Tôi đã kiểm tra thông tin và tình trạng tài liệu</span>
        </label>
        <div className="modal-actions">
          <Button variant="ghost" disabled={processing} onClick={() => setConfirmation(null)}>
            Quay lại
          </Button>
          <Button loading={processing} onClick={() => void executeConfirmedTransaction()}>
            {actionLabel}
          </Button>
        </div>
      </Modal>

      {toast && (
        <div className="toast-position">
          <Toast tone={toast.tone} title="Lưu thông tài liệu" onClose={() => setToast(null)}>
            {toast.text}
          </Toast>
        </div>
      )}
    </div>
  );
}
