import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Breadcrumb, Button, Field, TextAreaField } from "../../../design-system";
import { catalogService } from "../../../services/catalog.service";
import { userService } from "../../../services/user.service";
import { ApiError } from "../../../services/http";
import { authSession } from "../../../shared/auth/auth-session";
import { getAccessToken } from "../../../services/session";
import type { DepartmentDto, DocumentRequestDto, PhysicalCopyDto } from "../../../types/api";

type CopyDraft = {
  key: number;
  id?: string;
  barcode: string;
  callNumber: string;
  shelfLocation: string;
  status: string;
};

const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const emptyRecord = {
  title: "", isbn: "", authors: "", publisher: "", year: "", abstractText: "",
  docType: "", classificationNumber: "", language: "", coverUrl: "",
};
const copyStatuses = ["AVAILABLE", "BORROWED", "RESERVED", "LOST", "DAMAGED", "MAINTENANCE"];

function toDraft(copy: PhysicalCopyDto, key: number): CopyDraft {
  return {
    key, id: copy.id, barcode: copy.barcode, callNumber: copy.callNumber ?? "",
    shelfLocation: copy.shelfLocation ?? "", status: copy.status ?? "",
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Yêu cầu thất bại.";
}

function outcomeUnknown(error: unknown) {
  return !(error instanceof ApiError) || [0, 408].includes(error.status) || error.status >= 500;
}

export default function BibliographicRecordForm({ edit = false }: { edit?: boolean }) {
  const { id } = useParams();
  return <RecordEditor key={edit ? id ?? "invalid" : "new"} edit={edit} id={id} />;
}

function RecordEditor({ edit, id }: { edit: boolean; id?: string }) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const base = pathname.startsWith("/admin/") ? "/admin/materials" : "/staff/materials";
  const [record, setRecord] = useState(emptyRecord);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [departmentIds, setDepartmentIds] = useState<number[]>([]);
  const [copies, setCopies] = useState<CopyDraft[]>([]);
  const [pdf, setPdf] = useState<File>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const documentId = useRef(edit ? id : undefined);
  const nextKey = useRef(0);
  const submitting = useRef(false);
  const savedCopies = useRef(new Map<number, CopyDraft>());

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    async function load() {
      if (edit && (!id || !uuidPattern.test(id))) throw new Error("UUID tài liệu không hợp lệ.");
      const [units, detail, physical] = await Promise.all([
        userService.getDepartments(),
        edit && id ? catalogService.getDocumentDetails(id) : undefined,
        edit && id ? catalogService.getPhysicalCopies(id) : [],
      ]);
      if (!active) return;
      setDepartments(units);
      if (!detail) return;
      setRecord({
        title: detail.title, isbn: detail.isbn ?? "", authors: detail.authors?.join(", ") ?? "",
        publisher: detail.publisher ?? "", year: detail.publicationYear?.toString() ?? "",
        abstractText: detail.abstractText ?? "", docType: detail.docType ?? "",
        classificationNumber: detail.classificationNumber ?? "", language: detail.language ?? "",
        coverUrl: detail.coverUrl ?? "",
      });
      setDepartmentIds(detail.departmentIds ?? []);
      const drafts = physical.map((copy) => toDraft(copy, ++nextKey.current));
      savedCopies.current = new Map(drafts.map((copy) => [copy.key, copy]));
      setCopies(drafts);
    }
    load().catch((cause) => {
      if (active) setLoadError(errorMessage(cause));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [edit, id, revision]);

  function change(field: keyof typeof emptyRecord, value: string) {
    setRecord((previous) => ({ ...previous, [field]: value }));
    setMessage("");
  }

  async function save() {
    if (submitting.current || uncertain) return;
    setError("");
    setMessage("");
    if (!getAccessToken()) return setError("Vui lòng đăng nhập trước khi lưu.");
    if (!record.title.trim()) return setError("Vui lòng nhập nhan đề.");
    if (record.year && !/^[1-9][0-9]{3}$/.test(record.year)) return setError("Năm xuất bản phải từ 1000 đến 9999.");
    const barcodes = copies.map((copy) => copy.barcode.trim());
    if (barcodes.some((barcode) => !barcode) || new Set(barcodes).size !== barcodes.length) {
      return setError("Mỗi bản giấy cần có mã vạch riêng.");
    }
    if (pdf && (!pdf.name.toLowerCase().endsWith(".pdf") || pdf.size === 0 || pdf.size > 100 * 1024 * 1024)) {
      return setError("Chọn tệp PDF có dung lượng từ 1 byte đến 100 MB.");
    }
    const payload: DocumentRequestDto = {
      title: record.title.trim(), isbn: record.isbn.trim() || undefined,
      authors: record.authors.split(",").map((name) => name.trim()).filter(Boolean),
      publisher: record.publisher.trim() || undefined,
      publicationYear: record.year ? Number(record.year) : undefined,
      abstractText: record.abstractText.trim() || undefined, docType: record.docType.trim() || undefined,
      classificationNumber: record.classificationNumber.trim() || undefined,
      language: record.language.trim() || undefined, coverUrl: record.coverUrl.trim() || undefined,
      departmentIds,
    };
    submitting.current = true;
    setSaving(true);
    let stage = "biểu ghi";
    let documentSaved = false;
    let copiesSaved = 0;
    let creating = !documentId.current;
    const { identityVersion } = authSession.getSnapshot();
    const ensureSession = () => {
      if (authSession.getSnapshot().identityVersion !== identityVersion) throw new ApiError("Phiên đã thay đổi. Kiểm tra dữ liệu trước khi tiếp tục.", 401);
    };
    try {
      const target = documentId.current
        ? await catalogService.updateDocument(documentId.current, payload)
        : await catalogService.createDocument(payload);
      documentId.current = target;
      documentSaved = true;
      for (const copy of copies) {
        if (JSON.stringify(copy) === JSON.stringify(savedCopies.current.get(copy.key))) continue;
        ensureSession();
        stage = `bản giấy ${copy.barcode}`;
        creating = !copy.id;
        const copyPayload = {
          documentId: target, barcode: copy.barcode.trim(), callNumber: copy.callNumber.trim() || undefined,
          shelfLocation: copy.shelfLocation.trim() || undefined, status: copy.status || undefined,
        };
        const saved = copy.id
          ? await catalogService.updatePhysicalCopy(copy.id, copyPayload)
          : await catalogService.createPhysicalCopy(copyPayload);
        const updated = toDraft(saved, copy.key);
        savedCopies.current.set(copy.key, updated);
        copiesSaved++;
        setCopies((previous) => previous.map((row) => row.key === copy.key ? updated : row));
      }
      if (pdf) {
        ensureSession();
        stage = "tệp PDF";
        creating = true;
        const uploaded = await catalogService.uploadPdf(target, pdf);
        setPdf(undefined);
        setMessage(`Đã lưu biểu ghi, bản giấy và nhận tệp PDF. Mã tiến trình: ${uploaded.jobId}.`);
      } else {
        setMessage("Đã lưu biểu ghi và bản giấy.");
      }
    } catch (cause) {
      const unknown = creating && outcomeUnknown(cause);
      if (unknown) setUncertain(true);
      setError(`${documentSaved ? "Đã lưu biểu ghi. " : ""}${copiesSaved ? "Đã lưu " + copiesSaved + " bản giấy. " : ""}Không thể xác nhận lưu ${stage}: ${errorMessage(cause)}${unknown ? " Kiểm tra dữ liệu trong danh sách trước khi tạo lại." : ""}`);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return <div className="record-form-page">
    <Breadcrumb items={[{ label: "Quản lý tài liệu", to: base + search }, edit ? "Chỉnh sửa" : "Thêm mới"]} />
    <h1>{edit ? "Chỉnh sửa biểu ghi thư mục" : "Thêm biểu ghi thư mục"}</h1>
    {loading ? <p role="status">Đang tải dữ liệu…</p> : loadError ? (
      <div role="alert"><p>{loadError}</p><Button onClick={() => setRevision((value) => value + 1)}>Thử lại</Button></div>
    ) : <form onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <fieldset className="record-form-main" disabled={saving}>
        <section className="record-form-section">
          <header><h2>Thông tin biểu ghi</h2></header>
          <div className="bibliographic-form-grid">
            <Field label="Nhan đề" required value={record.title} onChange={(event) => change("title", event.target.value)} />
            <Field label="ISBN" value={record.isbn} onChange={(event) => change("isbn", event.target.value)} />
            <Field label="Tác giả (phân cách bằng dấu phẩy)" value={record.authors} onChange={(event) => change("authors", event.target.value)} />
            <Field label="Nhà xuất bản" value={record.publisher} onChange={(event) => change("publisher", event.target.value)} />
            <Field label="Năm xuất bản" type="number" min={1000} max={9999} value={record.year} onChange={(event) => change("year", event.target.value)} />
            <Field label="Mã loại tài liệu" value={record.docType} onChange={(event) => change("docType", event.target.value)} />
            <Field label="Mã phân loại" value={record.classificationNumber} onChange={(event) => change("classificationNumber", event.target.value)} />
            <Field label="Ngôn ngữ" value={record.language} onChange={(event) => change("language", event.target.value)} />
            <Field label="URL ảnh bìa" value={record.coverUrl} onChange={(event) => change("coverUrl", event.target.value)} />
            <TextAreaField label="Tóm tắt" value={record.abstractText} onChange={(event) => change("abstractText", event.target.value)} />
          </div>
          <fieldset className="program-selector"><legend>Khoa/ngành</legend>
            {departments.map((unit) => <label key={unit.id}>
              <input type="checkbox" checked={departmentIds.includes(unit.id)} onChange={(event) => {
                const checked = event.target.checked;
                setDepartmentIds((ids) => checked ? [...ids, unit.id] : ids.filter((value) => value !== unit.id));
              }} /> {unit.name}{" "}
            </label>)}
          </fieldset>
        </section>
        <section className="record-form-section">
          <header><h2>Bản giấy</h2></header>
          {copies.length === 0 && <p>Chưa có bản giấy.</p>}
          {copies.map((copy) => {
            const update = (field: "barcode" | "callNumber" | "shelfLocation" | "status", value: string) =>
              setCopies((rows) => rows.map((row) => row.key === copy.key ? { ...row, [field]: value } : row));
            return <fieldset key={copy.key} className="bibliographic-form-grid">
              <legend>{copy.id ? "Bản đã lưu" : "Bản mới"}</legend>
              <Field label="Mã vạch" required value={copy.barcode} onChange={(event) => update("barcode", event.target.value)} />
              <Field label="Mã xếp giá" value={copy.callNumber} onChange={(event) => update("callNumber", event.target.value)} />
              <Field label="Vị trí kệ" value={copy.shelfLocation} onChange={(event) => update("shelfLocation", event.target.value)} />
              <label>Trạng thái <select value={copy.status} onChange={(event) => update("status", event.target.value)}>
                {[...new Set([copy.status, ...copyStatuses])].map((status) => <option key={status} value={status}>{status || "Mặc định"}</option>)}
              </select></label>
              {!copy.id && <Button type="button" variant="ghost" onClick={() => setCopies((rows) => rows.filter((row) => row.key !== copy.key))}>Bỏ dòng mới</Button>}
            </fieldset>;
          })}
          <Button type="button" onClick={() => {
            const key = ++nextKey.current;
            setCopies((rows) => [...rows, { key, barcode: "", callNumber: "", shelfLocation: "", status: "AVAILABLE" }]);
          }}>Thêm bản giấy</Button>
        </section>
        <section className="record-form-section">
          <header><h2>Tài liệu số</h2></header>
          <label>Chọn PDF <input type="file" accept=".pdf,application/pdf" onChange={(event) => setPdf(event.target.files?.[0])} /></label>
          {pdf && <span> {pdf.name} <Button type="button" variant="ghost" onClick={() => setPdf(undefined)}>Bỏ tệp</Button></span>}
        </section>
      </fieldset>
      {error && <p role="alert" className="form-error-summary">{error}</p>}
      {uncertain && documentId.current && <Link to={base + "/edit/" + documentId.current}>Đối soát biểu ghi đã lưu</Link>}
      {message && <p role="status" className="form-success-summary">{message}</p>}
      <div className="record-form-actions">
        <Button type="button" variant="ghost" disabled={saving} onClick={() => navigate(base + search)}>Về danh sách</Button>
        <Button type="submit" disabled={saving || uncertain}>{saving ? "Đang lưu…" : "Lưu tài liệu"}</Button>
      </div>
    </form>}
  </div>;
}
