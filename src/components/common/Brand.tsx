import { Icon } from "../../design-system";

export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`portal-brand ${compact ? "compact" : ""}`}>
      <span className="portal-brand-mark"><Icon name="library" size={compact ? 21 : 24} /></span>
      <span className="portal-brand-copy">
        <strong>PTIT LIBRARY</strong>
        <small>THƯ VIỆN SỐ THÔNG MINH</small>
      </span>
    </div>
  );
}
