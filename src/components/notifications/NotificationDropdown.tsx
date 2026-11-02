import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Icon } from "../../design-system";
import type { LibraryNotification } from "../../data/notifications";
import { libraryNotifications } from "../../data/notifications";
import { notificationService } from "../../services/analytics.service";
import { getAccessToken } from "../../services/session";
import { mapMessageQueueToNotification } from "../../utils/mappers";

const defaultItems: LibraryNotification[] = ["due", "reserved", "ready"].map(
  (id) => libraryNotifications[id],
);

export default function NotificationDropdown({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<LibraryNotification[]>(defaultItems);

  useEffect(() => {
    if (!open || !getAccessToken()) return;
    let active = true;
    notificationService
      .getMyNotifications({ page: 0, size: 5 })
      .then((pageData) => {
        if (active && pageData.items?.length) {
          setItems(pageData.items.map((dto) => mapMessageQueueToNotification(dto)));
        }
      })
      .catch(() => {
        // Keep mock notifications
      });
    return () => {
      active = false;
    };
  }, [open]);

  if (!open) return null;
  const unreadCount = items.filter((i) => i.unread).length;

  return (
    <div className="notification-dropdown" role="menu">
      <header><div><strong>Thông báo</strong><span>{unreadCount} thông báo chưa đọc</span></div><Badge tone="brand">{items.length} MỚI NHẤT</Badge></header>
      <div>
        {items.map((item) => (
          <button key={item.id} className={item.unread ? "unread" : ""} onClick={() => { onClose(); navigate(`/reader/notifications/${item.id}`); }}><span className={`notification-type ${item.tone}`}><Icon name={item.icon} size={17} /></span><span><strong>{item.title}</strong><small>{item.category} · {item.relativeTime}</small></span>{item.unread && <i />}</button>
        ))}
      </div>
      <button className="all-notifications" onClick={() => { onClose(); navigate("/reader"); }}>Tất cả thông báo<Icon name="chevron-right" size={14} /></button>
    </div>
  );
}
