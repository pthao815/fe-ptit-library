import type * as React from "react";
import { Button, Icon } from "../../design-system";

export default function HomeSection({
  eyebrow,
  title,
  subtitle,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="reader-section">
      <div className="reader-section-heading">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action && <Button variant="ghost" size="sm">{action}<Icon name="chevron-right" size={16} /></Button>}
      </div>
      {children}
    </section>
  );
}
