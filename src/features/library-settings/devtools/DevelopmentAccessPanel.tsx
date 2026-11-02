import { useState, useSyncExternalStore } from "react"
import { Button, Field } from "../../../design-system"
import {
  authSession,
  sessionFromAccessToken,
} from "../../../shared/auth/auth-session.ts"

export default function DevelopmentAccessPanel() {
  const { session } = useSyncExternalStore(
    authSession.subscribe,
    authSession.getSnapshot,
  )
  const [token, setToken] = useState("")
  const [error, setError] = useState("")
  if (!import.meta.env.DEV) return null
  return (
    <details className="configuration-demo">
      <summary>Kết nối phiên development (chờ Module 1)</summary>
      <p>
        Chỉ dùng access token từ môi trường thử được cho phép. Token chỉ giữ
        trong bộ nhớ, refresh phải nhập lại. Không dùng refresh token. Quyền
        thực tế do backend xác minh.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          try {
            authSession.setSession(sessionFromAccessToken(token))
            setToken("")
            setError("")
          } catch (cause) {
            setError(
              cause instanceof Error ? cause.message : "Token không hợp lệ.",
            )
          }
        }}
      >
        <Field
          label="Access token development"
          type="password"
          value={token}
          autoComplete="off"
          onChange={(event) => setToken(event.target.value)}
          error={error}
        />
        <Button type="submit">Dùng phiên development</Button>
        {session && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              authSession.setSession(null)
              setToken("")
              setError("")
            }}
          >
            Xóa phiên development
          </Button>
        )}
      </form>
      <p>
        {session
          ? `Vai trò đọc từ token: ${session.role}.`
          : "Chưa có phiên từ Module 1 hoặc development."}
      </p>
    </details>
  )
}
