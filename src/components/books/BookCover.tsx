import { useEffect, useState } from "react";
import type { Book } from "../../types/library";

function isRenderableImageUrl(url?: string): url is string {
  return Boolean(url && (/^https?:\/\//i.test(url.trim()) || url.trim().startsWith("/")));
}

export default function BookCover({ book, compact = false }: { book: Book; compact?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [book.coverUrl]);

  const showImage = isRenderableImageUrl(book.coverUrl) && !imageFailed;

  return (
    <div
      className={`book-cover ${book.cover} ${compact ? "compact" : ""} ${showImage ? "has-image" : ""}`}
      aria-label={`Bìa sách ${book.title}`}
    >
      {showImage ? (
        <img
          className="book-cover-image"
          src={book.coverUrl}
          alt={`Bìa sách ${book.title}`}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <>
          <span>PTIT</span>
          <strong title={book.title}>{book.title}</strong>
          <small>{book.code}</small>
        </>
      )}
    </div>
  );
}
