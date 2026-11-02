import { useRef } from "react"
import { Button, Field } from "../../../design-system"
import type { PenaltyType } from "../model/settings.types.ts"
import {
  emptyPenaltyDraft,
  penaltyDraft,
  validatePenalty,
} from "../model/settings.validation.ts"
import useSettingsForm from "../hooks/useSettingsForm"
import SettingsDialog from "./SettingsDialog"

const textFields = [
  ["code", "Mã loại phạt (tối đa 50 ký tự)"],
  ["name", "Tên loại phạt (tối đa 255 ký tự)"],
  ["unitName", "Đơn vị tính (tối đa 50 ký tự)"],
] as const
export default function PenaltyTypeForm({
  penalty,
  onSave,
  onClose,
}: {
  penalty?: PenaltyType
  onSave: (
    penalty: Omit<PenaltyType, "id"> & { id?: number },
    signal: AbortSignal,
  ) => Promise<void>
  onClose: () => void
}) {
  const form = useSettingsForm(
    penalty ? penaltyDraft(penalty) : emptyPenaltyDraft,
  )
  const element = useRef<HTMLFormElement>(null)
  return (
    <SettingsDialog
      title={penalty ? "Chỉnh sửa loại phạt" : "Thêm loại phạt"}
      saving={form.saving}
      onClose={onClose}
    >
      {form.message && (
        <p className="configuration-form-error" role="alert">
          {form.message}
        </p>
      )}
      <form
        ref={element}
        noValidate
        onSubmit={async (event) => {
          event.preventDefault()
          const saved = await form.submit(validatePenalty, (draft, signal) =>
            onSave(
              {
                ...(penalty ? { id: penalty.id } : {}),
                code: draft.code.trim(),
                name: draft.name.trim(),
                unitName: draft.unitName.trim(),
                unitPrice: Number(draft.unitPrice),
              },
              signal,
            ),
          )
          if (saved) onClose()
          else
            requestAnimationFrame(() =>
              element.current
                ?.querySelector<HTMLElement>('[aria-invalid="true"]')
                ?.focus(),
            )
        }}
      >
        <div className="configuration-form-grid">
          <fieldset disabled={form.saving}>
            {textFields.map(([key, label]) => (
              <Field
                key={key}
                label={label}
                name={key}
                required
                value={form.draft[key]}
                error={form.errors[key]}
                aria-invalid={!!form.errors[key]}
                onChange={(event) => form.change(key, event.target.value)}
              />
            ))}
            <Field
              label="Đơn giá (VNĐ)"
              name="unitPrice"
              required
              type="number"
              min={0}
              step={1}
              value={form.draft.unitPrice}
              error={form.errors.unitPrice}
              aria-invalid={!!form.errors.unitPrice}
              onChange={(event) => form.change("unitPrice", event.target.value)}
            />
          </fieldset>
        </div>
        <div className="modal-actions">
          <Button
            type="button"
            variant="ghost"
            disabled={form.saving}
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button type="submit" loading={form.saving}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </SettingsDialog>
  )
}
