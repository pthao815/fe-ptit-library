import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  CustomSelect,
  EmptyState,
  Field,
  Icon,
  LoadingState,
  Modal,
  Pagination,
  SearchInput,
  SelectField,
  Status,
  TextAreaField,
  Toast,
} from "../../../design-system";
import { notificationService } from "../../../services/analytics.service";
import { userService } from "../../../services/user.service";
import type {
  AdminNotificationItemDto,
  DepartmentDto,
  NotificationTargetScope,
  PageResponse,
  UserDto,
} from "../../../types/api";
import { formatDateTimeVi, parseNotificationContent } from "../../../utils/mappers";
import ReaderPickerModal from "../circulation/ReaderPickerModal";

const TARGET_SCOPES: Array<{
  value: NotificationTargetScope;
  label: string;
  description: string;
}> = [
  {
    value: "ALL_READERS",
    label: "Tất cả bạn đọc",
    description: "Gửi đến toàn bộ bạn đọc đang hoạt động",
  },
  {
    value: "DEPARTMENT",
    label: "Theo khoa / ngành",
    description: "Gửi đến bạn đọc thuộc một đơn vị đào tạo",
  },
  {
    value: "USER_TYPE",
    label: "Theo nhóm bạn đọc",
    description: "Sinh viên, giảng viên, nghiên cứu sinh...",
  },
  {
    value: "SINGLE_USER",
    label: "Một bạn đọc cụ thể",
    description: "Chọn trực tiếp 1 tài khoản nhận thông báo",
  },
];

const MESSAGE_TYPE_OPTIONS = [
  { value: "SYSTEM_ANNOUNCEMENT", label: "Thông báo hệ thống" },
  { value: "LIBRARY_NOTICE", label: "Thông báo hoạt động thư viện" },
  { value: "REMINDER", label: "Nhắc nhở bạn đọc" },
  { value: "MAINTENANCE", label: "Thông báo bảo trì" },
] as const;

const HISTORY_TYPE_FILTERS = [
  { value: "", label: "Tất cả loại thông báo" },
  { value: "SYSTEM_ANNOUNCEMENT", label: "Thông báo hệ thống" },
  { value: "LIBRARY_NOTICE", label: "Hoạt động thư viện" },
  { value: "REMINDER", label: "Nhắc nhở bạn đọc" },
  { value: "MAINTENANCE", label: "Bảo trì hệ thống" },
  { value: "LOAN_OVERDUE", label: "Nhắc quá hạn mượn" },
  { value: "HOLD_PLACED", label: "Đặt trước thành công" },
  { value: "HOLD_READY", label: "Sách đặt trước sẵn sàng" },
] as const;

const HISTORY_STATUS_FILTERS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "SENT", label: "Đã gửi · Chưa đọc" },
  { value: "READ", label: "Đã đọc" },
  { value: "PENDING", label: "Chờ gửi" },
  { value: "FAILED", label: "Gửi lỗi" },
] as const;

const USER_TYPE_OPTIONS = [
  { value: "STUDENT", label: "Sinh viên" },
  { value: "LECTURER", label: "Giảng viên" },
  { value: "RESEARCHER", label: "Nghiên cứu sinh" },
  { value: "STAFF", label: "Nhân viên" },
] as const;

type SelectedRecipient = {
  id: string;
  userCode: string;
  fullName: string;
  email: string;
};

function messageTypeMeta(type?: string): {
  label: string;
  tone: "brand" | "info" | "warning" | "error" | "success" | "neutral";
} {
  switch ((type || "").toUpperCase()) {
    case "SYSTEM_ANNOUNCEMENT":
      return { label: "Hệ thống", tone: "brand" };
    case "LIBRARY_NOTICE":
      return { label: "Thư viện", tone: "info" };
    case "REMINDER":
      return { label: "Nhắc nhở", tone: "warning" };
    case "MAINTENANCE":
      return { label: "Bảo trì", tone: "warning" };
    case "LOAN_OVERDUE":
      return { label: "Quá hạn", tone: "error" };
    case "HOLD_PLACED":
      return { label: "Đặt trước", tone: "info" };
    case "HOLD_READY":
      return { label: "Sẵn sàng nhận", tone: "success" };
    default:
      return { label: type || "Thông báo", tone: "neutral" };
  }
}

