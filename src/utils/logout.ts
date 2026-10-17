import type { NavigateFunction } from "react-router-dom";

export function logout(navigate: NavigateFunction) {
  ["ptit-library-session", "ptit-library-user", "ptit-library-role"].forEach((key) => {
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  });
  navigate("/login", { replace: true });
}
