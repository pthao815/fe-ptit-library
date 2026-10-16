import { useState } from "react";
import { Badge, Breadcrumb, Button, Icon } from "../../../design-system";

export default function ReportsScreen() {
  const [view, setView] = useState<"circulation" | "demand">("circulation");
  return (
    <div className="reports-page">
      <div className="reports-heading">
        <div><Breadcrumb items={["Không gian nghiệp vụ", "Thống kê & báo cáo"]} /><p className="eyebrow">PHÂN TÍCH VẬN HÀNH</p><h1>Thống kê &amp; báo cáo</h1><p>Dữ liệu tổng hợp phục vụ đánh giá hoạt động và phát triển nguồn lực thư viện.</p></div>
        <Button icon="document">Xuất báo cáo</Button>
      </div>

      <section className="report-filter-bar">
        <label><span>Khoảng thời gian</span><select defaultValue="30"><option value="7">7 ngày gần đây</option><option value="30">30 ngày gần đây</option><option value="90">3 tháng gần đây</option><option value="365">12 tháng gần đây</option></select><Icon name="chevron-down" size={14} /></label>
        <label><span>Ngành đào tạo</span><select defaultValue="all"><option value="all">Tất cả ngành đào tạo</option><option>Công nghệ thông tin</option><option>Điện tử viễn thông</option><option>Quản trị kinh doanh</option></select><Icon name="chevron-down" size={14} /></label>
        <label><span>Dạng tài liệu</span><select defaultValue="all"><option value="all">Tất cả dạng tài liệu</option><option>Giáo trình</option><option>Sách chuyên khảo</option><option>Luận án, luận văn</option></select><Icon name="chevron-down" size={14} /></label>
        <Button variant="secondary">Áp dụng</Button>
        <button className="report-reset">Đặt lại</button>
      </section>

      <section className="report-kpi-grid">
        <article><span className="report-kpi-icon brand"><Icon name="book" /></span><div><small>Tổng lượt mượn</small><strong>3.842</strong><p><b>+8,4%</b> so với kỳ trước</p></div></article>
        <article><span className="report-kpi-icon info"><Icon name="arrow-left" /></span><div><small>Tổng lượt trả</small><strong>3.615</strong><p><b>+5,2%</b> so với kỳ trước</p></div></article>
        <article><span className="report-kpi-icon error"><Icon name="error" /></span><div><small>Quá hạn</small><strong>186</strong><p className="negative"><b>+12,1%</b> cần chú ý</p></div></article>
        <article><span className="report-kpi-icon success"><Icon name="users" /></span><div><small>Bạn đọc hoạt động</small><strong>2.947</strong><p><b>+4,8%</b> so với kỳ trước</p></div></article>
      </section>

      <div className="report-view-tabs">
        <button className={view === "circulation" ? "active" : ""} onClick={() => setView("circulation")}><Icon name="dashboard" />Lưu thông tài liệu<span>4 biểu đồ</span></button>
        <button className={view === "demand" ? "active" : ""} onClick={() => setView("demand")}><Icon name="search" />Nhu cầu &amp; tình trạng kho<span>3 báo cáo</span></button>
      </div>

      {view === "circulation" ? (
        <div className="report-view-content">
          <section className="report-panel report-trend-panel">
            <header><div><h2>Lượt mượn theo thời gian</h2><p>Xu hướng mượn và trả trong 30 ngày gần đây</p></div><div className="chart-legend"><span><i className="legend-borrowed" />Lượt mượn</span><span><i className="legend-returned" />Lượt trả</span></div></header>
            <div className="report-line-chart">
              <div className="line-y-axis"><span>200</span><span>150</span><span>100</span><span>50</span><span>0</span></div>
              <svg viewBox="0 0 800 230" role="img" aria-label="Biểu đồ lượt mượn và trả theo thời gian">
                <g className="line-grid"><line x1="20" y1="20" x2="790" y2="20" /><line x1="20" y1="65" x2="790" y2="65" /><line x1="20" y1="110" x2="790" y2="110" /><line x1="20" y1="155" x2="790" y2="155" /><line x1="20" y1="200" x2="790" y2="200" /></g>
                <polyline className="borrow-line" points="20,145 90,125 160,134 230,92 300,106 370,81 440,98 510,61 580,77 650,45 720,67 790,35" />
                <polyline className="return-line" points="20,158 90,142 160,118 230,126 300,97 370,109 440,78 510,91 580,62 650,74 720,48 790,57" />
                <g className="borrow-points">{[[20,145],[90,125],[160,134],[230,92],[300,106],[370,81],[440,98],[510,61],[580,77],[650,45],[720,67],[790,35]].map(([x,y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" />)}</g>
              </svg>
              <div className="line-x-axis"><span>24/05</span><span>30/05</span><span>05/06</span><span>11/06</span><span>17/06</span><span>22/06</span></div>
            </div>
          </section>

          <div className="report-two-column">
            <section className="report-panel">
              <header><div><h2>Lượt mượn theo ngành đào tạo</h2><p>Tỷ trọng theo hồ sơ bạn đọc</p></div></header>
              <div className="horizontal-chart">
                {[["Công nghệ thông tin", "1.248", "w-92"], ["Điện tử viễn thông", "986", "w-74"], ["Quản trị kinh doanh", "642", "w-51"], ["An toàn thông tin", "518", "w-42"], ["Công nghệ đa phương tiện", "448", "w-35"]].map(([label, value, width]) => <div key={label}><span>{label}</span><div><i className={width} /></div><strong>{value}</strong></div>)}
              </div>
            </section>
            <section className="report-panel">
              <header><div><h2>Lượt mượn theo dạng tài liệu</h2><p>Phân bổ 3.842 lượt mượn</p></div></header>
              <div className="document-type-chart">
                <div className="report-donut"><span><strong>3.842</strong><small>Lượt mượn</small></span></div>
                <div className="donut-legend"><div><i className="donut-a" /><span>Giáo trình</span><strong>42%</strong></div><div><i className="donut-b" /><span>Sách chuyên khảo</span><strong>28%</strong></div><div><i className="donut-c" /><span>Sách tham khảo</span><strong>18%</strong></div><div><i className="donut-d" /><span>Khác</span><strong>12%</strong></div></div>
              </div>
            </section>
          </div>

          <section className="report-panel report-ranking">
            <header><div><h2>Tài liệu mượn nhiều nhất</h2><p>Top 5 tài liệu theo số lượt lưu thông</p></div><Button variant="ghost" size="sm">Xem danh sách đầy đủ</Button></header>
            <div className="ranking-list">{[
              ["01", "Nhập môn Trí tuệ nhân tạo", "Nguyễn Thanh Thủy", "286", "4.8"],
              ["02", "Cấu trúc dữ liệu và giải thuật", "Nguyễn Đức Nghĩa", "243", "4.7"],
              ["03", "Mạng máy tính và hệ thống phân tán", "Lê Nhật Quang", "218", "4.5"],
              ["04", "An toàn thông tin trong kỷ nguyên số", "Phạm Văn Cường", "194", "4.4"],
              ["05", "Nhập môn Khoa học dữ liệu", "Trần Đức Khánh", "176", "4.6"],
            ].map(([rank, title, author, loans, rating]) => <div key={rank}><span>{rank}</span><div><strong>{title}</strong><small>{author}</small></div><div className="ranking-meter"><i className={`rank-${rank}`} /></div><b>{loans}<small> lượt</small></b><em>{rating} ★</em></div>)}</div>
          </section>
        </div>
      ) : (
        <div className="report-view-content">
          <div className="report-two-column demand-grid">
            <section className="report-panel">
              <header><div><h2>Tài liệu ít được mượn</h2><p>Không phát sinh hoặc có rất ít lượt mượn trong 12 tháng</p></div><Badge tone="warning">184 TÀI LIỆU</Badge></header>
              <div className="low-circulation-list">{[
                ["Kỹ thuật truyền dẫn quang nâng cao", "0 lượt", "18 tháng"],
                ["Mô hình toán trong kinh tế vi mô", "1 lượt", "11 tháng"],
                ["Ngôn ngữ lập trình Prolog", "2 lượt", "9 tháng"],
                ["Hệ thống thông tin địa lý", "2 lượt", "8 tháng"],
              ].map(([title, count, period]) => <article key={title}><span><Icon name="book" /></span><div><strong>{title}</strong><small>Lần mượn gần nhất: {period} trước</small></div><Badge>{count}</Badge></article>)}</div>
            </section>
            <section className="report-panel inventory-report">
              <header><div><h2>Tình trạng kho</h2><p>Phân bổ 52.184 bản cá biệt</p></div></header>
              <div className="inventory-report-total"><strong>52.184</strong><span>Tổng số bản</span></div>
              <div className="inventory-report-bar"><i className="inv-available" /><i className="inv-borrowed" /><i className="inv-damaged" /><i className="inv-audit" /></div>
              <div className="inventory-report-legend"><div><i className="inventory-available" /><span>Có sẵn</span><strong>49.862</strong><small>95,55%</small></div><div><i className="inventory-borrowed" /><span>Đang mượn</span><strong>1.284</strong><small>2,46%</small></div><div><i className="inventory-damaged" /><span>Hư hỏng</span><strong>892</strong><small>1,71%</small></div><div><i className="inventory-audit" /><span>Cần kiểm kê</span><strong>146</strong><small>0,28%</small></div></div>
            </section>
          </div>

          <section className="report-panel report-query-panel">
            <header><div><h2>Truy vấn không có kết quả</h2><p>Các nhu cầu tìm kiếm chưa được đáp ứng</p></div><Badge tone="warning">CẦN PHÂN TÍCH</Badge></header>
            <div className="report-query-table-wrap"><table><thead><tr><th>Query</th><th>Số lần tìm</th><th>Thời gian gần nhất</th><th>Xu hướng</th></tr></thead><tbody>
              <tr><td><strong>“mạng 6G và truyền thông lượng tử”</strong></td><td><b>28</b></td><td>22/06/2025 · 09:18</td><td><Badge tone="error">TĂNG NHANH</Badge></td></tr>
              <tr><td><strong>“AI tạo sinh trong thiết kế vi mạch”</strong></td><td><b>21</b></td><td>21/06/2025 · 16:42</td><td><Badge tone="warning">TĂNG</Badge></td></tr>
              <tr><td><strong>“giáo trình rust tiếng Việt”</strong></td><td><b>17</b></td><td>20/06/2025 · 14:05</td><td><Badge>ỔN ĐỊNH</Badge></td></tr>
              <tr><td><strong>“bảo mật cho thiết bị y tế IoT”</strong></td><td><b>12</b></td><td>19/06/2025 · 11:26</td><td><Badge>ỔN ĐỊNH</Badge></td></tr>
            </tbody></table></div>
          </section>
        </div>
      )}
    </div>
  );
}
