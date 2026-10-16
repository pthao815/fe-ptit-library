import { useEffect, useState } from "react";
import { Badge, Breadcrumb, Button, Icon, Skeleton } from "../../../design-system";
import { libraryNotifications } from "../../../data/notifications";

export default function NotificationDetailPage({ notificationId }: { notificationId: string }) {
  const notification = libraryNotifications[notificationId];
  const [read, setRead] = useState(notification ? !notification.unread : true);
  const [loadState, setLoadState] = useState<"ready" | "loading" | "error">(notificationId === "loading" ? "loading" : notificationId === "error" ? "error" : "ready");

  useEffect(() => {
    if (!notification?.unread) return;
    const timer = window.setTimeout(() => setRead(true), 350);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const retry = () => {
    setLoadState("loading");
    window.setTimeout(() => setLoadState(notification ? "ready" : "error"), 700);
  };

  if (loadState === "loading") {
    return <div className="notification-detail-page"><main className="notification-detail-container"><div className="notification-skeleton"><Skeleton className="notification-skeleton-line short" /><Skeleton className="notification-skeleton-line title" /><Skeleton className="notification-skeleton-card" /><Skeleton className="notification-skeleton-card tall" /></div></main></div>;
  }
  if (loadState === "error") {
    return <div className="notification-detail-page"><main className="notification-detail-container"><div className="notification-state"><span className="error"><Icon name="error" size={28} /></span><h1>Không thể tải thông báo</h1><p>Đã xảy ra lỗi khi tải dữ liệu. Vui lòng kiểm tra kết nối và thử lại.</p><Button variant="secondary" onClick={retry}>Thử lại</Button></div></main></div>;
  }
  if (!notification) {
    return <div className="notification-detail-page"><main className="notification-detail-container"><div className="notification-state"><span><Icon name="info" size={28} /></span><h1>Không tìm thấy thông báo</h1><p>Thông báo không tồn tại hoặc bạn không có quyền truy cập nội dung này.</p><Button variant="secondary" onClick={() => { window.location.hash = "#/reader"; }}>Quay lại trang chủ</Button></div></main></div>;
  }

  return (
    <div className="notification-detail-page">
      <main className="notification-detail-container">
        <Breadcrumb items={["Trang chủ", "Thông báo", "Chi tiết thông báo"]} />
        <button className="back-notifications" onClick={() => window.history.back()}><Icon name="arrow-left" size={16} />Tất cả thông báo</button>
        <div className="notification-page-heading">
          <div><p className="eyebrow">TRUNG TÂM THÔNG BÁO</p><h1>Chi tiết thông báo</h1></div>
          <div><Badge tone={read ? "neutral" : "brand"}>{read ? "ĐÃ ĐỌC" : "CHƯA ĐỌC"}</Badge><span>{notification.sentAt}</span></div>
        </div>

        <article className={`notification-detail-card ${notification.unread && !read ? "unread" : ""}`}>
          <header>
            <span className={`notification-detail-icon ${notification.tone}`}><Icon name={notification.icon} size={24} /></span>
            <div><Badge tone={notification.tone}>{notification.category}</Badge><h2>{notification.title}</h2><p>Gửi lúc {notification.sentAt} · {notification.relativeTime}</p></div>
            {notification.unread && !read && <i className="unread-dot" aria-label="Chưa đọc" />}
          </header>
          <div className="notification-detail-body">
            {notification.expired && <div className="expired-notice"><Icon name="info" size={17} /><div><strong>Thông báo đã hết hiệu lực</strong><p>Hành động liên quan không còn khả dụng.</p></div></div>}
            <p>{notification.intro}</p>
            <section><h3>Thông tin chi tiết</h3><dl>{notification.details.map((detail) => <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl></section>
            <p className="notification-sample-note"><Icon name="info" size={14} />Thông tin trên là dữ liệu mẫu dùng để minh họa giao diện.</p>
          </div>
          {notification.actionLabel && !notification.expired && <footer><Button onClick={() => { window.location.hash = notification.actionPath || "#/reader"; }}>{notification.actionLabel}</Button><Button variant="ghost" onClick={() => window.history.back()}>Quay lại</Button></footer>}
        </article>

        <section className="notification-related">
          <header><span><Icon name="document" size={18} /></span><div><h2>Thông tin liên quan</h2><p>Đối tượng được đề cập trong thông báo này.</p></div></header>
          <div><div><strong>{notification.relatedTitle}</strong><span>{notification.relatedSubtitle}</span></div><Badge tone={notification.expired ? "neutral" : notification.tone}>{notification.details.find((detail) => detail.label.includes("Trạng thái"))?.value || notification.category}</Badge></div>
        </section>
      </main>
    </div>
  );
}
