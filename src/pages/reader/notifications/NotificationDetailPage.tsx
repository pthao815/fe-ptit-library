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
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setError("");
    setResponse(undefined);
    notificationService.getMyNotifications({ page, size: 20 }).then((result) => {
      if (active) setResponse(result);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Không tải được thông báo.");
    });
    return () => { active = false; };
  }, [page, revision]);

  const items = response?.items.map(mapMessageQueueToNotification) ?? [];
  const selected = items.find((item) => item.id === notificationId);
  const list = "/reader/notifications?page=" + page;

  return <main className="notification-detail-container">
    <Breadcrumb items={notificationId ? ["Trang chủ", "Thông báo", "Chi tiết"] : ["Trang chủ", "Thông báo"]} />
    {notificationId && <Link className="btn btn-ghost" to={list}>Về danh sách thông báo</Link>}
    <h1>{notificationId ? "Chi tiết thông báo" : "Thông báo"}</h1>
    {error ? <div role="alert"><p>{error}</p><Button onClick={() => setRevision((value) => value + 1)}>Thử lại</Button></div>
      : !response ? <p role="status">Đang tải thông báo…</p>
      : notificationId ? selected
        ? <article className="notification-detail-card"><h2>{selected.title}</h2><p>{selected.sentAt}</p><p>{selected.intro}</p></article>
        : <p>Thông báo không có trên trang này. Vui lòng chọn lại từ danh sách.</p>
      : items.length ? <ul>{items.map((item) => <li key={item.id}>
        <Link to={item.id + "?page=" + page}>{item.title} · {item.sentAt}</Link>
      </li>)}</ul> : <p>Không có thông báo trên trang này.</p>}
    {!notificationId && response && <nav className="catalog-pagination" aria-label="Phân trang thông báo">
      <Button disabled={page === 0} onClick={() => setParams({ page: String(page - 1) })}>Trang trước</Button>
      <span>Trang {page + 1}</span>
      <Button disabled={!response.hasNext} onClick={() => setParams({ page: String(page + 1) })}>Trang sau</Button>
    </nav>}
  </main>;
}
