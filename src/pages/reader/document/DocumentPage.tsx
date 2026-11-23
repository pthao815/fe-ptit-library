import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button, Icon, IconButton } from "../../../design-system";
import { catalogService } from "../../../services/catalog.service";
import { searchService } from "../../../services/search.service";
import { tryRefreshAccessToken } from "../../../services/http";
import { getAccessToken } from "../../../services/session";
import type { DocumentDetailDto, DocumentMatchDto } from "../../../types/api";
import { httpStatusOf, openPdf, readOutline, type OutlineItem } from "./pdf";
import PdfPageView, { type HighlightBox } from "./PdfPageView";
import { exactPattern, extractPageText, findInPage, type ExactHit, type PageText } from "./textFind";

const ZOOM_LEVELS = [75, 100, 125, 150, 200];
const BASE_PAGE_WIDTH = 720; // bề rộng trang (px CSS) ở mức 100%
const MATCH_LIMIT = 20;
const EXACT_HIT_LIMIT = 500; // trần số kết quả khớp chính xác, tránh danh sách quá dài

type FindMode = "exact" | "content";

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
  // Kích thước gốc (điểm PDF) của từng trang, để dựng sẵn khung cho cả tài liệu
  const [pageSizes, setPageSizes] = useState<{ w: number; h: number }[]>([]);
  const [stageWidth, setStageWidth] = useState(0);
  const [stageEl, setStageEl] = useState<HTMLElement | null>(null);

  const [matches, setMatches] = useState<DocumentMatchDto[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [matchState, setMatchState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [activeMatch, setActiveMatch] = useState(-1);
  const [matchAttempt, setMatchAttempt] = useState(0);
  const [draft, setDraft] = useState(query);
  // Khớp chính xác (như Ctrl+F): tìm trên lớp chữ của PDF ngay trong trình duyệt
  const [findMode, setFindMode] = useState<FindMode>(query ? "content" : "exact");
  const [exactQuery, setExactQuery] = useState("");
  const [exactHits, setExactHits] = useState<ExactHit[]>([]);
  const [exactActive, setExactActive] = useState(-1);
  const [exactState, setExactState] = useState<{ status: "idle" | "indexing" | "done"; done: number; total: number; noText?: boolean }>({ status: "idle", done: 0, total: 0 });
  const pageTextsRef = useRef<(PageText | undefined)[]>([]);
  // Màn hình rộng: hai panel nằm cạnh trang và bật/tắt được. Mục lục tự ẩn nếu tài liệu không có mục lục.
  const [tocPref, setTocPref] = useState<boolean | null>(null);
  const [panelVisible, setPanelVisible] = useState(true);
  // Màn hình hẹp: hai panel thành ngăn kéo trượt ra
  const [tocOpen, setTocOpen] = useState(false);
  const [matchesOpen, setMatchesOpen] = useState(false);

  const stageRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);
  const sheetRefs = useRef<(HTMLDivElement | null)[]>([]);
  const currentPageRef = useRef(requestedPage);
  const positionedRef = useRef(false); // đã cuộn tới vị trí ban đầu chưa
  const revealActiveRef = useRef(false); // lần đổi đoạn khớp tới có cần cuộn tới nó không
  const pageCount = pdf?.numPages ?? 0;
  const zoom = ZOOM_LEVELS[zoomIndex];

  const attachStage = useCallback((element: HTMLElement | null) => { stageRef.current = element; setStageEl(element); }, []);

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
    setPageSizes([]);
    positionedRef.current = false;

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
        // Dựng khung theo trang đầu trước để hiện ngay, rồi đọc kích thước thật của mọi trang
        const first = (await loaded.getPage(1)).getViewport({ scale: 1 });
        if (!active) return;
        setPageSizes(Array.from({ length: loaded.numPages }, () => ({ w: first.width, h: first.height })));
        setPdf(loaded);
        setLoad({ status: "ready" });
        readOutline(loaded).then((items) => { if (active) setOutline(items); }).catch(() => undefined);
        const sizes: { w: number; h: number }[] = [];
        for (let page = 1; page <= loaded.numPages; page++) {
          const viewport = (await loaded.getPage(page)).getViewport({ scale: 1 });
          if (!active) return;
          sizes.push({ w: viewport.width, h: viewport.height });
        }
        if (sizes.some((size) => size.w !== first.width || size.h !== first.height)) setPageSizes(sizes);
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
        const page = currentPageRef.current;
        const onPage = items.findIndex((item) => item.pageNumber != null && item.pageNumber <= page && page <= (item.pageEnd ?? item.pageNumber));
        const first = onPage >= 0 ? onPage : items.length ? 0 : -1;
        // Cuộn tới đoạn khớp nếu nó nằm ở trang đang mở, hoặc khi không chỉ định trang cụ thể
        revealActiveRef.current = first >= 0 && (onPage >= 0 || !searchParams.get("page"));
        setMatches(items);
        setTerms(data.highlightTerms ?? []);
        setMatchState("done");
        setActiveMatch(first);
      })
      .catch(() => { if (active) { setMatches([]); setMatchState("error"); } });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ tải lại khi đổi tài liệu hoặc truy vấn
  }, [documentId, query, matchAttempt]);

  // Bề rộng khung đọc: màn hình hẹp hơn trang chuẩn thì 100% = vừa khít chiều ngang
  useEffect(() => {
    if (!stageEl || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setStageWidth(Math.floor(entry.contentRect.width)));
    observer.observe(stageEl);
    return () => observer.disconnect();
  }, [stageEl]);
  const fitWidth = stageWidth > 0 ? Math.min(BASE_PAGE_WIDTH, stageWidth) : BASE_PAGE_WIDTH;
  const pageWidth = Math.round((fitWidth * zoom) / 100);

  const syncPageParam = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("page") === String(page)) return;
    params.set("page", String(page));
    setSearchParams(params, { replace: true });
  };

  const markCurrentPage = (page: number) => {
    if (page === currentPageRef.current) return;
    currentPageRef.current = page;
    setCurrentPage(page);
    if (document.activeElement !== pageInputRef.current) setPageInput(String(page));
    syncPageParam(page);
  };

  const scrollToPage = (page: number) => {
    const stage = stageRef.current;
    const sheet = sheetRefs.current[page - 1];
    if (stage && sheet) stage.scrollTo({ top: sheet.offsetTop - 16 });
  };

  const goToPage = (page: number) => {
    const total = pdf?.numPages ?? Number.MAX_SAFE_INTEGER;
    const next = Math.min(Math.max(Math.round(page) || 1, 1), total);
    currentPageRef.current = next;
    setCurrentPage(next);
    setPageInput(String(next));
    setTocOpen(false);
    syncPageParam(next);
    scrollToPage(next);
  };

  // Trang đang xem = trang chứa điểm cách mép trên khung đọc khoảng 1/3 chiều cao
  const onStageScroll = () => {
    const stage = stageRef.current;
    const sheets = sheetRefs.current;
    if (!stage || !sheets.length) return;
    const probe = stage.scrollTop + stage.clientHeight / 3;
    let low = 0;
    let high = sheets.length - 1;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      if ((sheets[mid]?.offsetTop ?? Infinity) <= probe) low = mid; else high = mid - 1;
    }
    markCurrentPage(low + 1);
  };

  // Lần đầu dựng xong khung trang: cuộn tới trang được yêu cầu
  useLayoutEffect(() => {
    if (positionedRef.current || !pageSizes.length || !stageWidth) return;
    positionedRef.current = true;
    const page = Math.min(currentPageRef.current, pageSizes.length);
    if (page !== currentPageRef.current) { currentPageRef.current = page; setCurrentPage(page); setPageInput(String(page)); }
    scrollToPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSizes.length, stageWidth]);

  // Đổi mức phóng to: giữ nguyên trang đang đọc
  useLayoutEffect(() => {
    if (positionedRef.current) scrollToPage(currentPageRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageWidth]);

  // Đưa vùng tô sáng của đoạn được chọn vào giữa khung nhìn
  useEffect(() => {
    if (!revealActiveRef.current || !pageSizes.length || !stageWidth) return;
    let page: number | null | undefined;
    if (findMode === "exact") {
      if (exactActive < 0) return;
      page = exactHits[exactActive]?.page;
    } else {
      if (activeMatch < 0) return;
      const match = matches[activeMatch];
      page = match?.locations[0]?.page ?? match?.pageNumber;
    }
    revealActiveRef.current = false;
    if (page) scrollToPage(page);
    const target = stageRef.current?.querySelector<HTMLElement>(".pdf-highlight.active");
    if (target) target.scrollIntoView({ block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [findMode, activeMatch, matches, exactActive, exactHits, pageSizes.length, stageWidth]);

  const selectMatch = (index: number) => {
    if (!matches.length) return;
    revealActiveRef.current = true;
    setActiveMatch((index + matches.length) % matches.length);
    setMatchesOpen(false);
  };

  // Giữ thẻ kết quả đang chọn nằm trong vùng nhìn của danh sách (khi Enter / nút trước-sau)
  useEffect(() => {
    document.querySelector<HTMLElement>(".matches-panel .document-match-list > button.active")?.scrollIntoView({ block: "nearest" });
  }, [findMode, exactActive, activeMatch]);

  const selectExact = (index: number, closeDrawer = true) => {
    if (!exactHits.length) return;
    revealActiveRef.current = true;
    setExactActive((index + exactHits.length) % exactHits.length);
    if (closeDrawer) setMatchesOpen(false);
  };

  const setContentQuery = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set("q", value); else params.delete("q");
    setSearchParams(params, { replace: true });
  };

  // Khớp chính xác: Enter = kết quả sau, Shift+Enter = kết quả trước (như Ctrl+F). Theo nội dung: Enter = tìm.
  const submitSearch = (backwards = false) => {
    if (findMode === "exact") {
      if (draft.trim() !== exactQuery) setExactQuery(draft.trim());
      else selectExact(exactActive + (backwards ? -1 : 1), false);
      return;
    }
    setContentQuery(draft.trim());
  };

  // Xoá hẳn lượt tìm: ô nhập, kết quả, vùng tô sáng (và q trên URL ở chế độ theo nội dung)
  const clearSearch = () => {
    setDraft("");
    if (findMode === "exact") setExactQuery("");
    else setContentQuery("");
    searchInputRef.current?.focus();
  };

  const switchFindMode = (mode: FindMode) => {
    if (mode === findMode) return;
    setFindMode(mode);
    // Mang truy vấn đang gõ sang chế độ mới để khỏi gõ lại
    if (mode === "exact") setExactQuery(draft.trim());
    else if (draft.trim() && draft.trim() !== query) setContentQuery(draft.trim());
    searchInputRef.current?.focus();
  };

  // Khớp chính xác tìm ngay khi gõ (chờ người dùng ngừng gõ một chút)
  useEffect(() => {
    if (findMode !== "exact") return;
    const timer = window.setTimeout(() => setExactQuery(draft.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [draft, findMode]);

  // Đổi tài liệu thì bỏ bộ nhớ đệm chữ của tài liệu cũ
  useEffect(() => { pageTextsRef.current = []; }, [pdf]);

  // Quét lớp chữ từng trang (đọc một lần rồi giữ lại), gom mọi chỗ khớp theo thứ tự trang
  useEffect(() => {
    const pattern = exactPattern(exactQuery);
    if (!pdf || !pattern) {
      setExactHits([]); setExactActive(-1); setExactState({ status: "idle", done: 0, total: 0 });
      return;
    }
    let cancelled = false;
    (async () => {
      const total = pdf.numPages;
      const texts = pageTextsRef.current;
      const hits: ExactHit[] = [];
      let hasText = false;
      setExactState({ status: "indexing", done: 0, total });
      for (let page = 1; page <= total; page++) {
        if (!texts[page - 1]) {
          texts[page - 1] = await extractPageText(pdf, page);
          if (cancelled) return;
          if (page % 10 === 0) setExactState({ status: "indexing", done: page, total });
        }
        const pageText = texts[page - 1]!;
        if (pageText.text.trim()) hasText = true;
        if (hits.length < EXACT_HIT_LIMIT) hits.push(...findInPage(pageText, page, pattern, EXACT_HIT_LIMIT - hits.length));
      }
      if (cancelled) return;
      // Như Ctrl+F: bắt đầu từ kết quả đầu tiên kể từ trang đang đọc
      const fromHere = hits.findIndex((hit) => hit.page >= currentPageRef.current);
      revealActiveRef.current = hits.length > 0;
      setExactHits(hits);
      setExactActive(hits.length ? (fromHere >= 0 ? fromHere : 0) : -1);
      setExactState({ status: "done", done: total, total, noText: !hasText });
    })().catch(() => { if (!cancelled) setExactState({ status: "done", done: 0, total: 0 }); });
    return () => { cancelled = true; };
  }, [pdf, exactQuery]);

  // Ctrl+F mở ô khớp chính xác (Ctrl+F của trình duyệt không tìm được chữ vẽ trên canvas)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setFindMode("exact");
        if (window.matchMedia("(max-width: 1120px)").matches) { setTocOpen(false); setMatchesOpen(true); }
        else setPanelVisible(true);
        window.setTimeout(() => { searchInputRef.current?.focus(); searchInputRef.current?.select(); }, 60);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Vùng tô sáng nhóm theo trang (toạ độ theo tỉ lệ trang nên không phụ thuộc mức phóng to)
  const highlightsByPage = useMemo(() => {
    const byPage = new Map<number, HighlightBox[]>();
    if (findMode === "exact") {
      exactHits.forEach((hit, index) => hit.boxes.forEach((box, boxIndex) => {
        const list = byPage.get(hit.page) ?? [];
        list.push({ key: `x${index}-${boxIndex}`, active: index === exactActive, ...box });
        byPage.set(hit.page, list);
      }));
      return byPage;
    }
    matches.forEach((match, index) => match.locations
      .filter((loc) => loc.pageWidth > 0 && loc.pageHeight > 0)
      .forEach((loc) => loc.rects.forEach((rect, rectIndex) => {
        const list = byPage.get(loc.page) ?? [];
        list.push({
          key: `${index}-${loc.wordStart}-${rectIndex}`,
          active: index === activeMatch,
          left: (rect[0] / loc.pageWidth) * 100,
          top: (rect[1] / loc.pageHeight) * 100,
          width: ((rect[2] - rect[0]) / loc.pageWidth) * 100,
          height: ((rect[3] - rect[1]) / loc.pageHeight) * 100,
        });
        byPage.set(loc.page, list);
      })));
    return byPage;
  }, [findMode, exactHits, exactActive, matches, activeMatch]);

  const close = () => {
    if (location.key !== "default") navigate(-1);
    else navigate(`/reader/book-detail?id=${encodeURIComponent(documentId)}`);
  };
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  // Điểm ngắt khớp với CSS: <=780px mục lục là ngăn kéo, <=1120px panel tìm kiếm là ngăn kéo
  const isNarrow = (maxWidth: number) => window.matchMedia(`(max-width: ${maxWidth}px)`).matches;
  const tocVisible = tocPref ?? outline.length > 0;
  const toggleToc = () => {
    if (isNarrow(780)) { setMatchesOpen(false); setTocOpen((open) => !open); }
    else setTocPref(!tocVisible);
  };
  const toggleSearchPanel = () => {
    const opening = isNarrow(1120) ? !matchesOpen : !panelVisible;
    if (isNarrow(1120)) { setTocOpen(false); setMatchesOpen(opening); }
    else setPanelVisible(opening);
    if (opening) window.setTimeout(() => searchInputRef.current?.focus(), 60);
  };
  const searchPanelShown = isNarrow(1120) ? matchesOpen : panelVisible;

  const title = detail?.title || "Tài liệu số";
  const subtitle = [detail?.authors?.join(", "), detail?.publicationYear].filter(Boolean).join(" · ");
  const activeChapter = outline.reduce<OutlineItem | null>((found, item) => (item.page && item.page <= currentPage ? item : found), null);
  const activeHighlighted = activeMatch >= 0 && Boolean(matches[activeMatch]?.locations.some((loc) => loc.rects.length > 0));

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
          <IconButton label="Quay lại" icon="arrow-left" onClick={close} />
          <span className="reader-doc-icon"><Icon name="document" size={18} /></span>
          <div><strong title={title}>{title}</strong>{subtitle && <small>{subtitle}</small>}</div>
        </div>

        <div className="reader-toolbar-center">
          <div className="page-control">
            <IconButton label="Trang trước" icon="chevron-left" disabled={!pdf || currentPage <= 1} onClick={() => goToPage(currentPage - 1)} />
            <label>
              <input
                ref={pageInputRef}
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
          <button type="button" className={`reader-toggle ${tocVisible || tocOpen ? "on" : ""}`} aria-pressed={tocVisible || tocOpen} onClick={toggleToc}>
            <Icon name="menu" size={17} /><span>Mục lục</span>
          </button>
          <button type="button" className={`reader-toggle ${searchPanelShown ? "on" : ""}`} aria-pressed={searchPanelShown} onClick={toggleSearchPanel}>
            <Icon name="search" size={17} /><span>Tìm trong tài liệu</span>
            {findMode === "exact"
              ? exactHits.length > 0 && <em>{exactHits.length >= EXACT_HIT_LIMIT ? `${EXACT_HIT_LIMIT}+` : exactHits.length}</em>
              : query && matches.length > 0 && <em>{matches.length}</em>}
          </button>
          <IconButton className="reader-fullscreen" label="Toàn màn hình" icon="maximize" onClick={toggleFullscreen} />
        </div>
      </header>

      <div className={`reader-workspace ${tocVisible ? "" : "toc-hidden"} ${panelVisible ? "" : "panel-hidden"}`}>
        <aside className={`toc-panel ${tocOpen ? "mobile-open" : ""}`}>
          <div className="reader-panel-heading">
            <strong>Mục lục</strong>
            <IconButton label="Đóng mục lục" icon="close" onClick={() => { setTocOpen(false); setTocPref(false); }} />
          </div>
          <nav aria-label="Mục lục tài liệu">
            {outline.length > 0
              ? <div className="toc-group">{renderOutline(outline)}</div>
              : <p className="reader-panel-empty">{load.status === "ready" ? "Tài liệu này không có mục lục nhúng. Hãy nhập số trang trên thanh công cụ hoặc tìm trong tài liệu để di chuyển." : "Đang đọc mục lục…"}</p>}
          </nav>
        </aside>

        <main className="document-stage" ref={attachStage} onScroll={onStageScroll}>
          {load.status === "error" ? (
            <div className="reader-state">
              <span className="reader-state-icon"><Icon name={load.kind === "missing" ? "document" : "error"} size={26} /></span>
              <h2>{load.kind === "auth" ? "Cần đăng nhập" : load.kind === "missing" ? "Chưa có bản số" : "Không mở được tài liệu"}</h2>
              <p>{load.message}</p>
              <div>
                {load.kind === "auth" && <Button onClick={() => navigate("/login", { state: { returnTo: location.pathname + location.search } })}>Đăng nhập</Button>}
                {load.kind === "failed" && <Button onClick={() => navigate(0)}>Thử lại</Button>}
                <Button variant="secondary" onClick={() => navigate(`/reader/book-detail?id=${encodeURIComponent(documentId)}`)}>Về trang chi tiết</Button>
              </div>
            </div>
          ) : (
            <div className="pdf-pages">
              {pdf && pageSizes.length ? pageSizes.map((size, index) => (
                <PdfPageView
                  key={index}
                  pdf={pdf}
                  pageNumber={index + 1}
                  width={pageWidth}
                  height={Math.round((pageWidth * size.h) / size.w)}
                  root={stageEl}
                  highlights={highlightsByPage.get(index + 1) ?? []}
                  sheetRef={(element) => { sheetRefs.current[index] = element; }}
                />
              )) : (
                <div className="pdf-sheet" style={{ width: pageWidth, height: Math.round(pageWidth * 1.414) }}>
                  <div className="pdf-sheet-loading">
                    <span className="spinner" />
                    <span>{load.status === "loading" && load.progress != null ? `Đang tải tài liệu… ${load.progress}%` : "Đang mở tài liệu…"}</span>
                    {load.status === "loading" && load.progress != null && <i style={{ width: `${load.progress}%` }} />}
                  </div>
                </div>
              )}
              <p className="pdf-caption">
                <span><Icon name="shield" size={14} />Chỉ xem trực tuyến · Tài liệu được bảo vệ bản quyền</span>
              </p>
            </div>
          )}
        </main>

        <aside className={`matches-panel ${matchesOpen ? "mobile-open" : ""}`}>
          <div className="reader-panel-heading">
            <strong>Tìm trong tài liệu</strong>
            <IconButton label="Đóng tìm kiếm" icon="close" onClick={() => { setMatchesOpen(false); setPanelVisible(false); }} />
          </div>
          <div className="find-tabs" role="tablist" aria-label="Cách tìm">
            <button type="button" role="tab" aria-selected={findMode === "exact"} className={findMode === "exact" ? "active" : ""} onClick={() => switchFindMode("exact")}>Khớp chính xác</button>
            <button type="button" role="tab" aria-selected={findMode === "content"} className={findMode === "content" ? "active" : ""} onClick={() => switchFindMode("content")}>Theo nội dung</button>
          </div>
          <form className="document-search" role="search" onSubmit={(event) => { event.preventDefault(); submitSearch(); }}>
            <Icon name="search" size={17} />
            <input
              ref={searchInputRef}
              value={draft}
              placeholder={findMode === "exact" ? "Gõ từ hoặc cụm từ cần tìm…" : "Từ khóa hoặc mô tả nội dung…"}
              aria-label="Tìm trong tài liệu"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && event.shiftKey) { event.preventDefault(); submitSearch(true); }
                else if (event.key === "Escape" && draft) { event.preventDefault(); clearSearch(); }
              }}
            />
            {(draft || (findMode === "content" && query)) && <button type="button" className="document-search-clear" aria-label="Xóa tìm kiếm" title="Xóa tìm kiếm (Esc)" onClick={clearSearch}><Icon name="close" size={14} /></button>}
          </form>
          <p className="find-hint">
            {findMode === "exact"
              ? <>Tìm đúng từng chữ, không phân biệt hoa thường. <kbd>Enter</kbd> kết quả sau · <kbd>Shift</kbd>+<kbd>Enter</kbd> kết quả trước</>
              : <>Xếp hạng các đoạn liên quan nhất theo nội dung. Nhấn <kbd>Enter</kbd> để tìm.</>}
          </p>

          {findMode === "exact" ? (
            exactQuery ? <>
              <div className="match-status">
                <span>
                  {exactState.status === "indexing" ? `Đang đọc chữ của tài liệu… ${exactState.done}/${exactState.total} trang`
                    : exactState.noText ? "Tài liệu không có lớp chữ (bản scan) nên không tìm chính xác được."
                    : exactHits.length ? <><strong>{exactActive + 1}</strong> / {exactHits.length}{exactHits.length >= EXACT_HIT_LIMIT ? "+" : ""} kết quả</>
                    : "Không tìm thấy trong tài liệu."}
                </span>
                <IconButton label="Kết quả trước" icon="chevron-left" disabled={exactHits.length < 2} onClick={() => selectExact(exactActive - 1, false)} />
                <IconButton label="Kết quả sau" icon="chevron-right" disabled={exactHits.length < 2} onClick={() => selectExact(exactActive + 1, false)} />
              </div>
              {exactState.status === "indexing" && <div className="find-progress"><i style={{ width: `${exactState.total ? (exactState.done / exactState.total) * 100 : 0}%` }} /></div>}
              <div className="document-match-list exact-hit-list">
                {exactHits.map((hit, index) => (
                  <button key={`${hit.page}-${index}`} className={index === exactActive ? "active" : ""} onClick={() => selectExact(index)}>
                    <span className="match-card-head">
                      <span className="match-page">Trang {hit.page}</span>
                    </span>
                    <blockquote>{hit.before}<mark>{hit.match}</mark>{hit.after}</blockquote>
                  </button>
                ))}
              </div>
            </> : (
              <p className="reader-panel-empty">Gõ một từ hoặc cụm từ để liệt kê <strong>mọi chỗ xuất hiện</strong> trong tài liệu theo thứ tự trang, tô sáng ngay trên trang. Mẹo: nhấn <kbd>Ctrl</kbd>+<kbd>F</kbd> để mở nhanh ô này.</p>
            )
          ) : query ? <>
            <div className="match-status">
              <span>
                {matchState === "loading" ? "Đang tìm các đoạn phù hợp…"
                  : matchState === "error" ? "Không tải được đoạn khớp."
                  : matches.length ? <><strong>{activeMatch + 1}</strong> / {matches.length} đoạn phù hợp</>
                  : "Không có đoạn nào phù hợp."}
              </span>
              <IconButton label="Đoạn trước" icon="chevron-left" disabled={matches.length < 2} onClick={() => selectMatch(activeMatch - 1)} />
              <IconButton label="Đoạn sau" icon="chevron-right" disabled={matches.length < 2} onClick={() => selectMatch(activeMatch + 1)} />
            </div>
            {matchState === "error" && <div className="match-retry"><Button variant="secondary" size="sm" onClick={() => setMatchAttempt((n) => n + 1)}>Thử lại</Button></div>}
            <div className="document-match-list">
              {matches.map((match, index) => (
                <button key={match.chunkIds.join("-") || index} className={index === activeMatch ? "active" : ""} onClick={() => selectMatch(index)}>
                  <span className="match-card-head">
                    <span className="match-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="match-page">Trang {matchLabel(match)}</span>
                    {index === activeMatch && activeHighlighted && <span className="match-live"><Icon name="success" size={13} />Đang tô sáng</span>}
                  </span>
                  <blockquote>{highlight(match.snippet || "", terms)}</blockquote>
                  {(match.chapter || match.section) && (
                    <span className="match-where">
                      {[match.chapter, match.section].filter(Boolean).map((part) => part!.normalize("NFC")).join(" › ")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </> : (
            <p className="reader-panel-empty">Nhập từ khóa, câu hỏi hoặc mô tả rồi nhấn <kbd>Enter</kbd>. Hệ thống trả về những đoạn <strong>liên quan nhất</strong> (tối đa {MATCH_LIMIT}) và tô sáng ngay trên trang.</p>
          )}
        </aside>
      </div>
      {(tocOpen || matchesOpen) && <button className="reader-mobile-scrim" aria-label="Đóng bảng điều khiển" onClick={() => { setTocOpen(false); setMatchesOpen(false); }} />}
    </div>
  );
}
