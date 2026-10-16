import { useEffect, useState } from "react";
import { Badge, Breadcrumb, Button, Icon, Rating, Status } from "../../../design-system";
import LibraryListCard from "../../../components/books/LibraryListCard";
import { libraryTabs } from "../../../constants/library-options";
import { loanBooks, reservedBooks, shelfGroups, loanHistory } from "../../../data/my-library";

function LoanCard({ loan }: { loan: typeof loanBooks[number] }) {
  const overdue = loan.days < 0;
  return (
    <LibraryListCard
      book={loan}
      badge={loan.type}
      badgeTone={overdue ? "error" : "neutral"}
      status={overdue ? `Quá hạn ${Math.abs(loan.days)} ngày` : `Còn ${loan.days} ngày`}
      statusHint={overdue ? "Cần trả ngay" : "Thời gian còn lại"}
      statusTone={overdue ? "error" : loan.days <= 5 ? "warning" : "success"}
      details={[
        { label: "Ngày mượn", value: loan.borrowed },
        { label: "Hạn trả", value: loan.due },
        { label: "Gia hạn", value: <Status tone={loan.renewable ? "success" : "error"}>{loan.renewable ? "Có thể gia hạn" : "Không thể gia hạn"}</Status> },
      ]}
      actions={<><Button size="sm" disabled={!loan.renewable}>Gia hạn tài liệu</Button><Button variant="ghost" size="sm">Xem chi tiết</Button></>}
    />
  );
}

function PersonalShelf({ group }: { group: string }) {
  const books = shelfGroups[group] || [];
  const [saved, setSaved] = useState<number[]>(books.map((book) => book.id));
  const status = group === "Muốn đọc" ? "Đã lưu" : group === "Đang đọc" ? "Đang đọc dở" : "Đã hoàn thành";
  const statusHint = group === "Muốn đọc" ? "Trong danh sách cá nhân" : group === "Đang đọc" ? "Tiếp tục từ lần gần nhất" : "Đã đọc toàn bộ";
  return (
    <div className="personal-shelf">
      <div className="shelf-toolbar"><p><strong>{books.length} tài liệu</strong> trong danh sách “{group}”</p><Button variant="secondary" size="sm" icon="plus">Thêm tài liệu</Button></div>
      <div className="loan-list">{books.map((book, index) => (
        <LibraryListCard
          key={book.id}
          book={book}
          badge={book.type}
          badgeTone={group === "Đã đọc" ? "success" : group === "Đang đọc" ? "info" : "brand"}
          status={status}
          statusHint={statusHint}
          statusTone={group === "Đã đọc" ? "success" : "info"}
          details={[
            { label: "Năm xuất bản", value: book.year },
            { label: "Định dạng", value: book.type === "Tài liệu số" ? "Tài liệu số" : "Bản in" },
            { label: group === "Đang đọc" ? "Tiến độ đọc" : "Đánh giá", value: group === "Đang đọc" ? `${42 + index * 23}% hoàn thành` : <Rating value={book.rating} /> },
          ]}
          actions={<><Button size="sm">{group === "Đang đọc" ? "Tiếp tục đọc" : group === "Đã đọc" ? "Đọc lại" : "Xem chi tiết"}</Button><Button variant="ghost" size="sm" icon="bookmark" onClick={() => setSaved((items) => items.filter((item) => item !== book.id))}>{saved.includes(book.id) ? "Bỏ khỏi danh sách" : "Đã xóa"}</Button></>}
        />
      ))}</div>
    </div>
  );
}

