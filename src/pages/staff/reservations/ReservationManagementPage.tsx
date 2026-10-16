import { useState } from "react";
import { Avatar, Badge, Breadcrumb, Button, Icon, Modal, SearchInput, Status } from "../../../design-system";
import BookCover from "../../../components/books/BookCover";
import { initialReservationGroups } from "../../../data/reservations";
import { detailBook } from "../../../data/books";

export default function ReservationManagementPage() {
  const [groups, setGroups] = useState(initialReservationGroups);
  const [searchType, setSearchType] = useState("Tài liệu");
  const [action, setAction] = useState<{ type: "ready" | "cancel" | "transfer"; groupId: number; readerId: number } | null>(null);
  const targetGroup = groups.find((group) => group.id === action?.groupId);
  const targetReader = targetGroup?.queue.find((reader) => reader.id === action?.readerId);

  const executeAction = () => {
    if (!action) return;
    setGroups((items) => items.map((group) => {
      if (group.id !== action.groupId) return group;
      if (action.type === "cancel") return { ...group, queue: group.queue.filter((reader) => reader.id !== action.readerId) };
      if (action.type === "ready") return { ...group, available: false, copies: "1 bản đang được giữ", queue: group.queue.map((reader) => reader.id === action.readerId ? { ...reader, status: "Đã sẵn sàng", holdUntil: "10/10/2026 · 17:00" } : reader) };
      const remaining = group.queue.filter((reader) => reader.id !== action.readerId);
      return { ...group, queue: remaining, copies: remaining.length ? "Chuyển giữ cho lượt tiếp theo" : group.copies };
    }));
    setAction(null);
  };

  const actionTitle = action?.type === "ready" ? "Xác nhận tài liệu sẵn sàng" : action?.type === "transfer" ? "Chuyển lượt đặt trước" : "Hủy lượt đặt trước";

  return (
    <div className="reservation-management-page">
      <div className="reservation-page-heading">
        <div><Breadcrumb items={["Không gian nghiệp vụ", "Đặt trước"]} /><p className="eyebrow">LƯU THÔNG TÀI LIỆU</p><h1>Quản lý đặt trước</h1><p>Theo dõi hàng đợi và xử lý tài liệu sẵn sàng theo đúng thứ tự đăng ký.</p></div>
        <Button variant="secondary" icon="settings">Thiết lập thời gian giữ</Button>
      </div>

      <section className="reservation-search-panel">
        <div className="reservation-search-types">{["Tài liệu", "Mã bạn đọc", "Tên bạn đọc"].map((type) => <button key={type} className={searchType === type ? "active" : ""} onClick={() => setSearchType(type)}>{type}</button>)}</div>
        <SearchInput placeholder={searchType === "Tài liệu" ? "Tìm theo nhan đề, ISBN hoặc mã biểu ghi..." : searchType === "Mã bạn đọc" ? "Nhập mã bạn đọc..." : "Nhập tên bạn đọc..."} />
        <Button icon="search">Tìm kiếm</Button>
      </section>

      <div className="queue-policy-note">
        <span><Icon name="info" /></span>
        <div><strong>Hàng đợi áp dụng nguyên tắc đến trước, phục vụ trước</strong><p>Thứ tự được xác định tự động theo thời gian đăng ký và không thể kéo thả hoặc sắp xếp thủ công. Chỉ chuyển lượt khi người đứng đầu từ chối, hết thời gian giữ hoặc không còn đủ điều kiện.</p></div>
        <Badge tone="info">FIFO</Badge>
      </div>

      <div className="reservation-queue-toolbar"><div><h2>Hàng đợi theo tài liệu</h2><p>{groups.length} tài liệu · {groups.reduce((total, group) => total + group.queue.length, 0)} lượt đang được quản lý</p></div><label><span>Hiển thị</span><select defaultValue="all"><option value="all">Tất cả hàng đợi</option><option>Có bản sẵn sàng</option><option>Đang giữ</option><option>Chưa có bản</option></select><Icon name="chevron-down" size={14} /></label></div>

      <div className="reservation-group-list">
        {groups.map((group) => (
          <section className="reservation-group-card" key={group.id}>
            <header>
              <div className="reservation-book-cover"><BookCover book={{ ...detailBook, title: group.title, author: group.author, cover: group.cover }} /></div>
              <div className="reservation-book-info"><div><Badge tone={group.available ? "success" : "neutral"}>{group.available ? "CÓ BẢN SẴN SÀNG" : "CHƯA CÓ BẢN"}</Badge><span>{group.record}</span></div><h2>{group.title}</h2><p>{group.author}</p></div>
              <div className={`reservation-copy-status ${group.available ? "available" : ""}`}><Icon name="library" /><span><small>Tình trạng bản</small><strong>{group.copies}</strong></span></div>
              <div className="queue-total"><small>Hàng đợi</small><strong>{String(group.queue.length).padStart(2, "0")}</strong><span>người</span></div>
            </header>
            {group.queue.length > 0 ? <ol className="reservation-queue">
              {group.queue.map((reader, index) => {
                const isFirst = index === 0;
                return <li key={reader.id} className={`${isFirst ? "first" : ""} ${reader.status === "Đã sẵn sàng" ? "ready" : ""}`}>
                  <span className="queue-position">{index + 1}</span>
                  <Avatar name={reader.name} />
                  <div className="queue-reader"><div><strong>{reader.name}</strong>{isFirst && <Badge tone="brand">ƯU TIÊN TIẾP THEO</Badge>}</div><small>{reader.code}</small></div>
                  <dl><div><dt>Đăng ký</dt><dd>{reader.registered}</dd></div><div><dt>Trạng thái</dt><dd><Status tone={reader.status === "Đã sẵn sàng" ? "success" : "warning"}>{reader.status}</Status></dd></div>{reader.holdUntil && <div className="hold-expiration"><dt>Giữ đến</dt><dd>{reader.holdUntil}</dd></div>}</dl>
                  <div className="queue-actions">
                    {isFirst && group.available && reader.status === "Đang chờ" && <Button size="sm" icon="success" onClick={() => setAction({ type: "ready", groupId: group.id, readerId: reader.id })}>Xác nhận sẵn sàng</Button>}
                    {isFirst && reader.status === "Đã sẵn sàng" && <Button variant="secondary" size="sm" onClick={() => setAction({ type: "transfer", groupId: group.id, readerId: reader.id })}>Chuyển lượt</Button>}
                    <Button variant="ghost" size="sm" onClick={() => setAction({ type: "cancel", groupId: group.id, readerId: reader.id })}>Hủy</Button>
                  </div>
                </li>;
              })}
            </ol> : <div className="empty-queue"><Icon name="users" /><span><strong>Hàng đợi đã trống</strong><small>Không còn bạn đọc chờ tài liệu này.</small></span></div>}
          </section>
        ))}
      </div>

      <Modal open={action !== null} onClose={() => setAction(null)} title={actionTitle}>
        <div className={`queue-confirmation ${action?.type === "cancel" ? "danger" : ""}`}><span><Icon name={action?.type === "ready" ? "success" : action?.type === "transfer" ? "chevron-right" : "error"} size={24} /></span><div><strong>{targetReader?.name}</strong><p>{targetGroup?.title}</p></div></div>
        <p className="queue-confirmation-text">{action?.type === "ready" ? "Hệ thống sẽ thông báo cho bạn đọc và giữ bản tài liệu đến 10/10/2026 lúc 17:00." : action?.type === "transfer" ? "Lượt hiện tại sẽ kết thúc và quyền nhận tài liệu được chuyển cho người tiếp theo trong hàng đợi. Không thể hoàn tác." : "Lượt đặt trước sẽ bị hủy và các vị trí phía sau tự động được dịch lên theo đúng thứ tự đăng ký."}</p>
        {action?.type === "transfer" && <div className="transfer-policy"><Icon name="info" size={15} /><span>Chỉ thực hiện khi bạn đọc từ chối, hết hạn giữ hoặc không còn đủ điều kiện.</span></div>}
        <div className="modal-actions"><Button variant="ghost" onClick={() => setAction(null)}>Quay lại</Button><Button variant={action?.type === "cancel" ? "danger" : "primary"} onClick={executeAction}>{actionTitle}</Button></div>
      </Modal>
    </div>
  );
}
