import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type CSSProperties,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type OptionHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

type Tone = "brand" | "neutral" | "success" | "warning" | "error" | "info";
type IconName =
  | "arrow-left"
  | "bell"
  | "book"
  | "bookmark"
  | "chart"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "circulation"
  | "close"
  | "dashboard"
  | "document"
  | "error"
  | "eye"
  | "eye-off"
  | "filter"
  | "info"
  | "library"
  | "logout"
  | "maximize"
  | "menu"
  | "more"
  | "plus"
  | "search"
  | "settings"
  | "shield"
  | "sparkle"
  | "success"
  | "user"
  | "users"
  | "zoom-in"
  | "zoom-out";

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    "arrow-left": <><path d="m15 18-6-6 6-6" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
    chart: <><path d="M4 20h16" /><path d="M7 16v-5M12 16V7M17 16v-8" /></>,
    "chevron-down": <path d="m6 9 6 6 6-6" />,
    "chevron-left": <path d="m15 18-6-6 6-6" />,
    "chevron-right": <path d="m9 18 6-6-6-6" />,
    circulation: <><path d="M7 16V4m0 0-3 3m3-3 3 3" /><path d="M17 8v12m0 0-3-3m3 3 3-3" /></>,
    close: <><path d="m18 6-12 12" /><path d="m6 6 12 12" /></>,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    document: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    error: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    "eye-off": <><path d="m3 3 18 18" /><path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-2 2.7M6.6 6.6C3.6 8.4 2 12 2 12s3.5 6 10 6a10.7 10.7 0 0 0 4.1-.8M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
    filter: <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    library: <><path d="M3 21h18M5 21V9M9 21V9M15 21V9M19 21V9M3 7l9-4 9 4H3Z" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>,
    maximize: <><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    more: <><circle cx="6" cy="12" r="1.4" stroke="none" fill="currentColor" /><circle cx="12" cy="12" r="1.4" stroke="none" fill="currentColor" /><circle cx="18" cy="12" r="1.4" stroke="none" fill="currentColor" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.5v-.1A1.7 1.7 0 0 0 8.4 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2V9.5h.3A1.7 1.7 0 0 0 4 8.4a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.46 3.6l.06.06A1.7 1.7 0 0 0 8.4 4 1.7 1.7 0 0 0 9.5 2.3V2h4.1v.3A1.7 1.7 0 0 0 15 4a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8a1.7 1.7 0 0 0 1.7 1.5h.9v4.1h-.9a1.7 1.7 0 0 0-1.7 1.4Z" /></>,
    shield: <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3Z" />,
    sparkle: <><path d="m12 3 1.4 3.6L17 8l-3.6 1.4L12 13l-1.4-3.6L7 8l3.6-1.4L12 3Z" /><path d="m19 14 .7 1.8 1.8.7-1.8.7L19 19l-.7-1.8-1.8-.7 1.8-.7L19 14Z" /></>,
    success: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    "zoom-in": <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4M8 11h6M11 8v6" /></>,
    "zoom-out": <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4M8 11h6" /></>,
  };
  return (
    <svg aria-hidden="true" className="ds-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
  icon?: IconName;
}) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`} {...props} disabled={props.disabled || loading}>
      {loading ? <span className="spinner" /> : icon ? <Icon name={icon} size={18} /> : null}
      {children}
    </button>
  );
}

export function IconButton({ label, icon, size = 18, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: IconName; size?: number }) {
  return <button className={className ? `icon-button ${className}` : "icon-button"} aria-label={label} title={label} {...props}><Icon name={icon} size={size} /></button>;
}

export function Field({
  label,
  hint,
  error,
  success,
  fieldClassName = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string; success?: string; fieldClassName?: string }) {
  const state = error ? "error" : success ? "success" : "";
  return (
    <label className={`field ${state} ${fieldClassName}`}>
      <span className="field-label">{label}</span>
      <input className="input" {...props} />
      {(error || success || hint) && <span className="field-message">{error || success || hint}</span>}
    </label>
  );
}

export function SearchInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <label className={`search-input ${className}`}><Icon name="search" /><input aria-label="Tìm kiếm" {...props} /><kbd>Ctrl K</kbd></label>;
}

export type SelectOption = { value: string; label: string; disabled?: boolean };

function extractNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractNodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return extractNodeText(node.props.children);
  return "";
}

function collectSelectOptions(children: ReactNode): SelectOption[] {
  const result: SelectOption[] = [];
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    if (child.type === Fragment) {
      result.push(...collectSelectOptions((child.props as { children?: ReactNode }).children));
    } else if (child.type === "option") {
      const optionProps = child.props as OptionHTMLAttributes<HTMLOptionElement>;
      const label = extractNodeText(optionProps.children).trim() || String(optionProps.value ?? "");
      const value = optionProps.value !== undefined ? String(optionProps.value) : label;
      result.push({ value, label, disabled: Boolean(optionProps.disabled) });
    }
  }
  return result;
}

export function CustomSelect({
  children,
  options: optionsProp,
  value,
  defaultValue,
  onChange,
  disabled,
  className = "",
  name,
  id,
  title,
  "aria-label": ariaLabel,
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  children?: ReactNode;
  options?: SelectOption[];
}) {
  const options = optionsProp ?? collectSelectOptions(children);
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(() =>
    defaultValue !== undefined ? String(defaultValue) : options[0]?.value ?? ""
  );
  const currentValue = controlled ? String(value ?? "") : internalValue;
  const selectedOption = options.find((opt) => opt.value === currentValue) ?? options[0];

  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const estimatedHeight = Math.min(Math.max(options.length, 1) * 40 + 12, 280);
    const openUp = spaceBelow < Math.min(estimatedHeight, 180) && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, Math.min(280, openUp ? spaceAbove : spaceBelow));
    const width = Math.max(rect.width, 168);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    setMenuStyle({
      position: "fixed",
      left,
      width,
      maxHeight,
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
      zIndex: 120,
    });
  }, [options.length]);

  const openMenu = () => {
    if (disabled) return;
    updateMenuPosition();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (wrapRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleScroll = (event: Event) => {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return;
      updateMenuPosition();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updateMenuPosition);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updateMenuPosition);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, updateMenuPosition]);

  const commitValue = (nextValue: string) => {
    if (!controlled) setInternalValue(nextValue);
    setOpen(false);
    triggerRef.current?.focus();
    if (onChange) {
      const syntheticTarget = { value: nextValue, name: name ?? "" } as unknown as HTMLSelectElement;
      const syntheticEvent = { target: syntheticTarget, currentTarget: syntheticTarget } as ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <div className={`custom-select ${open ? "is-open" : ""} ${disabled ? "is-disabled" : ""} ${className}`} ref={wrapRef}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        title={title}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        className="custom-select-trigger"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (open) setOpen(false);
          else openMenu();
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) openMenu();
          }
        }}
      >
        <span className="custom-select-value">{selectedOption?.label ?? ""}</span>
        <Icon name="chevron-down" size={16} />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div ref={menuRef} id={listboxId} role="listbox" className="custom-select-menu" style={menuStyle}>
          {options.map((option) => {
            const selected = option.value === currentValue;
            return (
              <button
                key={`${option.value}-${option.label}`}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={option.disabled}
                className={`custom-select-option ${selected ? "selected" : ""}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!option.disabled) commitValue(option.value);
                }}
              >
                <span>{option.label}</span>
                {selected && <span className="custom-select-check" aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

export function SelectField({ label, children, error, className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode; error?: string }) {
  return (
    <label className={`field ${error ? "error" : ""}`}>
      <span className="field-label">{label}</span>
      <CustomSelect className={`select ${className}`} {...props}>{children}</CustomSelect>
      {error && <span className="field-message">{error}</span>}
    </label>
  );
}

export function TextAreaField({
  label,
  error,
  hint,
  fieldClassName = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: string; fieldClassName?: string }) {
  return <label className={`field ${error ? "error" : ""} ${fieldClassName}`}><span className="field-label">{label}</span><textarea className="input textarea" {...props} />{(error || hint) && <span className="field-message">{error || hint}</span>}</label>;
}

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Tag({ children, selected, onRemove }: { children: ReactNode; selected?: boolean; onRemove?: () => void }) {
  return <span className={`tag ${selected ? "selected" : ""}`}>{children}{onRemove && <button aria-label="Xóa thẻ" onClick={onRemove}><Icon name="close" size={14} /></button>}</span>;
}

export function Card({ children, className = "", selected, ...props }: HTMLAttributes<HTMLDivElement> & { selected?: boolean }) {
  return <div className={`card ${selected ? "card-selected" : ""} ${className}`} {...props}>{children}</div>;
}

export function Tabs({ items, active, onChange }: { items: string[]; active: string; onChange: (item: string) => void }) {
  return <div className="tabs" role="tablist">{items.map((item) => <button key={item} className={active === item ? "active" : ""} role="tab" aria-selected={active === item} onClick={() => onChange(item)}>{item}</button>)}</div>;
}

export function Pagination() {
  return <nav className="pagination" aria-label="Phân trang"><IconButton label="Trang trước" icon="chevron-left" disabled /><button className="active">1</button><button>2</button><button>3</button><span>…</span><button>12</button><IconButton label="Trang sau" icon="chevron-right" /></nav>;
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").slice(-2).map((part) => part[0]).join("").toUpperCase();
  return <span className={`avatar avatar-${size}`} aria-label={name}>{initials}</span>;
}

export function Rating({ value = 4 }: { value?: number }) {
  return <span className="rating" aria-label={`${value} trên 5 sao`}>{[1, 2, 3, 4, 5].map((star) => <span key={star} className={star <= value ? "filled" : ""}>★</span>)}</span>;
}

export function Status({ tone, children }: { tone: "success" | "warning" | "error" | "neutral"; children: ReactNode }) {
  return <span className={`status status-${tone}`}><span />{children}</span>;
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return <span className="tooltip" data-tooltip={label}>{children}</span>;
}

export function Dropdown({ open, children }: { open: boolean; children: ReactNode }) {
  return open ? <div className="dropdown" role="menu">{children}</div> : null;
}

const modalEscapeStack: Array<{ id: string; onClose: () => void }> = [];

function handleModalEscape(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  const topModal = modalEscapeStack[modalEscapeStack.length - 1];
  topModal?.onClose();
}

export function Modal({ open, onClose, title, children, className = "", eyebrow = "XÁC NHẬN THAO TÁC" }: { open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string; eyebrow?: string }) {
  const id = useId();
  const titleId = `modal-title-${Array.from(id, (character) => character.codePointAt(0)!.toString(16)).join("-")}`;
  const dialog = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    dialog.current?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || modalEscapeStack[modalEscapeStack.length - 1]?.id !== id || !dialog.current) return;
      const controls = Array.from(dialog.current.querySelectorAll<HTMLElement>(
        "button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex='0']",
      )).filter((control) => control.getClientRects().length);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); return; }
      const focused = document.activeElement;
      if (!controls.some((control) => control === focused) || focused === (event.shiftKey ? first : last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener("keydown", trapFocus);
    const entry = { id, onClose: () => onCloseRef.current() };
    modalEscapeStack.push(entry);
    if (modalEscapeStack.length === 1) {
      document.addEventListener("keydown", handleModalEscape);
    }
    return () => {
      document.removeEventListener("keydown", trapFocus);
      if (modalEscapeStack[modalEscapeStack.length - 1]?.id === id && previous instanceof HTMLElement && previous.isConnected) previous.focus();
      const index = modalEscapeStack.indexOf(entry);
      if (index !== -1) modalEscapeStack.splice(index, 1);
      if (modalEscapeStack.length === 0) {
        document.removeEventListener("keydown", handleModalEscape);
      }
    };
  }, [open, id]);
  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className={`modal ${className}`} ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="eyebrow">{eyebrow}</p><h2 id={titleId}>{title}</h2></div><IconButton label="Đóng" icon="close" onClick={onClose} /></div><div className="modal-body">{children}</div></section></div>;
}

