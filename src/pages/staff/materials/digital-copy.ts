// Giữ khớp spring.servlet.multipart.max-file-size ở backend.
export const MAX_PDF_SIZE_MB = 100;

const PDF_SIGNATURE = "%PDF-";

export type ProcessingView = {
  label: string;
  tone: "success" | "warning" | "error";
  finished: boolean;
};

/** Trả về thông báo lỗi, hoặc null nếu tệp qua được các kiểm tra của backend. */
export async function validatePdfFile(file: File): Promise<string | null> {
  if (!file.name.toLowerCase().endsWith(".pdf")) return "Chỉ chấp nhận tệp có đuôi .pdf.";
  if (file.size === 0) return "Tệp PDF đang rỗng.";
  if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
    return `Tệp vượt quá giới hạn ${MAX_PDF_SIZE_MB} MB.`;
  }
  const signature = await file.slice(0, PDF_SIGNATURE.length).text();
  return signature === PDF_SIGNATURE ? null : "Nội dung tệp không phải PDF hợp lệ.";
}

/** Gộp trạng thái background job và digital copy thành một trạng thái hiển thị. */
export function describeProcessing(jobStatus?: string, copyStatus?: string): ProcessingView {
  if (jobStatus === "FAILED" || copyStatus === "FAILED") {
    return { label: "Lỗi xử lý", tone: "error", finished: true };
  }
  if (jobStatus === "CANCELLED") return { label: "Đã hủy", tone: "error", finished: true };
  if (copyStatus === "LOW_QUALITY") {
    return { label: "Chất lượng thấp", tone: "warning", finished: true };
  }
  if (copyStatus === "INDEXED" || jobStatus === "COMPLETED") {
    return { label: "Đã xử lý", tone: "success", finished: true };
  }
  if (jobStatus === "RUNNING" || copyStatus === "PROCESSING") {
    return { label: "Đang xử lý", tone: "warning", finished: false };
  }
  return { label: "Đang chờ xử lý", tone: "warning", finished: false };
}

export function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Bản đầu tiên là 1.0; bản thay thế dùng mốc thời gian vì API không trả phiên bản hiện hành. */
export function nextPdfVersion(hasCurrentCopy: boolean, now = new Date()): string {
  if (!hasCurrentCopy) return "1.0";
  return now.toISOString().slice(0, 16).replace(/[-:]/g, "").replace("T", "-");
}
