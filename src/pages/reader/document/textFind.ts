import { Util, type PDFDocumentProxy } from "pdfjs-dist";

/** Một mẩu chữ trên trang (một text item của PDF.js) và vị trí của nó trong chuỗi chữ của trang. */
interface TextSpan {
  start: number;
  end: number;
  // Khung chữ theo điểm PDF, gốc ở góc trên-trái trang
  x: number;
  y: number;
  w: number;
  h: number;
  str: string;
  font: string;
}

let measureContext: CanvasRenderingContext2D | null | undefined;

/**
 * Tỉ lệ bề rộng của str[0..index) so với cả str, đo bằng canvas theo font của PDF.
 * Đếm ký tự thì lệch nhiều với dòng có dấu chấm dẫn (……) hoặc chữ rộng hẹp khác nhau.
 */
function widthFraction(str: string, index: number, font: string): number {
  if (index <= 0) return 0;
  if (index >= str.length) return 1;
  if (measureContext === undefined) measureContext = document.createElement("canvas").getContext("2d");
  if (!measureContext) return index / str.length;
  measureContext.font = `100px ${font}`;
  const total = measureContext.measureText(str).width;
  return total > 0 ? measureContext.measureText(str.slice(0, index)).width / total : index / str.length;
}

export interface PageText {
  text: string;
  spans: TextSpan[];
  width: number;
  height: number;
}

export interface ExactHit {
  page: number;
  /** Ngữ cảnh quanh chỗ khớp (hiển thị dạng chữ thường, không phải HTML). */
  before: string;
  match: string;
  after: string;
  /** Vùng tô sáng theo % kích thước trang. */
  boxes: { left: number; top: number; width: number; height: number }[];
}

const CONTEXT_CHARS = 70;

/** Đọc lớp chữ của một trang: nối các text item thành một chuỗi và nhớ toạ độ từng mẩu. */
export async function extractPageText(pdf: PDFDocumentProxy, pageNumber: number): Promise<PageText> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  let text = "";
  const spans: TextSpan[] = [];
  for (const item of content.items) {
    if (!("str" in item)) continue;
    // Gộp chữ tổ hợp (NFD) về dạng dựng sẵn để so khớp tiếng Việt ổn định
    const str = item.str.normalize("NFC");
    if (str) {
      const tx = Util.transform(viewport.transform, item.transform);
      const h = Math.hypot(tx[2], tx[3]);
      const font = content.styles[item.fontName]?.fontFamily || "serif";
      spans.push({ start: text.length, end: text.length + str.length, x: tx[4], y: tx[5] - h, w: item.width, h, str, font });
      text += str;
    }
    // Xuống dòng trong PDF coi như một khoảng trắng để cụm từ vắt dòng vẫn khớp
    if (item.hasEOL && !text.endsWith(" ")) text += " ";
  }
  page.cleanup();
  return { text, spans, width: viewport.width, height: viewport.height };
}

/** Biểu thức tìm: không phân biệt hoa thường, khoảng trắng trong truy vấn khớp mọi khoảng trắng. */
export function exactPattern(query: string): RegExp | null {
  const cleaned = query.normalize("NFC").trim();
  if (!cleaned) return null;
  const source = cleaned.split(/\s+/).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+");
  return new RegExp(source, "giu");
}

/** Tìm mọi lần xuất hiện trong một trang, kèm đoạn ngữ cảnh và vùng tô sáng. */
export function findInPage(pageText: PageText, pageNumber: number, pattern: RegExp, limit: number): ExactHit[] {
  const hits: ExactHit[] = [];
  const { text, spans, width, height } = pageText;
  if (!text || width <= 0 || height <= 0) return hits;
  pattern.lastIndex = 0;
  let found: RegExpExecArray | null;
  while (hits.length < limit && (found = pattern.exec(text))) {
    const start = found.index;
    const end = start + found[0].length;
    if (end === start) { pattern.lastIndex++; continue; }

    const boxes: ExactHit["boxes"] = [];
    for (const span of spans) {
      if (span.end <= start) continue;
      if (span.start >= end) break;
      const from = widthFraction(span.str, Math.max(start, span.start) - span.start, span.font);
      const to = widthFraction(span.str, Math.min(end, span.end) - span.start, span.font);
      boxes.push({
        left: ((span.x + span.w * from) / width) * 100,
        top: (span.y / height) * 100,
        width: ((span.w * (to - from)) / width) * 100,
        height: (span.h / height) * 100,
      });
    }

    hits.push({
      page: pageNumber,
      before: `${start > CONTEXT_CHARS ? "… " : ""}${text.slice(Math.max(0, start - CONTEXT_CHARS), start)}`,
      match: found[0],
      after: `${text.slice(end, end + CONTEXT_CHARS)}${end + CONTEXT_CHARS < text.length ? " …" : ""}`,
      boxes,
    });
  }
  return hits;
}
