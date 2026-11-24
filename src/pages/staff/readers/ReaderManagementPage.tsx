import { useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Avatar, Badge, Breadcrumb, Button, EmptyState, LoadingState, Modal, Pagination, SearchInput, SelectField, Status } from "../../../design-system";
import { circulationService } from "../../../services/circulation.service";
import { userService } from "../../../services/user.service";
import type { CirculationHistoryItemDto, DepartmentDto, PageResponse, UserDto } from "../../../types/api";
import { formatDateVi } from "../../../utils/mappers";

const types = { STUDENT: "Sinh viên", LECTURER: "Giảng viên", RESEARCHER: "Nghiên cứu sinh", STAFF: "Nhân viên" };
const statuses = { ACTIVE: "Hoạt động", LOCKED: "Bị khóa", EXPIRED: "Hết hạn", INACTIVE: "Ngừng hoạt động" };
const historyStatusFilters = [
  { value: "", label: "Tất cả" },
  { value: "BORROWING", label: "Đang mượn" },
  { value: "OVERDUE", label: "Quá hạn" },
  { value: "RETURNED", label: "Đã trả" },
] as const;
const reasons = {
  violation: "Vi phạm quy định thư viện",
  debt: "Công nợ chưa xử lý",
  lost: "Báo mất thẻ",
};
const labelFor = (labels: Record<string, string>, value: string) =>
  Object.prototype.hasOwnProperty.call(labels, value) ? labels[value] : value || "—";

function loanStatusMeta(status: string): { tone: "success" | "warning" | "error" | "neutral"; label: string } {
  switch (status) {
    case "OVERDUE":
      return { tone: "error", label: "Quá hạn" };
    case "RETURNED":
      return { tone: "success", label: "Đã trả" };
    case "RETURNED_LATE":
      return { tone: "warning", label: "Trả muộn" };
    case "BORROWING":
      return { tone: "neutral", label: "Đang mượn" };
    default:
      return { tone: "neutral", label: status || "—" };
  }
}