export function Toast({ tone = "success", title, children, onClose }: { tone?: Tone; title: string; children: ReactNode; onClose?: () => void }) {
  return <div className={`toast toast-${tone}`} role="status"><Icon name={tone === "success" ? "success" : tone === "error" ? "error" : "info"} /><div><strong>{title}</strong><p>{children}</p></div>{onClose && <IconButton label="Đóng" icon="close" onClick={onClose} />}</div>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`skeleton ${className}`} />;
}

type NavContextType = { active: string; setActive: (value: string) => void };
const NavContext = createContext<NavContextType | null>(null);
export function NavProvider({ value, children }: { value: NavContextType; children: ReactNode }) {
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}
export function NavItem({ icon, label }: { icon: IconName; label: string }) {
  const nav = useContext(NavContext);
  return <button className={`nav-item ${nav?.active === label ? "active" : ""}`} onClick={() => nav?.setActive(label)}><Icon name={icon} /><span>{label}</span></button>;
}

export function EmptyState({ error = false }: { error?: boolean }) {
  return <div className={`empty-state ${error ? "error-state" : ""}`}><span className="empty-icon"><Icon name={error ? "error" : "book"} size={28} /></span><strong>{error ? "Không thể tải dữ liệu" : "Chưa có tài liệu"}</strong><p>{error ? "Đã xảy ra lỗi kết nối. Vui lòng thử lại sau." : "Các tài liệu được thêm vào sẽ xuất hiện tại đây."}</p><Button variant={error ? "secondary" : "primary"} size="sm">{error ? "Thử lại" : "Thêm tài liệu"}</Button></div>;
}

export function Breadcrumb({ items }: { items: (string | { label: string; to: string })[] }) {
  return <nav className="breadcrumb" aria-label="Đường dẫn">{items.map((item, index) => {
    const current = index === items.length - 1;
    const label = typeof item === "string" ? item : item.label;
    return <span key={index}>
      {index > 0 && <Icon name="chevron-right" size={14} />}
      {typeof item !== "string" && !current ? <Link to={item.to}>{label}</Link>
        : <span className={current ? "current" : undefined} aria-current={current ? "page" : undefined}>{label}</span>}
    </span>;
  })}</nav>;
}
