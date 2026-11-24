import { Link } from "react-router-dom";
import { Icon } from "../../design-system";

export default function Brand({
  compact = false,
  to,
  onClick,
}: {
  compact?: boolean;
  to?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="portal-brand-mark"><Icon name="library" size={compact ? 21 : 24} /></span>
      <span className="portal-brand-copy">
        <strong>PTIT LIBRARY</strong>
        <small>THƯ VIỆN SỐ THÔNG MINH</small>
      </span>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        className={`portal-brand portal-brand-link ${compact ? "compact" : ""}`}
        aria-label="PTIT Library — Về trang chủ"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={`portal-brand ${compact ? "compact" : ""}`}>
      {content}
    </div>
  );
}
