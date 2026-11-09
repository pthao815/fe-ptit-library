import { API_BASE_URL } from "../../../config/env"
import { getAccessToken } from "../../../services/session"
import { tryRefreshAccessToken } from "../../../services/http"
import { ApiError, createHttpClient } from "../../../shared/api/http-client.ts"
import { authSession } from "../../../shared/auth/auth-session.ts"
import { createSettingsApi } from "./settings.api.ts"

const request = createHttpClient(API_BASE_URL)

export const settingsApi = createSettingsApi(async (path, options) => {
  const context = options?.context
  if (!context || context.accessToken !== getAccessToken()) return request(path, options)

  let currentUnauthorized = false
  try {
    return await request(path, {
      ...options,
      context: {
        ...context,
        onAuthError(status) {
          if (status === 401) currentUnauthorized = true
          else context.onAuthError(status)
        },
      },
    })
  } catch (error) {
    if (!currentUnauthorized || options?.signal?.aborted || !context.isIdentityCurrent()) throw error

    const token = await tryRefreshAccessToken()
    if (!context.isIdentityCurrent() || options?.signal?.aborted)
      throw new DOMException("Trang hoặc tài khoản đã thay đổi", "AbortError")
    if (!token) {
      if (context.isCredentialCurrent()) context.onAuthError(401)
      throw error
    }
    if (options?.method && options.method !== "GET")
      throw new ApiError("Phiên đã được làm mới. Kiểm tra dữ liệu trước khi gửi lại.", 401)

    const { version } = authSession.getSnapshot()
    return request(path, {
      ...options,
      context: {
        ...context,
        accessToken: token,
        isCredentialCurrent: () => authSession.getSnapshot().version === version,
        onAuthError: (status) => authSession.reportAuthError(status, version),
      },
    })
  }
})
