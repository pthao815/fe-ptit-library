import { useEffect, useState } from "react";
import { Button, Field } from "../../../design-system";
import { catalogService } from "../../../services/catalog.service";
import type { AuthorDto, PageResponse } from "../../../types/api";

export default function AuthorFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = Number(value);
  const validId = /^[1-9][0-9]*$/.test(value) && Number.isSafeInteger(id);
  const [author, setAuthor] = useState<AuthorDto>();
  const [nameError, setNameError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState<{ keyword: string; page: number }>();
  const [results, setResults] = useState<PageResponse<AuthorDto>>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setAuthor(undefined);
    setNameError("");
    if (!validId) return;
    catalogService.getAuthorById(id).then((data) => {
      if (active) setAuthor(data);
    }).catch((cause: unknown) => {
      if (active) setNameError(cause instanceof Error ? cause.message : "Không tải được tên tác giả.");
    });
    return () => { active = false; };
  }, [id, validId]);

  useEffect(() => {
    if (!search) return;
    let active = true;
    setLoading(true);
    setResults(undefined);
    setError("");
    catalogService.searchAuthors(search.keyword || undefined, { page: search.page, size: 8 }).then((data) => {
      if (active) setResults(data);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Không tìm được tác giả.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search]);

  function findAuthors() {
    setSearch({ keyword: keyword.trim(), page: 0 });
  }

  return <fieldset className="filter-group">
    <legend>Tác giả</legend>
    {value && <div>
      <p role={nameError || !validId ? "alert" : "status"}>
        {!validId ? "Mã tác giả không hợp lệ." : nameError || (author?.id === id ? author.name : "Đang tải tên tác giả…")}
      </p>
      <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>Bỏ chọn tác giả</Button>
    </div>}
    <Field label="Tên tác giả" value={keyword} onChange={(event) => {
      setKeyword(event.target.value);
      setSearch(undefined);
      setResults(undefined);
      setLoading(false);
      setError("");
    }} onKeyDown={(event) => {
      if (event.key === "Enter") { event.preventDefault(); findAuthors(); }
    }} />
    <Button type="button" variant="secondary" size="sm" onClick={findAuthors}>Tìm tác giả</Button>
    {loading && <p role="status">Đang tìm tác giả…</p>}
    {error && <p role="alert">{error} <Button type="button" onClick={() => search && setSearch({ ...search })}>Thử lại</Button></p>}
    {results && (results.items.length ? <>
      <ul>{results.items.map((item) => <li key={item.id}>
        <Button type="button" variant="ghost" size="sm" aria-pressed={item.id === id} onClick={() => onChange(String(item.id))}>{item.name}</Button>
      </li>)}</ul>
      <div aria-label="Phân trang tác giả">
        <Button type="button" size="sm" disabled={!results.hasPrevious} onClick={() => search && setSearch({ ...search, page: results.page - 1 })}>Trang trước</Button>{" "}
        <Button type="button" size="sm" disabled={!results.hasNext} onClick={() => search && setSearch({ ...search, page: results.page + 1 })}>Trang sau</Button>
      </div>
    </> : <p>Không tìm thấy tác giả.</p>)}
  </fieldset>;
}
