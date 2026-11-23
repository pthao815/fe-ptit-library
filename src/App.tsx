import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { Link, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { LoadingState } from "./design-system";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPortal from "./layouts/DashboardPortal";
import ReaderPortal from "./layouts/ReaderPortal";
import { authSession } from "./shared/auth/auth-session";
import { getPortalHomePath, isSessionExpired, mapBackendRoleToPortalRole } from "./services/session";
import { routeAccess, safeReturnPath } from "./utils/portal-routes";

// PDF.js nặng (~400 kB): chỉ tải khi mở trình đọc
const DocumentReader = lazy(() => import("./pages/reader/document/DocumentPage"));

const DOCUMENT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// /reader/document/<documentId>?page=<trang>&q=<truy vấn để tô sáng>
function DocumentRoute() {
  const { "*": documentPath } = useParams();
  const documentId = documentPath?.split("/")[0] ?? "";
  if (!DOCUMENT_ID.test(documentId)) return <Navigate replace to="/reader/search" />;
  return (
    <Suspense fallback={<div className="document-reader" aria-busy="true" />}>
      <DocumentReader key={documentId} documentId={documentId} />
    </Suspense>
  );
}

export default function App({ restoration }: { restoration?: Promise<unknown> }) {
  const location = useLocation();
  const { session, identityVersion } = useSyncExternalStore(authSession.subscribe, authSession.getSnapshot);
  const [restoring, setRestoring] = useState(Boolean(restoration));
  useEffect(() => {
    let active = true;
    const finish = () => { if (active) setRestoring(false); };
    void restoration?.then(finish, finish);
    return () => { active = false; };
  }, [restoration]);

  const path = location.pathname.replace(/^\/|\/+$/g, "").toLowerCase();
  const home = session ? getPortalHomePath(mapBackendRoleToPortalRole(session.role)) : "/reader";
  const target = location.pathname + location.search + location.hash;
  const login = path === "" || path === "login";
  const access = routeAccess(location.pathname, session?.role);
  if (restoring) {
    return (
      <main className="reader-main ui-state-page-wrap">
        <LoadingState size="lg" surface="card" title="Đang khôi phục phiên đăng nhập…" />
      </main>
    );
  }
  if (login) {
    return session
      ? <Navigate replace to={safeReturnPath(location.state?.returnTo, session.role) ?? home} />
      : <LoginPage />;
  }
  if (access === "login") {
    return <Navigate replace to="/login" state={{ returnTo: target, expired: isSessionExpired() }} />;
  }
  if (access === "forbidden" || access === "missing") {
    return <main className="reader-main empty-state access-state" role="alert">
      <span className="access-state-icon">{access === "forbidden" ? "403" : "404"}</span>
      <h1>{access === "forbidden" ? "Bạn không có quyền truy cập" : "Không tìm thấy trang"}</h1>
      <p>{access === "forbidden" ? "Tài khoản hiện tại không được phép mở trang này. Nếu cần quyền, hãy liên hệ quản trị viên." : "Đường dẫn không tồn tại hoặc đã được thay đổi."}</p>
      <Link className="btn btn-primary" to={home}>Về trang chủ</Link>
    </main>;
  }
  return <Routes key={identityVersion}>
    <Route path="/staff/*" element={<DashboardPortal role="staff" path={path} />} />
    <Route path="/admin/*" element={<DashboardPortal role="admin" path={path} />} />
    <Route path="/reader/document/*" element={<DocumentRoute />} />
    <Route path="/reader/*" element={<ReaderPortal path={path} />} />
  </Routes>;
}
