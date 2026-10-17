import { Route, Routes, useLocation, useParams } from "react-router-dom";
import DocumentReader from "./pages/reader/document/DocumentPage";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPortal from "./layouts/DashboardPortal";
import ReaderPortal from "./layouts/ReaderPortal";

function DocumentRoute() {
  const { "*": documentPath } = useParams();
  const requestedPage = Number(documentPath?.split("/")[0]) || 42;
  return <DocumentReader initialPage={requestedPage} />;
}

export default function App() {
  const path = useLocation().pathname.replace(/^\//, "");
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/staff/*" element={<DashboardPortal role="staff" path={path} />} />
      <Route path="/admin/*" element={<DashboardPortal role="admin" path={path} />} />
      <Route path="/reader/document/*" element={<DocumentRoute />} />
      <Route path="/reader/*" element={<ReaderPortal path={path} />} />
      <Route path="*" element={<ReaderPortal path={path} />} />
    </Routes>
  );
}
