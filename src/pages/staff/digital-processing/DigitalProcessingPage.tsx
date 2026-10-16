import { useState } from "react";
import { Badge, Breadcrumb, Button, Icon, IconButton, Modal, Pagination, SelectField } from "../../../design-system";
import type { ProcessingJob } from "../../../data/processing-jobs";
import { initialProcessingJobs } from "../../../data/processing-jobs";
import { pipelineSteps } from "../../../constants/library-options";

export default function DigitalProcessingPage() {
  const [jobs, setJobs] = useState(initialProcessingJobs);
  const [detailJob, setDetailJob] = useState<ProcessingJob | null>(null);
  const retry = (id: number) => setJobs((items) => items.map((item) => item.id === id ? { ...item, status: "Đang chờ", progress: 0, stage: "Đã thêm lại vào hàng đợi", completed: "—" } : item));
  const counts = {
    waiting: jobs.filter((job) => job.status === "Đang chờ").length,
    processing: jobs.filter((job) => job.status === "Đang xử lý").length,
    complete: jobs.filter((job) => job.status === "Hoàn thành").length,
    error: jobs.filter((job) => job.status === "Lỗi").length,
  };

  return (
    <div className="digital-processing-page">
      <div className="processing-page-heading">
        <div><Breadcrumb items={["Không gian nghiệp vụ", "Tài liệu số", "Trạng thái xử lý"]} /><p className="eyebrow">XỬ LÝ NỘI DUNG SỐ</p><h1>Trạng thái xử lý tài liệu số</h1><p>Theo dõi pipeline trích xuất nội dung và lập chỉ mục tìm kiếm.</p></div>
        <div><Button variant="secondary" icon="settings">Cấu hình xử lý</Button><Button icon="plus">Thêm tệp xử lý</Button></div>
      </div>

      <section className="processing-summary-grid">
        <article><span className="processing-summary-icon waiting"><Icon name="more" /></span><div><small>Đang chờ</small><strong>{counts.waiting}</strong><p>Trong hàng đợi</p></div></article>
        <article><span className="processing-summary-icon processing"><Icon name="sparkle" /></span><div><small>Đang xử lý</small><strong>{counts.processing}</strong><p>Đang chạy pipeline</p></div></article>
        <article><span className="processing-summary-icon complete"><Icon name="success" /></span><div><small>Hoàn thành</small><strong>{counts.complete}</strong><p>Trong phiên hôm nay</p></div></article>
        <article><span className="processing-summary-icon failed"><Icon name="error" /></span><div><small>Lỗi</small><strong>{counts.error}</strong><p>Cần kiểm tra</p></div></article>
      </section>

      <section className="processing-table-panel">
        <div className="processing-table-heading"><div><h2>Danh sách tác vụ</h2><p>{jobs.length} tệp · Cập nhật tự động mỗi 30 giây</p></div><div><SelectField label="Trạng thái" defaultValue="all"><option value="all">Tất cả trạng thái</option><option>Đang chờ</option><option>Đang xử lý</option><option>Hoàn thành</option><option>Lỗi</option></SelectField><IconButton label="Làm mới" icon="sparkle" /></div></div>
        <div className="processing-table-wrap"><table className="processing-table"><thead><tr><th>Tài liệu</th><th>File</th><th>Dung lượng</th><th>Trạng thái</th><th>Tiến độ</th><th>Thời gian bắt đầu</th><th>Thời gian hoàn thành</th><th>Actions</th></tr></thead><tbody>
          {jobs.map((job) => <tr key={job.id}>
            <td><div className="processing-title"><span><Icon name="document" /></span><div><strong>{job.title}</strong><small>{job.record}</small></div></div></td>
            <td><div className="processing-file"><strong>{job.file}</strong>{job.status === "Lỗi" && <small className="file-error">Không thể trích xuất văn bản</small>}</div></td>
            <td>{job.size}</td>
            <td><Badge tone={job.status === "Hoàn thành" ? "success" : job.status === "Lỗi" ? "error" : job.status === "Đang xử lý" ? "info" : "warning"}>{job.status}</Badge></td>
            <td><div className="job-progress"><div><i className={`progress-value progress-${job.progress}`} /></div><span>{job.progress}%</span><small>{job.stage}</small></div></td>
            <td>{job.started}</td>
            <td>{job.completed}</td>
            <td><div className="processing-actions"><Button variant="ghost" size="sm" onClick={() => setDetailJob(job)}>Chi tiết</Button>{job.status === "Lỗi" && <Button variant="secondary" size="sm" onClick={() => retry(job.id)}>Xử lý lại</Button>}</div></td>
          </tr>)}
        </tbody></table></div>
        <div className="processing-footnote"><span><Icon name="info" size={14} />Pipeline đang sử dụng cấu hình mặc định · 2 tác vụ chạy song song</span><Pagination /></div>
      </section>

      <Modal open={detailJob !== null} onClose={() => setDetailJob(null)} title="Chi tiết xử lý tài liệu">
        {detailJob && <div className="processing-detail">
          <div className="processing-detail-file"><span className="file-icon">PDF</span><div><strong>{detailJob.file}</strong><small>{detailJob.title} · {detailJob.size}</small></div><Badge tone={detailJob.status === "Lỗi" ? "error" : detailJob.status === "Hoàn thành" ? "success" : "info"}>{detailJob.status}</Badge></div>
          {detailJob.status === "Lỗi" && <div className="processing-error-detail"><Icon name="error" /><div><strong>Không thể trích xuất văn bản</strong><p>Tệp có thể là bản scan chất lượng thấp hoặc được bảo vệ. Kiểm tra OCR và quyền truy cập trước khi xử lý lại.</p></div></div>}
          <div className="pipeline-heading"><p>PIPELINE XỬ LÝ</p><span>{detailJob.progress}% hoàn thành</span></div>
          <ol className="pipeline-steps">
            {pipelineSteps.map((step, index) => {
              const failed = detailJob.status === "Lỗi" && index === 1;
              const completedJob = detailJob.status === "Hoàn thành";
              const status = completedJob ? "complete" : failed ? "failed" : detailJob.status === "Đang chờ" ? index === 0 ? "waiting" : "waiting" : step.status;
              return <li key={step.title} className={status}><span>{status === "complete" ? <Icon name="success" size={15} /> : status === "failed" ? <Icon name="error" size={15} /> : String(index + 1).padStart(2, "0")}</span><div><strong>{step.title}</strong><p>{failed ? "Không đọc được lớp văn bản trong tệp PDF" : step.description}</p></div><small>{status === "complete" ? "Hoàn thành" : status === "processing" ? "Đang xử lý" : status === "failed" ? "Lỗi" : "Đang chờ"}</small></li>;
            })}
          </ol>
          <div className="processing-technical-meta"><div><span>Job ID</span><strong>JOB-{detailJob.id}-2025</strong></div><div><span>Worker</span><strong>worker-index-02</strong></div><div><span>Ưu tiên</span><strong>Tiêu chuẩn</strong></div></div>
          <div className="modal-actions"><Button variant="ghost" onClick={() => setDetailJob(null)}>Đóng</Button>{detailJob.status === "Lỗi" && <Button onClick={() => { retry(detailJob.id); setDetailJob(null); }}>Xử lý lại</Button>}</div>
        </div>}
      </Modal>
    </div>
  );
}
