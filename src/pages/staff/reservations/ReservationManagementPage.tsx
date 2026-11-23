import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Badge, Breadcrumb, Button, CustomSelect, EmptyState, Icon, LoadingState, Modal, SearchInput, Status, Toast } from "../../../design-system";
import BookCover from "../../../components/books/BookCover";
import { circulationService } from "../../../services/circulation.service";
import type { StaffHoldItemDto } from "../../../types/api";
import { formatDocTypeLabel, pickCoverByIndex } from "../../../utils/mappers";

type Group = { documentId: string; title: string; docType?: string | null; year?: number | null; holds: StaffHoldItemDto[] };
type Action = { type: "transfer" | "cancel"; hold: StaffHoldItemDto };
type View = "all" | "ready" | "waiting";

function formatDate(iso?: string | null, withTime = false) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return withTime
    ? date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })
    : date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const isReady = (hold: StaffHoldItemDto) => hold.status === "READY_FOR_PICKUP";

export default function ReservationManagementPage() {
  const navigate = useNavigate();
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [view, setView] = useState<View>("all");
  const [holds, setHolds] = useState<StaffHoldItemDto[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">("loading");
  const [revision, setRevision] = useState(0);
  const [action, setAction] = useState<Action | null>(null);
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    setLoadState("loading");
    circulationService
      .searchHolds({ status: "ACTIVE", keyword: keyword || undefined })
      .then((items) => { if (active) { setHolds(items); setLoadState("ready"); } })
      .catch(() => { if (active) setLoadState("error"); });
    return () => { active = false; };
  }, [keyword, revision]);

  // Gom theo tài liệu: lượt đang giữ sách lên đầu, sau đó theo vị trí hàng chờ
  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    for (const hold of holds) {
      const group = map.get(hold.documentId) ?? { documentId: hold.documentId, title: hold.documentTitle, docType: hold.docType, year: hold.publicationYear, holds: [] };
      group.holds.push(hold);
      map.set(hold.documentId, group);
    }
    const list = [...map.values()];
    for (const group of list) {
      group.holds.sort((a, b) => Number(isReady(b)) - Number(isReady(a)) || (a.queuePosition ?? 0) - (b.queuePosition ?? 0));
    }
    return list.filter((group) => view === "all" || (view === "ready" ? group.holds.some(isReady) : !group.holds.some(isReady)));
  }, [holds, view]);

  const readyCount = holds.filter(isReady).length;
  const expiringSoon = holds.filter((hold) => isReady(hold) && hold.pickupDeadline && new Date(hold.pickupDeadline).getTime() - Date.now() < 24 * 3600 * 1000).length;

  const execute = async () => {
    if (!action || working) return;
    setWorking(true);
    try {
      await circulationService.cancelHold(
        action.hold.holdId,
        action.type === "transfer" ? "Thủ thư chuyển lượt: bạn đọc không nhận sách" : "Thủ thư hủy lượt đặt trước",
      );
      setToast({ tone: "success", text: action.type === "transfer" ? "Đã chuyển bản sách cho lượt tiếp theo (hoặc trả về kệ nếu không còn ai chờ)." : "Đã hủy lượt đặt trước." });
      setAction(null);
      setRevision((value) => value + 1);
    } catch (error) {
      setToast({ tone: "error", text: error instanceof Error ? error.message : "Không thực hiện được thao tác." });
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="reservation-management-page">
      <div className="reservation-page-heading">
        <div><Breadcrumb items={["Không gian nghiệp vụ", "Đặt trước"]} /><p className="eyebrow">LƯU THÔNG TÀI LIỆU</p><h1>Quản lý đặt trước</h1><p>Theo dõi hàng đợi và xử lý tài liệu sẵn sàng theo đúng thứ tự đăng ký.</p></div>
        <Button variant="secondary" icon="settings" onClick={() => navigate("/staff/policies")}>Thiết lập thời gian giữ</Button>
      </div>

      <form className="reservation-search-panel" onSubmit={(event) => { event.preventDefault(); setKeyword(keywordInput.trim()); }}>
        <SearchInput placeholder="Tìm theo nhan đề, mã bạn đọc, tên hoặc email bạn đọc..." value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} />
        <Button icon="search" type="submit">Tìm kiếm</Button>
        {keyword && <Button variant="ghost" type="button" onClick={() => { setKeywordInput(""); setKeyword(""); }}>Xóa lọc</Button>}
      </form>

      <div className="queue-policy-note">
        <span><Icon name="info" /></span>
        <div><strong>Hàng đợi áp dụng nguyên tắc đến trước, phục vụ trước</strong><p>Khi một bản được trả, hệ thống tự giữ sách cho người đứng đầu hàng đợi. Lượt giữ quá hạn nhận sẽ tự hết hạn và chuyển cho người tiếp theo; thủ thư chỉ cần chuyển lượt thủ công khi bạn đọc từ chối nhận.</p></div>
        <Badge tone="info">FIFO</Badge>
      </div>

      <div className="reservation-queue-toolbar">
        <div><h2>Hàng đợi theo tài liệu</h2><p>{loadState === "ready" ? `${groups.length} tài liệu · ${holds.length} lượt đang chờ · ${readyCount} lượt đang giữ sách${expiringSoon ? ` · ${expiringSoon} sắp hết hạn nhận` : ""}` : "Đang tải…"}</p></div>
        <label><span>Hiển thị</span><CustomSelect value={view} onChange={(event) => setView(event.target.value as View)}><option value="all">Tất cả hàng đợi</option><option value="ready">Có bản đang giữ</option><option value="waiting">Chưa có bản</option></CustomSelect></label>
      </div>

      <div className="reservation-group-list">
        {loadState === "loading" ? (
          <LoadingState surface="card" variant="list" count={3} title="Đang tải hàng đợi đặt trước…" />
        ) : loadState === "error" ? (
          <EmptyState surface="card" tone="error" title="Không tải được hàng đợi đặt trước" description="Kiểm tra kết nối tới máy chủ rồi thử lại." action={<Button size="sm" onClick={() => setRevision((value) => value + 1)}>Thử lại</Button>} />
        ) : groups.length === 0 ? (
          <EmptyState surface="card" icon="bookmark" title={keyword || view !== "all" ? "Không có hàng đợi phù hợp" : "Chưa có hàng đợi đặt trước nào"} description="Các yêu cầu đặt trước tài liệu từ bạn đọc sẽ hiển thị tại đây." />
        ) : groups.map((group, groupIndex) => {
          const holding = group.holds.find(isReady);
          const waiting = group.holds.filter((hold) => !isReady(hold)).length;
          return (
            <section className="reservation-group-card" key={group.documentId}>
              <header>
                <div className="reservation-book-cover"><BookCover book={{ id: groupIndex, documentId: group.documentId, title: group.title, author: "", year: String(group.year ?? ""), type: formatDocTypeLabel(group.docType ?? undefined), rating: 0, available: Boolean(holding), code: formatDocTypeLabel(group.docType ?? undefined), cover: pickCoverByIndex(groupIndex) }} /></div>
                <div className="reservation-book-info"><div><Badge tone={holding ? "success" : "neutral"}>{holding ? "ĐANG GIỮ 1 BẢN" : "CHƯA CÓ BẢN"}</Badge><span>{formatDocTypeLabel(group.docType ?? undefined)}{group.year ? ` · ${group.year}` : ""}</span></div><h2>{group.title}</h2><p><button type="button" className="link-button" onClick={() => navigate(`/reader/book-detail?id=${encodeURIComponent(group.documentId)}`)}>Xem chi tiết tài liệu</button></p></div>
                <div className={`reservation-copy-status ${holding ? "available" : ""}`}><Icon name="library" /><span><small>Tình trạng bản</small><strong>{holding ? `${holding.barcode ?? "—"}${holding.shelfLocation ? ` · ${holding.shelfLocation}` : ""}` : "Chờ bạn đọc trả sách"}</strong></span></div>
                <div className="queue-total"><small>Đang chờ</small><strong>{String(waiting).padStart(2, "0")}</strong><span>người</span></div>
              </header>
              <ol className="reservation-queue">
                {group.holds.map((hold, index) => {
                  const ready = isReady(hold);
                  return <li key={hold.holdId} className={`${index === 0 ? "first" : ""} ${ready ? "ready" : ""}`}>
                    <span className="queue-position">{ready ? <Icon name="success" size={15} /> : hold.queuePosition ?? index + 1}</span>
                    <Avatar name={hold.fullName || hold.userCode} />
                    <div className="queue-reader"><div><strong>{hold.fullName}</strong>{!ready && index === 0 && !holding && <Badge tone="brand">ƯU TIÊN TIẾP THEO</Badge>}</div><small>{hold.userCode}{hold.email ? ` · ${hold.email}` : ""}</small></div>
                    <dl>
                      <div><dt>Đăng ký</dt><dd>{formatDate(hold.requestDate)}</dd></div>
                      <div><dt>Trạng thái</dt><dd><Status tone={ready ? "success" : "warning"}>{ready ? "Đang giữ sách" : "Đang chờ"}</Status></dd></div>
                      {ready && <div className="hold-expiration"><dt>Giữ đến</dt><dd>{formatDate(hold.pickupDeadline, true)}</dd></div>}
                    </dl>
                    <div className="queue-actions">
                      {ready && <Button variant="secondary" size="sm" onClick={() => setAction({ type: "transfer", hold })}>Chuyển lượt</Button>}
                      <Button variant="ghost" size="sm" onClick={() => setAction({ type: "cancel", hold })}>Hủy</Button>
                    </div>
                  </li>;
                })}
              </ol>
            </section>
          );
        })}
      </div>

      <Modal open={action !== null} onClose={() => setAction(null)} title={action?.type === "transfer" ? "Chuyển lượt đặt trước" : "Hủy lượt đặt trước"}>
        <div className={`queue-confirmation ${action?.type === "cancel" ? "danger" : ""}`}><span><Icon name={action?.type === "transfer" ? "chevron-right" : "error"} size={24} /></span><div><strong>{action?.hold.fullName} · {action?.hold.userCode}</strong><p>{action?.hold.documentTitle}</p></div></div>
        <p className="queue-confirmation-text">{action?.type === "transfer"
          ? "Lượt hiện tại kết thúc và bản sách được giữ cho người tiếp theo trong hàng đợi; nếu không còn ai chờ, bản sách trở về kệ. Không thể hoàn tác."
          : isReady(action?.hold ?? ({} as StaffHoldItemDto))
            ? "Lượt đặt trước bị hủy và bản sách đang giữ được chuyển cho người tiếp theo (hoặc trả về kệ)."
            : "Lượt đặt trước bị hủy và các vị trí phía sau tự động được dịch lên theo đúng thứ tự đăng ký."}</p>
        {action?.type === "transfer" && <div className="transfer-policy"><Icon name="info" size={15} /><span>Chỉ thực hiện khi bạn đọc từ chối hoặc không còn đủ điều kiện nhận sách.</span></div>}
        <div className="modal-actions"><Button variant="ghost" onClick={() => setAction(null)}>Quay lại</Button><Button variant={action?.type === "cancel" ? "danger" : "primary"} loading={working} onClick={execute}>{action?.type === "transfer" ? "Chuyển lượt" : "Hủy lượt đặt trước"}</Button></div>
      </Modal>

      {toast && <Toast tone={toast.tone} title="Quản lý đặt trước" onClose={() => setToast(null)}>{toast.text}</Toast>}
    </div>
  );
}
