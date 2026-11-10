import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Avatar, Breadcrumb, Button, Modal, SearchInput, SelectField, Status } from "../../../design-system";
import { userService } from "../../../services/user.service";
import type { DepartmentDto, PageResponse, UserDto } from "../../../types/api";
import { formatDateVi } from "../../../utils/mappers";

const types = { STUDENT: "Sinh viên", LECTURER: "Giảng viên", RESEARCHER: "Nghiên cứu sinh", STAFF: "Nhân viên" };
const statuses = { ACTIVE: "Hoạt động", LOCKED: "Bị khóa", EXPIRED: "Hết hạn", INACTIVE: "Ngừng hoạt động" };
const reasons = {
  violation: "Vi phạm quy định thư viện",
  debt: "Công nợ chưa xử lý",
  lost: "Báo mất thẻ",
};
const labelFor = (labels: Record<string, string>, value: string) =>
  Object.prototype.hasOwnProperty.call(labels, value) ? labels[value] : value || "—";

export default function ReaderManagementPage() {
  const [params, setParams] = useSearchParams();
  const [revision, setRevision] = useState(0);
  const keyword = params.get("q") ?? "";
  const status = params.get("status") ?? "";
  const userType = params.get("userType") ?? "";
  const departmentId = params.get("departmentId") ?? "";
  const requestedPage = Number(params.get("page"));
  const page = Number.isInteger(requestedPage) && requestedPage >= 0 && requestedPage <= 2147483647 ? requestedPage : 0;
  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [departmentError, setDepartmentError] = useState(false);
  const [departmentRevision, setDepartmentRevision] = useState(0);
  const requestKey = params.toString() + ":" + revision;
  const [load, setLoad] = useState<{ key: string; result?: PageResponse<UserDto>; error?: string }>();
  const result = load?.key === requestKey ? load.result : undefined;
  const loadError = load?.key === requestKey ? load.error : undefined;
  const [selectedReader, setSelectedReader] = useState<UserDto>();
  const [cardAction, setCardAction] = useState<{ reader: UserDto; lock: boolean }>();
  const [reason, setReason] = useState<keyof typeof reasons>("violation");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

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
      size: 20,
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
  }, [departmentId, keyword, page, requestKey, setParams, status, userType]);

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
        <div><Breadcrumb items={["Không gian nghiệp vụ", "Bạn đọc"]} /><h1>Quản lý bạn đọc</h1><p>Tra cứu hồ sơ và kiểm soát trạng thái thẻ thư viện.</p></div>
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
        {loadError ? <p role="alert">{loadError} <Button onClick={() => setRevision((value) => value + 1)}>Thử lại</Button></p>
          : !result ? <p role="status">Đang tải danh sách…</p>
          : !result.items.length ? <p>Không tìm thấy bạn đọc phù hợp.</p>
          : <>
            <div className="reader-management-table-wrap">
              <table className="reader-management-table">
                <thead><tr><th>Mã bạn đọc</th><th>Họ tên</th><th>Loại bạn đọc</th><th>Khoa/ngành</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>{result.items.map((reader) => <tr key={reader.id}>
                  <td><code>{reader.userCode}</code></td>
                  <td><div className="managed-reader-cell"><Avatar name={reader.fullName} /><div><strong>{reader.fullName}</strong><small>{reader.email}</small></div></div></td>
                  <td>{labelFor(types, reader.userType)}</td><td>{reader.departmentName || "—"}</td>
                  <td><Status tone={reader.status === "ACTIVE" ? "success" : reader.status === "LOCKED" ? "error" : "warning"}>{labelFor(statuses, reader.status)}</Status></td>
                  <td><div className="managed-reader-actions"><Button variant="ghost" size="sm" onClick={() => setSelectedReader(reader)}>Xem hồ sơ</Button>{cardActionButton(reader)}</div></td>
                </tr>)}</tbody>
              </table>
            </div>
            <nav className="reader-table-pagination" aria-label="Phân trang bạn đọc">
              <Button disabled={!result.hasPrevious} onClick={() => changePage(result.page - 1)}>Trang trước</Button>
              <span>Trang {result.page + 1}/{result.totalPages}</span>
              <Button disabled={!result.hasNext} onClick={() => changePage(result.page + 1)}>Trang sau</Button>
            </nav>
          </>}
      </section>

      <Modal open={Boolean(selectedReader)} onClose={() => setSelectedReader(undefined)} title="Hồ sơ bạn đọc" className="reader-detail-modal">
        {selectedReader && <div className="reader-profile">
          <dl className="reader-personal-info">
            <div><dt>Họ tên</dt><dd>{selectedReader.fullName}</dd></div>
            <div><dt>Mã bạn đọc</dt><dd>{selectedReader.userCode}</dd></div>
            <div><dt>Email</dt><dd>{selectedReader.email}</dd></div>
            <div><dt>Khoa/ngành</dt><dd>{selectedReader.departmentName || "—"}</dd></div>
            <div><dt>Điện thoại</dt><dd>{selectedReader.phone || "—"}</dd></div>
            <div><dt>Hạn thẻ</dt><dd>{formatDateVi(selectedReader.cardExpiry)}</dd></div>
            <div><dt>Trạng thái</dt><dd>{labelFor(statuses, selectedReader.status)}</dd></div>
            {selectedReader.lockReason && <div><dt>Lý do khóa</dt><dd>{selectedReader.lockReason}</dd></div>}
          </dl>
          {cardActionButton(selectedReader)}
        </div>}
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
