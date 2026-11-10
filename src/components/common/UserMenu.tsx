import { useEffect, useState } from "react";
import { Avatar, Dropdown, Icon } from "../../design-system";
import { authService } from "../../services/auth.service";
import { getAccessToken, getStoredUser } from "../../services/session";
import type { Role } from "../../types/library";

export default function UserMenu({
  open,
  onToggle,
  onLogout,
  onProfile,
  role,
}: {
  open: boolean;
  onToggle: () => void;
  onLogout: () => void;
  onProfile?: () => void;
  role: Role;
}) {
  const [storedUser, setStoredUser] = useState(() => getStoredUser());

  useEffect(() => {
    if (!getAccessToken()) return;
    let active = true;
    authService
      .getCurrentUser()
      .then((user) => {
        if (active) setStoredUser(user);
      })
      .catch(() => {
        // Keep existing stored user or fallback display name
      });
    return () => {
      active = false;
    };
  }, []);

  const roleName =
    role === "reader" ? "Bạn đọc" : role === "staff" ? "Nhân viên thư viện" : "Quản trị viên";
  const userName = storedUser?.fullName || roleName;

  return (
    <div className="user-menu-wrap">
      <button className="user-trigger" onClick={onToggle} aria-expanded={open}>
        <Avatar name={userName} />
        <span>
          <strong>{userName}</strong>
          <small>{roleName}</small>
        </span>
        <Icon name="chevron-down" size={15} />
      </button>
      <Dropdown open={open}>
        <button onClick={onProfile}><Icon name="users" />Thông tin tài khoản</button>
        <button><Icon name="settings" />Thiết lập cá nhân</button>
        <hr />
        <button className="danger" onClick={onLogout}><Icon name="arrow-left" />Đăng xuất</button>
      </Dropdown>
    </div>
  );
}
