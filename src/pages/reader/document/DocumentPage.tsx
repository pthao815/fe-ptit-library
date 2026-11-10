import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { Button, Icon, IconButton } from "../../../design-system";
import { catalogService } from "../../../services/catalog.service";
import { searchService } from "../../../services/search.service";
import { tryRefreshAccessToken } from "../../../services/http";
import { getAccessToken } from "../../../services/session";
import type { DocumentDetailDto, DocumentMatchDto } from "../../../types/api";
import { httpStatusOf, openPdf, readOutline, type OutlineItem } from "./pdf";

const ZOOM_LEVELS = [75, 100, 125, 150, 200];
const BASE_PAGE_WIDTH = 720; // bề rộng trang (px CSS) ở mức 100%
const MATCH_LIMIT = 20;

type LoadState =
  | { status: "loading"; progress: number | null }
  | { status: "ready" }
  | { status: "error"; kind: "auth" | "missing" | "failed"; message: string };

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Đoạn trích từ backend đã đánh dấu từ khớp bằng <mark>…</mark>: tách thành phần tử React
 * (không dùng innerHTML). Đoạn không có thẻ thì tự tô các từ khóa.
 */
function highlight(raw: string, terms: string[]): ReactNode {
  // Gộp chữ tổ hợp (NFD) về dạng dựng sẵn để dấu tiếng Việt hiển thị liền
  const snippet = raw.normalize("NFC");
  if (snippet.includes("<mark>")) {
    return snippet.split(/<mark>([\s\S]*?)<\/mark>/g).map((part, index) => {
      const text = part.replace(/<[^>]+>/g, "");
      return index % 2 === 1 ? <mark key={index}>{text}</mark> : <Fragment key={index}>{text}</Fragment>;
    });
  }
  const words = terms.map((term) => term.trim()).filter((term) => term.length > 1);
  if (!words.length) return snippet;
  const pattern = new RegExp(`(${words.sort((x, y) => y.length - x.length).map(escapeRegExp).join("|")})`, "giu");
  return snippet.split(pattern).map((part, index) => (index % 2 === 1 ? <mark key={index}>{part}</mark> : <Fragment key={index}>{part}</Fragment>));
}

function matchLabel(match: DocumentMatchDto) {
  if (!match.pageNumber) return "—";
  return match.pageEnd && match.pageEnd !== match.pageNumber ? `${match.pageNumber}–${match.pageEnd}` : String(match.pageNumber);
}

