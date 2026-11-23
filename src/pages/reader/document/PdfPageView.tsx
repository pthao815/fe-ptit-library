import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

export interface HighlightBox {
  key: string;
  active: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Một trang PDF trong chế độ cuộn liên tục. Khung trang luôn giữ đúng kích thước để thanh cuộn chính xác,
 * nhưng chỉ vẽ canvas khi trang ở gần vùng nhìn thấy; ra xa thì giải phóng canvas để tiết kiệm bộ nhớ.
 */
export default function PdfPageView({
  pdf,
  pageNumber,
  width,
  height,
  root,
  highlights,
  sheetRef,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  height: number;
  root: HTMLElement | null;
  highlights: HighlightBox[];
  sheetRef: (element: HTMLDivElement | null) => void;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);
  const [status, setStatus] = useState<"idle" | "rendering" | "done" | "error">("idle");

  // Theo dõi trang có ở gần vùng nhìn thấy không (đệm khoảng một màn hình phía trên và dưới)
  useEffect(() => {
    const element = boxRef.current;
    if (!element || !root || typeof IntersectionObserver === "undefined") { setNear(true); return; }
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { root, rootMargin: "100% 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [root]);

  // Vẽ trang lên canvas theo mật độ điểm ảnh của màn hình; rời xa thì xoá canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!near) {
      canvas.width = 0;
      canvas.height = 0;
      setStatus("idle");
      return;
    }
    let cancelled = false;
    let task: RenderTask | null = null;
    setStatus("rendering");
    (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;
      const unit = page.getViewport({ scale: 1 });
      const ratio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: (width / unit.width) * ratio });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      task = page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport });
      await task.promise;
      if (!cancelled) setStatus("done");
    })().catch((error: unknown) => {
      if (!cancelled && (error as { name?: string })?.name !== "RenderingCancelledException") setStatus("error");
    });
    return () => { cancelled = true; task?.cancel(); };
  }, [pdf, pageNumber, width, near]);

  return (
    <div
      ref={(element) => { boxRef.current = element; sheetRef(element); }}
      className="pdf-sheet"
      data-page={pageNumber}
      style={{ width, height }}
    >
      <canvas ref={canvasRef} aria-label={`Trang ${pageNumber}`} style={{ width, height }} />
      {highlights.map((box) => (
        <span key={box.key} className={`pdf-highlight ${box.active ? "active" : ""}`} style={{ left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` }} />
      ))}
      {status !== "done" && (
        <div className={`pdf-page-placeholder ${status === "error" ? "error" : ""}`}>
          {status === "error" ? "Không hiển thị được trang này." : <span className="spinner" />}
        </div>
      )}
      <span className="pdf-page-number">{pageNumber}</span>
    </div>
  );
}
