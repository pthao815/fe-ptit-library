import { Badge, Breadcrumb } from "../../design-system";
import type { Role } from "../../types/library";

export default function ShellPlaceholder({
  title,
  description,
  role,
}: {
  title: string;
  description: string;
  role: Role;
}) {
  return (
    <div className="shell-content">
      <Breadcrumb items={role === "reader" ? ["Trang chủ"] : ["Không gian làm việc", title]} />
      <div className="shell-page-heading">
        <div>
          <p className="eyebrow">
            {role === "reader" ? "THƯ VIỆN SỐ PTIT" : role === "staff" ? "NGHIỆP VỤ THƯ VIỆN" : "QUẢN TRỊ HỆ THỐNG"}
          </p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {role !== "reader" && <Badge tone={role === "staff" ? "brand" : "info"}>{role === "staff" ? "STAFF PORTAL" : "ADMIN PORTAL"}</Badge>}
      </div>
      <div className="shell-grid-guide" aria-label="Khu vực nội dung 12 cột">
        <section className="shell-placeholder-card shell-span-8">
          <span className="placeholder-label">KHU VỰC NỘI DUNG CHÍNH · 8 CỘT</span>
          <div className="placeholder-lines"><i /><i /><i /></div>
        </section>
        <section className="shell-placeholder-card shell-span-4">
          <span className="placeholder-label">THÔNG TIN HỖ TRỢ · 4 CỘT</span>
          <div className="placeholder-lines compact"><i /><i /></div>
        </section>
      </div>
      <p className="foundation-note">
        Nội dung chi tiết sẽ được xây dựng ở giai đoạn tiếp theo. Khung hiện tại thiết lập điều hướng, phân quyền và lưới giao diện.
      </p>
    </div>
  );
}
