import { useEffect, useState, useSyncExternalStore } from "react";
import { Link, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import DocumentReader from "./pages/reader/document/DocumentPage";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPortal from "./layouts/DashboardPortal";
import ReaderPortal from "./layouts/ReaderPortal";
import { authSession } from "./shared/auth/auth-session";
import { getPortalHomePath, isSessionExpired, mapBackendRoleToPortalRole } from "./services/session";
import { routeAccess, safeReturnPath } from "./utils/portal-routes";

function DocumentRoute() {
  const { "*": documentPath } = useParams();
  const requestedPage = Number(documentPath?.split("/")[0]) || 42;
  return <DocumentReader key={requestedPage} initialPage={requestedPage} />;
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
  if (restoring && (login || (access !== "public" && access !== "missing"))) {
    return <main className="reader-main" role="status">Đang khôi phục phiên đăng nhập…</main>;
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
    return <main className="reader-main empty-state" role="alert">
      <h1>{access === "forbidden" ? "Bạn không có quyền truy cập" : "Không tìm thấy trang"}</h1>
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
