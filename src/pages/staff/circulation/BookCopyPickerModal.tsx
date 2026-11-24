import { useEffect, useState } from "react";
import { Badge, Button, EmptyState, Icon, LoadingState, Modal, Pagination, SearchInput, Status } from "../../../design-system";
import { catalogService } from "../../../services/catalog.service";
import { circulationService } from "../../../services/circulation.service";
import type { CopyLookupDto, DocumentSummaryDto, PageResponse, PhysicalCopyDto } from "../../../types/api";
import { formatDocTypeLabel } from "../../../utils/mappers";

const COPY_STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Sẵn sàng",
  BORROWED: "Đang mượn",
  RESERVED: "Đang giữ đặt trước",
  DAMAGED: "Hư hỏng",
  LOST: "Đã mất",
  MAINTENANCE: "Bảo trì",
};

export default function BookCopyPickerModal({
  open,
  readerCode,
  addedBarcodes,
  onClose,
  onPickCopy,
}: {
  open: boolean;
  readerCode?: string;
  addedBarcodes: string[];
  onClose: () => void;
  onPickCopy: (copy: CopyLookupDto) => void;
}) {
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [load, setLoad] = useState<{ key: string; result?: PageResponse<DocumentSummaryDto>; error?: string }>();
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [copiesByDoc, setCopiesByDoc] = useState<Record<string, { status: "loading" | "ready" | "error"; items?: PhysicalCopyDto[]; error?: string }>>({});
  const [pickingBarcode, setPickingBarcode] = useState<string | null>(null);
  const [pickFeedback, setPickFeedback] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setPickFeedback(null);
  }, [open]);

  const requestKey = open ? `${query}:${page}:${revision}` : "";
  const result = load?.key === requestKey ? load.result : undefined;
  const loadError = load?.key === requestKey ? load.error : undefined;

  useEffect(() => {
    if (!open) return;
    let active = true;
    catalogService
      .searchDocuments({
        keyword: query || undefined,
        page,
        size: 6,
      })
      .then((data) => {
        if (active) setLoad({ key: requestKey, result: data });
      })
      .catch((error: unknown) => {
        if (active) {
          setLoad({
            key: requestKey,
            error: error instanceof Error ? error.message : "Không tải được danh mục tài liệu.",
          });
        }
      });
    return () => { active = false; };
  }, [open, page, query, requestKey]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = draftQuery.trim();
    setPage(0);
    setExpandedDocId(null);
    if (next === query) setRevision((v) => v + 1);
    else setQuery(next);
  };

  const handleToggleDocument = async (documentId: string) => {
    if (expandedDocId === documentId) {
      setExpandedDocId(null);
      return;
    }
    setExpandedDocId(documentId);
    setPickFeedback(null);
    if (copiesByDoc[documentId]?.status === "ready") return;
    setCopiesByDoc((prev) => ({ ...prev, [documentId]: { status: "loading" } }));
    try {
      const copies = await catalogService.getPhysicalCopies(documentId);
      setCopiesByDoc((prev) => ({ ...prev, [documentId]: { status: "ready", items: copies } }));
    } catch (error) {
      setCopiesByDoc((prev) => ({
        ...prev,
        [documentId]: {
          status: "error",
          error: error instanceof Error ? error.message : "Không tải được danh sách bản sách.",
        },
      }));
    }
  };

  const handleSelectPhysicalCopy = async (barcode: string) => {
    if (pickingBarcode) return;
    if (addedBarcodes.some((code) => code.toLowerCase() === barcode.toLowerCase())) return;
    setPickingBarcode(barcode);
    setPickFeedback(null);
    try {
      const copy = await circulationService.lookupCopy(barcode);
      const isAvailable = copy.status === "AVAILABLE";
      const isReservedForCurrentReader =
        copy.status === "RESERVED" && Boolean(readerCode) && copy.reservedFor?.userCode === readerCode;

      if (!isAvailable && !isReservedForCurrentReader) {
        const detail =
          copy.status === "RESERVED" && copy.reservedFor
            ? `Bản sách ${copy.barcode} đang giữ đặt trước cho ${copy.reservedFor.fullName} (${copy.reservedFor.userCode}).`
            : copy.activeLoan
              ? `Bản sách ${copy.barcode} đang được mượn bởi ${copy.activeLoan.fullName} (${copy.activeLoan.userCode}).`
              : `Bản sách ${copy.barcode} hiện ở trạng thái "${COPY_STATUS_LABEL[copy.status] ?? copy.status}", không thể cho mượn.`;
        setPickFeedback({ tone: "error", text: detail });
        return;
      }

      onPickCopy(copy);
      setPickFeedback({ tone: "success", text: `Đã thêm "${copy.documentTitle}" (${copy.barcode}) vào danh sách cho mượn.` });
    } catch (error) {
      setPickFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Không tra cứu được bản sách này.",
      });
    } finally {
      setPickingBarcode(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="TRA CỨU KHO SÁCH"
      title="Tìm & chọn tài liệu cho mượn"
      className="circulation-picker-modal"
    >
      <div className="picker-modal-body">
        <form className="picker-search-row" onSubmit={handleSubmit}>
          <SearchInput
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Tìm theo nhan đề tài liệu..."
            autoFocus
          />
          <Button type="submit" icon="search">Tìm sách</Button>
          {query && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDraftQuery("");
                setQuery("");
                setPage(0);
                setExpandedDocId(null);
              }}
            >
              Xóa lọc
            </Button>
          )}
        </form>

        {pickFeedback && (
          <div className={`picker-feedback ${pickFeedback.tone}`} role="status">
            <Icon name={pickFeedback.tone === "error" ? "error" : "success"} size={16} />
            <span>{pickFeedback.text}</span>
          </div>
        )}

        {loadError ? (
          <EmptyState
            size="sm"
            tone="error"
            title="Không tải được danh mục tài liệu"
            description={loadError}
            action={<Button size="sm" onClick={() => setRevision((v) => v + 1)}>Thử lại</Button>}
          />
        ) : !result ? (
          <LoadingState size="sm" variant="table" count={4} title="Đang tìm tài liệu trong kho…" />
        ) : result.items.length === 0 ? (
          <EmptyState
            size="sm"
            icon="book"
            title="Không tìm thấy tài liệu phù hợp"
            description="Thử nhập từ khóa khác hoặc kiểm tra lại mã tài liệu."
          />
        ) : (
          <>
            <p className="picker-result-meta">
              Tìm thấy <strong>{result.totalElements.toLocaleString("vi-VN")}</strong> đầu sách. Nhấn vào tài liệu để xem các bản sách vật lý.
            </p>
            <div className="picker-doc-list">
              {result.items.map((doc) => {
                const isExpanded = expandedDocId === doc.id;
                const copiesState = copiesByDoc[doc.id];
                const authorText = doc.authors?.length ? doc.authors.join(", ") : "Chưa rõ tác giả";
                return (
                  <article key={doc.id} className={`picker-doc-card ${isExpanded ? "expanded" : ""}`}>
                    <button
                      type="button"
                      className="picker-doc-header"
                      onClick={() => void handleToggleDocument(doc.id)}
                      aria-expanded={isExpanded}
                    >
                      <span className="picker-doc-icon"><Icon name="book" size={18} /></span>
                      <div className="picker-doc-info">
                        <strong>{doc.title}</strong>
                        <small>
                          {authorText}
                          {doc.publicationYear ? ` · ${doc.publicationYear}` : ""}
                          {doc.docType ? ` · ${formatDocTypeLabel(doc.docType)}` : ""}
                        </small>
                      </div>
                      <Badge tone={doc.availablePhysicalCopies > 0 ? "success" : "neutral"}>
                        Còn {doc.availablePhysicalCopies}/{doc.totalPhysicalCopies} bản
                      </Badge>
                      <Icon name={isExpanded ? "chevron-down" : "chevron-right"} size={16} />
                    </button>

                    {isExpanded && (
                      <div className="picker-copies-panel">
                        {copiesState?.status === "loading" ? (
                          <p className="picker-copies-status">Đang tải danh sách bản sách vật lý…</p>
                        ) : copiesState?.status === "error" ? (
                          <p className="picker-copies-status error">{copiesState.error}</p>
                        ) : !copiesState?.items?.length ? (
                          <p className="picker-copies-status">Đầu sách này chưa có bản sách vật lý nào.</p>
                        ) : (
                          <div className="picker-copy-list">
                            {copiesState.items.map((copy) => {
                              const alreadyAdded = addedBarcodes.some(
                                (code) => code.toLowerCase() === copy.barcode.toLowerCase(),
                              );
                              const canTryPick = copy.status === "AVAILABLE" || copy.status === "RESERVED";
                              const tone =
                                copy.status === "AVAILABLE"
                                  ? "success"
                                  : copy.status === "RESERVED"
                                    ? "warning"
                                    : "error";
                              return (
                                <div key={copy.id} className="picker-copy-row">
                                  <div>
                                    <code>{copy.barcode}</code>
                                    <small>
                                      {[copy.shelfLocation, copy.callNumber].filter(Boolean).join(" · ") || "Chưa cập nhật vị trí"}
                                    </small>
                                  </div>
                                  <Status tone={tone}>
                                    {COPY_STATUS_LABEL[copy.status ?? ""] ?? copy.status ?? "—"}
                                  </Status>
                                  <Button
                                    size="sm"
                                    variant={alreadyAdded ? "secondary" : "primary"}
                                    disabled={alreadyAdded || !canTryPick || (pickingBarcode !== null && pickingBarcode !== copy.barcode)}
                                    loading={pickingBarcode === copy.barcode}
                                    onClick={() => void handleSelectPhysicalCopy(copy.barcode)}
                                  >
                                    {alreadyAdded ? "Đã thêm" : "Thêm vào phiếu"}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {result.totalPages > 1 && (
              <div className="picker-pagination">
                <Pagination
                  variant="compact"
                  page={result.page + 1}
                  totalPages={result.totalPages}
                  totalElements={result.totalElements}
                  pageSize={6}
                  itemLabel="tài liệu"
                  ariaLabel="Phân trang chọn tài liệu"
                  onPageChange={(nextPage) => {
                    setPage(nextPage - 1);
                    setExpandedDocId(null);
                  }}
                />
              </div>
            )}
          </>
        )}

        <div className="modal-actions picker-modal-footer">
          <span className="picker-footer-count">
            Đã có <strong>{addedBarcodes.length}</strong> bản sách trong danh sách cho mượn
          </span>
          <Button onClick={onClose}>Xong</Button>
        </div>
      </div>
    </Modal>
  );
}
