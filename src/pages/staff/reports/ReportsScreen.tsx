import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Breadcrumb, Button, CustomSelect, EmptyState, Icon, LoadingState, Pagination } from "../../../design-system";
import { analyticsService } from "../../../services/analytics.service";
import { userService } from "../../../services/user.service";
import { getAccessToken } from "../../../services/session";
import type {
  AcquisitionSuggestionDto,
  AnalyticsPeriod,
  CirculationTrendPointDto,
  DepartmentDto,
  LibraryOverviewStatsDto,
  PopularDocumentDto,
} from "../../../types/api";
import { formatDateTimeVi, formatDateVi } from "../../../utils/mappers";

const PERIOD_MAP: Record<string, AnalyticsPeriod> = {
  "7": "LAST_7_DAYS",
  "30": "LAST_30_DAYS",
  "90": "LAST_90_DAYS",
  "365": "THIS_YEAR",
  all: "ALL",
};

const PERIOD_LABELS: Record<string, string> = {
  "7": "7 ngày gần đây",
  "30": "30 ngày gần đây",
  "90": "3 tháng gần đây",
  "365": "12 tháng gần đây",
  all: "toàn thời gian",
};

const DONUT_COLORS = ["var(--red-500)", "var(--info)", "var(--warning)", "var(--gray-300)"];
const DONUT_CLASSES = ["donut-a", "donut-b", "donut-c", "donut-d"];

