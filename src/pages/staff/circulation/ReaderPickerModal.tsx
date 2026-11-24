import { useEffect, useState } from "react";
import { Avatar, Button, EmptyState, LoadingState, Modal, Pagination, SearchInput, Status } from "../../../design-system";
import { userService } from "../../../services/user.service";
import type { PageResponse, UserDto } from "../../../types/api";

const USER_TYPE_LABELS: Record<string, string> = {
  STUDENT: "Sinh viên",
  LECTURER: "Giảng viên",
  RESEARCHER: "Nghiên cứu sinh",
  STAFF: "Nhân viên",
};

const READER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Hoạt động",
  LOCKED: "Bị khóa",
  EXPIRED: "Hết hạn",
  INACTIVE: "Ngừng hoạt động",
};

export default function ReaderPickerModal({
  open,
  initialQuery = "",
  selectedReaderId,
  onClose,
  onSelect,
}: {
  open: boolean;
  initialQuery?: string;
  selectedReaderId?: string;
  onClose: () => void;
  onSelect: (reader: UserDto) => void;
}) {
  const [draftQuery, setDraftQuery] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [load, setLoad] = useState<{ key: string; result?: PageResponse<UserDto>; error?: string }>();

  useEffect(() => {
    if (!open) return;
    const normalized = initialQuery.trim();
    setDraftQuery(normalized);
    setQuery(normalized);
    setPage(0);
  }, [open, initialQuery]);

  const requestKey = open ? `${query}:${page}:${revision}` : "";
  const result = load?.key === requestKey ? load.result : undefined;
  const loadError = load?.key === requestKey ? load.error : undefined;

  useEffect(() => {
    if (!open) return;
    let active = true;
    userService
      .searchAdminUsers({
        role: "READER",
        keyword: query || undefined,
        page,
        size: 8,
      })
      .then((data) => {
        if (active) setLoad({ key: requestKey, result: data });
      })
      .catch((error: unknown) => {
        if (active) {
          setLoad({
            key: requestKey,
            error: error instanceof Error ? error.message : "Không tải được danh sách bạn đọc.",
          });
        }
      });
    return () => { active = false; };
  }, [open, page, query, requestKey]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = draftQuery.trim();
    setPage(0);
    if (next === query) setRevision((v) => v + 1);
    else setQuery(next);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="TRA CỨU BẠN ĐỌC"
      title="Chọn bạn đọc tại quầy"
      className="circulation-picker-modal"
    >
      <div className="picker-modal-body">
        <form className="picker-search-row" onSubmit={handleSubmit}>
          <SearchInput
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Nhập mã bạn đọc, họ tên hoặc email..."
            autoFocus
          />
          <Button type="submit" icon="search">Tìm kiếm</Button>
          {query && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDraftQuery("");
                setQuery("");
                setPage(0);
              }}
            >
              Xóa lọc
            </Button>
          )}
        </form>

        {loadError ? (
          <EmptyState
            size="sm"
            tone="error"
            title="Không tải được danh sách bạn đọc"
            description={loadError}
            action={<Button size="sm" onClick={() => setRevision((v) => v + 1)}>Thử lại</Button>}
          />
        ) : !result ? (
          <LoadingState size="sm" variant="table" count={5} title="Đang tìm bạn đọc…" />
        ) : result.items.length === 0 ? (
          <EmptyState
            size="sm"
            icon="users"
            title="Không tìm thấy bạn đọc phù hợp"
            description="Thử tìm với mã bạn đọc, họ tên hoặc email khác."
          />
        ) : (
          <>
            <p className="picker-result-meta">
              Tìm thấy <strong>{result.totalElements.toLocaleString("vi-VN")}</strong> bạn đọc. Nhấn chọn để mở hồ sơ tại quầy.
            </p>
            <div className="picker-reader-list">
              {result.items.map((reader) => {
                const isSelected = reader.id === selectedReaderId;
                const statusTone =
                  reader.status === "ACTIVE" ? "success" : reader.status === "LOCKED" ? "error" : "warning";
                return (
                  <div
                    key={reader.id}
                    className={`picker-reader-item ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      onSelect(reader);
                      onClose();
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect(reader);
                        onClose();
                      }
                    }}
                  >
                    <Avatar name={reader.fullName} size="sm" />
                    <div className="picker-reader-info">
                      <strong>{reader.fullName}</strong>
                      <small>
                        <code>{reader.userCode}</code>
                        {" · "}
                        {USER_TYPE_LABELS[reader.userType] ?? reader.userType}
                        {reader.departmentName ? ` · ${reader.departmentName}` : ""}
                      </small>
                      <small>{reader.email}</small>
                    </div>
                    <Status tone={statusTone}>{READER_STATUS_LABELS[reader.status] ?? reader.status}</Status>
                    <Button
                      size="sm"
                      variant={isSelected ? "secondary" : "primary"}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(reader);
                        onClose();
                      }}
                    >
                      {isSelected ? "Đang chọn" : "Chọn"}
                    </Button>
                  </div>
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
                  pageSize={8}
                  itemLabel="bạn đọc"
                  ariaLabel="Phân trang chọn bạn đọc"
                  onPageChange={(nextPage) => setPage(nextPage - 1)}
                />
              </div>
            )}
          </>
        )}

        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </Modal>
  );
}
