import { getDocument, GlobalWorkerOptions, type PDFDocumentLoadingTask, type PDFDocumentProxy } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerUrl;

export interface OutlineItem {
  title: string;
  page: number | null;
  children: OutlineItem[];
}

/**
 * Mở PDF qua API đọc trực tuyến. CORS của backend chưa cho phép header Range nên tải cả file
 * (disableRange) thay vì từng khúc; thanh tiến độ dựa trên onProgress.
 */
export function openPdf(url: string, token: string | null): PDFDocumentLoadingTask {
  return getDocument({
    url,
    httpHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
    disableRange: true,
  });
}

type RawOutline = Awaited<ReturnType<PDFDocumentProxy["getOutline"]>>;

/** Mục lục nhúng trong PDF (bookmark), đổi đích đến thành số trang; chỉ lấy 2 cấp cho gọn. */
export async function readOutline(pdf: PDFDocumentProxy): Promise<OutlineItem[]> {
  const outline = await pdf.getOutline();
  if (!outline?.length) return [];

  const pageOf = async (dest: RawOutline[number]["dest"]): Promise<number | null> => {
    try {
      const explicit = typeof dest === "string" ? await pdf.getDestination(dest) : dest;
      const ref = Array.isArray(explicit) ? explicit[0] : null;
      if (ref == null) return null;
      const index = typeof ref === "number" ? ref : await pdf.getPageIndex(ref);
      return index + 1;
    } catch {
      return null;
    }
  };

  const walk = (items: RawOutline, depth: number): Promise<OutlineItem[]> =>
    Promise.all(items.map(async (item) => ({
      title: item.title,
      page: await pageOf(item.dest),
      children: depth === 0 && item.items?.length ? await walk(item.items, 1) : [],
    })));
  return walk(outline, 0);
}

/** PDF.js báo lỗi HTTP bằng ResponseException kèm status. */
export function httpStatusOf(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" && status > 0 ? status : undefined;
}