function formatPercent(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${((part / total) * 100).toFixed(2).replace(".", ",")}%`;
}

function buildTrendChartGeometry(trend: CirculationTrendPointDto[]) {
  const maxVal = Math.max(4, Math.ceil(Math.max(1, ...trend.flatMap((t) => [t.borrowCount, t.returnCount])) / 4) * 4);
  const yTicks = [maxVal, Math.round((maxVal * 3) / 4), Math.round(maxVal / 2), Math.round(maxVal / 4), 0];
  const minX = 20;
  const maxX = 790;
  const topY = 20;
  const bottomY = 200;

  const toCoords = (selector: (item: CirculationTrendPointDto) => number) =>
    trend.map((item, idx) => {
      const x = trend.length === 1 ? (minX + maxX) / 2 : minX + (idx * (maxX - minX)) / (trend.length - 1);
      const val = selector(item);
      const y = bottomY - (val / maxVal) * (bottomY - topY);
      return [Math.round(x), Math.round(y)] as const;
    });

  const borrowCoords = toCoords((t) => t.borrowCount);
  const returnCoords = toCoords((t) => t.returnCount);
  const borrowPolyline = borrowCoords.map(([x, y]) => `${x},${y}`).join(" ");
  const returnPolyline = returnCoords.map(([x, y]) => `${x},${y}`).join(" ");

  const xLabels: string[] = [];
  if (trend.length <= 6) {
    trend.forEach((t) => xLabels.push(t.label));
  } else {
    for (let i = 0; i < 6; i++) {
      const idx = Math.round((i * (trend.length - 1)) / 5);
      xLabels.push(trend[idx].label);
    }
  }

  return { yTicks, borrowCoords, borrowPolyline, returnPolyline, xLabels };
}

export default function ReportsScreen() {
  const navigate = useNavigate();
  const [view, setView] = useState<"circulation" | "demand">("circulation");

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [draftPeriod, setDraftPeriod] = useState("30");
  const [draftDepartmentId, setDraftDepartmentId] = useState("all");
  const [draftDocType, setDraftDocType] = useState("all");

  const [appliedFilter, setAppliedFilter] = useState({
    periodKey: "30",
    departmentId: "all",
    docType: "all",
  });

  const [overview, setOverview] = useState<LibraryOverviewStatsDto | null>(null);
  const [popularDocs, setPopularDocs] = useState<PopularDocumentDto[]>([]);
  const [suggestions, setSuggestions] = useState<AcquisitionSuggestionDto[]>([]);
  const [acqPage, setAcqPage] = useState(0);
  const [acqPageSize, setAcqPageSize] = useState(10);
  const [acqTotalElements, setAcqTotalElements] = useState(0);
  const [acqTotalPages, setAcqTotalPages] = useState(0);
  const [acqLoading, setAcqLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    userService
      .getDepartments()
      .then((list) => setDepartments(list))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }
    let active = true;
    const period = PERIOD_MAP[appliedFilter.periodKey] ?? "LAST_30_DAYS";
    const departmentId = appliedFilter.departmentId !== "all" ? Number(appliedFilter.departmentId) : undefined;
    const docType = appliedFilter.docType !== "all" ? appliedFilter.docType : undefined;

    setLoading(true);
    setLoadError(null);

    Promise.all([
      analyticsService.getOverviewStatistics({ period, departmentId, docType }),
      analyticsService.getPopularDocuments({ period, departmentId, docType, limit: 10, sortBy: "BORROWS" }),
    ])
      .then(([stats, popular]) => {
        if (!active) return;
        setOverview(stats);
        setPopularDocs(popular);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : "Không tải được dữ liệu thống kê & báo cáo.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [appliedFilter, revision]);

  useEffect(() => {
    if (!getAccessToken()) {
      setAcqLoading(false);
      return;
    }
    let active = true;
    const departmentId = appliedFilter.departmentId !== "all" ? Number(appliedFilter.departmentId) : undefined;
    setAcqLoading(true);

    analyticsService
      .getAcquisitionSuggestions(
        undefined,
        { page: acqPage, size: acqPageSize, sortBy: "queryCount", sortDir: "desc" },
        departmentId,
      )
      .then((acqData) => {
        if (!active) return;
        setSuggestions(acqData.items);
        setAcqTotalElements(acqData.totalElements);
        setAcqTotalPages(acqData.totalPages);
      })
      .catch(() => {
        if (active) {
          setSuggestions([]);
          setAcqTotalElements(0);
          setAcqTotalPages(0);
        }
      })
      .finally(() => {
        if (active) setAcqLoading(false);
      });

    return () => {
      active = false;
    };
  }, [appliedFilter.departmentId, acqPage, acqPageSize, revision]);

  const applyFilters = () => {
    setAcqPage(0);
    setAppliedFilter({
      periodKey: draftPeriod,
      departmentId: draftDepartmentId,
      docType: draftDocType,
    });
  };

  const resetFilters = () => {
    setDraftPeriod("30");
    setDraftDepartmentId("all");
    setDraftDocType("all");
    setAcqPage(0);
    setAppliedFilter({ periodKey: "30", departmentId: "all", docType: "all" });
  };

  const totalCopies = overview?.totalPhysicalCopies ?? 0;
  const breakdown = overview?.inventoryBreakdown;
  const availableCopies = breakdown?.available ?? overview?.availablePhysicalCopies ?? 0;
  const borrowedCopies = breakdown?.borrowed ?? overview?.borrowedPhysicalCopies ?? 0;
  const damagedCopies = breakdown?.damaged ?? 0;
  const auditCopies = (breakdown?.maintenance ?? 0) + (breakdown?.lost ?? 0) + (breakdown?.reserved ?? 0);

  const trend = overview?.circulationTrend ?? [];
  const chartGeom = buildTrendChartGeometry(trend);
  const deptStats = overview?.borrowsByDepartment ?? [];
  const maxDeptCount = Math.max(1, ...deptStats.map((d) => d.count));
  const docTypeStats = overview?.borrowsByDocType ?? [];
  const docTypeTotal = docTypeStats.reduce((sum, item) => sum + item.count, 0);

  const donutTop = docTypeStats.slice(0, 4);
  let cumulativePct = 0;
  const donutGradientStops = donutTop.map((item, idx) => {
    const start = cumulativePct;
    const pct = docTypeTotal > 0 ? (item.count / docTypeTotal) * 100 : 0;
    cumulativePct = idx === donutTop.length - 1 ? 100 : Math.min(100, start + pct);
    return `${DONUT_COLORS[idx]} ${start.toFixed(1)}% ${cumulativePct.toFixed(1)}%`;
  });
  const donutBackground =
    docTypeTotal > 0 && donutGradientStops.length > 0
      ? `conic-gradient(${donutGradientStops.join(", ")})`
      : "var(--gray-200)";

  const maxPopularBorrows = Math.max(1, ...popularDocs.map((d) => d.borrowCount));
  const lowCircDocs = overview?.lowCirculationDocuments ?? [];
  const periodLabel = PERIOD_LABELS[appliedFilter.periodKey] ?? "30 ngày gần đây";

  return (
    <div className="reports-page">
      <div className="reports-heading">
        <div>
          <Breadcrumb items={["Không gian nghiệp vụ", "Thống kê & báo cáo"]} />
          <p className="eyebrow">PHÂN TÍCH VẬN HÀNH</p>
          <h1>Thống kê &amp; báo cáo</h1>
          <p>Dữ liệu tổng hợp phục vụ đánh giá hoạt động và phát triển nguồn lực thư viện.</p>
        </div>
        <Button icon="document" onClick={() => window.print()}>Xuất báo cáo</Button>
      </div>

      <section className="report-filter-bar">
        <label>
          <span>Khoảng thời gian</span>
          <CustomSelect value={draftPeriod} onChange={(e) => setDraftPeriod(e.target.value)}>
            <option value="7">7 ngày gần đây</option>
            <option value="30">30 ngày gần đây</option>
            <option value="90">3 tháng gần đây</option>
            <option value="365">12 tháng gần đây</option>
            <option value="all">Toàn thời gian</option>
          </CustomSelect>
        </label>
        <label>
          <span>Ngành đào tạo</span>
          <CustomSelect value={draftDepartmentId} onChange={(e) => setDraftDepartmentId(e.target.value)}>
            <option value="all">Tất cả ngành đào tạo</option>
            {departments.map((dept) => (
              <option key={dept.id} value={String(dept.id)}>{dept.name}</option>
            ))}
          </CustomSelect>
        </label>
        <label>
          <span>Dạng tài liệu</span>
          <CustomSelect value={draftDocType} onChange={(e) => setDraftDocType(e.target.value)}>
            <option value="all">Tất cả dạng tài liệu</option>
            <option value="textbook">Giáo trình</option>
            <option value="book">Sách chuyên khảo</option>
            <option value="slide">Bài giảng</option>
            <option value="thesis">Luận văn, luận án</option>
            <option value="reference">Sách tham khảo</option>
            <option value="journal">Tạp chí</option>
          </CustomSelect>
        </label>
        <Button variant="secondary" onClick={applyFilters}>Áp dụng</Button>
        <button type="button" className="report-reset" onClick={resetFilters}>Đặt lại</button>
      </section>

      {loadError && (
        <div role="alert" style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <span>{loadError}</span>
          <Button variant="secondary" size="sm" onClick={() => setRevision((v) => v + 1)}>Thử lại</Button>
        </div>
      )}

      <section className="report-kpi-grid">
        <article>
          <span className="report-kpi-icon brand"><Icon name="book" /></span>
          <div>
            <small>Tổng lượt mượn</small>
            <strong>{overview ? (overview.totalBorrowsInPeriod ?? overview.activeLoans).toLocaleString("vi-VN") : "—"}</strong>
            <p>Trong {periodLabel} · <b>{(overview?.activeLoans ?? 0).toLocaleString("vi-VN")}</b> đang mượn</p>
          </div>
        </article>
        <article>
          <span className="report-kpi-icon info"><Icon name="circulation" /></span>
          <div>
            <small>Tổng lượt trả</small>
            <strong>{overview ? (overview.totalReturnsInPeriod ?? 0).toLocaleString("vi-VN") : "—"}</strong>
            <p>Hoàn trả trong {periodLabel}</p>
          </div>
        </article>
        <article>
          <span className="report-kpi-icon error"><Icon name="error" /></span>
          <div>
            <small>Quá hạn</small>
            <strong>{overview ? (overview.overdueLoans ?? 0).toLocaleString("vi-VN") : "—"}</strong>
            <p className={(overview?.overdueLoans ?? 0) > 0 ? "negative" : ""}>
              <b>{(overview?.overdueInPeriod ?? 0).toLocaleString("vi-VN")}</b> phát sinh trong kỳ
            </p>
          </div>
        </article>
        <article>
          <span className="report-kpi-icon success"><Icon name="users" /></span>
          <div>
            <small>Bạn đọc hoạt động</small>
            <strong>{overview ? (overview.activeUsers ?? overview.totalUsers).toLocaleString("vi-VN") : "—"}</strong>
            <p>Tổng <b>{(overview?.totalUsers ?? 0).toLocaleString("vi-VN")}</b> tài khoản</p>
          </div>
        </article>
      </section>

      <div className="report-view-tabs">
        <button className={view === "circulation" ? "active" : ""} onClick={() => setView("circulation")}><Icon name="chart" />Lưu thông tài liệu<span>4 biểu đồ</span></button>
        <button className={view === "demand" ? "active" : ""} onClick={() => setView("demand")}><Icon name="search" />Nhu cầu &amp; tình trạng kho<span>3 báo cáo</span></button>
      </div>

      {view === "circulation" ? (
        <div className="report-view-content">
          <section className="report-panel report-trend-panel">
            <header>
              <div>
                <h2>Lượt mượn theo thời gian</h2>
                <p>Xu hướng mượn và trả trong {periodLabel}</p>
              </div>
              <div className="chart-legend">
                <span><i className="legend-borrowed" />Lượt mượn</span>
                <span><i className="legend-returned" />Lượt trả</span>
              </div>
            </header>
            {trend.length > 0 ? (
              <div className="report-line-chart">
                <div className="line-y-axis">
                  {chartGeom.yTicks.map((tick, idx) => <span key={idx}>{tick}</span>)}
                </div>
                <svg viewBox="0 0 800 230" role="img" aria-label="Biểu đồ lượt mượn và trả theo thời gian">
                  <g className="line-grid">
                    <line x1="20" y1="20" x2="790" y2="20" />
                    <line x1="20" y1="65" x2="790" y2="65" />
                    <line x1="20" y1="110" x2="790" y2="110" />
                    <line x1="20" y1="155" x2="790" y2="155" />
                    <line x1="20" y1="200" x2="790" y2="200" />
                  </g>
                  {trend.length > 1 && <polyline className="borrow-line" points={chartGeom.borrowPolyline} />}
                  {trend.length > 1 && <polyline className="return-line" points={chartGeom.returnPolyline} />}
                  <g className="borrow-points">
                    {chartGeom.borrowCoords.map(([x, y], idx) => <circle key={`${idx}-${x}-${y}`} cx={x} cy={y} r="3" />)}
                  </g>
                </svg>
                <div className="line-x-axis">
                  {chartGeom.xLabels.map((lbl, idx) => <span key={`${idx}-${lbl}`}>{lbl}</span>)}
                </div>
              </div>
            ) : loading ? (
              <LoadingState size="sm" title="Đang tải biểu đồ xu hướng…" />
            ) : (
              <EmptyState
                size="sm"
                icon="chart"
                title="Chưa có giao dịch lưu thông"
                description="Không có lượt mượn hoặc trả trong khoảng thời gian đã chọn."
              />
            )}
          </section>

          <div className="report-two-column">
            <section className="report-panel">
              <header><div><h2>Lượt mượn theo ngành đào tạo</h2><p>Tỷ trọng theo hồ sơ bạn đọc</p></div></header>
              {deptStats.length > 0 ? (
                <div className="horizontal-chart">
                  {deptStats.map((dept) => (
                    <div key={dept.key}>
                      <span>{dept.label}</span>
                      <div><i style={{ width: `${Math.max(4, Math.round((dept.count / maxDeptCount) * 100))}%` }} /></div>
                      <strong>{dept.count.toLocaleString("vi-VN")}</strong>
                    </div>
                  ))}
                </div>
              ) : loading ? (
                <LoadingState size="sm" title="Đang tải phân bổ theo ngành…" />
              ) : (
                <EmptyState size="sm" icon="users" title="Chưa có dữ liệu phân bổ theo ngành" />
              )}
            </section>

            <section className="report-panel">
              <header>
                <div>
                  <h2>Lượt mượn theo dạng tài liệu</h2>
                  <p>Phân bổ {docTypeTotal.toLocaleString("vi-VN")} lượt mượn</p>
                </div>
              </header>
              {donutTop.length > 0 ? (
                <div className="document-type-chart">
                  <div className="report-donut" style={{ background: donutBackground }}>
                    <span><strong>{docTypeTotal.toLocaleString("vi-VN")}</strong><small>Lượt mượn</small></span>
                  </div>
                  <div className="donut-legend">
                    {donutTop.map((item, idx) => (
                      <div key={item.key}>
                        <i className={DONUT_CLASSES[idx]} />
                        <span>{item.label}</span>
                        <strong>{item.percentage}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : loading ? (
                <LoadingState size="sm" title="Đang tải phân bổ dạng tài liệu…" />
              ) : (
                <EmptyState size="sm" icon="chart" title="Chưa có dữ liệu phân bổ" />
              )}
            </section>
          </div>

          <section className="report-panel report-ranking">
            <header>
              <div>
                <h2>Tài liệu mượn &amp; tương tác nhiều nhất</h2>
                <p>Top {popularDocs.length} tài liệu nổi bật trong {periodLabel}</p>
              </div>
              <Badge tone="brand">TOP {popularDocs.length}</Badge>
            </header>
            {popularDocs.length > 0 ? (
              <div className="ranking-list">
                {popularDocs.map((doc) => {
                  const meterPct = Math.max(8, Math.round((doc.borrowCount / maxPopularBorrows) * 100));
                  return (
                    <div
                      key={doc.documentId}
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/reader/book-detail?id=${encodeURIComponent(doc.documentId)}`)}
                    >
                      <span>{String(doc.rank).padStart(2, "0")}</span>
                      <div>
                        <strong>{doc.title}</strong>
                        <small>{doc.authors?.length ? doc.authors.join(", ") : "Chưa cập nhật tác giả"} · {doc.interactionCount} tương tác</small>
                      </div>
                      <div className="ranking-meter"><i style={{ width: `${meterPct}%` }} /></div>
                      <b>{doc.borrowCount}<small> lượt</small></b>
                      <em>{doc.averageRating ? `${doc.averageRating.toFixed(1)} ★` : "—"}</em>
                    </div>
                  );
                })}
              </div>
            ) : loading ? (
              <LoadingState variant="table" count={4} size="sm" title="Đang tải bảng xếp hạng tài liệu…" />
            ) : (
              <EmptyState
                size="sm"
                icon="book"
                title="Chưa có tài liệu nổi bật"
                description="Chưa có tài liệu nào phát sinh mượn hoặc tương tác trong kỳ này."
              />
            )}
          </section>
        </div>
      ) : (
        <div className="report-view-content">
          <div className="report-two-column demand-grid">
            <section className="report-panel">
              <header>
                <div>
                  <h2>Tài liệu ít được mượn</h2>
                  <p>Không phát sinh hoặc có rất ít lượt mượn trong 12 tháng</p>
                </div>
                <Badge tone="warning">{lowCircDocs.length} TÀI LIỆU</Badge>
              </header>
              <div className="low-circulation-list">
                {lowCircDocs.length > 0 ? (
                  lowCircDocs.map((doc) => (
                    <article
                      key={doc.documentId}
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/reader/book-detail?id=${encodeURIComponent(doc.documentId)}`)}
                    >
                      <span><Icon name="book" /></span>
                      <div>
                        <strong>{doc.title}</strong>
                        <small>
                          {doc.lastBorrowedAt
                            ? `Lần mượn gần nhất: ${formatDateVi(doc.lastBorrowedAt)}`
                            : "Chưa phát sinh lượt mượn nào"}
                        </small>
                      </div>
                      <Badge>{doc.borrowCount} lượt</Badge>
                    </article>
                  ))
                ) : loading ? (
                  <LoadingState size="sm" title="Đang tải danh sách tài liệu ít lưu thông…" />
                ) : (
                  <EmptyState
                    size="sm"
                    icon="book"
                    title="Không có tài liệu ít lưu thông"
                    description="Các tài liệu trong kho hiện đều có mức lưu thông ổn định."
                  />
                )}
              </div>
            </section>

            <section className="report-panel inventory-report">
              <header>
                <div>
                  <h2>Tình trạng kho</h2>
                  <p>Phân bổ {totalCopies.toLocaleString("vi-VN")} bản cá biệt</p>
                </div>
              </header>
              <div className="inventory-report-total">
                <strong>{totalCopies.toLocaleString("vi-VN")}</strong>
                <span>Tổng số bản</span>
              </div>
              <div className="inventory-report-bar">
                <i className="inv-available" style={{ width: totalCopies ? `${(availableCopies / totalCopies) * 100}%` : "0%" }} />
                <i className="inv-borrowed" style={{ width: totalCopies ? `${(borrowedCopies / totalCopies) * 100}%` : "0%" }} />
                <i className="inv-damaged" style={{ width: totalCopies ? `${(damagedCopies / totalCopies) * 100}%` : "0%" }} />
                <i className="inv-audit" style={{ width: totalCopies ? `${(auditCopies / totalCopies) * 100}%` : "0%" }} />
              </div>
              <div className="inventory-report-legend">
                <div><i className="inventory-available" /><span>Có sẵn</span><strong>{availableCopies.toLocaleString("vi-VN")}</strong><small>{formatPercent(availableCopies, totalCopies)}</small></div>
                <div><i className="inventory-borrowed" /><span>Đang mượn</span><strong>{borrowedCopies.toLocaleString("vi-VN")}</strong><small>{formatPercent(borrowedCopies, totalCopies)}</small></div>
                <div><i className="inventory-damaged" /><span>Hư hỏng</span><strong>{damagedCopies.toLocaleString("vi-VN")}</strong><small>{formatPercent(damagedCopies, totalCopies)}</small></div>
                <div><i className="inventory-audit" /><span>Bảo trì / khác</span><strong>{auditCopies.toLocaleString("vi-VN")}</strong><small>{formatPercent(auditCopies, totalCopies)}</small></div>
              </div>
            </section>
          </div>

          <section className="report-panel report-query-panel">
            <header>
              <div>
                <h2>Truy vấn không có kết quả &amp; Đề xuất bổ sung</h2>
                <p>Các nhu cầu tìm kiếm chưa được đáp ứng</p>
              </div>
              <Badge tone="warning">{acqTotalElements} ĐỀ XUẤT</Badge>
            </header>
            {acqLoading && !suggestions.length ? (
              <LoadingState variant="table" count={4} size="sm" title="Đang tải đề xuất bổ sung…" />
            ) : suggestions.length === 0 ? (
              <EmptyState
                size="sm"
                icon="search"
                title="Chưa có đề xuất bổ sung tài liệu"
                description="Chưa có cụm truy vấn không có kết quả nào được ghi nhận."
              />
            ) : (
              <>
                <div className="report-query-table-wrap">
                  <table>
                    <thead>
                      <tr><th>Chủ đề / Từ khóa</th><th>Khoa / Ngành</th><th>Số lần tìm</th><th>Thời gian gần nhất</th><th>Trạng thái</th></tr>
                    </thead>
                    <tbody>
                      {suggestions.map((item) => (
                        <tr key={item.id}>
                          <td><strong>“{item.topic}”</strong></td>
                          <td>{item.departmentName || "—"}</td>
                          <td><b>{item.queryCount}</b></td>
                          <td>{formatDateTimeVi(item.updatedAt || item.createdAt)}</td>
                          <td><Badge tone={item.queryCount >= 20 ? "error" : "warning"}>{item.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  variant="bar"
                  page={acqPage + 1}
                  totalPages={acqTotalPages}
                  totalElements={acqTotalElements}
                  pageSize={acqPageSize}
                  itemLabel="đề xuất"
                  ariaLabel="Phân trang đề xuất bổ sung"
                  onPageChange={(nextPage) => setAcqPage(nextPage - 1)}
                  onPageSizeChange={(nextSize) => {
                    setAcqPageSize(nextSize);
                    setAcqPage(0);
                  }}
                />
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