export default function MyLibraryPage({ initialTab = "Đang mượn" }: { initialTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [reservations, setReservations] = useState(reservedBooks);

  useEffect(() => setActiveTab(initialTab), [initialTab]);

  return (
    <div className="my-library-page">
      <main className="my-library-container">
        <Breadcrumb items={["Trang chủ", "Thư viện của tôi"]} />
        <div className="my-library-heading">
          <div><p className="eyebrow">KHÔNG GIAN CÁ NHÂN</p><h1>Thư viện của tôi</h1><p>Theo dõi tài liệu đang mượn, lượt đặt trước và các bộ sưu tập cá nhân của bạn.</p></div>
          <Button variant="secondary" icon="search" onClick={() => { window.location.hash = "#/reader/search"; }}>Tìm thêm tài liệu</Button>
        </div>

        <section className="library-summary-grid" aria-label="Tổng quan tài khoản thư viện">
          <article><span className="summary-icon summary-brand"><Icon name="book" /></span><div><small>Đang mượn</small><strong>03</strong><p>3 tài liệu đang lưu thông</p></div></article>
          <article><span className="summary-icon summary-warning"><Icon name="info" /></span><div><small>Sắp đến hạn</small><strong>02</strong><p>1 tài liệu đã quá hạn</p></div></article>
          <article><span className="summary-icon summary-info"><Icon name="bookmark" /></span><div><small>Đặt trước</small><strong>02</strong><p>1 tài liệu chờ nhận</p></div></article>
          <article><span className="summary-icon summary-error"><Icon name="error" /></span><div><small>Công nợ</small><strong>20.000đ</strong><p>Cần hoàn tất thanh toán</p></div></article>
        </section>

        <div className="library-tabs" role="tablist">
          {libraryTabs.map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab}{tab === "Đang mượn" && <span>3</span>}{tab === "Đặt trước" && <span>2</span>}</button>)}
        </div>

        {activeTab === "Đang mượn" && (
          <div className="library-tab-content">
            <div className="tab-content-heading"><div><h2>Tài liệu đang mượn</h2><p>Kiểm tra thời hạn và gia hạn các tài liệu đủ điều kiện.</p></div><Badge tone="warning">01 TÀI LIỆU QUÁ HẠN</Badge></div>
            <div className="loan-list">{loanBooks.map((loan) => <LoanCard key={loan.id} loan={loan} />)}</div>
            <section className="debt-section">
              <div className="debt-heading"><span><Icon name="error" /></span><div><h2>Công nợ thư viện</h2><p>Các khoản phí chưa hoàn tất trong tài khoản của bạn.</p></div><strong>20.000đ</strong></div>
              <div className="debt-row"><div><Badge tone="error">CHƯA THANH TOÁN</Badge><strong>Phí quá hạn tài liệu</strong><small>Phát sinh từ “Mạng máy tính và hệ thống phân tán” · 3 ngày quá hạn</small></div><div><span>20.000đ</span><Button variant="secondary" size="sm">Xem hướng dẫn thanh toán</Button></div></div>
              <p className="debt-note"><Icon name="info" size={14} />Vui lòng thanh toán tại quầy lưu thông. Một số chức năng mượn và gia hạn có thể bị giới hạn khi còn công nợ.</p>
            </section>
          </div>
        )}

        {activeTab === "Lịch sử mượn" && (
          <div className="library-tab-content">
            <div className="tab-content-heading"><div><h2>Lịch sử mượn</h2><p>Các tài liệu bạn đã mượn và hoàn trả trong 12 tháng gần đây.</p></div><Button variant="secondary" size="sm">Xuất lịch sử</Button></div>
            <div className="loan-list">{loanHistory.map((item) => (
              <LibraryListCard
                key={item.id}
                book={item}
                badge={item.type}
                badgeTone={item.returnStatus.includes("muộn") ? "warning" : "success"}
                status={item.returnStatus}
                statusHint="Đã hoàn tất lượt mượn"
                statusTone={item.returnStatus.includes("muộn") ? "warning" : "success"}
                details={[
                  { label: "Ngày mượn", value: item.borrowed },
                  { label: "Ngày trả", value: item.returned },
                  { label: "Đánh giá", value: item.historyRating ? <Rating value={item.historyRating} /> : "Chưa đánh giá" },
                ]}
                actions={<><Button variant="secondary" size="sm">{item.historyRating ? "Xem chi tiết" : "Đánh giá tài liệu"}</Button><Button variant="ghost" size="sm">Mượn lại</Button></>}
              />
            ))}</div>
          </div>
        )}

        {activeTab === "Đặt trước" && (
          <div className="library-tab-content">
            <div className="tab-content-heading"><div><h2>Tài liệu đã đặt trước</h2><p>Theo dõi vị trí hàng chờ và thời hạn nhận tài liệu.</p></div></div>
            <div className="loan-list">{reservations.map((reservation) => (
              <LibraryListCard
                key={reservation.id}
                book={reservation}
                badge={reservation.type}
                badgeTone={reservation.status === "Chờ nhận" ? "success" : "warning"}
                status={reservation.status}
                statusHint={reservation.status === "Chờ nhận" ? "Tài liệu đã sẵn sàng" : `Vị trí hàng chờ: ${reservation.position}`}
                statusTone={reservation.status === "Chờ nhận" ? "success" : "warning"}
                details={[
                  { label: "Vị trí hàng chờ", value: reservation.position },
                  { label: "Ngày đặt trước", value: reservation.reserved },
                  { label: "Hạn nhận tài liệu", value: reservation.expiration },
                ]}
                actions={<><Button size="sm" disabled={reservation.status !== "Chờ nhận"}>Xem thông tin nhận</Button><Button variant="ghost" size="sm" onClick={() => setReservations((items) => items.filter((item) => item.id !== reservation.id))}>Hủy đặt trước</Button></>}
              />
            ))}</div>
          </div>
        )}

        {["Muốn đọc", "Đang đọc", "Đã đọc"].includes(activeTab) && (
          <div className="library-tab-content">
            <div className="tab-content-heading"><div><h2>{activeTab}</h2><p>{activeTab === "Muốn đọc" ? "Các tài liệu bạn đã lưu để khám phá sau." : activeTab === "Đang đọc" ? "Các tài liệu số bạn đang đọc dở." : "Các tài liệu bạn đã hoàn thành."}</p></div></div>
            <PersonalShelf group={activeTab} />
          </div>
        )}
      </main>
    </div>
  );
}
