import { useRef } from "react"
import { Button, Field, SelectField } from "../../../design-system"
import type { Policy } from "../model/settings.types.ts"
import { userTypeLabels } from "../model/settings.constants.ts"
import { policyDraft, validatePolicy } from "../model/settings.validation.ts"
import { parsePolicyResponse } from "../model/settings.parsers.ts"
import useSettingsForm from "../hooks/useSettingsForm"
import SettingsDialog from "./SettingsDialog"

const numbers = [
  ["loanDays", "Số ngày mượn", 1],
  ["maxLoans", "Số lượng tối đa", 1],
  ["maxRenewals", "Số lần gia hạn", 0],
  ["holdExpiryDays", "Thời gian giữ chờ (ngày)", 0],
] as const
export default function PolicyForm({
  policy,
  onSave,
  onClose,
}: {
  policy: Policy
  onSave: (policy: Policy, signal: AbortSignal) => Promise<void>
  onClose: () => void
}) {
  const form = useSettingsForm(policyDraft(policy))
  const element = useRef<HTMLFormElement>(null)
  return (
    <SettingsDialog
      title="Chỉnh sửa chính sách"
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
          const saved = await form.submit(validatePolicy, (draft, signal) =>
            onSave(
              parsePolicyResponse({
                id: policy.id,
                ...draft,
                docType: draft.docType.trim(),
                loanDays: Number(draft.loanDays),
                maxLoans: Number(draft.maxLoans),
                maxRenewals: Number(draft.maxRenewals),
                holdExpiryDays: Number(draft.holdExpiryDays),
              }),
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
            <SelectField
              label="Loại độc giả"
              name="userType"
              value={form.draft.userType}
              error={form.errors.userType}
              aria-invalid={!!form.errors.userType}
              onChange={(event) => form.change("userType", event.target.value)}
            >
              <option value="">Chọn loại độc giả</option>
              {Object.entries(userTypeLabels).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </SelectField>
            <Field
              label="Mã loại tài liệu"
              name="docType"
              required
              value={form.draft.docType}
              error={form.errors.docType}
              aria-invalid={!!form.errors.docType}
              onChange={(event) => form.change("docType", event.target.value)}
            />
            <p className="configuration-field-note">
              Nhập đúng mã loại tài liệu đang được catalog sử dụng.
            </p>
            {numbers.map(([key, label, min]) => (
              <Field
                key={key}
                label={label}
                name={key}
                type="number"
                min={min}
                step={1}
                required
                value={form.draft[key]}
                error={form.errors[key]}
                aria-invalid={!!form.errors[key]}
                onChange={(event) => form.change(key, event.target.value)}
              />
            ))}
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
