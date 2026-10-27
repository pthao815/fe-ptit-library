import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { NavLink } from "react-router-dom";
import { Badge, Button, Field, Icon, Modal, SelectField, Toast } from "../../design-system";
import { userTypeLabels } from "../../data/configuration";
import { configurationMock } from "../../services/configuration-mock";
import type { ConfigurationKind, DemoMode, Policy } from "../../types/configuration";
import "./configuration.css";

const titles: Record<ConfigurationKind, string> = { policies: "Chính sách mượn trả", "penalty-types": "Loại hình phạt", "search-configs": "Cấu hình tìm kiếm" };
const descriptions: Record<ConfigurationKind, string> = {
  policies: "Thiết lập hạn mức và thời gian sử dụng tài liệu theo từng nhóm độc giả.",
  "penalty-types": "Quản lý danh mục vi phạm, đơn vị tính và mức phí áp dụng.",
  "search-configs": "Xem cấu hình bóc tách dữ liệu và lựa chọn cấu hình tìm kiếm mặc định.",
};
const numericPolicyFields = [
  ["loanDays", "Số ngày mượn", 1], ["maxLoans", "Số lượng tối đa", 1],
  ["maxRenewals", "Số lần gia hạn", 0], ["holdExpiryDays", "Thời gian giữ chờ (ngày)", 0],
] as const;
type Editor = { id?: number; values: Record<string, string> };

