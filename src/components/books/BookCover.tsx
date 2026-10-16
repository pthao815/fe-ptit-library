import type { Book } from "../../types/library";

export default function BookCover({ book, compact = false }: { book: Book; compact?: boolean }) {
  return (
    <div className={`book-cover ${book.cover} ${compact ? "compact" : ""}`} aria-label={`Bìa sách ${book.title}`}>
      <span>PTIT</span>
      <strong>{book.title}</strong>
      <small>{book.code}</small>
    </div>
  );
}
