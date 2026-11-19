import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Breadcrumb, Button } from "../../../design-system";
import { notificationService } from "../../../services/analytics.service";
import type { MessageQueueDto, PageResponse } from "../../../types/api";
import { mapMessageQueueToNotification } from "../../../utils/mappers";

export default function NotificationDetailPage({ notificationId }: { notificationId?: string }) {
  const [params, setParams] = useSearchParams();
  const requested = Number(params.get("page"));
  const page = Number.isSafeInteger(requested) && requested >= 0 && requested <= 2147483647 ? requested : 0;
  const [response, setResponse] = useState<PageResponse<MessageQueueDto>>();
  const [selectedItem, setSelectedItem] = useState<MessageQueueDto | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setError("");
    setResponse(undefined);
    setSelectedItem(null);

    if (notificationId) {
      notificationService
        .findMyNotificationById(notificationId, page, 20)
        .then((res) => {
          if (!active) return;
          setResponse(res.pageData);
          setSelectedItem(res.item);
          if (!res.item) {
            setError("Không tìm thấy thông báo hoặc bạn không có quyền truy cập thông báo này.");
          }
        })
        .catch((cause: unknown) => {
          if (active) setError(cause instanceof Error ? cause.message : "Không tải được thông báo.");
        });
    } else {
      notificationService
        .getMyNotifications({ page, size: 20 })
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
  }, [notificationId, page, revision]);

  const items = response?.items.map(mapMessageQueueToNotification) ?? [];
  const selected = selectedItem ? mapMessageQueueToNotification(selectedItem) : items.find((item) => item.id === notificationId);
  const list = "/reader/notifications?page=" + page;

  return (
    <main className="notification-detail-container">
      <Breadcrumb items={notificationId ? ["Trang chủ", "Thông báo", "Chi tiết"] : ["Trang chủ", "Thông báo"]} />
      {notificationId && <Link className="btn btn-ghost" to={list}>Về danh sách thông báo</Link>}
      <h1>{notificationId ? "Chi tiết thông báo" : "Thông báo"}</h1>
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <Button onClick={() => setRevision((value) => value + 1)}>Thử lại</Button>
        </div>
      ) : !response ? (
        <p role="status">Đang tải thông báo…</p>
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
          <p>Không tìm thấy thông tin chi tiết cho thông báo này.</p>
        )
      ) : items.length ? (
        <ul className="notification-list-simple">
          {items.map((item) => (
            <li key={item.id}>
              <Link to={item.id + "?page=" + page}>
                <strong>{item.title}</strong> · <time>{item.sentAt}</time>
                <p>{item.intro}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>Không có thông báo trên trang này.</p>
      )}
      {!notificationId && response && (
        <nav className="catalog-pagination" aria-label="Phân trang thông báo">
          <Button disabled={page === 0} onClick={() => setParams({ page: String(page - 1) })}>
            Trang trước
          </Button>
          <span>Trang {page + 1}</span>
          <Button disabled={!response.hasNext} onClick={() => setParams({ page: String(page + 1) })}>
            Trang sau
          </Button>
        </nav>
      )}
    </main>
  );
}