export default function ConfigurationPage({ kind, role }: { kind: ConfigurationKind; role: "admin" | "staff" }) {
  const store = useSyncExternalStore(configurationMock.subscribe, configurationMock.getSnapshot);
  const [mode, setMode] = useState<DemoMode>("ready");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [activation, setActivation] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [failSave, setFailSave] = useState(false);
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const dialog = useRef<HTMLDivElement>(null);
  const admin = role === "admin";

  useEffect(() => {
    let cancelled = false;
    setStatus("loading"); setLoadError("");
    configurationMock.load(mode).then(() => { if (!cancelled) setStatus("ready"); })
      .catch((error: Error) => { if (!cancelled) { setLoadError(error.message); setStatus("error"); } });
    return () => { cancelled = true; };
  }, [mode, kind]);

  const modalOpen = editor !== null || activation !== null;
  useEffect(() => {
    if (!modalOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = dialog.current?.closest<HTMLElement>('[role="dialog"]');
    const focusable = () => Array.from(root?.querySelectorAll<HTMLElement>('input:not(:disabled), select:not(:disabled), button:not(:disabled)') ?? []);
    focusable()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusable(); const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !root?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !root?.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => { document.removeEventListener("keydown", trap); previous?.focus(); };
  }, [modalOpen]);

  if (!admin && kind === "search-configs") return <div className="configuration-page"><h1>Không có quyền truy cập</h1><p>Cấu hình tìm kiếm chỉ dành cho Admin trong bản demo.</p></div>;

  const policies = mode === "empty" ? [] : store.policies;
  const penalties = mode === "empty" ? [] : store.penaltyTypes;
  const configs = mode === "empty" ? [] : store.searchConfigs;
  const count = kind === "policies" ? policies.length : kind === "penalty-types" ? penalties.length : configs.length;
  const close = () => { if (!lock.current) { setEditor(null); setActivation(null); setSaveError(""); } };
  const open = (id?: number) => {
    const row = kind === "policies" ? store.policies.find((item) => item.id === id) : store.penaltyTypes.find((item) => item.id === id);
    const values = row ? Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value)])) : { code: "", name: "", unitName: "", unitPrice: "" };
    setErrors({}); setSaveError(""); setEditor({ id, values });
  };
  const change = (key: string, value: string) => {
    setEditor((current) => current ? { ...current, values: { ...current.values, [key]: value } } : null);
    setErrors((current) => ({ ...current, [key]: "" })); setSaveError("");
  };
  const save = async () => {
    if (!admin || !editor || lock.current) return;
    const values = editor.values; const next: Record<string, string> = {};
    const integer = (key: string, min: number, max = Number.MAX_SAFE_INTEGER) => {
      const value = Number(values[key]);
      if (!values[key]?.trim() || !Number.isSafeInteger(value) || value < min || value > max) next[key] = `Nhập số nguyên từ ${min.toLocaleString("vi-VN")} đến ${max.toLocaleString("vi-VN")}.`;
    };
    if (kind === "policies") {
      if (!Object.prototype.hasOwnProperty.call(userTypeLabels, values.userType)) next.userType = "Vui lòng chọn loại độc giả.";
      if (!values.docType?.trim()) next.docType = "Vui lòng nhập mã loại tài liệu.";
      numericPolicyFields.forEach(([key, , min]) => integer(key, min, 2147483647));
    } else {
      for (const [key, max] of [["code", 50], ["name", 255], ["unitName", 50]] as const) {
        if (!values[key]?.trim()) next[key] = "Không được để trống.";
        else if (values[key].trim().length > max) next[key] = `Tối đa ${max} ký tự.`;
      }
      integer("unitPrice", 0);
      if (store.penaltyTypes.some((item) => item.id !== editor.id && item.code === values.code.trim())) next.code = "Mã loại phạt đã tồn tại.";
    }
    setErrors(next);
    if (Object.keys(next).length) { dialog.current?.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus(); return; }
    lock.current = true; setSaving(true); setSaveError("");
    try {
      if (kind === "policies") {
        await configurationMock.updatePolicy({ id: editor.id!, userType: values.userType as Policy["userType"], docType: values.docType.trim(), loanDays: Number(values.loanDays), maxLoans: Number(values.maxLoans), maxRenewals: Number(values.maxRenewals), holdExpiryDays: Number(values.holdExpiryDays) }, failSave);
      } else await configurationMock.savePenalty({ id: editor.id, code: values.code, name: values.name, unitName: values.unitName, unitPrice: Number(values.unitPrice) }, failSave);
      setEditor(null); setMode("ready"); setNotice("Đã cập nhật dữ liệu demo. Tải lại trang sẽ khôi phục dữ liệu mẫu.");
    } catch (error) { setSaveError(error instanceof Error ? error.message : "Không thể lưu dữ liệu demo."); }
    finally { lock.current = false; setSaving(false); }
  };
  const activate = async () => {
    if (!admin || activation === null || lock.current) return;
    lock.current = true; setSaving(true); setSaveError("");
    try { await configurationMock.activate(activation, failSave); setActivation(null); setNotice("Đã kích hoạt cấu hình trong dữ liệu demo. Không thực hiện lập chỉ mục lại."); }
    catch (error) { setSaveError(error instanceof Error ? error.message : "Không thể kích hoạt cấu hình demo."); }
    finally { lock.current = false; setSaving(false); }
  };
  const input = (key: string, label: string, numeric = false, min = 0) => <Field key={key} label={label} name={key} value={editor?.values[key] ?? ""} type={numeric ? "number" : "text"} min={numeric ? min : undefined} step={numeric ? 1 : undefined} required disabled={saving} error={errors[key]} aria-invalid={Boolean(errors[key])} onChange={(event) => change(key, event.target.value)} />;

  return <div className="configuration-page">
    <header className="configuration-heading"><div><p className="eyebrow">MODULE 2 · CHÍNH SÁCH & CẤU HÌNH</p><h1>{titles[kind]}</h1><p>{descriptions[kind]}</p></div><Badge tone={admin ? "brand" : "info"}>{admin ? "QUẢN TRỊ VIÊN" : "LIBRARIAN · CHỈ XEM"}</Badge></header>
    <nav className="configuration-tabs" aria-label="Chính sách và cấu hình">
      {(["policies", "penalty-types", ...(admin ? ["search-configs"] : [])] as ConfigurationKind[]).map((item) => <NavLink key={item} to={`/${role}/${item}`}>{titles[item]}</NavLink>)}
    </nav>
    <div className="configuration-note"><Icon name="info" size={20} /><p><strong>Bản demo giao diện.</strong> Dữ liệu chỉ lưu trong bộ nhớ; refresh sẽ khôi phục mẫu. Quyền Admin/Staff dựa trên portal, chưa phải bảo mật thực tế.</p></div>
    <details className="configuration-demo"><summary>Kiểm tra trạng thái demo</summary><div><SelectField label="Trạng thái tải dữ liệu" value={mode} onChange={(event) => setMode(event.target.value as DemoMode)}><option value="ready">Bình thường</option><option value="empty">Danh sách rỗng</option><option value="error">Lỗi tải dữ liệu</option></SelectField>{admin && <label className="configuration-checkbox"><input type="checkbox" checked={failSave} onChange={(event) => setFailSave(event.target.checked)} />Mô phỏng lỗi khi lưu / kích hoạt</label>}</div></details>
    {kind === "search-configs" && <p className="configuration-help">Kích hoạt chỉ đổi cấu hình mặc định, không tự lập chỉ mục lại. Tên model trong bảng là dữ liệu minh họa.</p>}
    <section className="configuration-panel" aria-label={titles[kind]} aria-busy={status === "loading"}>
      <div className="configuration-toolbar"><div><h2>Danh sách {titles[kind].toLocaleLowerCase("vi-VN")}</h2><p>{status === "ready" ? `${count} bản ghi demo` : "Đang kiểm tra dữ liệu demo"}</p></div>{admin && kind === "penalty-types" && status === "ready" && <Button icon="plus" onClick={() => open()}>Thêm loại phạt</Button>}</div>
      {status === "loading" ? <div className="configuration-state" role="status"><span className="spinner" /><h3>Đang tải dữ liệu demo…</h3></div>
        : status === "error" ? <div className="configuration-state" role="alert"><Icon name="error" size={30} /><h3>Không thể tải danh sách</h3><p>{loadError}</p><Button onClick={() => setMode("ready")}>Thử lại</Button></div>
        : count === 0 ? <div className="configuration-state"><Icon name="document" size={30} /><h3>Chưa có dữ liệu</h3><p>Đây là trạng thái rỗng mô phỏng, không xóa các bản ghi đã lưu.</p><Button variant="secondary" onClick={() => setMode("ready")}>Xem dữ liệu mẫu</Button></div>
        : <div className="configuration-table-scroll" tabIndex={0} role="region" aria-label="Bảng dữ liệu, có thể cuộn ngang"><table className="configuration-table"><thead><tr>
          {(kind === "policies" ? ["Loại độc giả", "Loại tài liệu", "Ngày mượn", "Số lượng tối đa", "Lần gia hạn", "Giữ chờ (ngày)"] : kind === "penalty-types" ? ["Mã loại phạt", "Tên loại phạt", "Đơn vị tính", "Đơn giá"] : ["Cấu hình", "Chunk size", "Overlap", "Strategy", "Embedding model", "Dimensions", "Trạng thái"]).map((label) => <th key={label} scope="col">{label}</th>)}{admin && <th scope="col">Thao tác</th>}
        </tr></thead><tbody>
          {kind === "policies" && policies.map((item) => <tr key={item.id}><th scope="row">{userTypeLabels[item.userType]}<small>{item.userType}</small></th><td><code>{item.docType}</code></td><td>{item.loanDays} ngày</td><td>{item.maxLoans} tài liệu</td><td>{item.maxRenewals} lần</td><td>{item.holdExpiryDays} ngày</td>{admin && <td><Button size="sm" variant="secondary" aria-label={`Sửa chính sách ${userTypeLabels[item.userType]} ${item.docType}`} onClick={() => open(item.id)}>Chỉnh sửa</Button></td>}</tr>)}
          {kind === "penalty-types" && penalties.map((item) => <tr key={item.id}><th scope="row"><code>{item.code}</code></th><td>{item.name}</td><td>{item.unitName}</td><td className="configuration-money">{item.unitPrice.toLocaleString("vi-VN")} ₫</td>{admin && <td><Button size="sm" variant="secondary" aria-label={`Sửa loại phạt ${item.code}`} onClick={() => open(item.id)}>Chỉnh sửa</Button></td>}</tr>)}
          {kind === "search-configs" && configs.map((item) => <tr key={item.id} className={item.isActive ? "configuration-active-row" : ""}><th scope="row">#{item.id}</th><td>{item.chunkSize}</td><td>{item.overlap}</td><td>{item.strategy}</td><td className="configuration-model"><code>{item.embeddingModel}</code></td><td>{item.vectorDimensions}</td><td><Badge tone={item.isActive ? "success" : "neutral"}>{item.isActive ? "Đang active" : "Chưa active"}</Badge></td><td><Button size="sm" variant="secondary" disabled={item.isActive} aria-label={`Kích hoạt cấu hình ${item.id}`} onClick={() => { setSaveError(""); setActivation(item.id); }}>{item.isActive ? "Đang sử dụng" : "Kích hoạt"}</Button></td></tr>)}
        </tbody></table></div>}
    </section>
    {notice && <div className="configuration-notice"><Toast title="Cập nhật demo thành công" onClose={() => setNotice("")}>{notice}</Toast></div>}
    <Modal open={modalOpen} onClose={close} title={activation !== null ? "Kích hoạt cấu hình tìm kiếm?" : kind === "policies" ? "Chỉnh sửa chính sách" : editor?.id ? "Chỉnh sửa loại phạt" : "Thêm loại phạt"} eyebrow="CẬP NHẬT DỮ LIỆU DEMO" className="configuration-modal">
      <div ref={dialog}>
        <label className="configuration-checkbox configuration-save-demo"><input type="checkbox" checked={failSave} disabled={saving} onChange={(event) => setFailSave(event.target.checked)} />Mô phỏng lỗi khi lưu / kích hoạt</label>
        {saveError && <p className="configuration-form-error" role="alert">{saveError}</p>}
        {activation !== null ? <><p>Bạn muốn sử dụng cấu hình <strong>#{activation}</strong> làm mặc định? Các cấu hình khác sẽ chuyển về chưa active.</p><p className="configuration-help">Thao tác chỉ cập nhật dữ liệu demo, không lập chỉ mục lại.</p><div className="modal-actions"><Button variant="ghost" disabled={saving} onClick={close}>Hủy</Button><Button loading={saving} onClick={activate}>Xác nhận kích hoạt</Button></div></>
          : editor && <form noValidate onSubmit={(event) => { event.preventDefault(); void save(); }}>
            <div className="configuration-form-grid"><fieldset disabled={saving}>
              {kind === "policies" ? <><SelectField label="Loại độc giả" name="userType" value={editor.values.userType} error={errors.userType} aria-invalid={Boolean(errors.userType)} onChange={(event) => change("userType", event.target.value)}><option value="">Chọn loại độc giả</option>{Object.entries(userTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>{input("docType", "Mã loại tài liệu")}<p className="configuration-field-note">Mã loại tài liệu là dữ liệu minh họa, ví dụ BOOK, THESIS.</p>{numericPolicyFields.map(([key, label, min]) => input(key, label, true, min))}</>
                : <>{input("code", "Mã loại phạt (tối đa 50 ký tự)")}{input("name", "Tên loại phạt (tối đa 255 ký tự)")}{input("unitName", "Đơn vị tính (tối đa 50 ký tự)")}{input("unitPrice", "Đơn giá (VNĐ)", true)}</>}
            </fieldset></div><div className="modal-actions"><Button type="button" variant="ghost" disabled={saving} onClick={close}>Hủy</Button><Button type="submit" loading={saving}>Lưu dữ liệu demo</Button></div>
          </form>}
      </div>
    </Modal>
  </div>;
}
