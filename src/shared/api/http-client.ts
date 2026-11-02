export class ApiError extends Error {
  status: number
  details: unknown
  code?: number
  constructor(message: string, status = 0, details?: unknown, code?: number) {
    super(message)
    this.status = status
    this.details = details
    this.code = code
  }
}

export type RequestContext = {
  accessToken: string
  isIdentityCurrent: () => boolean
  isCredentialCurrent: () => boolean
  onAuthError: (status: 401 | 403) => void
}
export type HttpRequest = {
  method?: "GET" | "POST" | "PUT"
  body?: unknown
  signal?: AbortSignal
  context?: RequestContext
}
export function createHttpClient(
  baseUrl: string,
  fetcher: typeof fetch = fetch,
) {
  const base = baseUrl.trim().replace(/\/$/, "")
  return async (path: string, options: HttpRequest = {}): Promise<unknown> => {
    if (
      base &&
      !/^https?:\/\//i.test(base) &&
      (!base.startsWith("/") || base.startsWith("//"))
    ) {
      throw new ApiError(
        "Base URL phải là URL HTTP(S) hoặc đường dẫn cùng origin.",
      )
    }
    const { method = "GET", body, signal, context } = options
    const assertCurrent = () => {
      if (signal?.aborted || (context && !context.isIdentityCurrent())) {
        throw new DOMException("Trang hoặc tài khoản đã thay đổi", "AbortError")
      }
    }
    assertCurrent()
    let response: Response
    try {
      response = await fetcher(`${base}${path}`, {
        method,
        signal,
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
        headers: {
          Accept: "application/json",
          ...(context
            ? { Authorization: `Bearer ${context.accessToken}` }
            : {}),
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })
    } catch (error) {
      assertCurrent()
      if (error instanceof DOMException && error.name === "AbortError")
        throw error
      throw new ApiError(
        method === "GET"
          ? "Không thể kết nối backend. Kiểm tra mạng, base URL và CORS."
          : "Không nhận được xác nhận từ server. Dữ liệu có thể đã được lưu; tải lại trước khi gửi lại.",
      )
    }
    assertCurrent()
    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
    assertCurrent()
    const envelope =
      payload && typeof payload === "object"
        ? payload as Record<string, unknown>
        : {}
    if (response.status === 401 || response.status === 403) {
      if (context && !context.isCredentialCurrent()) {
        throw new ApiError(
          "Phản hồi dùng token cũ đã bị bỏ qua. Token mới đã sẵn sàng; vui lòng thử lại.",
          response.status,
        )
      }
      context?.onAuthError(response.status)
    }
    if (!response.ok || envelope.success === false) {
      throw new ApiError(
        "Backend từ chối yêu cầu.",
        response.status,
        envelope.data,
        typeof envelope.code === "number" ? envelope.code : undefined,
      )
    }
    if (
      envelope.success !== true ||
      !Object.prototype.hasOwnProperty.call(envelope, "data")
    ) {
      throw new ApiError(
        "Response backend không đúng ApiResponse. Nếu vừa ghi, hãy tải lại trước khi gửi lại.",
      )
    }
    return envelope.data
  }
}
