import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Icon } from "../../design-system";
import type { LibraryNotification } from "../../data/notifications";
import { notificationService } from "../../services/analytics.service";
import { getAccessToken } from "../../services/session";
import { mapMessageQueueToNotification } from "../../utils/mappers";

export default function NotificationDropdown({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<LibraryNotification[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");

  useEffect(() => {
    if (!open || !getAccessToken()) return;
    let active = true;
    setStatus("loading");
    setItems([]);
    notificationService
      .getMyNotifications({ page: 0, size: 5 })
      .then((pageData) => {
        if (active) {
          setItems(pageData.items.map(mapMessageQueueToNotification));
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="notification-dropdown" aria-label="Thông báo gần đây">
      <header><div><strong>Thông báo</strong></div><Badge tone="brand">{items.length} MỚI NHẤT</Badge></header>
      <div>
        {status === "loading" && <p role="status">Đang tải…</p>}
        {status === "error" && <p role="alert">Không tải được thông báo.</p>}
        {status === "ready" && !items.length && <p>Chưa có thông báo.</p>}
        {items.map((item) => (
          <button key={item.id} className={item.unread ? "unread" : ""} onClick={() => { onClose(); navigate(`/reader/notifications/${item.id}`); }}><span className={`notification-type ${item.tone}`}><Icon name={item.icon} size={17} /></span><span><strong>{item.title}</strong><small>{item.category} · {item.relativeTime}</small></span>{item.unread && <i />}</button>
        ))}
      </div>
      <button className="all-notifications" onClick={() => { onClose(); navigate("/reader/notifications"); }}>Tất cả thông báo<Icon name="chevron-right" size={14} /></button>
    </div>
  );
}
