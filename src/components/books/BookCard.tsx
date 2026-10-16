import { IconButton, Rating, Status } from "../../design-system";
import type { Book } from "../../types/library";
import BookCover from "./BookCover";

export default function BookCard({
  book,
  saved,
  onSave,
}: {
  book: Book;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <article className="book-card">
      <div className="book-cover-wrap">
        <BookCover book={book} />
        <IconButton label={saved ? "Bỏ lưu tài liệu" : "Lưu tài liệu"} icon="bookmark" onClick={onSave} className={saved ? "saved" : ""} />
      </div>
      <div className="book-card-body">
        <div className="book-meta"><span>{book.type}</span><i /><span>{book.year}</span></div>
        <h3>{book.title}</h3>
        <p>{book.author}</p>
        <div className="book-card-footer">
          <Rating value={book.rating} />
          <Status tone={book.available ? "success" : "warning"}>{book.available ? "Có sẵn" : "Đang được mượn"}</Status>
        </div>
      </div>
    </article>
  );
}
