import type {
  Policy,
  PenaltyType,
  SearchConfig,
  UserType,
  ConfigurationKind,
} from "./settings.types.ts"
import { ApiError } from "../../../shared/api/http-client.ts"
const userTypes = ["STUDENT", "LECTURER", "RESEARCHER", "STAFF"]
function invalid(): never {
  throw new ApiError(
    "Dữ liệu backend có trường null, kiểu/mã không hỗ trợ hoặc số vượt giới hạn an toàn. Nếu vừa ghi, server có thể đã lưu; hãy tải lại trước khi gửi lại.",
  )
}
function row(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return invalid()
  return data as Record<string, unknown>
}
function text(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return invalid()
  return value
}
function number(
  value: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  )
    return invalid()
  return value
}
export function parsePolicyResponse(data: unknown): Policy {
  const r = row(data)
  const userType = text(r.userType)
  if (!userTypes.includes(userType)) return invalid()
  return {
    id: number(r.id, 1),
    userType: userType as UserType,
    docType: text(r.docType),
    loanDays: number(r.loanDays, 1, 2147483647),
    maxLoans: number(r.maxLoans, 1, 2147483647),
    maxRenewals: number(r.maxRenewals, 0, 2147483647),
    holdExpiryDays: number(r.holdExpiryDays, 0, 2147483647),
  }
}
export function parsePenaltyTypeResponse(data: unknown): PenaltyType {
  const r = row(data)
  return {
    id: number(r.id, 1),
    code: text(r.code),
    name: text(r.name),
    unitName: text(r.unitName),
    unitPrice: number(r.unitPrice),
  }
}
export function parseSearchConfigResponse(data: unknown): SearchConfig {
  const r = row(data)
  if (typeof r.isActive !== "boolean") return invalid()
  return {
    id: number(r.id, 1),
    chunkSize: number(r.chunkSize, 1),
    overlap: number(r.overlap),
    strategy: text(r.strategy),
    embeddingModel: text(r.embeddingModel),
    vectorDimensions: number(r.vectorDimensions, 1),
    isActive: r.isActive,
  }
}
export function parseList<T>(data: unknown, parse: (value: unknown) => T): T[] {
  if (!Array.isArray(data)) return invalid()
  return data.map(parse)
}