function statusMeta(status?: string): {
  label: string;
  tone: "success" | "warning" | "error" | "neutral";
} {
  switch ((status || "").toUpperCase()) {
    case "READ":
      return { label: "Đã đọc", tone: "success" };
    case "SENT":
      return { label: "Chưa đọc", tone: "neutral" };
    case "PENDING":
      return { label: "Chờ gửi", tone: "warning" };
    case "FAILED":
      return { label: "Gửi lỗi", tone: "error" };
    default:
      return { label: status || "Chưa đọc", tone: "neutral" };
  }
}

export default function NotificationManagementPage() {
  const location = useLocation();
  const isAdminPortal = location.pathname.startsWith("/admin");
  const [searchParams, setSearchParams] = useSearchParams();

  const preselectedUserId = searchParams.get("userId") ?? "";
  const preselectedUserCode = searchParams.get("userCode") ?? "";
  const preselectedFullName = searchParams.get("fullName") ?? "";
  const preselectedEmail = searchParams.get("email") ?? "";

  // Composer state
  const [targetScope, setTargetScope] = useState<NotificationTargetScope>(() =>
    preselectedUserId ? "SINGLE_USER" : "ALL_READERS",
  );
  const [selectedRecipient, setSelectedRecipient] = useState<SelectedRecipient | null>(() =>
    preselectedUserId
      ? {
          id: preselectedUserId,
          userCode: preselectedUserCode || "Bạn đọc",
          fullName: preselectedFullName || preselectedUserCode || "Bạn đọc đã chọn",
          email: preselectedEmail,
        }
      : null,
  );
  const [departmentId, setDepartmentId] = useState<string>("");
  const [userType, setUserType] = useState<string>("STUDENT");
  const [messageType, setMessageType] = useState<string>("SYSTEM_ANNOUNCEMENT");
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string>("");
  const [toast, setToast] = useState<{ tone: "success" | "error"; title: string; message: string } | null>(null);

  // Departments state
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [departmentError, setDepartmentError] = useState(false);

  // History state
  const [draftKeyword, setDraftKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [revision, setRevision] = useState(0);
  const [historyLoad, setHistoryLoad] = useState<{
    key: string;
    result?: PageResponse<AdminNotificationItemDto>;
    error?: string;
  }>();
  const [detailItem, setDetailItem] = useState<AdminNotificationItemDto | null>(null);

  // Sync deep-link query params from ReaderManagementPage
  useEffect(() => {
    if (!preselectedUserId) return;
    setTargetScope("SINGLE_USER");
    setSelectedRecipient({
      id: preselectedUserId,
      userCode: preselectedUserCode || "Bạn đọc",
      fullName: preselectedFullName || preselectedUserCode || "Bạn đọc đã chọn",
      email: preselectedEmail,
    });
  }, [preselectedEmail, preselectedFullName, preselectedUserCode, preselectedUserId]);

  useEffect(() => {
    let active = true;
    userService
      .getDepartments()
      .then((data) => {
        if (active) {
          setDepartments(data);
          setDepartmentError(false);
        }
      })
      .catch(() => {
        if (active) setDepartmentError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const historyRequestKey = `${keyword}:${filterType}:${filterStatus}:${page}:${pageSize}:${revision}`;
  const historyResult = historyLoad?.key === historyRequestKey ? historyLoad.result : undefined;
  const historyError = historyLoad?.key === historyRequestKey ? historyLoad.error : undefined;

  useEffect(() => {
    let active = true;
    notificationService
      .getAdminNotifications({
        keyword: keyword || undefined,
        messageType: filterType || undefined,
        status: filterStatus || undefined,
        page,
        size: pageSize,
      })
      .then((data) => {
        if (active) setHistoryLoad({ key: historyRequestKey, result: data });
      })
      .catch((error: unknown) => {
        if (active) {
          setHistoryLoad({
            key: historyRequestKey,
            error: error instanceof Error ? error.message : "Không tải được lịch sử thông báo.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [filterStatus, filterType, historyRequestKey, keyword, page, pageSize]);

  const handleSelectReader = (reader: UserDto) => {
    setSelectedRecipient({
      id: reader.id,
      userCode: reader.userCode,
      fullName: reader.fullName,
      email: reader.email,
    });
    setFormError("");
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setFormError("");
    if (preselectedUserId) {
      setSearchParams({}, { replace: true });
    }
  };

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    if (sending) return;
    setFormError("");

    const trimmedContent = content.trim();
    const trimmedTitle = title.trim();

    if (targetScope === "SINGLE_USER" && !selectedRecipient) {
      setFormError("Vui lòng chọn bạn đọc nhận thông báo.");
      return;
    }
    if (targetScope === "DEPARTMENT" && !departmentId) {
      setFormError("Vui lòng chọn khoa/ngành nhận thông báo.");
      return;
    }
    if (!trimmedContent) {
      setFormError("Vui lòng nhập nội dung thông báo.");
      return;
    }

    setSending(true);
    try {
      const response = await notificationService.sendAdminNotification({
        targetScope,
        userId: targetScope === "SINGLE_USER" ? selectedRecipient?.id : undefined,
        departmentId: targetScope === "DEPARTMENT" ? Number(departmentId) : undefined,
        userType: targetScope === "USER_TYPE" ? userType : undefined,
        messageType,
        title: trimmedTitle || undefined,
        content: trimmedContent,
        channel: "IN_APP",
      });

      setToast({
        tone: "success",
        title: "Đã gửi thông báo",
        message: `Thông báo đã được gửi thành công tới ${response.recipientCount.toLocaleString("vi-VN")} bạn đọc.`,
      });
      setTitle("");
      setContent("");
      setPage(0);
      setRevision((value) => value + 1);
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Không gửi được thông báo. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  const handleHistorySearch = (event: FormEvent) => {
    event.preventDefault();
    const next = draftKeyword.trim();
    setPage(0);
    if (next === keyword) setRevision((value) => value + 1);
    else setKeyword(next);
  };

  const detailParsed = detailItem ? parseNotificationContent(detailItem.content) : null;

  return (
    <div className="materials-page notifications-page">
      <Breadcrumb items={[isAdminPortal ? "Quản trị hệ thống" : "Nhân viên thư viện", "Thông báo"]} />

      <div className="materials-page-heading">
        <div>
          <p className="eyebrow">THÔNG BÁO BẠN ĐỌC</p>
          <h1>Quản lý &amp; gửi thông báo</h1>
          <p>
            Soạn và gửi thông báo trực tiếp tới một bạn đọc cụ thể, theo khoa/ngành, theo nhóm đối tượng hoặc toàn hệ thống.
          </p>
        </div>
      </div>

      {toast && (
        <div className="notifications-toast-wrap">
          <Toast tone={toast.tone} title={toast.title} onClose={() => setToast(null)}>
            {toast.message}
          </Toast>
        </div>
      )}

      <section className="notification-composer-card" aria-label="Soạn thông báo mới">
        <div className="notification-section-head">
          <div>
            <span className="notification-section-icon">
              <Icon name="bell" size={18} />
            </span>
            <div>
              <h2>Soạn thông báo mới</h2>
              <p>Thông báo sẽ hiển thị ngay tại biểu tượng chuông và mục Thông báo trên cổng bạn đọc.</p>
            </div>
          </div>
          <Badge tone="brand">Kênh: Trong hệ thống</Badge>
        </div>

        <form className="notification-composer-form" onSubmit={handleSend}>
          <div className="notification-scope-block">
            <span className="field-label">Phạm vi người nhận</span>
            <div className="notification-scope-grid" role="radiogroup" aria-label="Phạm vi người nhận">
              {TARGET_SCOPES.map((option) => {
                const selected = targetScope === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`notification-scope-option ${selected ? "active" : ""}`}
                    onClick={() => {
                      setTargetScope(option.value);
                      setFormError("");
                    }}
                  >
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </button>
                );
              })}
            </div>
          </div>

          {targetScope === "SINGLE_USER" && (
            <div className="notification-recipient-block">
              <span className="field-label">Bạn đọc nhận thông báo</span>
              {selectedRecipient ? (
                <div className="notification-recipient-card">
                  <Avatar name={selectedRecipient.fullName} size="sm" />
                  <div className="notification-recipient-info">
                    <strong>{selectedRecipient.fullName}</strong>
                    <small>
                      <code>{selectedRecipient.userCode}</code>
                      {selectedRecipient.email ? ` · ${selectedRecipient.email}` : ""}
                    </small>
                  </div>
                  <div className="notification-recipient-actions">
                    <Button type="button" variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
                      Đổi bạn đọc
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedRecipient(null);
                        if (preselectedUserId) setSearchParams({}, { replace: true });
                      }}
                    >
                      Bỏ chọn
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="notification-recipient-empty">
                  <p>Chưa chọn bạn đọc nào. Nhấn nút bên cạnh để tìm theo mã bạn đọc, họ tên hoặc email.</p>
                  <Button type="button" variant="secondary" icon="users" onClick={() => setPickerOpen(true)}>
                    Chọn bạn đọc
                  </Button>
                </div>
              )}
            </div>
          )}

          {targetScope === "DEPARTMENT" && (
            <div className="notification-target-select">
              <SelectField
                label="Khoa / ngành nhận thông báo"
                value={departmentId}
                disabled={departmentError || departments.length === 0}
                onChange={(event) => {
                  setDepartmentId(event.target.value);
                  setFormError("");
                }}
              >
                <option value="">
                  {departmentError ? "Không tải được danh sách khoa/ngành" : "Chọn khoa / ngành..."}
                </option>
                {departments.map((department) => (
                  <option key={department.id} value={String(department.id)}>
                    {department.code ? `${department.code} — ${department.name}` : department.name}
                  </option>
                ))}
              </SelectField>
            </div>
          )}

          {targetScope === "USER_TYPE" && (
            <div className="notification-target-select">
              <SelectField
                label="Nhóm bạn đọc nhận thông báo"
                value={userType}
                onChange={(event) => setUserType(event.target.value)}
              >
                {USER_TYPE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </SelectField>
            </div>
          )}

          <div className="notification-composer-row">
            <SelectField
              label="Loại thông báo"
              value={messageType}
              onChange={(event) => setMessageType(event.target.value)}
            >
              {MESSAGE_TYPE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </SelectField>

            <Field
              label="Tiêu đề thông báo"
              placeholder="Ví dụ: Thông báo lịch nghỉ lễ hoặc cập nhật nội quy thư viện"
              maxLength={160}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <TextAreaField
            label="Nội dung thông báo"
            placeholder="Nhập nội dung chi tiết cần thông báo đến bạn đọc..."
            rows={4}
            maxLength={2000}
            value={content}
            hint={`${content.length}/2000 ký tự`}
            onChange={(event) => {
              setContent(event.target.value);
              if (formError) setFormError("");
            }}
          />

          {formError && (
            <div className="notification-form-error" role="alert">
              <Icon name="error" size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="notification-composer-actions">
            <Button type="button" variant="ghost" disabled={sending} onClick={resetForm}>
              Xóa nội dung
            </Button>
            <Button type="submit" icon="bell" loading={sending}>
              Gửi thông báo
            </Button>
          </div>
        </form>
      </section>

      <section className="reader-management-panel notification-history-panel" aria-label="Lịch sử thông báo đã gửi">
        <div className="notification-history-header">
          <div>
            <h2>Lịch sử thông báo đã gửi</h2>
            <p>Theo dõi các thông báo thủ công và thông báo tự động gửi tới bạn đọc trong hệ thống.</p>
          </div>
          {historyResult && (
            <Badge tone="neutral">{historyResult.totalElements.toLocaleString("vi-VN")} thông báo</Badge>
          )}
        </div>

        <form className="notification-history-toolbar" onSubmit={handleHistorySearch}>
          <SearchInput
            value={draftKeyword}
            onChange={(event) => setDraftKeyword(event.target.value)}
            placeholder="Tìm theo nội dung, mã bạn đọc, họ tên hoặc email..."
          />
          <CustomSelect
            aria-label="Lọc theo loại thông báo"
            value={filterType}
            onChange={(event) => {
              setFilterType(event.target.value);
              setPage(0);
            }}
          >
            {HISTORY_TYPE_FILTERS.map((option) => (
              <option key={option.value || "ALL"} value={option.value}>
                {option.label}
              </option>
            ))}
          </CustomSelect>
          <CustomSelect
            aria-label="Lọc theo trạng thái đọc"
            value={filterStatus}
            onChange={(event) => {
              setFilterStatus(event.target.value);
              setPage(0);
            }}
          >
            {HISTORY_STATUS_FILTERS.map((option) => (
              <option key={option.value || "ALL_STATUS"} value={option.value}>
                {option.label}
              </option>
            ))}
          </CustomSelect>
          <Button type="submit" icon="search">Tìm kiếm</Button>
          {(keyword || filterType || filterStatus) && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDraftKeyword("");
                setKeyword("");
                setFilterType("");
                setFilterStatus("");
                setPage(0);
              }}
            >
              Đặt lại
            </Button>
          )}
        </form>

        {historyError ? (
          <EmptyState
            tone="error"
            title="Không tải được lịch sử thông báo"
            description={historyError}
            action={<Button onClick={() => setRevision((value) => value + 1)}>Thử lại</Button>}
          />
        ) : !historyResult ? (
          <LoadingState variant="table" count={5} title="Đang tải lịch sử thông báo…" />
        ) : historyResult.items.length === 0 ? (
          <EmptyState
            icon="bell"
            title="Chưa có thông báo nào"
            description={
              keyword || filterType || filterStatus
                ? "Không có thông báo nào phù hợp với bộ lọc hiện tại."
                : "Các thông báo bạn gửi cho bạn đọc sẽ hiển thị tại đây."
            }
          />
        ) : (
          <>
            <div className="reader-management-table-wrap">
              <table className="reader-management-table notification-history-table">
                <thead>
                  <tr>
                    <th>Người nhận</th>
                    <th>Loại</th>
                    <th>Nội dung</th>
                    <th>Thời gian gửi</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {historyResult.items.map((item) => {
                    const typeInfo = messageTypeMeta(item.messageType);
                    const stateInfo = statusMeta(item.status);
                    const parsed = parseNotificationContent(item.content);
                    const displayName = item.fullName || item.email || "Bạn đọc";

                    return (
                      <tr
                        key={item.id}
                        className="clickable-row"
                        onClick={() => setDetailItem(item)}
                      >
                        <td>
                          <div className="managed-reader-cell">
                            <Avatar name={displayName} size="sm" />
                            <div>
                              <strong>{displayName}</strong>
                              <small>
                                {item.userCode ? <code>{item.userCode}</code> : null}
                                {item.userCode && item.email ? " · " : ""}
                                {item.email || ""}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge tone={typeInfo.tone}>{typeInfo.label}</Badge>
                        </td>
                        <td>
                          <div className="notification-content-preview">
                            {parsed.title && <strong>{parsed.title}</strong>}
                            <p>{parsed.body}</p>
                          </div>
                        </td>
                        <td className="notification-time-cell">
                          {formatDateTimeVi(item.sentAt || item.createdAt)}
                        </td>
                        <td>
                          <Status tone={stateInfo.tone}>{stateInfo.label}</Status>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              variant="bar"
              page={historyResult.page + 1}
              totalPages={historyResult.totalPages}
              totalElements={historyResult.totalElements}
              pageSize={pageSize}
              itemLabel="thông báo"
              ariaLabel="Phân trang lịch sử thông báo"
              onPageChange={(nextPage) => setPage(nextPage - 1)}
              onPageSizeChange={(nextSize) => {
                setPageSize(nextSize);
                setPage(0);
              }}
            />
          </>
        )}
      </section>

      <ReaderPickerModal
        open={pickerOpen}
        selectedReaderId={selectedRecipient?.id}
        title="Chọn bạn đọc nhận thông báo"
        resultHint="Nhấn chọn để gán bạn đọc làm người nhận."
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectReader}
      />

      <Modal
        open={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        eyebrow="CHI TIẾT THÔNG BÁO"
        title={detailParsed?.title || "Nội dung thông báo"}
      >
        {detailItem && detailParsed && (
          <div className="notification-detail-modal">
            <dl className="reader-personal-info">
              <div>
                <dt>Người nhận</dt>
                <dd>
                  {detailItem.fullName || "—"}
                  {detailItem.userCode ? ` (${detailItem.userCode})` : ""}
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{detailItem.email || "—"}</dd>
              </div>
              <div>
                <dt>Loại thông báo</dt>
                <dd>{messageTypeMeta(detailItem.messageType).label}</dd>
              </div>
              <div>
                <dt>Thời gian gửi</dt>
                <dd>{formatDateTimeVi(detailItem.sentAt || detailItem.createdAt)}</dd>
              </div>
              <div>
                <dt>Trạng thái</dt>
                <dd>
                  <Status tone={statusMeta(detailItem.status).tone}>
                    {statusMeta(detailItem.status).label}
                  </Status>
                </dd>
              </div>
            </dl>
            <div className="notification-detail-body">
              <span className="field-label">Nội dung đầy đủ</span>
              <p>{detailParsed.body}</p>
            </div>
            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setDetailItem(null)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
