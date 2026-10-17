import { useNavigate } from "react-router-dom";
import { Badge, Icon } from "../../design-system";
import { libraryNotifications } from "../../data/notifications";

export default function NotificationDropdown({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  if (!open) return null;
  return (
    <div className="notification-dropdown" role="menu">
      <header><div><strong>Thông báo</strong><span>2 thông báo chưa đọc</span></div><Badge tone="brand">3 MỚI NHẤT</Badge></header>
      <div>
        {["due", "reserved", "ready"].map((id) => {
          const item = libraryNotifications[id];
          return <button key={item.id} className={item.unread ? "unread" : ""} onClick={() => { onClose(); navigate(`/reader/notifications/${item.id}`); }}><span className={`notification-type ${item.tone}`}><Icon name={item.icon} size={17} /></span><span><strong>{item.title}</strong><small>{item.category} · {item.relativeTime}</small></span>{item.unread && <i />}</button>;
        })}
      </div>
      <button className="all-notifications" onClick={() => { onClose(); navigate("/reader"); }}>Tất cả thông báo<Icon name="chevron-right" size={14} /></button>
    </div>
  );
}
