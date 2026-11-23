import type { AuthenticationResult, Configuration, PublicClientApplication } from "@azure/msal-browser";
import {
  MICROSOFT_AUTHORITY,
  MICROSOFT_CLIENT_ID,
  MICROSOFT_REDIRECT_URI,
} from "../config/env";
import {
  isPopupBlockedError,
  resolveMicrosoftRedirectUri,
} from "../utils/microsoft-auth";

const MICROSOFT_SCOPES = ["openid", "profile", "email"];
const REDIRECT_REMEMBER_KEY = "ptit-library-ms-remember";
const AUTH_RESPONSE_PATTERN =
  /(?:^|[?#&])(?:code|error)=.*&state=|(?:^|[?#&])state=.*&(?:code|error)=/i;

let msalInstancePromise: Promise<PublicClientApplication> | null = null;

export function isMicrosoftAuthConfigured(): boolean {
  return Boolean(MICROSOFT_CLIENT_ID);
}

export function hasMicrosoftAuthResponseInUrl(): boolean {
  if (typeof window === "undefined") return false;
  const combined = `${window.location.search}${window.location.hash}`;
  return AUTH_RESPONSE_PATTERN.test(combined);
}

/**
 * MSAL Browser v5 dùng BroadcastChannel redirect-bridge cho luồng popup.
 * Nếu cửa sổ hiện tại là popup do MSAL mở và Microsoft vừa redirect về /login,
 * chuyển payload về cửa sổ chính và đóng popup ngay mà không mount React.
 */
export async function tryHandleMicrosoftPopupBridge(): Promise<boolean> {
  if (!hasMicrosoftAuthResponseInUrl()) return false;
  const { BrowserUtils } = await import("@azure/msal-browser");
  if (!BrowserUtils.isInPopup()) return false;
  const { broadcastResponseToMainFrame } = await import("@azure/msal-browser/redirect-bridge");
  await broadcastResponseToMainFrame();
  return true;
}

async function getMsalInstance(): Promise<PublicClientApplication> {
  if (!MICROSOFT_CLIENT_ID) {
    throw new Error("Chưa cấu hình VITE_MICROSOFT_CLIENT_ID.");
  }
  if (!msalInstancePromise) {
    msalInstancePromise = (async () => {
      const { PublicClientApplication } = await import("@azure/msal-browser");
      const redirectUri = resolveMicrosoftRedirectUri(
        MICROSOFT_REDIRECT_URI,
        typeof window !== "undefined" ? window.location.origin : "",
      );
      const config: Configuration = {
        auth: {
          clientId: MICROSOFT_CLIENT_ID,
          authority: MICROSOFT_AUTHORITY,
          redirectUri,
        },
        cache: {
          cacheLocation: "sessionStorage",
        },
      };
      const instance = new PublicClientApplication(config);
      await instance.initialize();
      return instance;
    })().catch((error) => {
      msalInstancePromise = null;
      throw error;
    });
  }
  return msalInstancePromise;
}

function readAndClearRedirectRemember(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.sessionStorage.getItem(REDIRECT_REMEMBER_KEY);
    window.sessionStorage.removeItem(REDIRECT_REMEMBER_KEY);
    return raw !== "false";
  } catch {
    return true;
  }
}

function saveRedirectRemember(remember: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(REDIRECT_REMEMBER_KEY, remember ? "true" : "false");
  } catch {
    // Bỏ qua nếu trình duyệt chặn sessionStorage
  }
}

export interface MicrosoftRedirectResult {
  idToken: string;
  remember: boolean;
}

export async function completeMicrosoftRedirect(): Promise<MicrosoftRedirectResult | null> {
  if (!isMicrosoftAuthConfigured() || typeof window === "undefined") return null;
  if (!hasMicrosoftAuthResponseInUrl() && !window.sessionStorage.getItem(REDIRECT_REMEMBER_KEY)) {
    return null;
  }

  const instance = await getMsalInstance();
  const result: AuthenticationResult | null = await instance.handleRedirectPromise();
  if (!result?.idToken) {
    readAndClearRedirectRemember();
    return null;
  }
  return {
    idToken: result.idToken,
    remember: readAndClearRedirectRemember(),
  };
}

/**
 * Mở đăng nhập Microsoft (OIDC Authorization Code + PKCE) và trả về idToken.
 * Nếu trình duyệt chặn popup, tự động chuyển sang loginRedirect (trả về null vì trang sẽ điều hướng).
 */
export async function acquireMicrosoftIdToken(remember: boolean): Promise<string | null> {
  const instance = await getMsalInstance();
  const request = {
    scopes: MICROSOFT_SCOPES,
    prompt: "select_account",
  };

  try {
    const result = await instance.loginPopup(request);
    if (!result?.idToken) {
      throw new Error("Microsoft không trả về idToken hợp lệ.");
    }
    return result.idToken;
  } catch (error) {
    if (isPopupBlockedError(error)) {
      saveRedirectRemember(remember);
      await instance.loginRedirect(request);
      return null;
    }
    throw error;
  }
}
