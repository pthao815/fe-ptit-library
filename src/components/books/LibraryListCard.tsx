import type * as React from "react";
import { Badge } from "../../design-system";
import type { Book } from "../../types/library";
import BookCover from "./BookCover";

export default function LibraryListCard({
  book,
  badge,
  badgeTone = "neutral",
  status,
  statusHint,
  statusTone = "success",
  details,
  actions,
}: {
  book: Book;
  badge: string;
  badgeTone?: "brand" | "neutral" | "success" | "warning" | "error" | "info";
  status: string;
  statusHint: string;
  statusTone?: "success" | "warning" | "error" | "info";
  details: Array<{ label: string; value: React.ReactNode }>;
  actions: React.ReactNode;
}) {
  return (
    <article className={`loan-card ${statusTone === "error" ? "overdue" : ""}`}>
      <BookCover book={book} compact />
      <div className="loan-card-body">
        <div className="loan-title-row">
          <div><Badge tone={badgeTone}>{badge}</Badge><h3>{book.title}</h3><p>{book.author}</p></div>
          <span className={`loan-countdown ${statusTone === "error" ? "overdue" : statusTone === "success" ? "" : statusTone}`}><strong>{status}</strong><small>{statusHint}</small></span>
        </div>
        <dl className="loan-dates">{details.map((detail) => <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl>
        <div className="loan-actions">{actions}</div>
      </div>
    </article>
  );
}
