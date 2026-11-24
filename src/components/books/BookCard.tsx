import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconButton, Rating, Status } from "../../design-system";
import type { Book } from "../../types/library";
import BookCover from "./BookCover";

export default function BookCard({
  book,
  saved,
  saving = false,
  onSave,
  detailPath,
}: {
  book: Book;
  saved: boolean;
  saving?: boolean;
  onSave: () => void;
  detailPath?: string;
}) {
  const navigate = useNavigate();

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if (!detailPath) return;
    if ((event.target as HTMLElement).closest("button, a, input, select")) return;
    navigate(detailPath);
  };

  return (
    <article
      className={`book-card ${detailPath ? "clickable-card" : ""}`}
      onClick={handleCardClick}
    >
      <div className="book-cover-wrap">
        {detailPath ? (
          <Link to={detailPath} className="book-cover-link" aria-label={`Xem chi tiết ${book.title}`}>
            <BookCover book={book} />
          </Link>
        ) : (
          <BookCover book={book} />
        )}
        <IconButton
          type="button"
          label={saved ? "Bỏ lưu tài liệu" : "Lưu tài liệu"}
          icon="bookmark"
          aria-pressed={saved}
          disabled={saving}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSave();
          }}
          className={saved ? "saved" : ""}
        />
      </div>
      <div className="book-card-body">
        <div className="book-meta"><span>{book.type}</span><i /><span>{book.year}</span></div>
        <h3>{detailPath ? <Link to={detailPath}>{book.title}</Link> : book.title}</h3>
        <p>{book.author}</p>
        <div className="book-card-footer">
          <Rating value={book.rating} />
          <Status tone={book.available ? "success" : "warning"}>{book.available ? "Có sẵn" : "Đang được mượn"}</Status>
        </div>
      </div>
    </article>
  );
}
