import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Breadcrumb, Button, EmptyState, Icon, IconButton, LoadingState, Modal, Pagination, SearchInput, SelectField, Toast } from "../../../design-system";
import { pipelineSteps } from "../../../constants/library-options";
import { catalogService } from "../../../services/catalog.service";
import type { DigitalProcessingItemDto, DigitalProcessingListResponse } from "../../../types/api";

const DEFAULT_PAGE_SIZE = 20;
const AUTO_REFRESH_MS = 30_000;

type Tone = "success" | "error" | "info" | "warning";
const STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "Đang chờ", tone: "warning" },
  PROCESSING: { label: "Đang xử lý", tone: "info" },
  INDEXED: { label: "Hoàn thành", tone: "success" },
  LOW_QUALITY: { label: "Chất lượng thấp", tone: "warning" },
  FAILED: { label: "Lỗi", tone: "error" },
};
const statusOf = (status: string) => STATUS[status] ?? { label: status, tone: "info" as Tone };
const canReprocess = (item: DigitalProcessingItemDto) => item.processingStatus === "FAILED" || item.processingStatus === "LOW_QUALITY";

function formatSize(bytes?: number | null) {
  if (!bytes) return "—";
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
}

function qualityPercent(item: DigitalProcessingItemDto) {
  return item.extractionQuality == null ? null : Math.round(item.extractionQuality * 100);
}

// Trạng thái từng bước pipeline suy ra từ trạng thái bản số
function stepStatus(item: DigitalProcessingItemDto, index: number): "complete" | "processing" | "failed" | "waiting" {
  switch (item.processingStatus) {
    case "INDEXED":
    case "LOW_QUALITY":
      return "complete";
    case "FAILED":
      return index === 0 ? "complete" : index === 1 ? "failed" : "waiting";
    case "PROCESSING":
      return index === 0 ? "complete" : index === 1 ? "processing" : "waiting";
    default:
      return index === 0 ? "complete" : "waiting";
  }
}

