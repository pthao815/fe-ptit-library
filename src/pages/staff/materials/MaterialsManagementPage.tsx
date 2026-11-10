import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Badge, Breadcrumb, Button, Dropdown, Icon, IconButton, Modal, SearchInput } from "../../../design-system";
import { catalogService } from "../../../services/catalog.service";
import { userService } from "../../../services/user.service";
import { authSession } from "../../../shared/auth/auth-session";
import type { DepartmentDto, DocumentSummaryDto, PageResponse } from "../../../types/api";

const PAGE_SIZE = 20;
const MAX_INT = 2147483647;

// Mã docType đang có trong CSDL; mã lạ vẫn hiển thị nguyên văn.
const docTypeLabels: Record<string, string> = {
  textbook: "Giáo trình",
  slide: "Bài giảng",
  reference: "Sách tham khảo",
};
const docTypeLabel = (code?: string) => (code ? docTypeLabels[code] ?? code : "—");

const coverTones = ["cover-red", "cover-slate", "cover-sand", "cover-charcoal"];
function coverTone(id: string) {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return coverTones[Math.abs(hash) % coverTones.length];
}

function intParam(value: string | null, min: number, max: number) {
  const number = Number(value);
  return value && Number.isSafeInteger(number) && number >= min && number <= max ? number : undefined;
}

/** Các số trang cần hiện: trang đầu, trang cuối và lân cận trang hiện tại. */
function pageItems(current: number, total: number): (number | "gap")[] {
  const pages = new Set([0, total - 1, current - 1, current, current + 1].filter((page) => page >= 0 && page < total));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((page, index) => (index > 0 && page - sorted[index - 1] > 1 ? ["gap" as const, page] : [page]));
}

