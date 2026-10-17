import { useRoleRoute } from "./hooks/useRoleRoute";
import DocumentReader from "./pages/reader/document/DocumentPage";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPortal from "./layouts/DashboardPortal";
import ReaderPortal from "./layouts/ReaderPortal";

export default function App() {
  const { role, path } = useRoleRoute();
  if (path === "login") return <LoginPage />;
  if (role === "staff") return <DashboardPortal role="staff" path={path} />;
  if (role === "admin") return <DashboardPortal role="admin" path={path} />;
  if (path.startsWith("reader/document")) {
    const requestedPage = Number(path.split("/")[2]) || 42;
    return <DocumentReader initialPage={requestedPage} />;
  }
  return <ReaderPortal path={path} />;
}
