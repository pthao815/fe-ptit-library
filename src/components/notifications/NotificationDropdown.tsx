import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, EmptyState, Icon, LoadingState } from "../../design-system";
import type { LibraryNotification } from "../../data/notifications";
import { notificationService } from "../../services/analytics.service";
import { getAccessToken } from "../../services/session";
import { mapMessageQueueToNotification } from "../../utils/mappers";

export default function NotificationDropdown({
  open,
  onClose,
  onSyncUnread,
}: {
  open: boolean;
  onClose: () => void;
  onSyncUnread?: (hasUnread: boolean) => void;
}) {
  const navigate = useNavigate();
  const [items, setItems] = useState<LibraryNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");
  const [markingAll, setMarkingAll] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setRefreshTick((value) => value + 1);
    window.addEventListener("ptit:notifications-updated", handleUpdate);
    return () => window.removeEventListener("ptit:notifications-updated", handleUpdate);
  }, []);

  useEffect(() => {
    if (!open || !getAccessToken()) return;
    let active = true;
    setStatus("loading");
    setItems([]);
    Promise.all([
      notificationService.getMyNotifications({ page: 0, size: 5 }),
      notificationService.getMyUnreadCount().catch(() => null),
    ])
      .then(([pageData, unreadData]) => {
        if (!active) return;
        const mapped = pageData.items.map(mapMessageQueueToNotification);
        const count =
          unreadData && typeof unreadData.unreadCount === "number"
            ? unreadData.unreadCount
            : mapped.filter((item) => item.unread).length;
        setItems(mapped);
        setUnreadCount(count);
        setStatus("ready");
        onSyncUnread?.(count > 0);
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [open, refreshTick, onSyncUnread]);

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await notificationService.markAllAsRead();
      setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
      setUnreadCount(0);
      onSyncUnread?.(false);
      window.dispatchEvent(new Event("ptit:notifications-updated"));
    } finally {
      setMarkingAll(false);
    }
  };

  if (!open) return null;

  return (
    <div className="notification-dropdown" aria-label="Thông báo gần đây">
      <header>
        <div>
          <strong>Thông báo</strong>
        </div>
        <div className="notification-dropdown-head-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="notification-mark-all-btn"
              disabled={markingAll}
              onClick={handleMarkAllRead}
            >
              {markingAll ? "Đang xử lý…" : "Đọc tất cả"}
            </button>
          )}
          <Badge tone={unreadCount > 0 ? "brand" : "neutral"}>
            {unreadCount > 0 ? `${unreadCount} CHƯA ĐỌC` : "ĐÃ ĐỌC HẾT"}
          </Badge>
        </div>
      </header>
      <div>
        {status === "loading" && <LoadingState size="sm" title="Đang tải thông báo…" />}
        {status === "error" && <EmptyState size="sm" tone="error" title="Không tải được thông báo" description="Vui lòng thử mở lại sau." />}
        {status === "ready" && !items.length && <EmptyState size="sm" icon="bell" title="Chưa có thông báo mới" description="Bạn đã cập nhật hết các thông báo gần đây." />}
        {items.map((item) => (
          <button
            key={item.id}
            className={item.unread ? "unread" : ""}
            onClick={() => {
              onClose();
              navigate(`/reader/notifications/${item.id}`);
            }}
          >
            <span className={`notification-type ${item.tone}`}><Icon name={item.icon} size={17} /></span>
            <span>
              <strong>{item.title}</strong>
              <small>{item.category} · {item.relativeTime}</small>
            </span>
            {item.unread && <i />}
          </button>
        ))}
      </div>
      <button className="all-notifications" onClick={() => { onClose(); navigate("/reader/notifications"); }}>
        Tất cả thông báo<Icon name="chevron-right" size={14} />
      </button>
    </div>
  );
}
