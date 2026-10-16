export function logout() {
  ["ptit-library-session", "ptit-library-user", "ptit-library-role"].forEach((key) => {
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  });
  window.location.replace("#/login");
}
