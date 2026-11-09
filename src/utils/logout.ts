import { clearAuthSession } from "../services/session";
import type { NavigateFunction } from "react-router-dom";

export function logout(navigate: NavigateFunction) {
  clearAuthSession();
  navigate("/login", { replace: true });
}
