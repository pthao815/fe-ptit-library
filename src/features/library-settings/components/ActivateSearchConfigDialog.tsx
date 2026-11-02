import { Button } from "../../../design-system"
import useSettingsForm from "../hooks/useSettingsForm"
import SettingsDialog from "./SettingsDialog"
export default function ActivateSearchConfigDialog({
  id,
  onActivate,
  onClose,
}: {
  id: number
  onActivate: (id: number, signal: AbortSignal) => Promise<void>
  onClose: () => void
}) {
  const form = useSettingsForm({ id })
  return (
    <SettingsDialog
      title="Kích hoạt cấu hình tìm kiếm?"
      saving={form.saving}
      onClose={onClose}
    >
      {form.message && (
        <p className="configuration-form-error" role="alert">
          {form.message}
        </p>
      )}
      <p>
        Bạn muốn sử dụng cấu hình <strong>#{id}</strong> làm mặc định? Các cấu
        hình khác sẽ chuyển về chưa active.
      </p>
      <p className="configuration-help">
        Thao tác đổi cấu hình mặc định, không tự lập chỉ mục lại.
      </p>
      <div className="modal-actions">
        <Button variant="ghost" disabled={form.saving} onClick={onClose}>
          Hủy
        </Button>
        <Button
          loading={form.saving}
          onClick={async () => {
            if (
              await form.submit(
                () => ({}),
                (draft, signal) => onActivate(draft.id, signal),
              )
            )
              onClose()
          }}
        >
          Xác nhận kích hoạt
        </Button>
      </div>
    </SettingsDialog>
  )
}