export default function ReaderManagementPage() {
  const location = useLocation();
  const isAdminPortal = location.pathname.startsWith("/admin");
  const [params, setParams] = useSearchParams();
  const [revision, setRevision] = useState(0);
  const keyword = params.get("q") ?? "";
  const status = params.get("status") ?? "";
  const userType = params.get("userType") ?? "";
  const departmentId = params.get("departmentId") ?? "";
  const requestedPage = Number(params.get("page"));
  const page = Number.isInteger(requestedPage) && requestedPage >= 0 && requestedPage <= 2147483647 ? requestedPage : 0;
  const requestedSize = Number(params.get("size"));
  const pageSize = Number.isInteger(requestedSize) && requestedSize >= 1 && requestedSize <= 100 ? requestedSize : 20;
  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [departmentError, setDepartmentError] = useState(false);
  const [departmentRevision, setDepartmentRevision] = useState(0);
  const requestKey = params.toString() + ":" + revision;
  const [load, setLoad] = useState<{ key: string; result?: PageResponse<UserDto>; error?: string }>();
  const result = load?.key === requestKey ? load.result : undefined;
  const loadError = load?.key === requestKey ? load.error : undefined;
  const [selectedReader, setSelectedReader] = useState<UserDto>();
  const [profileTab, setProfileTab] = useState<"info" | "history">("info");
  const [historyStatus, setHistoryStatus] = useState<string>("");
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRevision, setHistoryRevision] = useState(0);
  const [historyLoad, setHistoryLoad] = useState<{
    key: string;
    result?: PageResponse<CirculationHistoryItemDto>;
    error?: string;
  }>();
  const [cardAction, setCardAction] = useState<{ reader: UserDto; lock: boolean }>();
  const [reason, setReason] = useState<keyof typeof reasons>("violation");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

  const historyRequestKey = selectedReader
    ? `${selectedReader.id}:${historyStatus}:${historyPage}:${historyRevision}`
    : "";
  const historyResult = historyLoad?.key === historyRequestKey ? historyLoad.result : undefined;
  const historyError = historyLoad?.key === historyRequestKey ? historyLoad.error : undefined;

  function openReaderModal(reader: UserDto, initialTab: "info" | "history" = "info") {
    setSelectedReader(reader);
    setProfileTab(initialTab);
    setHistoryStatus("");
    setHistoryPage(0);
  }

  useEffect(() => {
    if (!selectedReader || profileTab !== "history") return;
    let active = true;
    circulationService
      .getUserCirculationHistory(selectedReader.id, historyStatus || undefined, {
        page: historyPage,
        size: 8,
      })
      .then((data) => {
        if (active) setHistoryLoad({ key: historyRequestKey, result: data });
      })
      .catch((error: unknown) => {
        if (active) {
          setHistoryLoad({
            key: historyRequestKey,
            error: error instanceof Error ? error.message : "Không tải được lịch sử mượn trả.",
          });
        }
      });
    return () => { active = false; };
  }, [historyPage, historyRequestKey, historyStatus, profileTab, selectedReader]);

  useEffect(() => setDraftKeyword(keyword), [keyword]);

  useEffect(() => {
    let active = true;
    setDepartmentError(false);
    userService.getDepartments().then((data) => {
      if (active) setDepartments(data);
    }).catch(() => { if (active) setDepartmentError(true); });
    return () => { active = false; };
  }, [departmentRevision]);

  useEffect(() => {
    let active = true;
    const department = Number(departmentId);
    userService.searchAdminUsers({
      role: "READER",
      keyword: keyword.trim() || undefined,
      status: status || undefined,
      userType: userType || undefined,
      departmentId: Number.isSafeInteger(department) && department > 0 ? department : undefined,
      page,
      size: pageSize,
    }).then((data) => {
      if (!active) return;
      if (page > 0 && page >= data.totalPages) {
        setParams((previous) => {
          const next = new URLSearchParams(previous);
          next.set("page", String(Math.max(0, data.totalPages - 1)));
          return next;
        }, { replace: true });
        return;
      }
      setLoad({ key: requestKey, result: data });
    }).catch((error: unknown) => {
      if (active) setLoad({ key: requestKey, error: error instanceof Error ? error.message : "Không tải được danh sách bạn đọc." });
    });
    return () => { active = false; };
  }, [departmentId, keyword, page, pageSize, requestKey, setParams, status, userType]);

  function changeFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    if (next.toString() === params.toString()) setRevision((value) => value + 1);
    else setParams(next);
  }

  function changePage(nextPage: number) {
    const next = new URLSearchParams(params);
    next.set("page", String(nextPage));
    setParams(next);
  }

  function changePageSize(nextSize: number) {
    const next = new URLSearchParams(params);
    next.set("size", String(nextSize));
    next.delete("page");
    setParams(next);
  }

  function askCardAction(reader: UserDto) {
    setReason("violation");
    setActionError("");
    setCardAction({ reader, lock: reader.status === "ACTIVE" });
  }

  async function executeCardAction() {
    if (!cardAction || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setActionError("");
    try {
      const { reader, lock } = cardAction;
      const nextStatus = lock ? "LOCKED" : "ACTIVE";
      const lockReason = lock ? reasons[reason] : undefined;
      await userService.updateUserStatus(reader.id, { status: nextStatus, reason: lockReason });
      setSelectedReader((selected) => selected?.id === reader.id
        ? { ...selected, status: nextStatus, lockReason }
        : selected);
      setCardAction(undefined);
      setRevision((value) => value + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Máy chủ chưa xác nhận cập nhật trạng thái thẻ.");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  const cardActionButton = (reader: UserDto) => (reader.status === "ACTIVE" || reader.status === "LOCKED") && (
    <Button variant={reader.status === "LOCKED" ? "secondary" : "ghost"} size="sm" onClick={() => askCardAction(reader)}>
      {reader.status === "LOCKED" ? "Mở khóa thẻ" : "Khóa thẻ"}
    </Button>
  );

  return (
    <div className="reader-management-page">
      <div className="reader-management-heading">
        <div>
          <Breadcrumb items={[isAdminPortal ? "Không gian quản trị" : "Không gian nghiệp vụ", "Bạn đọc"]} />
          <h1>Quản lý bạn đọc</h1>
          <p>Tra cứu hồ sơ, theo dõi lịch sử mượn trả và kiểm soát trạng thái thẻ thư viện.</p>
        </div>
      </div>
      <section className="reader-search-filters">
        <form className="reader-management-search" onSubmit={(event) => {
          event.preventDefault();
          changeFilter("q", draftKeyword.trim());
        }}>
          <SearchInput aria-label="Tìm bạn đọc" placeholder="Mã bạn đọc, họ tên hoặc email" value={draftKeyword} onChange={(event) => setDraftKeyword(event.target.value)} />
          <Button type="submit" icon="search">Tìm kiếm</Button>
        </form>
        <div className="reader-filter-row">
          <SelectField label="Loại bạn đọc" value={userType} onChange={(event) => changeFilter("userType", event.target.value)}>
            <option value="">Tất cả loại bạn đọc</option>
            {Object.entries(types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectField>
          <SelectField label="Khoa/ngành" value={departmentId} onChange={(event) => changeFilter("departmentId", event.target.value)}>
            <option value="">Tất cả khoa/ngành</option>
            {departmentId && !departments.some((item) => String(item.id) === departmentId) && <option value={departmentId}>Khoa/ngành #{departmentId}</option>}
            {departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </SelectField>
          <SelectField label="Trạng thái thẻ" value={status} onChange={(event) => changeFilter("status", event.target.value)}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectField>
          <Button variant="ghost" size="sm" onClick={() => { setDraftKeyword(""); setParams({}); }}>Xóa bộ lọc</Button>
        </div>
        {departmentError && <p role="alert">Không tải được khoa/ngành. <Button size="sm" onClick={() => setDepartmentRevision((value) => value + 1)}>Thử lại</Button></p>}
      </section>

      <section className="reader-table-panel">
        <div className="reader-table-heading"><h2>Danh sách bạn đọc</h2>{result && <p>{result.totalElements.toLocaleString("vi-VN")} kết quả</p>}</div>
        {loadError ? (
          <EmptyState
            tone="error"
            title="Không tải được danh sách bạn đọc"
            description={loadError}
            action={<Button onClick={() => setRevision((value) => value + 1)}>Thử lại</Button>}
          />
        ) : !result ? (
          <LoadingState variant="table" count={6} title="Đang tải danh sách bạn đọc…" />
        ) : !result.items.length ? (
          <EmptyState
            icon="users"
            title="Không tìm thấy bạn đọc phù hợp"
            description="Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc hiện tại."
            action={<Button variant="secondary" size="sm" onClick={() => { setDraftKeyword(""); setParams({}); }}>Xóa bộ lọc</Button>}
          />
        ) : <>
            <div className="reader-management-table-wrap">
              <table className="reader-management-table">
                <thead><tr><th>Mã bạn đọc</th><th>Họ tên</th><th>Loại bạn đọc</th><th>Khoa/ngành</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>{result.items.map((reader) => <tr
                  key={reader.id}
                  className="clickable-row"
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest("button, a, input, select, .managed-reader-actions")) return;
                    openReaderModal(reader, "info");
                  }}
                >
                  <td><code>{reader.userCode}</code></td>
                  <td><div className="managed-reader-cell"><Avatar name={reader.fullName} /><div><strong>{reader.fullName}</strong><small>{reader.email}</small></div></div></td>
                  <td>{labelFor(types, reader.userType)}</td><td>{reader.departmentName || "—"}</td>
                  <td><Status tone={reader.status === "ACTIVE" ? "success" : reader.status === "LOCKED" ? "error" : "warning"}>{labelFor(statuses, reader.status)}</Status></td>
                  <td>
                    <div className="managed-reader-actions">
                      <Button variant="ghost" size="sm" onClick={() => openReaderModal(reader, "info")}>Xem hồ sơ</Button>
                      <Button variant="secondary" size="sm" onClick={() => openReaderModal(reader, "history")}>Lịch sử mượn</Button>
                      {cardActionButton(reader)}
                    </div>
                  </td>
                </tr>)}</tbody>
              </table>
            </div>
            <Pagination
              variant="bar"
              page={result.page + 1}
              totalPages={result.totalPages}
              totalElements={result.totalElements}
              pageSize={pageSize}
              itemLabel="bạn đọc"
              ariaLabel="Phân trang danh sách bạn đọc"
              onPageChange={(nextPage) => changePage(nextPage - 1)}
              onPageSizeChange={changePageSize}
            />
          </>}
      </section>

      <Modal
        open={Boolean(selectedReader)}
        onClose={() => setSelectedReader(undefined)}
        eyebrow="THÔNG TIN BẠN ĐỌC"
        title="Hồ sơ bạn đọc"
        className="reader-detail-modal"
      >
        {selectedReader && (
          <div className="reader-profile">
            <div className="reader-profile-header">
              <Avatar name={selectedReader.fullName} size="lg" />
              <div>
                <div>
                  <h2>{selectedReader.fullName}</h2>
                  <Status tone={selectedReader.status === "ACTIVE" ? "success" : selectedReader.status === "LOCKED" ? "error" : "warning"}>
                    {labelFor(statuses, selectedReader.status)}
                  </Status>
                </div>
                <p>{selectedReader.userCode} · {labelFor(types, selectedReader.userType)}</p>
              </div>
            </div>

            {selectedReader.status === "LOCKED" && selectedReader.lockReason && (
              <div className="reader-lock-alert" role="status">
                <div>
                  <strong>Thẻ thư viện hiện đang bị khóa</strong>
                  <p>Lý do: {selectedReader.lockReason}</p>
                </div>
              </div>
            )}

            <div className="reader-profile-tabs" role="tablist" aria-label="Chi tiết hồ sơ bạn đọc">
              <button
                type="button"
                role="tab"
                aria-selected={profileTab === "info"}
                className={profileTab === "info" ? "active" : ""}
                onClick={() => setProfileTab("info")}
              >
                Thông tin cá nhân
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={profileTab === "history"}
                className={profileTab === "history" ? "active" : ""}
                onClick={() => setProfileTab("history")}
              >
                Lịch sử mượn trả
              </button>
            </div>

            {profileTab === "info" ? (
              <dl className="reader-personal-info">
                <div><dt>Họ tên</dt><dd>{selectedReader.fullName}</dd></div>
                <div><dt>Mã bạn đọc</dt><dd><code>{selectedReader.userCode}</code></dd></div>
                <div><dt>Email</dt><dd>{selectedReader.email}</dd></div>
                <div><dt>Khoa/ngành</dt><dd>{selectedReader.departmentName || "—"}</dd></div>
                <div><dt>Điện thoại</dt><dd>{selectedReader.phone || "—"}</dd></div>
                <div><dt>Hạn thẻ</dt><dd>{formatDateVi(selectedReader.cardExpiry)}</dd></div>
                <div><dt>Loại bạn đọc</dt><dd>{labelFor(types, selectedReader.userType)}</dd></div>
                <div><dt>Trạng thái thẻ</dt><dd>{labelFor(statuses, selectedReader.status)}</dd></div>
              </dl>
            ) : (
              <div className="reader-history-panel">
                <div className="reader-history-toolbar">
                  <div className="reader-history-filters" role="group" aria-label="Lọc trạng thái mượn trả">
                    {historyStatusFilters.map((filter) => (
                      <button
                        key={filter.value || "ALL"}
                        type="button"
                        className={historyStatus === filter.value ? "active" : ""}
                        onClick={() => {
                          setHistoryStatus(filter.value);
                          setHistoryPage(0);
                        }}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  {historyResult && (
                    <Badge tone="neutral">{historyResult.totalElements.toLocaleString("vi-VN")} lượt</Badge>
                  )}
                </div>

                {historyError ? (
                  <EmptyState
                    size="sm"
                    tone="error"
                    title="Không tải được lịch sử mượn trả"
                    description={historyError}
                    action={<Button size="sm" onClick={() => setHistoryRevision((v) => v + 1)}>Thử lại</Button>}
                  />
                ) : !historyResult ? (
                  <LoadingState size="sm" variant="table" count={4} title="Đang tải lịch sử mượn trả…" />
                ) : historyResult.items.length === 0 ? (
                  <EmptyState
                    size="sm"
                    icon="book"
                    title="Chưa có dữ liệu mượn trả"
                    description={historyStatus ? "Không có lượt mượn nào khớp trạng thái đã chọn." : "Bạn đọc này chưa có lượt mượn tài liệu nào trong hệ thống."}
                  />
                ) : (
                  <>
                    <div className="profile-data-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Tài liệu</th>
                            <th>Ngày mượn</th>
                            <th>Hạn trả</th>
                            <th>Ngày trả</th>
                            <th>Gia hạn</th>
                            <th>Phí phạt</th>
                            <th>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyResult.items.map((item) => {
                            const meta = loanStatusMeta(item.status);
                            return (
                              <tr key={item.circulationId}>
                                <td>
                                  <strong>{item.documentTitle}</strong>
                                  <small>
                                    <code>{item.barcode}</code>
                                    {item.shelfLocation ? ` · ${item.shelfLocation}` : ""}
                                  </small>
                                </td>
                                <td>{formatDateVi(item.borrowDate)}</td>
                                <td className={item.status === "OVERDUE" ? "overdue-date" : undefined}>
                                  {formatDateVi(item.dueDate)}
                                </td>
                                <td>{item.returnDate ? formatDateVi(item.returnDate) : "—"}</td>
                                <td>{item.renewalsCount} lần</td>
                                <td className={item.fineAmount > 0 ? "reader-debt" : undefined}>
                                  {item.fineAmount > 0 ? `${item.fineAmount.toLocaleString("vi-VN")}đ` : "0đ"}
                                </td>
                                <td><Status tone={meta.tone}>{meta.label}</Status></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {historyResult.totalPages > 1 && (
                      <div className="reader-history-pagination">
                        <Pagination
                          variant="compact"
                          page={historyResult.page + 1}
                          totalPages={historyResult.totalPages}
                          totalElements={historyResult.totalElements}
                          pageSize={8}
                          itemLabel="lượt mượn"
                          ariaLabel="Phân trang lịch sử mượn trả"
                          onPageChange={(nextPage) => setHistoryPage(nextPage - 1)}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setSelectedReader(undefined)}>Đóng</Button>
              {(selectedReader.status === "ACTIVE" || selectedReader.status === "LOCKED") && (
                <Button
                  variant={selectedReader.status === "LOCKED" ? "primary" : "danger"}
                  onClick={() => askCardAction(selectedReader)}
                >
                  {selectedReader.status === "LOCKED" ? "Mở khóa thẻ" : "Khóa thẻ"}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
      <Modal open={Boolean(cardAction)} onClose={() => { if (!submitting.current) setCardAction(undefined); }} title={cardAction?.lock ? "Khóa thẻ bạn đọc" : "Mở khóa thẻ bạn đọc"}>
        <p>{cardAction?.reader.fullName} · {cardAction?.reader.userCode}</p>
        {actionError && <p role="alert">{actionError}</p>}
        {cardAction?.lock && <SelectField disabled={saving} label="Lý do khóa thẻ" value={reason} onChange={(event) => setReason(event.target.value as keyof typeof reasons)}>
          {Object.entries(reasons).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>}
        <div className="modal-actions">
          <Button variant="ghost" disabled={saving} onClick={() => setCardAction(undefined)}>Hủy</Button>
          <Button variant={cardAction?.lock ? "danger" : "primary"} loading={saving} onClick={executeCardAction}>Xác nhận</Button>
        </div>
      </Modal>
    </div>
  );
}
