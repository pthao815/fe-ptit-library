import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge, Breadcrumb, Button, EmptyState, Icon, IconButton, LoadingState, Rating, Status } from "../../../design-system";
import { staffSummary } from "../../../data/dashboard";
import { analyticsService } from "../../../services/analytics.service";
import { getAccessToken } from "../../../services/session";
import type {
  AcquisitionSuggestionDto,
  AnalyticsPeriod,
  CirculationTrendPointDto,
  LibraryOverviewStatsDto,
  PopularDocumentDto,
} from "../../../types/api";
import { formatDateTimeVi } from "../../../utils/mappers";

const DATE_RANGE_PERIODS: Record<string, AnalyticsPeriod> = {
  "Hôm nay": "TODAY",
  "7 ngày": "LAST_7_DAYS",
  "30 ngày": "LAST_30_DAYS",
  "3 tháng": "LAST_90_DAYS",
  "1 năm": "THIS_YEAR",
};

function formatPercent(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${((part / total) * 100).toFixed(2).replace(".", ",")}%`;
}

function CirculationChart({ trend, loading }: { trend: CirculationTrendPointDto[]; loading?: boolean }) {
  const visible = trend.slice(-7);
  if (visible.length === 0) {
    return loading ? (
      <LoadingState size="sm" title="Đang tải biểu đồ lưu thông…" />
    ) : (
      <EmptyState
        size="sm"
        icon="chart"
        title="Chưa có dữ liệu lưu thông"
        description="Chưa phát sinh lượt mượn hoặc trả trong khoảng thời gian này."
      />
    );
  }

  const peak = Math.max(
    1,
    ...visible.flatMap((item) => [item.borrowCount, item.returnCount, item.overdueCount]),
  );
  const max = Math.max(4, Math.ceil(peak / 4) * 4);
  const ticks = [max, Math.round((max * 3) / 4), Math.round(max / 2), Math.round(max / 4), 0];

  return (
    <div className="circulation-chart">
      <div className="chart-y-axis">
        {ticks.map((tick, idx) => <span key={idx}>{tick}</span>)}
      </div>
      <div className="chart-plot">
        <div className="chart-grid"><i /><i /><i /><i /><i /></div>
        <div
          className="chart-columns"
          style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}
        >
          {visible.map((item) => (
            <div className="chart-day" key={item.date}>
              <div className="chart-bars">
                <span
                  className="bar bar-borrowed"
                  style={{ height: `${item.borrowCount > 0 ? Math.max(4, Math.round((item.borrowCount / max) * 100)) : 2}%` }}
                  title={`${item.borrowCount} lượt mượn`}
                />
                <span
                  className="bar bar-returned"
                  style={{ height: `${item.returnCount > 0 ? Math.max(4, Math.round((item.returnCount / max) * 100)) : 2}%` }}
                  title={`${item.returnCount} lượt trả`}
                />
                <span
                  className="bar bar-overdue"
                  style={{ height: `${item.overdueCount > 0 ? Math.max(4, Math.round((item.overdueCount / max) * 100)) : 2}%` }}
                  title={`${item.overdueCount} quá hạn`}
                />
              </div>
              <small>{item.label}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const portalPrefix = location.pathname.startsWith("/admin") ? "/admin" : "/staff";

  const [dateRange, setDateRange] = useState("7 ngày");
  const [overview, setOverview] = useState<LibraryOverviewStatsDto | null>(null);
  const [popularDocs, setPopularDocs] = useState<PopularDocumentDto[]>([]);
  const [suggestions, setSuggestions] = useState<AcquisitionSuggestionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>(() => formatDateTimeVi(new Date().toISOString()));
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }
    let active = true;
    const period = DATE_RANGE_PERIODS[dateRange] ?? "LAST_7_DAYS";
    setLoading(true);
    setLoadError(null);

    Promise.all([
      analyticsService.getOverviewStatistics({ period }),
      analyticsService.getPopularDocuments({ period, limit: 5, sortBy: "BORROWS" }),
      analyticsService.getAcquisitionSuggestions(undefined, { page: 0, size: 5, sortBy: "queryCount", sortDir: "desc" }),
    ])
      .then(([stats, popular, acqPage]) => {
        if (!active) return;
        setOverview(stats);
        setPopularDocs(popular);
        setSuggestions(acqPage.items);
        setUpdatedAt(formatDateTimeVi(new Date().toISOString()));
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : "Không tải được dữ liệu thống kê tổng quan.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dateRange, revision]);

  const totalCopies = overview?.totalPhysicalCopies ?? 0;
  const breakdown = overview?.inventoryBreakdown;
  const availableCopies = breakdown?.available ?? overview?.availablePhysicalCopies ?? 0;
  const borrowedCopies = breakdown?.borrowed ?? overview?.borrowedPhysicalCopies ?? 0;
  const damagedCopies = breakdown?.damaged ?? 0;
  const auditAndOtherCopies = (breakdown?.maintenance ?? 0) + (breakdown?.lost ?? 0) + (breakdown?.reserved ?? 0);

  const overdueLoans = overview?.overdueLoans ?? 0;
  const severeOverdueLoans = overview?.severeOverdueLoans ?? 0;
  const pendingHolds = overview?.pendingHolds ?? 0;
  const failedDigitalJobs = overview?.failedDigitalJobs ?? 0;
  const activeUsers = overview?.activeUsers ?? overview?.totalUsers ?? 0;

  const summaryItems = [
    {
      ...staffSummary[0],
      value: overview ? overview.totalDocuments.toLocaleString("vi-VN") : "—",
      change: overview ? `${totalCopies.toLocaleString("vi-VN")} bản giấy trong kho` : "Đang tải…",
    },
    {
      ...staffSummary[1],
      value: overview ? overview.activeLoans.toLocaleString("vi-VN") : "—",
      change: overview ? `${formatPercent(borrowedCopies, totalCopies)} tổng số bản` : "Đang tải…",
    },
    {
      ...staffSummary[2],
      value: overview ? overdueLoans.toLocaleString("vi-VN") : "—",
      change: overview ? `${severeOverdueLoans.toLocaleString("vi-VN")} quá hạn trên 30 ngày` : "Đang tải…",
    },
    {
      ...staffSummary[3],
      value: overview ? pendingHolds.toLocaleString("vi-VN") : "—",
      change: overview ? `${overview.pendingAcquisitionSuggestions.toLocaleString("vi-VN")} đề xuất mua chờ duyệt` : "Đang tải…",
    },
    {
      ...staffSummary[4],
      value: overview ? activeUsers.toLocaleString("vi-VN") : "—",
      change: overview ? `Tổng ${overview.totalUsers.toLocaleString("vi-VN")} tài khoản` : "Đang tải…",
    },
    {
      ...staffSummary[5],
      value: overview ? overview.totalDigitalCopies.toLocaleString("vi-VN") : "—",
      change: overview ? `${failedDigitalJobs.toLocaleString("vi-VN")} tiến trình xử lý lỗi` : "Đang tải…",
    },
  ];

  const totalAlertsCount = severeOverdueLoans + failedDigitalJobs + pendingHolds + auditAndOtherCopies;

  return (
    <div className="staff-dashboard">
      <div className="staff-dashboard-heading">
        <div>
          <Breadcrumb items={["Không gian nghiệp vụ", "Tổng quan"]} />
          <p className="eyebrow">VẬN HÀNH THƯ VIỆN</p>
          <h1>Dashboard thư viện</h1>
          <p>{loading ? "Đang đồng bộ số liệu thống kê…" : `Dữ liệu cập nhật lúc ${updatedAt}`}</p>
        </div>
        <div className="date-filter" role="group" aria-label="Khoảng thời gian">
          {Object.keys(DATE_RANGE_PERIODS).map((item) => (
            <button
              key={item}
              className={dateRange === item ? "active" : ""}
              onClick={() => setDateRange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div role="alert" style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <span>{loadError}</span>
          <Button variant="secondary" size="sm" onClick={() => setRevision((v) => v + 1)}>Thử lại</Button>
        </div>
      )}

      <section className="staff-summary-grid" aria-label="Chỉ số vận hành">
        {summaryItems.map((item) => (
          <article key={item.label}>
            <span className={`staff-metric-icon ${item.tone}`}><Icon name={item.icon} /></span>
            <div>
              <small>{item.label}</small>
              <strong>{item.value}</strong>
              <p className={item.tone === "error" ? "negative" : ""}>{item.change}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="staff-dashboard-grid">
        <article className="staff-panel circulation-panel">
          <header className="staff-panel-heading">
            <div>
              <h2>Lưu thông tài liệu</h2>
              <p>Số lượt giao dịch trong {dateRange.toLowerCase()}</p>
            </div>
            <div className="chart-legend">
              <span><i className="legend-borrowed" />Mượn</span>
              <span><i className="legend-returned" />Trả</span>
              <span><i className="legend-overdue" />Quá hạn</span>
            </div>
          </header>
          <CirculationChart trend={overview?.circulationTrend ?? []} loading={loading} />
          <div className="chart-summary">
            <div>
              <small>Tổng lượt mượn</small>
              <strong>{(overview?.totalBorrowsInPeriod ?? 0).toLocaleString("vi-VN")}</strong>
              <span>Trong kỳ lọc</span>
            </div>
            <div>
              <small>Tổng lượt trả</small>
              <strong>{(overview?.totalReturnsInPeriod ?? 0).toLocaleString("vi-VN")}</strong>
              <span>Đã hoàn trả</span>
            </div>
            <div>
              <small>Phát sinh quá hạn</small>
              <strong>{(overview?.overdueInPeriod ?? 0).toLocaleString("vi-VN")}</strong>
              <span className={(overview?.overdueInPeriod ?? 0) > 0 ? "negative" : ""}>
                {(overview?.overdueInPeriod ?? 0) > 0 ? "Cần theo dõi" : "Ổn định"}
              </span>
            </div>
          </div>
        </article>

        <aside className="staff-panel alerts-panel">
          <header className="staff-panel-heading">
            <div>
              <h2>Cảnh báo vận hành</h2>
              <p>4 nhóm cần chú ý</p>
            </div>
            <Badge tone={totalAlertsCount > 0 ? "error" : "success"}>{totalAlertsCount} MỤC</Badge>
          </header>
          <div className="operational-alerts">
            <button onClick={() => navigate("/staff/circulation")}>
              <span className="alert-icon error"><Icon name="error" /></span>
              <div>
                <strong>Quá hạn nhiều</strong>
                <p>{severeOverdueLoans} lượt quá hạn trên 30 ngày</p>
              </div>
              <b>{severeOverdueLoans}</b>
              <Icon name="chevron-right" size={15} />
            </button>
            <button onClick={() => navigate("/staff/digital-processing")}>
              <span className="alert-icon error"><Icon name="document" /></span>
              <div>
                <strong>Tiến trình xử lý lỗi</strong>
                <p>{failedDigitalJobs} tác vụ nền ở trạng thái FAILED</p>
              </div>
              <b>{failedDigitalJobs}</b>
              <Icon name="chevron-right" size={15} />
            </button>
            <button onClick={() => navigate("/staff/reservations")}>
              <span className="alert-icon warning"><Icon name="bookmark" /></span>
              <div>
                <strong>Hàng đợi đặt trước</strong>
                <p>{pendingHolds} lượt đang chờ / sẵn sàng nhận</p>
              </div>
              <b>{pendingHolds}</b>
              <Icon name="chevron-right" size={15} />
            </button>
            <button onClick={() => navigate(`${portalPrefix}/materials`)}>
              <span className="alert-icon info"><Icon name="library" /></span>
              <div>
                <strong>Bản in bảo trì / mất / giữ chỗ</strong>
                <p>{auditAndOtherCopies} bản cần rà soát tình trạng kho</p>
              </div>
              <b>{auditAndOtherCopies}</b>
              <Icon name="chevron-right" size={15} />
            </button>
          </div>
        </aside>
      </section>

      <section className="staff-dashboard-grid lower-grid">
        <article className="staff-panel popular-panel">
          <header className="staff-panel-heading">
            <div>
              <h2>Tài liệu được mượn nhiều nhất</h2>
              <p>Xếp hạng trong {dateRange.toLowerCase()} gần đây</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/staff/reports")}>
              Xem báo cáo<Icon name="chevron-right" size={15} />
            </Button>
          </header>
          {loading && !popularDocs.length ? (
            <LoadingState variant="table" count={4} size="sm" title="Đang tải danh sách tài liệu nổi bật…" />
          ) : popularDocs.length === 0 ? (
            <EmptyState
              size="sm"
              icon="book"
              title="Chưa có tài liệu nổi bật"
              description="Chưa phát sinh lượt mượn hoặc tương tác trong khoảng thời gian này."
            />
          ) : (
            <div className="staff-table-wrap">
              <table className="staff-data-table">
                <thead>
                  <tr><th>Tài liệu</th><th>Lượt mượn</th><th>Đánh giá</th><th>Tình trạng</th></tr>
                </thead>
                <tbody>
                  {popularDocs.map((doc) => {
                    const availabilityTone =
                      doc.availablePhysicalCopies <= 0
                        ? "error"
                        : doc.availablePhysicalCopies <= 1
                          ? "warning"
                          : "success";
                    const availabilityText =
                      doc.totalPhysicalCopies === 0
                        ? "Chỉ có bản số"
                        : doc.availablePhysicalCopies > 0
                          ? `${doc.availablePhysicalCopies} / ${doc.totalPhysicalCopies} bản có sẵn`
                          : "Hết bản có sẵn";
                    return (
                      <tr
                        key={doc.documentId}
                        className="clickable-row"
                        onClick={() => navigate(`/reader/book-detail?id=${encodeURIComponent(doc.documentId)}`)}
                      >
                        <td>
                          <div className="staff-book-cell">
                            <span>{String(doc.rank).padStart(2, "0")}</span>
                            <div>
                              <strong>{doc.title}</strong>
                              <small>
                                {(doc.authors?.length ? doc.authors.join(", ") : "Chưa cập nhật tác giả")}
                                {doc.publicationYear ? ` · ${doc.publicationYear}` : ""}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td><b>{doc.borrowCount}</b></td>
                        <td>
                          {doc.averageRating ? (
                            <><Rating value={Math.round(doc.averageRating)} /><small>{doc.averageRating.toFixed(1)}</small></>
                          ) : (
                            <small>Chưa có</small>
                          )}
                        </td>
                        <td><Status tone={availabilityTone}>{availabilityText}</Status></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="staff-panel inventory-panel">
          <header className="staff-panel-heading">
            <div>
              <h2>Tình trạng kho</h2>
              <p>Phân bổ {totalCopies.toLocaleString("vi-VN")} bản cá biệt</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(`${portalPrefix}/materials`)}>Chi tiết</Button>
          </header>
          <div className="inventory-total">
            <div>
              <small>TỔNG SỐ BẢN</small>
              <strong>{totalCopies.toLocaleString("vi-VN")}</strong>
            </div>
            <span>
              <i className="inventory-available" style={{ width: totalCopies ? `${(availableCopies / totalCopies) * 100}%` : "0%" }} />
              <i className="inventory-borrowed" style={{ width: totalCopies ? `${(borrowedCopies / totalCopies) * 100}%` : "0%" }} />
              <i className="inventory-damaged" style={{ width: totalCopies ? `${(damagedCopies / totalCopies) * 100}%` : "0%" }} />
              <i className="inventory-audit" style={{ width: totalCopies ? `${(auditAndOtherCopies / totalCopies) * 100}%` : "0%" }} />
            </span>
          </div>
          <div className="inventory-list">
            <div><span><i className="inventory-available" />Có sẵn</span><strong>{availableCopies.toLocaleString("vi-VN")}</strong><small>{formatPercent(availableCopies, totalCopies)}</small></div>
            <div><span><i className="inventory-borrowed" />Đang mượn</span><strong>{borrowedCopies.toLocaleString("vi-VN")}</strong><small>{formatPercent(borrowedCopies, totalCopies)}</small></div>
            <div><span><i className="inventory-damaged" />Hư hỏng</span><strong>{damagedCopies.toLocaleString("vi-VN")}</strong><small>{formatPercent(damagedCopies, totalCopies)}</small></div>
            <div><span><i className="inventory-audit" />Bảo trì / khác</span><strong>{auditAndOtherCopies.toLocaleString("vi-VN")}</strong><small>{formatPercent(auditAndOtherCopies, totalCopies)}</small></div>
          </div>
        </article>
      </section>

      <section className="staff-panel no-query-panel">
        <header className="staff-panel-heading">
          <div>
            <h2>Truy vấn không có kết quả &amp; Đề xuất bổ sung</h2>
            <p>Các nhu cầu bạn đọc chưa được đáp ứng từ hệ thống tìm kiếm</p>
          </div>
          <Badge tone="warning">{suggestions.length} ĐỀ XUẤT</Badge>
        </header>
        {loading && !suggestions.length ? (
          <LoadingState variant="table" count={4} size="sm" title="Đang tải danh sách đề xuất bổ sung…" />
        ) : suggestions.length === 0 ? (
          <EmptyState
            size="sm"
            icon="search"
            title="Chưa có đề xuất bổ sung tài liệu"
            description="Chưa ghi nhận cụm truy vấn rỗng nào cần đề xuất mua bổ sung."
          />
        ) : (
          <div className="staff-table-wrap">
            <table className="staff-data-table query-table">
              <thead>
                <tr><th>Chủ đề / Từ khóa</th><th>Số lượt tìm</th><th>Cập nhật gần nhất</th><th>Trạng thái đề xuất</th><th /></tr>
              </thead>
              <tbody>
                {suggestions.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>“{item.topic}”</strong>
                      {item.departmentName && <small style={{ display: "block" }}>{item.departmentName}</small>}
                    </td>
                    <td><b>{item.queryCount}</b></td>
                    <td>{formatDateTimeVi(item.updatedAt || item.createdAt)}</td>
                    <td><span className="suggested-action">{item.status}</span></td>
                    <td><IconButton label="Xem báo cáo" icon="chevron-right" onClick={() => navigate("/staff/reports")} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
