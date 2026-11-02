import { ApiError } from "../../../shared/api/http-client.ts"
export type SettingsField = "userType" | "docType" | "loanDays" | "maxLoans" | "maxRenewals" | "holdExpiryDays" | "code" | "name" | "unitName" | "unitPrice"
const fields: SettingsField[] = [
  "userType",
  "docType",
  "loanDays",
  "maxLoans",
  "maxRenewals",
  "holdExpiryDays",
  "code",
  "name",
  "unitName",
  "unitPrice",
]
export class SettingsError extends Error {
  fields: Partial<Record<SettingsField, string>> = {}
}
export function settingsError(
  error: unknown,
  resource: "policies" | "penalty-types" | "search-configs",
): SettingsError {
  const result = new SettingsError(
    error instanceof Error ? error.message : "Không thể xử lý yêu cầu.",
  )
  if (!(error instanceof ApiError)) return result
  const messages: Record<number, string> = {
    400: "Dữ liệu không hợp lệ. Kiểm tra các trường nhập.",
    401: "Phiên không còn hợp lệ hoặc phản hồi dùng token cũ. Vui lòng kiểm tra phiên rồi thử lại.",
    403: "Tài khoản không có quyền thực hiện thao tác này.",
    404: "Bản ghi không còn tồn tại. Hãy tải lại danh sách.",
    409: "Dữ liệu bị xung đột. Hãy tải lại danh sách.",
  }
  if (error.status)
    result.message =
      messages[error.status] ?? "Backend báo lỗi. Vui lòng thử lại sau."
  if (
    error.status === 400 &&
    error.details &&
    typeof error.details === "object"
  ) {
    for (const key of fields) {
      if (key in error.details)
        result.fields[key] = "Giá trị không được backend chấp nhận."
    }
  }
  if (resource === "penalty-types" && error.status === 409) {
    result.message = "Mã loại phạt đã tồn tại."
    result.fields.code = result.message
  }
  return result
}
