import { authSession, sessionFromAccessToken } from "../shared/auth/auth-session.ts";
import type { Role } from "../types/library";
import type { TokenResponse, UserDto } from "../types/api";

let expired = false;
export const isSessionExpired = () => expired;

const SESSION_KEY = "ptit-library-session";
const USER_KEY = "ptit-library-user";
const ROLE_KEY = "ptit-library-role";

export interface StoredSession {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
}

export function mapBackendRoleToPortalRole(backendRole?: string): Role {
  const normalized = (backendRole || "").toUpperCase();
  if (normalized === "ADMIN" || normalized === "ROLE_ADMIN") return "admin";
  if (normalized === "LIBRARIAN" || normalized === "ROLE_LIBRARIAN" || normalized === "STAFF") {
    return "staff";
  }
  return "reader";
}

export function getPortalHomePath(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/reader";
}

function readStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
}

export function saveAuthSession(tokenData: TokenResponse, remember = true): Role {
  if (typeof window === "undefined") return "reader";
  const session = sessionFromAccessToken(tokenData.accessToken);
  const targetStorage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;

  [SESSION_KEY, USER_KEY, ROLE_KEY].forEach((key) => otherStorage.removeItem(key));

  const sessionPayload: StoredSession = {
    accessToken: tokenData.accessToken,
    refreshToken: tokenData.refreshToken,
    tokenType: tokenData.tokenType || "Bearer",
    expiresIn: tokenData.expiresIn,
  };
  const role = mapBackendRoleToPortalRole(session.role);

  targetStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
  if (tokenData.user) {
    targetStorage.setItem(USER_KEY, JSON.stringify(tokenData.user));
  }
  targetStorage.setItem(ROLE_KEY, role);
  expired = false;
  authSession.setSession(session);
  return role;
}

export function updateStoredUser(user: UserDto): void {
  if (typeof window === "undefined") return;
  const inLocal = window.localStorage.getItem(SESSION_KEY) !== null;
  const storage = inLocal ? window.localStorage : window.sessionStorage;
  storage.setItem(USER_KEY, JSON.stringify(user));
  storage.setItem(ROLE_KEY, mapBackendRoleToPortalRole(user.role));
}

export function getStoredSession(): StoredSession | null {
  const raw = readStorageItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return { accessToken: raw };
  }
}

export function getAccessToken(): string | null {
  return getStoredSession()?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return getStoredSession()?.refreshToken ?? null;
}

export function getStoredUser(): UserDto | null {
  const raw = readStorageItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserDto;
  } catch {
    return null;
  }
}

export function getStoredRole(): Role | null {
  const raw = readStorageItem(ROLE_KEY);
  if (raw === "reader" || raw === "staff" || raw === "admin") return raw;
  return null;
}

export function restoreAuthSession(): void {
  const token = getAccessToken();
  if (!token) {
    authSession.setSession(null);
    return;
  }
  try {
    authSession.setSession(sessionFromAccessToken(token));
  } catch {
    authSession.setSession(null);
  }
}

export function clearAuthSession(reason?: "expired"): void {
  expired = reason === "expired";
  [SESSION_KEY, USER_KEY, ROLE_KEY].forEach((key) => {
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  });
  authSession.setSession(null);
}

export function remembersSession(): boolean {
  return window.localStorage.getItem(SESSION_KEY) !== null;
}
