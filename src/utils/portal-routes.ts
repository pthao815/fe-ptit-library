import type { AuthRole } from "../shared/auth/auth-session.ts";

const publicReader = /^\/reader(?:\/(?:search(?:-empty)?|book-detail|guidelines))?$/i;
const privateReader = /^\/reader\/(?:profile(?:\/restricted)?|my-library(?:\/(?:history|reservations))?|notifications(?:\/[^/]+)?|book-detail\/review(?:\/(?:edit|login-required|error))?|content-search(?:-empty)?|document(?:\/\d+)?)$/i;
const workspace = /^\/(staff|admin)(?:\/(profile|policies|penalty-types|search-configs|materials(?:\/new|\/edit\/[^/]+)?|circulation|digital-processing|reservations|readers|reports|workspace))?$/i;

export function routeAccess(pathname: string, role?: AuthRole): "public" | "allowed" | "login" | "forbidden" | "missing" {
  const path = pathname.replace(/\/+$/, "").toLowerCase();
  if (publicReader.test(path)) return "public";
  if (privateReader.test(path)) return !role ? "login" : role === "READER" ? "allowed" : "forbidden";

  const match = workspace.exec(path);
  if (!match) return "missing";
  const [, portal, section] = match;
  if (portal === "admin" && ["circulation", "digital-processing", "reservations", "reports"].includes(section)) return "missing";
  if (portal === "staff" && section === "workspace") return "missing";
  if (!role) return "login";
  if (portal === "admin") return role === "ADMIN" ? "allowed" : "forbidden";
  return role === "LIBRARIAN" && section !== "search-configs" ? "allowed" : "forbidden";
}

export function safeReturnPath(value: unknown, role?: AuthRole): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/") || /[\\\u0000-\u0020]/.test(value) || value.startsWith("//")) return;
  const url = new URL(value, "https://portal.invalid");
  if (url.origin !== "https://portal.invalid") return;
  const access = routeAccess(url.pathname, role);
  return access === "allowed" || access === "public" ? url.pathname + url.search + url.hash : undefined;
}