export default function DigitalProcessingPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [data, setData] = useState<DigitalProcessingListResponse | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [revision, setRevision] = useState(0);
  const [detail, setDetail] = useState<DigitalProcessingItemDto | null>(null);
  const [reprocessing, setReprocessing] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setLoadState((current) => (data && current === "ready" ? "ready" : "loading"));
    catalogService
      .listDigitalProcessing({ status: status || undefined, keyword: keyword || undefined, page, size: pageSize })
      .then((result) => { if (active) { setData(result); setLoadState("ready"); } })
      .catch(() => { if (active) setLoadState("error"); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, keyword, page, pageSize, revision]);

  // Tự làm mới khi còn bản đang chờ / đang xử lý
  const counts = data?.statusCounts ?? {};
  const busy = (counts.PENDING ?? 0) + (counts.PROCESSING ?? 0) > 0;
  useEffect(() => {
    if (!busy) return;
    const timer = window.setInterval(refresh, AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [busy, refresh]);

  const changeStatus = (next: string) => { setStatus(next); setPage(0); };

  const reprocess = async (item: DigitalProcessingItemDto) => {
    if (reprocessing) return;
    setReprocessing(item.digitalCopyId);
    try {
      await catalogService.reprocessDigitalCopy(item.digitalCopyId);
      setToast(`Đã đưa "${item.documentTitle ?? item.fileName}" vào hàng đợi xử lý lại.`);
      setDetail(null);
      refresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Không thể xử lý lại bản số này.");
    } finally {
      setReprocessing(null);
    }
  };

  const items = data?.page.items ?? [];
  const totalPages = data?.page.totalPages ?? 0;
  const attention = (counts.FAILED ?? 0) + (counts.LOW_QUALITY ?? 0);
  const summary = [
    { key: "PENDING", icon: "more" as const, cls: "waiting", label: "Đang chờ", value: counts.PENDING ?? 0, hint: "Trong hàng đợi" },
    { key: "PROCESSING", icon: "sparkle" as const, cls: "processing", label: "Đang xử lý", value: counts.PROCESSING ?? 0, hint: "Worker đang bóc tách" },
    { key: "INDEXED", icon: "success" as const, cls: "complete", label: "Hoàn thành", value: counts.INDEXED ?? 0, hint: "Đã lập chỉ mục tìm kiếm" },
    { key: "ATTENTION", icon: "error" as const, cls: "failed", label: "Cần kiểm tra", value: attention, hint: `${counts.FAILED ?? 0} lỗi · ${counts.LOW_QUALITY ?? 0} chất lượng thấp` },
  ];

  return (
    <div className="digital-processing-page">
      <div className="processing-page-heading">
        <div><Breadcrumb items={["Không gian nghiệp vụ", "Tài liệu số", "Trạng thái xử lý"]} /><p className="eyebrow">XỬ LÝ NỘI DUNG SỐ</p><h1>Trạng thái xử lý tài liệu số</h1><p>Theo dõi bóc tách văn bản và lập chỉ mục tìm kiếm cho các bản PDF.</p></div>
        <div><Button icon="plus" onClick={() => navigate("/staff/materials")}>Tải tệp cho tài liệu</Button></div>
      </div>

      <section className="processing-summary-grid">
        {summary.map((card) => (
          <article
            key={card.key}
            className={(card.key === "ATTENTION" ? status === "FAILED" || status === "LOW_QUALITY" : status === card.key) ? "active" : ""}
            role="button"
            tabIndex={0}
            onClick={() => changeStatus(card.key === "ATTENTION" ? (counts.FAILED ? "FAILED" : "LOW_QUALITY") : status === card.key ? "" : card.key)}
            onKeyDown={(event) => { if (event.key === "Enter") (event.currentTarget as HTMLElement).click(); }}
          >
            <span className={`processing-summary-icon ${card.cls}`}><Icon name={card.icon} /></span>
            <div><small>{card.label}</small><strong>{data ? card.value.toLocaleString("vi-VN") : "—"}</strong><p>{card.hint}</p></div>
          </article>
        ))}
      </section>

      <section className="processing-table-panel">
        <div className="processing-table-heading">
          <div><h2>Danh sách bản số</h2><p>{data ? `${data.page.totalElements.toLocaleString("vi-VN")} tệp` : "Đang tải…"}{busy ? " · Tự làm mới mỗi 30 giây" : ""}</p></div>
          <div>
            <form className="processing-search" onSubmit={(event) => { event.preventDefault(); setKeyword(keywordInput.trim()); setPage(0); }}>
              <SearchInput placeholder="Nhan đề hoặc tên tệp…" value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} />
            </form>
            <SelectField label="Trạng thái" value={status} onChange={(event) => changeStatus(event.target.value)}>
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
            </SelectField>
            <IconButton label="Làm mới" icon="sparkle" onClick={refresh} />
          </div>
        </div>

        {loadState === "loading" && !data ? (
          <LoadingState variant="list" count={4} title="Đang tải danh sách bản số…" />
        ) : loadState === "error" ? (
          <EmptyState tone="error" title="Không tải được danh sách bản số" description="Kiểm tra kết nối tới máy chủ rồi thử lại." action={<Button size="sm" onClick={refresh}>Thử lại</Button>} />
        ) : items.length === 0 ? (
          <EmptyState icon="document" title={status || keyword ? "Không có bản số phù hợp" : "Chưa có bản số nào"} description="Các tệp PDF tải lên để trích xuất văn bản và lập chỉ mục sẽ hiển thị tại đây." />
        ) : (
          <div className="processing-table-wrap"><table className="processing-table"><thead><tr><th>Tài liệu</th><th>Tệp</th><th>Trạng thái</th><th>Chất lượng trích xuất</th><th>Thời gian xử lý</th><th>Thao tác</th></tr></thead><tbody>
            {items.map((item) => {
              const meta = statusOf(item.processingStatus);
              const quality = qualityPercent(item);
              return <tr key={item.digitalCopyId}>
                <td><div className="processing-title"><span><Icon name="document" /></span><div><strong>{item.documentTitle ?? "—"}</strong><small>{`Phiên bản ${item.version ?? "1.0"}${item.isCurrent ? " · đang dùng" : ""}`}</small></div></div></td>
                <td><div className="processing-file"><strong>{item.fileName ?? "—"}</strong><small>{formatSize(item.fileSize)}</small>{item.errorMessage && meta.tone !== "success" && <small className="file-error">{item.errorMessage}</small>}</div></td>
                <td><Badge tone={meta.tone}>{meta.label}</Badge></td>
                <td><div className="job-progress"><div><i className="progress-value" style={{ width: `${quality ?? 0}%`, background: quality == null ? undefined : quality < 60 ? "var(--warning)" : "var(--success)" }} /></div><span>{quality == null ? "—" : `${quality}%`}</span><small>{item.pageCount ? `${item.pageCount} trang` : "Chưa rõ số trang"}</small></div></td>
                <td><div className="processing-time"><span>{formatDateTime(item.startedAt ?? item.uploadedAt)}</span><small>{item.finishedAt ? `Xong ${formatDateTime(item.finishedAt)}` : "Chưa hoàn thành"}</small></div></td>
                <td><div className="processing-actions"><Button variant="ghost" size="sm" onClick={() => setDetail(item)}>Chi tiết</Button>{canReprocess(item) && <Button variant="secondary" size="sm" loading={reprocessing === item.digitalCopyId} onClick={() => reprocess(item)}>Xử lý lại</Button>}</div></td>
              </tr>;
            })}
          </tbody></table></div>
        )}

        <div className="processing-footnote">
          <span><Icon name="info" size={14} />Bản số dạng scan cần OCR sẽ có chất lượng trích xuất thấp.</span>
          {data && data.page.totalElements > 0 && (
            <Pagination
              variant="compact"
              page={page + 1}
              totalPages={totalPages}
              totalElements={data.page.totalElements}
              pageSize={pageSize}
              itemLabel="bản số"
              ariaLabel="Phân trang danh sách bản số"
              onPageChange={(nextPage) => setPage(nextPage - 1)}
              onPageSizeChange={(nextSize) => {
                setPageSize(nextSize);
                setPage(0);
              }}
            />
          )}
        </div>
      </section>

      <Modal open={detail !== null} onClose={() => setDetail(null)} title="Chi tiết xử lý tài liệu">
        {detail && (() => {
          const meta = statusOf(detail.processingStatus);
          const quality = qualityPercent(detail);
          return <div className="processing-detail">
            <div className="processing-detail-file"><span className="file-icon">PDF</span><div><strong>{detail.fileName ?? "—"}</strong><small>{detail.documentTitle ?? "—"} · {formatSize(detail.fileSize)}</small></div><Badge tone={meta.tone}>{meta.label}</Badge></div>
            {detail.errorMessage && meta.tone !== "success" && <div className="processing-error-detail"><Icon name="error" /><div><strong>{detail.processingStatus === "LOW_QUALITY" ? "Trích xuất văn bản chưa đầy đủ" : "Không thể trích xuất văn bản"}</strong><p>{detail.errorMessage}</p></div></div>}
            <div className="pipeline-heading"><p>PIPELINE XỬ LÝ</p><span>{quality == null ? meta.label : `Chất lượng ${quality}%`}</span></div>
            <ol className="pipeline-steps">
              {pipelineSteps.map((step, index) => {
                const state = stepStatus(detail, index);
                return <li key={step.title} className={state}><span>{state === "complete" ? <Icon name="success" size={15} /> : state === "failed" ? <Icon name="error" size={15} /> : String(index + 1).padStart(2, "0")}</span><div><strong>{step.title}</strong><p>{state === "failed" && detail.errorMessage ? detail.errorMessage : step.description}</p></div><small>{state === "complete" ? "Hoàn thành" : state === "processing" ? "Đang xử lý" : state === "failed" ? "Lỗi" : "Đang chờ"}</small></li>;
              })}
            </ol>
            <div className="processing-technical-meta">
              <div><span>Job ID</span><strong>{detail.jobId ? `#${detail.jobId}` : "Nạp ngoài hàng đợi"}</strong></div>
              <div><span>Số lần chạy</span><strong>{detail.attempts ?? "—"}</strong></div>
              <div><span>Số trang</span><strong>{detail.pageCount ?? "—"}</strong></div>
              <div><span>Tải lên</span><strong>{formatDateTime(detail.uploadedAt)}</strong></div>
              <div><span>Người tải</span><strong>{detail.uploadedBy ?? "—"}</strong></div>
            </div>
            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setDetail(null)}>Đóng</Button>
              {detail.documentId && <Button variant="secondary" onClick={() => navigate(`/reader/document/${encodeURIComponent(detail.documentId!)}`)}>Mở bản đọc</Button>}
              {canReprocess(detail) && <Button loading={reprocessing === detail.digitalCopyId} onClick={() => reprocess(detail)}>Xử lý lại</Button>}
            </div>
          </div>;
        })()}
      </Modal>

      {toast && <Toast tone="info" title="Xử lý tài liệu số" onClose={() => setToast(null)}>{toast}</Toast>}
    </div>
  );
}
