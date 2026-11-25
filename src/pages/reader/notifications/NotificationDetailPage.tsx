import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge, Breadcrumb, Button, EmptyState, LoadingState, Pagination } from "../../../design-system";
import { notificationService } from "../../../services/analytics.service";
import type { MessageQueueDto, PageResponse } from "../../../types/api";
import { mapMessageQueueToNotification } from "../../../utils/mappers";

export default function NotificationDetailPage({ notificationId }: { notificationId?: string }) {
  const [params, setParams] = useSearchParams();
  const requested = Number(params.get("page"));
  const page = Number.isSafeInteger(requested) && requested >= 0 && requested <= 2147483647 ? requested : 0;
  const requestedSize = Number(params.get("size"));
  const pageSize = Number.isSafeInteger(requestedSize) && requestedSize >= 1 && requestedSize <= 100 ? requestedSize : 20;
  const [response, setResponse] = useState<PageResponse<MessageQueueDto>>();
  const [selectedItem, setSelectedItem] = useState<MessageQueueDto | null>(null);
  const [detailLoaded, setDetailLoaded] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  const updatePagination = (nextPage: number, nextSize: number) => {
    setParams({ page: String(nextPage), size: String(nextSize) });
  };

  useEffect(() => {
    let active = true;
    setError("");
    setResponse(undefined);
    setSelectedItem(null);
    setDetailLoaded(false);

    if (notificationId) {
      notificationService
        .getMyNotificationById(notificationId)
        .catch(() =>
          notificationService
            .findMyNotificationById(notificationId, page, pageSize)
            .then((res) => res.item),
        )
        .then(async (foundItem) => {
          if (!active) return;
          if (!foundItem) {
            setDetailLoaded(true);
            setError("Không tìm thấy thông báo hoặc bạn không có quyền truy cập thông báo này.");
            return;
          }

          let finalItem = foundItem;
          if ((foundItem.status || "").toUpperCase() !== "READ") {
            try {
              finalItem = await notificationService.markAsRead(foundItem.id);
              window.dispatchEvent(new Event("ptit:notifications-updated"));
            } catch {
              // Giữ dữ liệu đã tải nếu cập nhật trạng thái thất bại tạm thời
            }
          }
          if (!active) return;
          setSelectedItem(finalItem);
          setDetailLoaded(true);
        })
        .catch((cause: unknown) => {
          if (active) {
            setDetailLoaded(true);
            setError(cause instanceof Error ? cause.message : "Không tải được thông báo.");
          }
        });
    } else {
      notificationService
        .getMyNotifications({ page, size: pageSize })
        .then((result) => {
          if (active) setResponse(result);
        })
        .catch((cause: unknown) => {
          if (active) setError(cause instanceof Error ? cause.message : "Không tải được thông báo.");
        });
    }

    return () => {
      active = false;
    };
  }, [notificationId, page, pageSize, revision]);

  const items = response?.items.map(mapMessageQueueToNotification) ?? [];
  const hasUnreadInList = items.some((item) => item.unread);
  const selected = selectedItem ? mapMessageQueueToNotification(selectedItem) : null;
  const list = `/reader/notifications?page=${page}&size=${pageSize}`;
  const isLoading = notificationId ? !detailLoaded : !response;

  const handleMarkAllRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await notificationService.markAllAsRead();
      setResponse((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((item) => ({ ...item, status: "READ" })),
            }
          : prev,
      );
      window.dispatchEvent(new Event("ptit:notifications-updated"));
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <main className="notification-detail-container">
      <Breadcrumb items={notificationId ? ["Trang chủ", "Thông báo", "Chi tiết"] : ["Trang chủ", "Thông báo"]} />
      {notificationId && <Link className="btn btn-ghost" to={list}>Về danh sách thông báo</Link>}
      <div className="notification-list-heading">
        <h1>{notificationId ? "Chi tiết thông báo" : "Thông báo"}</h1>
        {!notificationId && hasUnreadInList && (
          <Button variant="secondary" size="sm" loading={markingAll} onClick={handleMarkAllRead}>
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>
      {error ? (
        <EmptyState
          surface="card"
          tone="error"
          title="Không tải được thông báo"
          description={error}
          action={<Button onClick={() => setRevision((value) => value + 1)}>Thử lại</Button>}
        />
      ) : isLoading ? (
        <LoadingState
          variant={notificationId ? "detail" : "list"}
          count={4}
          surface="card"
          title="Đang tải thông báo…"
        />
      ) : notificationId ? (
        selected ? (
          <article className="notification-detail-card">
            <h2>{selected.title}</h2>
            <p className="notification-detail-time">{selected.sentAt}</p>
            <p className="notification-detail-intro">{selected.intro}</p>
            {selected.details && (
              <dl className="notification-metadata-list">
                {selected.details.map((detail) => (
                  <div key={detail.label}>
                    <dt>{detail.label}:</dt>
                    <dd>{detail.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </article>
        ) : (
          <EmptyState
            surface="card"
            icon="bell"
            title="Không tìm thấy thông báo"
            description="Không tìm thấy thông tin chi tiết cho thông báo này."
          />
        )
      ) : items.length ? (
        <ul className="notification-list-simple">
          {items.map((item) => (
            <li key={item.id} className={item.unread ? "unread" : ""}>
              <Link to={item.id + "?page=" + page}>
                <div className="notification-list-meta">
                  <div>
                    <strong>{item.title}</strong> · <time>{item.sentAt}</time>
                  </div>
                  <Badge tone={item.unread ? "brand" : "neutral"}>
                    {item.unread ? "Chưa đọc" : "Đã đọc"}
                  </Badge>
                </div>
                <p>{item.intro}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          surface="card"
          icon="bell"
          title="Chưa có thông báo nào"
          description="Các thông báo về hạn trả, đặt trước và cập nhật thư viện sẽ xuất hiện tại đây."
        />
      )}
      {!notificationId && response && response.totalElements > 0 && (
        <Pagination
          variant="card"
          page={page + 1}
          totalPages={response.totalPages}
          totalElements={response.totalElements}
          pageSize={pageSize}
          itemLabel="thông báo"
          ariaLabel="Phân trang thông báo"
          onPageChange={(nextPage) => updatePagination(nextPage - 1, pageSize)}
          onPageSizeChange={(nextSize) => updatePagination(0, nextSize)}
        />
      )}
    </main>
  );
}