export default function MaterialsManagementPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { pathname, search } = useLocation();
  const base = pathname.startsWith("/admin/") ? "/admin/materials" : "/staff/materials";
  const { session, identityVersion } = useSyncExternalStore(authSession.subscribe, authSession.getSnapshot);
  const isAdmin = session?.role === "ADMIN";

  const query = params.get("q") ?? "";
  const docType = params.get("type") ?? "";
  const departmentId = intParam(params.get("dept"), 1, MAX_INT);
  const year = intParam(params.get("year"), 1000, 9999);
  const page = intParam(params.get("page"), 0, MAX_INT) ?? 0;

  const [keyword, setKeyword] = useState(query);
  useEffect(() => setKeyword(query), [query]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<PageResponse<DocumentSummaryDto>>();
  const [loadError, setLoadError] = useState("");
  const [actionMenu, setActionMenu] = useState<string>();
  const [target, setTarget] = useState<DocumentSummaryDto>();
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const submitting = useRef(false);

  /** Ghi bộ lọc vào URL; đổi bộ lọc thì quay về trang đầu. */
  function updateParams(changes: Record<string, string | undefined>, replace = false) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries({ page: undefined, ...changes })) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace });
  }

  useEffect(() => {
    let active = true;
    userService.getDepartments().then((units) => {
      if (active) setDepartments(units);
    }).catch(() => {
      // Không tải được danh mục khoa/ngành thì chỉ ẩn bộ lọc này
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setResult(undefined);
    setLoadError("");
    catalogService.searchDocuments({
      keyword: query || undefined,
      docType: docType || undefined,
      departmentId,
      publicationYear: year,
      page,
      size: PAGE_SIZE,
    }).then((data) => {
      if (!active) return;
      if (page > 0 && page >= data.totalPages) updateParams({ page: String(Math.max(0, data.totalPages - 1)) }, true);
      else setResult(data);
    }).catch((cause: unknown) => {
      if (active) setLoadError(cause instanceof Error ? cause.message : "Không tải được danh mục.");
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, docType, departmentId, year, page, revision]);

  useEffect(() => {
    if (!actionMenu) return;
    const close = (event: MouseEvent) => {
      if (!(event.target as Element).closest?.(".catalog-more-wrap")) setActionMenu(undefined);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [actionMenu]);

  async function remove() {
    if (submitting.current || !target || !isAdmin) return;
    submitting.current = true;
    setDeleting(true);
    setDeleteError("");
    try {
      await catalogService.deleteDocument(target.id);
      if (authSession.getSnapshot().identityVersion !== identityVersion) return;
      setTarget(undefined);
      setRevision((value) => value + 1);
    } catch (cause) {
      if (authSession.getSnapshot().identityVersion === identityVersion) {
        setDeleteError(cause instanceof Error ? cause.message : "Không thể xác nhận xóa biểu ghi.");
      }
    } finally {
      submitting.current = false;
      setDeleting(false);
    }
  }

  const docTypeOptions = [...new Set([...Object.keys(docTypeLabels), docType].filter(Boolean))];
  const hasFilters = Boolean(query || docType || departmentId || year);
  const first = result ? result.page * result.size + 1 : 0;
  const last = result ? result.page * result.size + result.items.length : 0;

  return (
    <div className="materials-page">
      <div className="materials-page-heading">
        <div>
          <Breadcrumb items={[{ label: "Không gian nghiệp vụ", to: "/" + base.split("/")[1] }, "Quản lý tài liệu"]} />
          <p className="eyebrow">QUẢN LÝ BIỂU GHI</p>
          <h1>Quản lý tài liệu</h1>
          <p>Biên mục, kiểm soát và cập nhật kho tài liệu thư viện.</p>
        </div>
        <div className="materials-top-actions">
          <Button icon="plus" onClick={() => navigate(base + "/new" + search)}>Thêm tài liệu</Button>
        </div>
      </div>

      <form className="materials-search-panel" onSubmit={(event) => {
        event.preventDefault();
        updateParams({ q: keyword.trim() || undefined });
        setRevision((value) => value + 1);
      }}>
        <div className="catalog-search-row">
          <SearchInput value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm theo nhan đề, tác giả hoặc ISBN..." />
          <Button type="submit" icon="search">Tìm kiếm</Button>
          {hasFilters && <Button type="button" variant="ghost" onClick={() => { setKeyword(""); setParams({}); }}>Xóa bộ lọc</Button>}
        </div>
        <div className="catalog-filter-grid">
          <label>
            <span>Dạng tài liệu</span>
            <select value={docType} onChange={(event) => updateParams({ type: event.target.value || undefined })}>
              <option value="">Tất cả dạng tài liệu</option>
              {docTypeOptions.map((code) => <option key={code} value={code}>{docTypeLabel(code)}</option>)}
            </select>
            <Icon name="chevron-down" size={14} />
          </label>
          {departments.length > 0 && <label>
            <span>Khoa/ngành</span>
            <select value={departmentId ?? ""} onChange={(event) => updateParams({ dept: event.target.value || undefined })}>
              <option value="">Tất cả khoa/ngành</option>
              {departments.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select>
            <Icon name="chevron-down" size={14} />
          </label>}
          <label>
            <span>Năm xuất bản</span>
            <select value={year ?? ""} onChange={(event) => updateParams({ year: event.target.value || undefined })}>
              <option value="">Tất cả các năm</option>
              {Array.from({ length: 30 }, (_, index) => new Date().getFullYear() - index).map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <Icon name="chevron-down" size={14} />
          </label>
        </div>
      </form>

      <section className="catalog-table-panel">
        <div className="catalog-table-toolbar">
          <div>
            <h2>Danh sách biểu ghi</h2>
            <p>{result ? `${result.totalElements.toLocaleString("vi-VN")} biểu ghi${hasFilters ? " phù hợp bộ lọc" : ""}` : "Đang tải…"}</p>
          </div>
          <IconButton label="Làm mới" icon="sparkle" onClick={() => setRevision((value) => value + 1)} />
        </div>

        {loadError ? (
          <div className="catalog-empty" role="alert">
            <Icon name="error" size={28} />
            <h2>Không tải được danh mục</h2>
            <p>{loadError}</p>
            <Button onClick={() => setRevision((value) => value + 1)}>Thử lại</Button>
          </div>
        ) : !result ? (
          <div className="catalog-empty" role="status"><p>Đang tải danh mục…</p></div>
        ) : !result.items.length ? (
          <div className="catalog-empty">
            <Icon name="search" size={28} />
            <h2>Không tìm thấy tài liệu</h2>
            <p>{hasFilters ? "Thử đổi từ khóa hoặc bỏ bớt bộ lọc." : "Kho chưa có biểu ghi nào."}</p>
            <Button icon="plus" onClick={() => navigate(base + "/new" + search)}>Thêm tài liệu</Button>
          </div>
        ) : <>
          <div className="catalog-table-wrap">
            <table className="catalog-table">
              <thead><tr><th>Bìa</th><th>Nhan đề</th><th>Tác giả</th><th>Năm XB</th><th>Dạng tài liệu</th><th>Bản giấy</th><th>Tài liệu số</th><th>Thao tác</th></tr></thead>
              <tbody>{result.items.map((document) => (
                <tr key={document.id}>
                  <td>
                    <div className="catalog-cover">
                      {document.coverUrl
                        ? <img src={document.coverUrl} alt={`Bìa sách ${document.title}`} width={38} height={51} style={{ objectFit: "cover" }} />
                        : <div className={`book-cover ${coverTone(document.id)}`} aria-hidden="true"><strong>{document.title}</strong></div>}
                    </div>
                  </td>
                  <td><div className="catalog-title-cell"><strong>{document.title}</strong></div></td>
                  <td>{document.authors?.join(", ") || "—"}</td>
                  <td>{document.publicationYear ?? "—"}</td>
                  <td>{document.docType ? <Badge>{docTypeLabel(document.docType)}</Badge> : "—"}</td>
                  <td>
                    <div className="copy-count">
                      <strong>{document.availablePhysicalCopies}/{document.totalPhysicalCopies}</strong>
                      <small>Sẵn sàng / tổng</small>
                    </div>
                  </td>
                  <td>{document.hasDigitalCopy
                    ? <span className="digital-count"><Icon name="document" size={15} /><span><strong>Có bản số</strong><small>PDF</small></span></span>
                    : <span className="no-digital">Chưa có</span>}</td>
                  <td>
                    <div className="catalog-row-actions">
                      <Button variant="ghost" size="sm" onClick={() => navigate("/reader/book-detail?id=" + encodeURIComponent(document.id), { state: { returnTo: base + search } })}>Xem</Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(base + "/edit/" + document.id + search)}>Sửa</Button>
                      {isAdmin && <div className="catalog-more-wrap">
                        <IconButton label="Thêm thao tác" icon="more" onClick={() => setActionMenu(actionMenu === document.id ? undefined : document.id)} />
                        <Dropdown open={actionMenu === document.id}>
                          <button type="button" className="danger" onClick={() => { setTarget(document); setDeleteError(""); setActionMenu(undefined); }}>
                            <Icon name="error" />Xóa biểu ghi
                          </button>
                        </Dropdown>
                      </div>}
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="catalog-pagination">
            <p>Hiển thị <strong>{first}–{last}</strong> trong tổng số <strong>{result.totalElements.toLocaleString("vi-VN")}</strong> biểu ghi</p>
            {result.totalPages > 1 && <nav className="pagination" aria-label="Phân trang">
              <IconButton label="Trang trước" icon="chevron-left" disabled={page === 0} onClick={() => updateParams({ page: String(page - 1) })} />
              {pageItems(page, result.totalPages).map((item, index) => item === "gap"
                ? <span key={"gap" + index}>…</span>
                : <button key={item} type="button" className={item === page ? "active" : ""} aria-current={item === page ? "page" : undefined} onClick={() => updateParams({ page: String(item) })}>{item + 1}</button>)}
              <IconButton label="Trang sau" icon="chevron-right" disabled={page + 1 >= result.totalPages} onClick={() => updateParams({ page: String(page + 1) })} />
            </nav>}
          </div>
        </>}
      </section>

      <Modal open={Boolean(target && isAdmin)} onClose={() => { if (!deleting) setTarget(undefined); }} title="Xóa biểu ghi thư mục">
        <div className="catalog-delete-warning">
          <span><Icon name="error" size={24} /></span>
          <div><strong>Bạn có chắc muốn xóa biểu ghi này?</strong><p>{target?.title}</p></div>
        </div>
        <p className="delete-explanation">Không thể xóa khi đầu sách còn bản giấy đang được mượn. Biểu ghi bị xóa sẽ không còn hiện trong tra cứu.</p>
        {deleteError && <p role="alert" className="form-error-summary">{deleteError}</p>}
        <div className="modal-actions">
          <Button variant="ghost" disabled={deleting} onClick={() => setTarget(undefined)}>Hủy</Button>
          <Button variant="danger" loading={deleting} onClick={() => void remove()}>Xóa biểu ghi</Button>
        </div>
      </Modal>
    </div>
  );
}
