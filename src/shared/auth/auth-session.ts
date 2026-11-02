export type AuthRole = "ADMIN" | "LIBRARIAN" | "READER"
export type AuthSession = Readonly<{
  accessToken: string
  userId: string
  role: AuthRole
}>
let state: Readonly<{
  session: AuthSession | null
  version: number
  identityVersion: number
}> = { session: null, version: 0, identityVersion: 0 }
const listeners = new Set<() => void>()
const failures = new Set<(status: 401 | 403) => void>()

function claims(token: string): Record<string, unknown> {
  const part = token.split(".")[1]
  if (!part) throw new Error("Access token phải có định dạng JWT của backend.")
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/")
  try {
    const parsed = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(
          atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")),
          (c) => c.charCodeAt(0),
        ),
      ),
    )
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error()
    return parsed
  } catch {
    throw new Error("Không đọc được access token. Không nhập refresh token.")
  }
}

// This only reads claims for UI routing. Signature and authorization belong to the server.
export function sessionFromAccessToken(token: string): AuthSession {
  const accessToken = token.trim()
  const payload = claims(accessToken)
  const role =
    typeof payload.role === "string" ? payload.role.replace(/^ROLE_/, "") : ""
  if (
    payload.type === "REFRESH" ||
    !["ADMIN", "LIBRARIAN", "READER"].includes(role)
  )
    throw new Error("Token không có quyền hợp lệ hoặc là refresh token.")
  if (
    typeof payload.sub !== "string" ||
    !payload.sub ||
    typeof payload.exp !== "number" ||
    payload.exp * 1000 <= Date.now()
  )
    throw new Error("Access token đã hết hạn hoặc thiếu thông tin phiên.")
  return Object.freeze({
    accessToken,
    userId: payload.sub,
    role: role as AuthRole,
  })
}

/** Module 1 calls setSession on login/token rotation/account switch; null on logout. */
export const authSession = {
  getSnapshot: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  setSession(session: AuthSession | null) {
    if (session) {
      const parsed = sessionFromAccessToken(session.accessToken)
      if (parsed.userId !== session.userId || parsed.role !== session.role)
        throw new Error("Thông tin phiên không khớp access token.")
      session = parsed
    }
    const identityChanged =
      state.session?.userId !== session?.userId ||
      state.session?.role !== session?.role
    state = {
      session,
      version: state.version + 1,
      identityVersion: state.identityVersion + (identityChanged ? 1 : 0),
    }
    listeners.forEach((listener) => listener())
  },
  onAuthError(listener: (status: 401 | 403) => void) {
    failures.add(listener)
    return () => {
      failures.delete(listener)
    }
  },
  reportAuthError(status: 401 | 403, version: number) {
    if (state.version !== version) return
    if (status === 401) authSession.setSession(null)
    failures.forEach((listener) => {
      try {
        listener(status)
      } catch {
        /* Host errors must not alter the request outcome. */
      }
    })
  },
}
