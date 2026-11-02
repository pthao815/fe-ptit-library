import type { Policy, PenaltyType } from "./settings.types.ts"
import { userTypeLabels } from "./settings.constants.ts"
export type PolicyDraft = { [K in keyof Omit<Policy, "id">]: string }
export type PenaltyDraft = { [K in keyof Omit<PenaltyType, "id">]: string }
export type FieldErrors<T> = Partial<Record<keyof T, string>>
export const emptyPenaltyDraft: PenaltyDraft = {
  code: "",
  name: "",
  unitName: "",
  unitPrice: "",
}
export function policyDraft(policy: Policy): PolicyDraft {
  return {
    userType: policy.userType,
    docType: policy.docType,
    loanDays: String(policy.loanDays),
    maxLoans: String(policy.maxLoans),
    maxRenewals: String(policy.maxRenewals),
    holdExpiryDays: String(policy.holdExpiryDays),
  }
}
export function penaltyDraft(penalty: PenaltyType): PenaltyDraft {
  return {
    code: penalty.code,
    name: penalty.name,
    unitName: penalty.unitName,
    unitPrice: String(penalty.unitPrice),
  }
}
function integerError(
  value: string,
  min: number,
  max = Number.MAX_SAFE_INTEGER,
) {
  return !value.trim() ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) < min ||
    Number(value) > max
    ? `Nhập số nguyên từ ${min.toLocaleString("vi-VN")} đến ${max.toLocaleString("vi-VN")}.`
    : undefined
}
export function validatePolicy(draft: PolicyDraft): FieldErrors<PolicyDraft> {
  const errors: FieldErrors<PolicyDraft> = {}
  if (!Object.prototype.hasOwnProperty.call(userTypeLabels, draft.userType))
    errors.userType = "Vui lòng chọn loại độc giả."
  if (!draft.docType.trim()) errors.docType = "Vui lòng nhập mã loại tài liệu."
  for (const key of [
    "loanDays",
    "maxLoans",
    "maxRenewals",
    "holdExpiryDays",
  ] as const) {
    const error = integerError(
      draft[key],
      key === "loanDays" || key === "maxLoans" ? 1 : 0,
      2147483647,
    )
    if (error) errors[key] = error
  }
  return errors
}
export function validatePenalty(
  draft: PenaltyDraft,
): FieldErrors<PenaltyDraft> {
  const errors: FieldErrors<PenaltyDraft> = {}
  for (const [key, max] of [
    ["code", 50],
    ["name", 255],
    ["unitName", 50],
  ] as const) {
    if (!draft[key].trim()) errors[key] = "Không được để trống."
    else if (draft[key].trim().length > max)
      errors[key] = `Tối đa ${max} ký tự.`
  }
  const error = integerError(draft.unitPrice, 0)
  if (error) errors.unitPrice = error
  return errors
}
