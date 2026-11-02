import { useEffect, useState } from "react";
import { Badge, Breadcrumb, Button, Icon, IconButton, Rating, Status } from "../../../design-system";
import { staffSummary, circulationData } from "../../../data/dashboard";
import { analyticsService } from "../../../services/analytics.service";
import { getAccessToken } from "../../../services/session";
import type { AcquisitionSuggestionDto, LibraryOverviewStatsDto } from "../../../types/api";
import { formatDateTimeVi } from "../../../utils/mappers";

function CirculationChart() {
  const max = 200;
  return (
    <div className="circulation-chart">
      <div className="chart-y-axis"><span>200</span><span>150</span><span>100</span><span>50</span><span>0</span></div>
      <div className="chart-plot">
        <div className="chart-grid"><i /><i /><i /><i /><i /></div>
        <div className="chart-columns">
          {circulationData.map((item) => (
            <div className="chart-day" key={item.day}>
              <div className="chart-bars">
                <span className={`bar bar-borrowed h-${Math.round(item.borrowed / max * 10)}`} title={`${item.borrowed} lượt mượn`} />
                <span className={`bar bar-returned h-${Math.round(item.returned / max * 10)}`} title={`${item.returned} lượt trả`} />
                <span className={`bar bar-overdue h-${Math.max(1, Math.round(item.overdue / max * 10))}`} title={`${item.overdue} quá hạn`} />
              </div>
              <small>{item.day}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StaffDashboard() {
  const [dateRange, setDateRange] = useState("7 ngày");
  const [overview, setOverview] = useState<LibraryOverviewStatsDto | null>(null);
  const [suggestions, setSuggestions] = useState<AcquisitionSuggestionDto[]>([]);

  useEffect(() => {
    if (!getAccessToken()) return;
    let active = true;

    analyticsService
      .getOverviewStatistics()
      .then((stats) => {
        if (active) setOverview(stats);
      })
      .catch(() => {
        // Keep mock staffSummary
      });

    analyticsService
      .getAcquisitionSuggestions(undefined, { page: 0, size: 5 })
      .then((pageData) => {
        if (active && pageData.items?.length) {
          setSuggestions(pageData.items);
        }
      })
      .catch(() => {
        // Keep mock zero-result queries
      });

    return () => {
      active = false;
    };
  }, []);

  const summaryItems = overview
    ? [
        {
          ...staffSummary[0],
          value: overview.totalDocuments.toLocaleString("vi-VN"),
        },
        {
          ...staffSummary[1],
          value: overview.activeLoans.toLocaleString("vi-VN"),
        },
        staffSummary[2],
        {
          ...staffSummary[3],
          value: overview.pendingAcquisitionSuggestions.toLocaleString("vi-VN"),
        },
        {
          ...staffSummary[4],
          value: overview.totalUsers.toLocaleString("vi-VN"),
        },
        {
          ...staffSummary[5],
          value: overview.totalDigitalCopies.toLocaleString("vi-VN"),
        },
      ]
    : staffSummary;

  const totalCopies = overview ? overview.totalPhysicalCopies : 52184;
  const availableCopies = overview ? overview.availablePhysicalCopies : 49862;
  const borrowedCopies = overview ? overview.borrowedPhysicalCopies : 1284;

  return (
    <div className="staff-dashboard">
      <div className="staff-dashboard-heading">
        <div><Breadcrumb items={["Không gian nghiệp vụ", "Tổng quan"]} /><p className="eyebrow">VẬN HÀNH THƯ VIỆN</p><h1>Dashboard thư viện</h1><p>Dữ liệu cập nhật lúc 09:42, ngày 22/06/2025</p></div>
        <div className="date-filter" role="group" aria-label="Khoảng thời gian">
          {["Hôm nay", "7 ngày", "30 ngày", "3 tháng", "Tùy chọn"].map((item) => <button key={item} className={dateRange === item ? "active" : ""} onClick={() => setDateRange(item)}>{item === "Tùy chọn" && <Icon name="filter" size={14} />}{item}</button>)}
        </div>
      </div>

      <section className="staff-summary-grid" aria-label="Chỉ số vận hành">
        {summaryItems.map((item) => <article key={item.label}><span className={`staff-metric-icon ${item.tone}`}><Icon name={item.icon} /></span><div><small>{item.label}</small><strong>{item.value}</strong><p className={item.tone === "error" ? "negative" : ""}>{item.change}</p></div></article>)}
      </section>

      <section className="staff-dashboard-grid">
        <article className="staff-panel circulation-panel">
          <header className="staff-panel-heading"><div><h2>Lưu thông tài liệu</h2><p>Số lượt giao dịch theo ngày</p></div><div className="chart-legend"><span><i className="legend-borrowed" />Mượn</span><span><i className="legend-returned" />Trả</span><span><i className="legend-overdue" />Quá hạn</span></div></header>
          <CirculationChart />
          <div className="chart-summary"><div><small>Tổng lượt mượn</small><strong>904</strong><span>+8,4%</span></div><div><small>Tổng lượt trả</small><strong>825</strong><span>+5,2%</span></div><div><small>Phát sinh quá hạn</small><strong>109</strong><span className="negative">+12,1%</span></div></div>
        </article>

        <aside className="staff-panel alerts-panel">
          <header className="staff-panel-heading"><div><h2>Cảnh báo vận hành</h2><p>4 nhóm cần chú ý</p></div><Badge tone="error">16 VIỆC</Badge></header>
          <div className="operational-alerts">
            <button><span className="alert-icon error"><Icon name="error" /></span><div><strong>Quá hạn nhiều</strong><p>12 bạn đọc quá hạn trên 30 ngày</p></div><b>12</b><Icon name="chevron-right" size={15} /></button>
            <button><span className="alert-icon error"><Icon name="document" /></span><div><strong>Tài liệu số xử lý lỗi</strong><p>3 tệp không thể trích xuất nội dung</p></div><b>3</b><Icon name="chevron-right" size={15} /></button>
            <button><span className="alert-icon warning"><Icon name="bookmark" /></span><div><strong>Hàng đợi đặt trước</strong><p>38 lượt đang chờ xử lý</p></div><b>38</b><Icon name="chevron-right" size={15} /></button>
            <button><span className="alert-icon info"><Icon name="library" /></span><div><strong>Tài liệu cần kiểm kê</strong><p>146 bản chưa xác nhận vị trí</p></div><b>146</b><Icon name="chevron-right" size={15} /></button>
          </div>
        </aside>
      </section>

      <section className="staff-dashboard-grid lower-grid">
        <article className="staff-panel popular-panel">
          <header className="staff-panel-heading"><div><h2>Tài liệu được mượn nhiều nhất</h2><p>Xếp hạng trong {dateRange.toLowerCase()} gần đây</p></div><Button variant="ghost" size="sm">Xem báo cáo<Icon name="chevron-right" size={15} /></Button></header>
          <div className="staff-table-wrap"><table className="staff-data-table"><thead><tr><th>Tài liệu</th><th>Lượt mượn</th><th>Đánh giá</th><th>Tình trạng</th></tr></thead><tbody>
            <tr><td><div className="staff-book-cell"><span>01</span><div><strong>Nhập môn Trí tuệ nhân tạo</strong><small>Nguyễn Thanh Thủy · 2024</small></div></div></td><td><b>86</b></td><td><Rating value={5} /><small>4.8</small></td><td><Status tone="success">3 / 5 bản có sẵn</Status></td></tr>
            <tr><td><div className="staff-book-cell"><span>02</span><div><strong>Cấu trúc dữ liệu và giải thuật</strong><small>Nguyễn Đức Nghĩa · 2023</small></div></div></td><td><b>73</b></td><td><Rating value={5} /><small>4.7</small></td><td><Status tone="warning">1 / 8 bản có sẵn</Status></td></tr>
            <tr><td><div className="staff-book-cell"><span>03</span><div><strong>Mạng máy tính và hệ thống phân tán</strong><small>Lê Nhật Quang · 2024</small></div></div></td><td><b>68</b></td><td><Rating value={4} /><small>4.5</small></td><td><Status tone="error">Hết bản có sẵn</Status></td></tr>
            <tr><td><div className="staff-book-cell"><span>04</span><div><strong>An toàn thông tin trong kỷ nguyên số</strong><small>Phạm Văn Cường · 2022</small></div></div></td><td><b>54</b></td><td><Rating value={4} /><small>4.4</small></td><td><Status tone="success">2 / 4 bản có sẵn</Status></td></tr>
          </tbody></table></div>
        </article>

        <article className="staff-panel inventory-panel">
          <header className="staff-panel-heading"><div><h2>Tình trạng kho</h2><p>Phân bổ {totalCopies.toLocaleString("vi-VN")} bản cá biệt</p></div><Button variant="ghost" size="sm">Chi tiết</Button></header>
          <div className="inventory-total"><div><small>TỔNG SỐ BẢN</small><strong>{totalCopies.toLocaleString("vi-VN")}</strong></div><span><i className="inventory-available" /><i className="inventory-borrowed" /><i className="inventory-damaged" /><i className="inventory-audit" /></span></div>
          <div className="inventory-list">
            <div><span><i className="inventory-available" />Có sẵn</span><strong>{availableCopies.toLocaleString("vi-VN")}</strong><small>95,55%</small></div>
            <div><span><i className="inventory-borrowed" />Đang mượn</span><strong>{borrowedCopies.toLocaleString("vi-VN")}</strong><small>2,46%</small></div>
            <div><span><i className="inventory-damaged" />Hư hỏng</span><strong>892</strong><small>1,71%</small></div>
            <div><span><i className="inventory-audit" />Cần kiểm kê</span><strong>146</strong><small>0,28%</small></div>
          </div>
        </article>
      </section>

      <section className="staff-panel no-query-panel">
        <header className="staff-panel-heading"><div><h2>Truy vấn không có kết quả</h2><p>Các nhu cầu bạn đọc chưa được đáp ứng trong 7 ngày qua</p></div><Badge tone="warning">CẦN PHÂN TÍCH</Badge></header>
        <div className="staff-table-wrap"><table className="staff-data-table query-table"><thead><tr><th>Truy vấn tìm kiếm</th><th>Số lượt tìm</th><th>Lần tìm gần nhất</th><th>Hành động đề xuất</th><th /></tr></thead><tbody>
          {suggestions.length > 0 ? (
            suggestions.map((item) => (
              <tr key={item.id}>
                <td><strong>“{item.topic}”</strong></td>
                <td><b>{item.queryCount}</b></td>
                <td>{formatDateTimeVi(item.updatedAt || item.createdAt)}</td>
                <td><span className="suggested-action">Đề xuất mua bổ sung ({item.status})</span></td>
                <td><IconButton label="Xem chi tiết" icon="chevron-right" /></td>
              </tr>
            ))
          ) : (
            <>
              <tr><td><strong>“mạng 6G và truyền thông lượng tử”</strong></td><td><b>28</b></td><td>Hôm nay, 09:18</td><td><span className="suggested-action">Xem xét bổ sung tài liệu</span></td><td><IconButton label="Xem chi tiết" icon="chevron-right" /></td></tr>
              <tr><td><strong>“AI tạo sinh trong thiết kế vi mạch”</strong></td><td><b>21</b></td><td>Hôm qua, 16:42</td><td><span className="suggested-action">Kiểm tra từ khóa chủ đề</span></td><td><IconButton label="Xem chi tiết" icon="chevron-right" /></td></tr>
              <tr><td><strong>“giáo trình rust tiếng Việt”</strong></td><td><b>17</b></td><td>20/06/2025, 14:05</td><td><span className="suggested-action">Đề xuất mua bổ sung</span></td><td><IconButton label="Xem chi tiết" icon="chevron-right" /></td></tr>
              <tr><td><strong>“bảo mật cho thiết bị y tế IoT”</strong></td><td><b>12</b></td><td>19/06/2025, 11:26</td><td><span className="suggested-action">Mở rộng chỉ mục nội dung</span></td><td><IconButton label="Xem chi tiết" icon="chevron-right" /></td></tr>
            </>
          )}
        </tbody></table></div>
      </section>
    </div>
  );
}
