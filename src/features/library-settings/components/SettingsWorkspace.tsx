import { useSyncExternalStore } from "react"
import { NavLink } from "react-router-dom"
import { Badge, Icon } from "../../../design-system"
import { authSession } from "../../../shared/auth/auth-session.ts"
import DevelopmentAccessPanel from "../devtools/DevelopmentAccessPanel"
import LoanPoliciesPage from "../pages/LoanPoliciesPage"
import PenaltyTypesPage from "../pages/PenaltyTypesPage"
import SearchConfigsPage from "../pages/SearchConfigsPage"
import type { ConfigurationKind } from "../model/settings.types.ts"
import "../settings.css"

const titles = {
  policies: "Chính sách mượn trả",
  "penalty-types": "Loại hình phạt",
  "search-configs": "Cấu hình tìm kiếm",
}
const descriptions = {
  policies:
    "Thiết lập hạn mức và thời gian sử dụng tài liệu theo từng nhóm độc giả.",
  "penalty-types": "Quản lý danh mục vi phạm, đơn vị tính và mức phí áp dụng.",
  "search-configs":
    "Xem cấu hình bóc tách dữ liệu và lựa chọn cấu hình tìm kiếm mặc định.",
}
export default function SettingsWorkspace({
  kind,
  portal,
}: {
  kind: ConfigurationKind
  portal: "admin" | "staff"
}) {
  const { session, identityVersion } = useSyncExternalStore(
    authSession.subscribe,
    authSession.getSnapshot,
  )
  const allowed =
    session &&
    (session.role === "ADMIN" ||
      (session.role === "LIBRARIAN" && kind !== "search-configs")) &&
    (kind !== "search-configs" || portal === "admin")
  const canWrite = session?.role === "ADMIN" && portal === "admin"
  return (
    <>
      <DevelopmentAccessPanel />
      {!allowed ? (
        <div className="configuration-page">
          <h1>{session ? "Không có quyền truy cập" : "Cần phiên đăng nhập"}</h1>
          <p>
            {session
              ? "Tài khoản không có quyền xem mục này."
              : "Chờ phiên từ Module 1 hoặc cung cấp access token development. Module này không tự refresh token."}
          </p>
        </div>
      ) : (
        <div className="configuration-page">
          <header className="configuration-heading">
            <div>
              <p className="eyebrow">CHÍNH SÁCH & CẤU HÌNH</p>
              <h1>{titles[kind]}</h1>
              <p>{descriptions[kind]}</p>
            </div>
            <Badge tone={canWrite ? "brand" : "info"}>
              {canWrite ? "QUẢN TRỊ VIÊN" : "CHỈ XEM"}
            </Badge>
          </header>
          <nav
            className="configuration-tabs"
            aria-label="Chính sách và cấu hình"
          >
            {([
              "policies",
              "penalty-types",
              ...(canWrite ? ["search-configs"] : []),
            ] as ConfigurationKind[]).map((item) => (
              <NavLink key={item} to={`/${portal}/${item}`}>
                {titles[item]}
              </NavLink>
            ))}
          </nav>
          <div className="configuration-note">
            <Icon name="info" size={20} />
            <p>
              <strong>Dữ liệu từ backend.</strong> Quyền thao tác lấy từ phiên
              đăng nhập; server xác minh quyền cho từng request.
            </p>
          </div>
          <SettingsContent
            key={`${identityVersion}:${portal}:${kind}`}
            kind={kind}
            canWrite={canWrite}
          />
        </div>
      )}
    </>
  )
}
function SettingsContent({
  kind,
  canWrite,
}: {
  kind: ConfigurationKind
  canWrite: boolean
}) {
  if (kind === "policies") return <LoanPoliciesPage canWrite={canWrite} />
  if (kind === "penalty-types") return <PenaltyTypesPage canWrite={canWrite} />
  return <SearchConfigsPage />
}
