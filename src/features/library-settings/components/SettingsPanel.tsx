import type { ReactNode } from "react"
import { Button, EmptyState, LoadingState } from "../../../design-system"
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
        <LoadingState variant="table" count={4} title="Đang tải dữ liệu…" />
      ) : status === "error" ? (
        <EmptyState
          tone="error"
          title="Không thể tải danh sách"
          description={error}
          action={<Button onClick={reload}>Thử lại</Button>}
        />
      ) : !count ? (
        <EmptyState
          icon="document"
          title="Chưa có dữ liệu"
          description="Hệ thống chưa có bản ghi nào cho mục này."
        />
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
