import { useState } from "react";
import type * as React from "react";
import { Button, Icon } from "../../design-system";
import Brand from "../../components/common/Brand";

type LoginMessage =
  | { tone: "error" | "info"; text: string }
  | null;

function MicrosoftMark() {
  return <span className="microsoft-mark" aria-hidden="true"><i /><i /><i /><i /></span>;
}

export default function LoginPage() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ account?: string; password?: string }>({});
  const [message, setMessage] = useState<LoginMessage>(null);
  const [loading, setLoading] = useState<"library" | "microsoft" | null>(null);

  const submitLibraryLogin = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = {
      account: account.trim() ? undefined : "Vui lòng nhập tài khoản.",
      password: password ? undefined : "Vui lòng nhập mật khẩu.",
    };
    setErrors(nextErrors);
    setMessage(null);
    if (nextErrors.account || nextErrors.password) return;
    setLoading("library");
    window.setTimeout(() => {
      setLoading(null);
      setMessage({ tone: "error", text: "Tài khoản hoặc mật khẩu không chính xác." });
    }, 800);
  };

  const startMicrosoftLogin = () => {
    setMessage(null);
    setLoading("microsoft");
    window.setTimeout(() => {
      setLoading(null);
      setMessage({ tone: "error", text: "Không thể đăng nhập bằng tài khoản Microsoft. Vui lòng thử lại hoặc sử dụng phương thức đăng nhập khác." });
    }, 800);
  };

  return (
    <div className="login-page">
      <section className="login-brand-panel" aria-label="Giới thiệu PTIT Library">
        <div className="login-brand-top"><Brand /></div>
        <div className="login-brand-content">
          <div className="login-illustration" aria-hidden="true">
            <span className="illustration-orbit orbit-one" />
            <span className="illustration-orbit orbit-two" />
            <div className="illustration-search"><Icon name="search" size={22} /></div>
            <div className="illustration-document"><Icon name="document" size={28} /><i /><i /><i /></div>
            <div className="illustration-library">
              <span><Icon name="library" size={38} /></span>
              <div><i /><i /><i /><i /></div>
            </div>
            <div className="illustration-books"><i /><i /><i /></div>
            <span className="illustration-dot dot-one" />
            <span className="illustration-dot dot-two" />
            <span className="illustration-dot dot-three" />
          </div>
          <p className="eyebrow">HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG</p>
          <h1>Khám phá tri thức.<br />Kết nối tương lai.</h1>
          <p>Truy cập nguồn tài liệu học thuật, khám phá tri thức và quản lý hoạt động thư viện trên một nền tảng duy nhất.</p>
        </div>
        <div className="login-brand-note"><Icon name="library" size={16} /><span>Thư viện số thông minh dành cho cộng đồng PTIT</span></div>
      </section>

      <section className="login-form-panel">
        <div className="login-mobile-brand"><Brand compact /></div>
        <main className="login-card">
          <div className="login-heading">
            <p className="eyebrow">ĐĂNG NHẬP HỆ THỐNG</p>
            <h2>Chào mừng đến với PTIT Library</h2>
            <p>Đăng nhập để tiếp tục sử dụng thư viện số.</p>
          </div>

          {message && <div className={`login-message ${message.tone}`} role={message.tone === "error" ? "alert" : "status"}><Icon name={message.tone === "error" ? "error" : "info"} size={18} /><span>{message.text}</span></div>}

          <form className="login-form" onSubmit={submitLibraryLogin} noValidate>
            <label className={`login-field ${errors.account ? "has-error" : ""}`}>
              <span>Tài khoản</span>
              <span className="login-input-wrap"><Icon name="users" size={18} /><input value={account} onChange={(event) => { setAccount(event.target.value); setErrors((current) => ({ ...current, account: undefined })); }} autoComplete="username" placeholder="Nhập tài khoản thư viện" aria-invalid={Boolean(errors.account)} aria-describedby={errors.account ? "account-error" : undefined} /></span>
              {errors.account && <small id="account-error"><Icon name="error" size={13} />{errors.account}</small>}
            </label>
            <label className={`login-field ${errors.password ? "has-error" : ""}`}>
              <span>Mật khẩu</span>
              <span className="login-input-wrap"><Icon name="settings" size={18} /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })); }} autoComplete="current-password" placeholder="Nhập mật khẩu" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "password-error" : undefined} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}><Icon name={showPassword ? "eye-off" : "eye"} size={18} /></button></span>
              {errors.password && <small id="password-error"><Icon name="error" size={13} />{errors.password}</small>}
            </label>
            <div className="login-options">
              <label><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Ghi nhớ đăng nhập</span></label>
              <button type="button" onClick={() => setMessage({ tone: "info", text: "Vui lòng liên hệ nhân viên thư viện để được hỗ trợ khôi phục mật khẩu." })}>Quên mật khẩu?</button>
            </div>
            <Button className="login-submit" type="submit" loading={loading === "library"} disabled={loading !== null}>Đăng nhập</Button>
            <p className="login-helper"><Icon name="info" size={14} />Tài khoản và mật khẩu ban đầu được cấp bởi nhân viên thư viện.</p>
          </form>

          <div className="login-divider"><span>HOẶC</span></div>

          <Button className="microsoft-login" variant="secondary" type="button" loading={loading === "microsoft"} disabled={loading !== null} onClick={startMicrosoftLogin}>
            {loading !== "microsoft" && <MicrosoftMark />}
            Đăng nhập bằng tài khoản Microsoft
          </Button>
          <p className="microsoft-helper">Sử dụng tài khoản Outlook do Học viện cấp để đăng nhập. Khả năng truy cập phụ thuộc vào cấu hình Microsoft của hệ thống và chính sách tài khoản của Học viện.</p>

          <div className="login-assistance">
            <span><Icon name="info" size={18} /></span>
            <div><strong>Chưa có thông tin đăng nhập?</strong><p>Vui lòng liên hệ nhân viên thư viện để được cấp tài khoản hoặc hỗ trợ truy cập.</p><button type="button">Hướng dẫn đăng nhập</button></div>
          </div>
        </main>
        <footer className="login-footer">
          <p>© PTIT Library – Học viện Công nghệ Bưu chính Viễn thông</p>
          <nav aria-label="Liên kết hỗ trợ"><button>Hướng dẫn sử dụng</button><button>Quy định thư viện</button></nav>
        </footer>
      </section>
    </div>
  );
}
