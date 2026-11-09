import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Breadcrumb, Button, Modal } from "../../../design-system";
import { catalogService } from "../../../services/catalog.service";
import { authSession } from "../../../shared/auth/auth-session";
import type { DocumentSummaryDto, PageResponse } from "../../../types/api";

export default function MaterialsManagementPage() {
  const [params, setParams] = useSearchParams();
  const { pathname, search } = useLocation();
  const base = pathname.startsWith("/admin/") ? "/admin/materials" : "/staff/materials";
  const { session, identityVersion } = useSyncExternalStore(authSession.subscribe, authSession.getSnapshot);
  const query = params.get("q") ?? "";
  const rawPage = Number(params.get("page"));
  const page = Number.isSafeInteger(rawPage) && rawPage >= 0 && rawPage <= 2147483647 ? rawPage : 0;
  const [keyword, setKeyword] = useState(query);
  useEffect(() => setKeyword(query), [query]);
  const changePage = (next: number, replace = false) => {
    setParams({ q: query, page: String(next) }, { replace });
  };
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<PageResponse<DocumentSummaryDto>>();
  const [loadError, setLoadError] = useState("");
  const [target, setTarget] = useState<DocumentSummaryDto>();
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    setResult(undefined);
    setLoadError("");
    catalogService.searchDocuments({ keyword: query, page, size: 20 }).then((data) => {
      if (!active) return;
      if (page > 0 && page >= data.totalPages) changePage(Math.max(0, data.totalPages - 1), true);
      else setResult(data);
    }).catch((cause: unknown) => {
      if (active) setLoadError(cause instanceof Error ? cause.message : "Không tải được danh mục.");
    });
    return () => { active = false; };
  }, [query, page, revision]);

  async function remove() {
    if (submitting.current || !target || session?.role !== "ADMIN") return;
    submitting.current = true;
    setDeleting(true);
    setDeleteError("");
    try {
      await catalogService.deleteDocument(target.id);
      if (authSession.getSnapshot().identityVersion !== identityVersion) return;
      setTarget(undefined);
      setResult(undefined);
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

  return <div className="materials-page">
    <Breadcrumb items={[{ label: "Tổng quan", to: "/" + base.split("/")[1] }, "Quản lý tài liệu"]} />
    <div className="materials-page-heading"><h1>Quản lý tài liệu</h1><Link to={base + "/new" + search}>Thêm tài liệu</Link></div>
    <form className="materials-search-panel" onSubmit={(event) => {
      event.preventDefault();
      setParams({ q: keyword.trim() });
      setRevision((value) => value + 1);
    }}>
      <input aria-label="Từ khóa" placeholder="Nhan đề, tác giả hoặc ISBN" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
      <Button type="submit" icon="search">Tìm kiếm</Button>
    </form>
    {loadError ? <div role="alert">{loadError} <Button onClick={() => setRevision((value) => value + 1)}>Thử lại</Button></div>
      : !result ? <p role="status">Đang tải danh mục…</p>
      : !result.items.length ? <p>Không tìm thấy tài liệu.</p>
      : <>
        <div className="catalog-table-panel catalog-table-wrap"><table>
          <thead><tr><th>Nhan đề</th><th>Tác giả</th><th>Loại</th><th>Bản giấy có sẵn</th><th>Thao tác</th></tr></thead>
          <tbody>{result.items.map((document) => <tr key={document.id}>
            <td>{document.title}</td><td>{document.authors?.join(", ") || "—"}</td><td>{document.docType || "—"}</td>
            <td>{document.availablePhysicalCopies}/{document.totalPhysicalCopies}</td>
            <td>
              <Link to={"/reader/book-detail?id=" + encodeURIComponent(document.id)} state={{ returnTo: base + search }}>Xem</Link>{" "}
              <Link to={base + "/edit/" + document.id + search}>Sửa biểu ghi và bản giấy</Link>{" "}
              {session?.role === "ADMIN" && <Button size="sm" variant="danger" onClick={() => {
                setTarget(document);
                setDeleteError("");
              }}>Xóa</Button>}
            </td>
          </tr>)}</tbody>
        </table></div>
        <div className="catalog-pagination">
          <Button disabled={page === 0} onClick={() => changePage(page - 1)}>Trang trước</Button>
          <span>Trang {page + 1}/{result.totalPages} · {result.totalElements} tài liệu</span>
          <Button disabled={page + 1 >= result.totalPages} onClick={() => changePage(page + 1)}>Trang sau</Button>
        </div>
      </>}
    <Modal open={Boolean(target && session?.role === "ADMIN")} onClose={() => { if (!deleting) setTarget(undefined); }} title="Xóa biểu ghi">
      <p>{target?.title}</p>
      {deleteError && <p role="alert">{deleteError}</p>}
      <Button variant="secondary" disabled={deleting} onClick={() => setTarget(undefined)}>Hủy</Button>{" "}
      <Button variant="danger" disabled={deleting} onClick={() => void remove()}>{deleting ? "Đang xóa…" : "Xác nhận xóa"}</Button>
    </Modal>
  </div>;
}
