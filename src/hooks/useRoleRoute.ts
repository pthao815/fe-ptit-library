import { useEffect, useState } from "react";
import type { Role } from "../types/library";

export function useRoleRoute() {
  const readRoute = (): { role: Role; path: string } => {
    const path = window.location.hash.replace("#/", "") || "login";
    const root = path.split("/")[0];
    return { role: root === "staff" || root === "admin" ? root : "reader", path };
  };
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const update = () => setRoute(readRoute());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  return route;
}
