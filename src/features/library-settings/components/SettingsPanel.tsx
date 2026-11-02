import type { ReactNode } from "react"
import { Button, Icon } from "../../../design-system"
export default function SettingsPanel({
  title,
  count,
  status,
  error,
  reload,
  actions,
  children,
}: {
  title: string
  count: number
  status: "loading" | "ready" | "error"
  error: string
  reload: () => void
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section
      className="configuration-panel"
      aria-label={title}
      aria-busy={status === "loading"}
    >
      <div className="configuration-toolbar">
        <div>
          <h2>{title}</h2>
          <p>{status === "ready" ? `${count} bản ghi` : "Đang tải dữ liệu"}</p>
        </div>
        <div className="configuration-toolbar-actions">
          <Button
            variant="secondary"
            disabled={status === "loading"}
            onClick={reload}
          >
            Tải lại
          </Button>
          {status === "ready" && actions}
        </div>
      </div>
      {status === "loading" ? (
        <div className="configuration-state" role="status">
          <span className="spinner" />
          <h3>Đang tải dữ liệu…</h3>
        </div>
      ) : status === "error" ? (
        <div className="configuration-state" role="alert">
          <Icon name="error" size={30} />
          <h3>Không thể tải danh sách</h3>
          <p>{error}</p>
          <Button onClick={reload}>Thử lại</Button>
        </div>
      ) : !count ? (
        <div className="configuration-state">
          <Icon name="document" size={30} />
          <h3>Chưa có dữ liệu</h3>
          <p>Backend chưa có bản ghi cho mục này.</p>
        </div>
      ) : (
        <div
          className="configuration-table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Bảng dữ liệu, có thể cuộn ngang"
        >
          {children}
        </div>
      )}
    </section>
  )
}