export default function DocumentReader({ documentId }: { documentId: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() || "";
  const requestedPage = Number(searchParams.get("page")) || 1;

  const [detail, setDetail] = useState<DocumentDetailDto | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [load, setLoad] = useState<LoadState>({ status: "loading", progress: null });
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [currentPage, setCurrentPage] = useState(requestedPage);
  const [pageInput, setPageInput] = useState(String(requestedPage));
  const [zoomIndex, setZoomIndex] = useState(1);
  const [pageBox, setPageBox] = useState<{ width: number; height: number } | null>(null);
  const [renderError, setRenderError] = useState("");

  const [matches, setMatches] = useState<DocumentMatchDto[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [matchState, setMatchState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [activeMatch, setActiveMatch] = useState(-1);
  const [matchAttempt, setMatchAttempt] = useState(0);
  const [searchOpen, setSearchOpen] = useState(Boolean(query));
  const [draft, setDraft] = useState(query);
  const [tocOpen, setTocOpen] = useState(false);
  const [matchesOpen, setMatchesOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const pageCount = pdf?.numPages ?? 0;
  const zoom = ZOOM_LEVELS[zoomIndex];

  // Thông tin biểu ghi cho thanh tiêu đề (không chặn việc đọc nếu lỗi)
  useEffect(() => {
    let active = true;
    catalogService.getDocumentDetails(documentId).then((data) => { if (active) setDetail(data); }).catch(() => undefined);
    return () => { active = false; };
  }, [documentId]);

  // Tải PDF; token hết hạn thì làm mới một lần rồi thử lại
  useEffect(() => {
    let active = true;
    let task: ReturnType<typeof openPdf> | null = null;
    setLoad({ status: "loading", progress: null });
    setPdf(null);

    const start = async (token: string | null, retried: boolean): Promise<void> => {
      if (!token) {
        setLoad({ status: "error", kind: "auth", message: "Bạn cần đăng nhập để đọc tài liệu số." });
        return;
      }
      task = openPdf(searchService.getReadUrl(documentId), token);
      task.onProgress = ({ loaded: done, total }: { loaded: number; total: number }) => {
        if (active && total > 0) setLoad({ status: "loading", progress: Math.min(99, Math.round((done / total) * 100)) });
      };
      try {
        const loaded = await task.promise;
        if (!active) return;
        setPdf(loaded);
        setLoad({ status: "ready" });
        readOutline(loaded).then((items) => { if (active) setOutline(items); }).catch(() => undefined);
      } catch (error) {
        if (!active) return;
        const status = httpStatusOf(error);
        if (status === 401 && !retried) {
          await start(await tryRefreshAccessToken(), true);
        } else if (status === 401 || status === 403) {
          setLoad({ status: "error", kind: "auth", message: "Phiên đăng nhập đã hết hạn hoặc tài khoản không có quyền đọc tài liệu này." });
        } else if (status === 404 || status === 400) {
          setLoad({ status: "error", kind: "missing", message: "Tài liệu này chưa có bản số để đọc trực tuyến." });
        } else {
          setLoad({ status: "error", kind: "failed", message: "Không tải được tài liệu. Kiểm tra kết nối rồi thử lại." });
        }
      }
    };
    void start(getAccessToken(), false);
    return () => {
      active = false;
      void task?.destroy(); // huỷ tải và giải phóng tài liệu đã mở
    };
  }, [documentId]);

  // Đoạn khớp với truy vấn (từ trang tìm kiếm hoặc ô tìm trong tài liệu)
  useEffect(() => {
    if (!query) {
      setMatches([]); setTerms([]); setActiveMatch(-1); setMatchState("idle");
      return;
    }
    let active = true;
    setMatchState("loading");
    searchService.getDocumentMatches(documentId, query, MATCH_LIMIT)
      .then((data) => {
        if (!active) return;
        const items = data.matches ?? [];
        setMatches(items);
        setTerms(data.highlightTerms ?? []);
        setMatchState("done");
        const onPage = items.findIndex((item) => item.pageNumber != null && item.pageNumber <= currentPage && currentPage <= (item.pageEnd ?? item.pageNumber));
        const first = onPage >= 0 ? onPage : items.length ? 0 : -1;
        setActiveMatch(first);
        if (onPage < 0 && first >= 0 && !searchParams.get("page") && items[first].pageNumber) goToPage(items[first].pageNumber!);
      })
      .catch(() => { if (active) { setMatches([]); setMatchState("error"); } });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ tải lại khi đổi tài liệu hoặc truy vấn
  }, [documentId, query, matchAttempt]);

  // Vẽ trang hiện tại lên canvas, nét theo mật độ điểm ảnh của màn hình
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    let cancelled = false;
    let task: RenderTask | null = null;
    setRenderError("");
    (async () => {
      const page = await pdf.getPage(currentPage);
      if (cancelled || !canvasRef.current) return;
      const cssWidth = (BASE_PAGE_WIDTH * zoom) / 100;
      const unit = page.getViewport({ scale: 1 });
      const ratio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: (cssWidth / unit.width) * ratio });
      const canvas = canvasRef.current;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const box = { width: cssWidth, height: viewport.height / ratio };
      canvas.style.width = `${box.width}px`;
      canvas.style.height = `${box.height}px`;
      setPageBox(box);
      task = page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport });
      await task.promise;
    })().catch((error: unknown) => {
      if (!cancelled && (error as { name?: string })?.name !== "RenderingCancelledException") setRenderError("Không hiển thị được trang này.");
    });
    return () => { cancelled = true; task?.cancel(); };
  }, [pdf, currentPage, zoom]);

  // Đưa vùng tô sáng của đoạn đang chọn vào giữa khung nhìn
  useEffect(() => {
    const target = stageRef.current?.querySelector<HTMLElement>(".pdf-highlight.active");
    if (target) target.scrollIntoView({ block: "center", behavior: "smooth" });
    else stageRef.current?.scrollTo({ top: 0 });
  }, [pageBox, activeMatch, currentPage]);

  const goToPage = (page: number) => {
    const total = pdf?.numPages ?? Number.MAX_SAFE_INTEGER;
    const next = Math.min(Math.max(Math.round(page) || 1, 1), total);
    setCurrentPage(next);
    setPageInput(String(next));
    setTocOpen(false);
    const params = new URLSearchParams(searchParams);
    params.set("page", String(next));
    setSearchParams(params, { replace: true });
  };

  // Giữ trang trong giới hạn khi biết tổng số trang
  useEffect(() => {
    if (pageCount && currentPage > pageCount) goToPage(pageCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount]);

  const selectMatch = (index: number) => {
    if (!matches.length) return;
    const next = (index + matches.length) % matches.length;
    setActiveMatch(next);
    setMatchesOpen(false);
    const page = matches[next].locations[0]?.page ?? matches[next].pageNumber;
    if (page) goToPage(page);
  };

  const submitSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (draft.trim()) params.set("q", draft.trim()); else params.delete("q");
    setSearchParams(params, { replace: true });
  };

  const highlights = useMemo(() => matches.flatMap((match, index) =>
    match.locations
      .filter((loc) => loc.page === currentPage && loc.pageWidth > 0 && loc.pageHeight > 0)
      .flatMap((loc) => loc.rects.map((rect, rectIndex) => ({
        key: `${index}-${loc.wordStart}-${rectIndex}`,
        active: index === activeMatch,
        left: (rect[0] / loc.pageWidth) * 100,
        top: (rect[1] / loc.pageHeight) * 100,
        width: ((rect[2] - rect[0]) / loc.pageWidth) * 100,
        height: ((rect[3] - rect[1]) / loc.pageHeight) * 100,
      })))), [matches, currentPage, activeMatch]);

  const close = () => {
    if (location.key !== "default") navigate(-1);
    else navigate(`/reader/book-detail?id=${encodeURIComponent(documentId)}`);
  };
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  const title = detail?.title || "Tài liệu số";
  const subtitle = [detail?.authors?.join(", "), detail?.publicationYear].filter(Boolean).join(" · ");
  const activeChapter = outline.reduce<OutlineItem | null>((found, item) => (item.page && item.page <= currentPage ? item : found), null);

  const renderOutline = (items: OutlineItem[], nested = false) => items.map((item, index) => (
    <Fragment key={`${item.title}-${index}`}>
      <button
        className={`${nested ? "toc-section" : ""} ${(nested ? item.page === currentPage : item === activeChapter) ? "active" : ""}`.trim()}
        disabled={!item.page}
        onClick={() => item.page && goToPage(item.page)}
      ><span>{item.title}</span><small>{item.page ?? ""}</small></button>
      {item.children.length > 0 && renderOutline(item.children, true)}
    </Fragment>
  ));

  return (
    <div className="document-reader">
      <header className="reader-toolbar">
        <div className="reader-document-identity">
          <span><Icon name="document" /></span>
          <div><strong title={title}>{title}</strong>{subtitle && <small>{subtitle}</small>}</div>
        </div>
        <div className="reader-toolbar-center">
          <div className="page-control">
            <IconButton label="Trang trước" icon="chevron-left" disabled={!pdf || currentPage <= 1} onClick={() => goToPage(currentPage - 1)} />
            <label>
              <input
                aria-label="Trang hiện tại"
                inputMode="numeric"
                value={pageInput}
                disabled={!pdf}
                onChange={(event) => setPageInput(event.target.value.replace(/\D/g, ""))}
                onBlur={() => goToPage(Number(pageInput))}
                onKeyDown={(event) => event.key === "Enter" && goToPage(Number(pageInput))}
              />
              <span>/ {pageCount || "…"}</span>
            </label>
            <IconButton label="Trang sau" icon="chevron-right" disabled={!pdf || currentPage >= pageCount} onClick={() => goToPage(currentPage + 1)} />
          </div>
          <span className="toolbar-separator" />
          <div className="zoom-control">
            <IconButton label="Thu nhỏ" icon="zoom-out" disabled={zoomIndex === 0} onClick={() => setZoomIndex(zoomIndex - 1)} />
            <span>{zoom}%</span>
            <IconButton label="Phóng to" icon="zoom-in" disabled={zoomIndex === ZOOM_LEVELS.length - 1} onClick={() => setZoomIndex(zoomIndex + 1)} />
          </div>
        </div>
        <div className="reader-toolbar-actions">
          <IconButton label="Tìm trong tài liệu" icon="search" onClick={() => setSearchOpen(!searchOpen)} />
          <IconButton label="Toàn màn hình" icon="maximize" onClick={toggleFullscreen} />
          <IconButton label="Đóng tài liệu" icon="close" onClick={close} />
        </div>
      </header>

      {searchOpen && (
        <div className="document-search-bar">
          <Icon name="search" size={17} />
          <input
            autoFocus
            value={draft}
            placeholder="Tìm từ khóa hoặc mô tả nội dung trong tài liệu…"
            aria-label="Tìm trong tài liệu"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && submitSearch()}
          />
          <span>{matchState === "loading" ? "Đang tìm…" : matchState === "error" ? "Lỗi tìm kiếm" : query ? `${matches.length ? activeMatch + 1 : 0}/${matches.length} kết quả` : ""}</span>
          <IconButton label="Kết quả trước" icon="chevron-left" disabled={matches.length < 2} onClick={() => selectMatch(activeMatch - 1)} />
          <IconButton label="Kết quả sau" icon="chevron-right" disabled={matches.length < 2} onClick={() => selectMatch(activeMatch + 1)} />
          <IconButton label="Đóng tìm kiếm" icon="close" onClick={() => setSearchOpen(false)} />
        </div>
      )}

      <div className="reader-workspace">
        <aside className={`toc-panel ${tocOpen ? "mobile-open" : ""}`}>
          <div className="reader-panel-heading"><div><p>MỤC LỤC</p><strong>Nội dung tài liệu</strong></div><IconButton label="Đóng mục lục" icon="close" onClick={() => setTocOpen(false)} /></div>
          <nav aria-label="Mục lục tài liệu">
            {outline.length > 0
              ? <div className="toc-group">{renderOutline(outline)}</div>
              : <p className="reader-panel-empty">{load.status === "ready" ? "Tài liệu không có mục lục nhúng. Dùng ô số trang hoặc tìm trong tài liệu để di chuyển." : "Đang đọc mục lục…"}</p>}
          </nav>
          <div className="online-only"><Icon name="info" size={15} /><span><strong>Chỉ được xem trực tuyến</strong><small>Tài liệu được bảo vệ bản quyền</small></span></div>
        </aside>

        <main className="document-stage" ref={stageRef}>
          <div className="mobile-reader-controls">
            <Button variant="secondary" size="sm" icon="menu" onClick={() => setTocOpen(true)}>Mục lục</Button>
            <Button variant="secondary" size="sm" icon="sparkle" onClick={() => setMatchesOpen(true)}>Đoạn khớp</Button>
          </div>

          {load.status === "error" ? (
            <div className="reader-state">
              <Icon name={load.kind === "missing" ? "document" : "error"} size={28} />
              <h2>{load.kind === "auth" ? "Cần đăng nhập" : load.kind === "missing" ? "Chưa có bản số" : "Không mở được tài liệu"}</h2>
              <p>{load.message}</p>
              <div>
                {load.kind === "auth" && <Button onClick={() => navigate("/login", { state: { returnTo: location.pathname + location.search } })}>Đăng nhập</Button>}
                {load.kind === "failed" && <Button onClick={() => navigate(0)}>Thử lại</Button>}
                <Button variant="secondary" onClick={() => navigate(`/reader/book-detail?id=${encodeURIComponent(documentId)}`)}>Về trang chi tiết</Button>
              </div>
            </div>
          ) : (
            <div className="pdf-sheet" style={pageBox ? { width: pageBox.width, height: pageBox.height } : { width: (BASE_PAGE_WIDTH * zoom) / 100 }}>
              <canvas ref={canvasRef} aria-label={`Trang ${currentPage}`} />
              {highlights.map((box) => (
                <span key={box.key} className={`pdf-highlight ${box.active ? "active" : ""}`} style={{ left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` }} />
              ))}
              {(load.status === "loading" || !pageBox) && (
                <div className="pdf-sheet-loading"><span className="spinner" />{load.status === "loading" && load.progress != null ? `Đang tải ${load.progress}%` : "Đang mở tài liệu…"}</div>
              )}
              {renderError && <div className="pdf-sheet-loading">{renderError}</div>}
            </div>
          )}
        </main>

        <aside className={`matches-panel ${matchesOpen ? "mobile-open" : ""}`}>
          <div className="reader-panel-heading"><div><p>TÌM KIẾM NỘI DUNG</p><strong>Đoạn nội dung khớp</strong></div><IconButton label="Đóng đoạn khớp" icon="close" onClick={() => setMatchesOpen(false)} /></div>
          {query ? <>
            <div className="match-query"><Icon name="search" size={15} /><span>“{query}”</span></div>
            <p className="match-count">{matchState === "loading" ? "Đang tìm các đoạn phù hợp…" : matchState === "error" ? "Không tải được đoạn khớp." : `${matches.length} đoạn phù hợp trong tài liệu`}</p>
            {matchState === "error" && <div className="match-retry"><Button variant="secondary" size="sm" onClick={() => setMatchAttempt((n) => n + 1)}>Thử lại</Button></div>}
            <div className="document-match-list">
              {matches.map((match, index) => (
                <button key={match.chunkIds.join("-") || index} className={index === activeMatch ? "active" : ""} onClick={() => selectMatch(index)}>
                  <span className="match-index">{String(index + 1).padStart(2, "0")}</span>
                  <blockquote>{highlight(match.snippet || "", terms)}</blockquote>
                  <dl>
                    <div><dt>Trang</dt><dd>{matchLabel(match)}</dd></div>
                    {match.chapter && <div><dt>Chương</dt><dd>{match.chapter.normalize("NFC")}</dd></div>}
                    {match.section && <div><dt>Mục</dt><dd>{match.section.normalize("NFC")}</dd></div>}
                  </dl>
                </button>
              ))}
            </div>
          </> : (
            <p className="reader-panel-empty">Nhập nội dung vào ô <strong>Tìm trong tài liệu</strong> (biểu tượng kính lúp) để xem các đoạn khớp và vị trí của chúng.</p>
          )}
          {activeMatch >= 0 && highlights.some((box) => box.active) && (
            <div className="active-match-note"><Icon name="success" size={16} /><span>Đang tô sáng đoạn khớp trên trang {currentPage}</span></div>
          )}
        </aside>
      </div>
      {(tocOpen || matchesOpen) && <button className="reader-mobile-scrim" aria-label="Đóng bảng điều khiển" onClick={() => { setTocOpen(false); setMatchesOpen(false); }} />}
    </div>
  );
}
