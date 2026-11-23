export interface MicrosoftErrorLike {
  errorCode?: string;
  errorMessage?: string;
  subError?: string;
  message?: string;
}

export const DEFAULT_MICROSOFT_AUTHORITY = "https://login.microsoftonline.com/organizations";

export function resolveMicrosoftRedirectUri(configuredUri: string, origin?: string): string {
  const trimmed = configuredUri.trim();
  if (trimmed) return trimmed;
  const normalizedOrigin = (origin || "").trim().replace(/\/+$/, "");
  return normalizedOrigin ? `${normalizedOrigin}/login` : "/login";
}

function combinedErrorText(error: unknown): { code: string; detail: string } {
  if (!error || typeof error !== "object") {
    return { code: "", detail: typeof error === "string" ? error : "" };
  }
  const obj = error as MicrosoftErrorLike;
  const code = String(obj.errorCode || "").trim().toLowerCase();
  const detail = [obj.errorCode, obj.subError, obj.errorMessage, obj.message]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(" ");
  return { code, detail };
}

export function isPopupBlockedError(error: unknown): boolean {
  const { code, detail } = combinedErrorText(error);
  return (
    code === "popup_window_error"
    || code === "empty_window_error"
    || /popup_window_error|empty_window_error|blocked.*popup/i.test(detail)
  );
}

export function isUserCancelledError(error: unknown): boolean {
  const { code, detail } = combinedErrorText(error);
  return (
    code === "user_cancelled"
    || /user_cancelled|access_denied.*cancel/i.test(detail)
  );
}

export function mapMicrosoftAuthError(error: unknown): { tone: "info" | "error"; text: string } {
  const { code, detail } = combinedErrorText(error);

  if (isUserCancelledError(error)) {
    return { tone: "info", text: "Bạn đã hủy quá trình đăng nhập bằng tài khoản Microsoft." };
  }
  if (code === "interaction_in_progress" || /interaction_in_progress/i.test(detail)) {
    return {
      tone: "info",
      text: "Cửa sổ đăng nhập Microsoft đang mở. Vui lòng hoàn tất hoặc đóng cửa sổ đó rồi thử lại.",
    };
  }
  if (/AADSTS90094|AADSTS65001|consent_required|admin\s*approval/i.test(detail)) {
    return {
      tone: "error",
      text: "Tài khoản tổ chức đang yêu cầu quản trị viên Học viện phê duyệt ứng dụng (AADSTS90094). Vui lòng liên hệ quản trị viên hoặc dùng tài khoản thư viện.",
    };
  }
  if (/AADSTS50020|AADSTS500200/i.test(detail)) {
    return {
      tone: "error",
      text: "Tài khoản Microsoft này chưa được phép truy cập ứng dụng. Vui lòng dùng email do Học viện cấp.",
    };
  }
  if (/AADSTS9002325|AADSTS50011|redirect_uri/i.test(detail)) {
    return {
      tone: "error",
      text: "Cấu hình Redirect URI hoặc SPA PKCE trên Microsoft Entra ID chưa khớp với địa chỉ hiện tại.",
    };
  }
  if (code === "monitor_window_timeout" || /timed?\s*out/i.test(detail)) {
    return {
      tone: "error",
      text: "Quá thời gian chờ xác thực Microsoft. Vui lòng thử lại.",
    };
  }
  return {
    tone: "error",
    text: "Không thể đăng nhập bằng tài khoản Microsoft. Vui lòng thử lại hoặc sử dụng tài khoản thư viện.",
  };
}
