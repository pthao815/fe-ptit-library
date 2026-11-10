import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Badge, Breadcrumb, Button, Field, Icon, IconButton, Modal, SelectField, Status, TextAreaField } from "../../../design-system";
import { catalogService } from "../../../services/catalog.service";
import { userService } from "../../../services/user.service";
import { ApiError } from "../../../services/http";
import { authSession } from "../../../shared/auth/auth-session";
import { getAccessToken } from "../../../services/session";
import type { DepartmentDto, DocumentRequestDto, PhysicalCopyDto } from "../../../types/api";
import { describeProcessing, formatFileSize, MAX_PDF_SIZE_MB, nextPdfVersion, validatePdfFile } from "./digital-copy";

type CopyDraft = {
  key: number;
  id?: string;
  barcode: string;
  callNumber: string;
  shelfLocation: string;
  status: string;
  condition: string;
  accessionDate?: string;
};

type CurrentDigital = { fileName?: string; status?: string; pageCount?: number };
type UploadState = { jobId: number; fileName: string; jobStatus?: string; copyStatus?: string; error?: string };

const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const emptyRecord = {
  title: "", isbn: "", authors: "", publisher: "", year: "", abstractText: "", docType: "",
  classificationNumber: "", language: "", coverUrl: "", origin: "", physicalDescription: "",
};
type RecordField = keyof typeof emptyRecord;

const docTypes: Record<string, string> = { textbook: "Giáo trình", slide: "Bài giảng", reference: "Sách tham khảo" };
const languages: Record<string, string> = { vi: "Tiếng Việt", en: "Tiếng Anh", fr: "Tiếng Pháp" };
const copyStatuses: Record<string, string> = {
  AVAILABLE: "Có sẵn", BORROWED: "Đang mượn", RESERVED: "Đang giữ",
  LOST: "Mất", DAMAGED: "Hư hỏng", MAINTENANCE: "Bảo trì",
};
// Đang mượn / Đang giữ chỉ do nghiệp vụ lưu thông đặt, không cho chọn tay trên form biên mục
const circulationLocked = new Set(["BORROWED", "RESERVED"]);
const editableStatuses = Object.fromEntries(Object.entries(copyStatuses).filter(([code]) => !circulationLocked.has(code)));
const conditions = ["Tốt", "Hư hỏng nhẹ", "Hư hỏng nặng"];
const POLL_MS = 3000;

/** Danh sách lựa chọn, giữ thêm giá trị hiện tại nếu nó nằm ngoài danh sách. */
function optionsWith(labels: Record<string, string>, current: string) {
  return Object.entries(current && !(current in labels) ? { ...labels, [current]: current } : labels);
}

function toDraft(copy: PhysicalCopyDto, key: number): CopyDraft {
  return {
    key, id: copy.id, barcode: copy.barcode, callNumber: copy.callNumber ?? "",
    shelfLocation: copy.shelfLocation ?? "", status: copy.status ?? "",
    condition: copy.condition ?? "", accessionDate: copy.accessionDate,
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Yêu cầu thất bại.";
}

function outcomeUnknown(error: unknown) {
  return !(error instanceof ApiError) || [0, 408].includes(error.status) || error.status >= 500;
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString("vi-VN") : "Khi lưu";
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
  const [digital, setDigital] = useState<CurrentDigital>();
  const [pdf, setPdf] = useState<File>();
  const [pdfError, setPdfError] = useState("");
  const [upload, setUpload] = useState<UploadState>();
  const [updatedAt, setUpdatedAt] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const [removing, setRemoving] = useState<CopyDraft>();
  const [removeError, setRemoveError] = useState("");
  const [removeBusy, setRemoveBusy] = useState(false);
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
        coverUrl: detail.coverUrl ?? "", origin: detail.origin ?? "",
        physicalDescription: detail.physicalDescription ?? "",
      });
      setDepartmentIds(detail.departmentIds ?? []);
      setDigital(detail.hasDigitalCopy
        ? { fileName: detail.digitalFileName, status: detail.digitalProcessingStatus, pageCount: detail.pageCount }
        : undefined);
      setUpdatedAt(detail.updatedAt);
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

  // Theo dõi tiến trình bóc tách PDF cho tới khi job kết thúc
  const uploadJobId = upload?.jobId;
  const uploadFinished = upload ? describeProcessing(upload.jobStatus, upload.copyStatus).finished || Boolean(upload.error) : true;
  useEffect(() => {
    if (!uploadJobId || uploadFinished) return;
    let active = true;
    const timer = window.setInterval(() => {
      catalogService.getProcessingStatus(uploadJobId).then((status) => {
        if (!active) return;
        setUpload((current) => current && current.jobId === uploadJobId
          ? { ...current, jobStatus: status.status, copyStatus: status.digitalCopyStatus, error: status.errorMessage || undefined }
          : current);
        if (status.digitalCopyStatus) {
          setDigital((current) => ({ ...current, status: status.digitalCopyStatus, pageCount: status.pageCount ?? current?.pageCount }));
        }
      }).catch(() => {
        // Lỗi mạng tạm thời: thử lại ở lượt sau
      });
    }, POLL_MS);
    return () => { active = false; window.clearInterval(timer); };
  }, [uploadJobId, uploadFinished]);

  function change(field: RecordField, value: string) {
    setRecord((previous) => ({ ...previous, [field]: value }));
    setMessage("");
  }

  function updateCopy(key: number, field: "barcode" | "callNumber" | "shelfLocation" | "status" | "condition", value: string) {
    setCopies((rows) => rows.map((row) => row.key === key ? { ...row, [field]: value } : row));
    setMessage("");
  }

  async function choosePdf(file?: File) {
    setPdfError("");
    if (!file) return;
    const problem = await validatePdfFile(file);
    if (problem) {
      setPdf(undefined);
      setPdfError(problem);
    } else {
      setPdf(file);
      setMessage("");
    }
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
    const text = (value: string) => value.trim() || undefined;
    const payload: DocumentRequestDto = {
      title: record.title.trim(), isbn: text(record.isbn),
      authors: record.authors.split(",").map((name) => name.trim()).filter(Boolean),
      publisher: text(record.publisher),
      publicationYear: record.year ? Number(record.year) : undefined,
      abstractText: text(record.abstractText), docType: text(record.docType),
      classificationNumber: text(record.classificationNumber), language: text(record.language),
      coverUrl: text(record.coverUrl), origin: text(record.origin),
      physicalDescription: text(record.physicalDescription), departmentIds,
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
          documentId: target, barcode: copy.barcode.trim(), callNumber: text(copy.callNumber),
          shelfLocation: text(copy.shelfLocation), status: copy.status || undefined, condition: copy.condition || undefined,
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
        const uploaded = await catalogService.uploadPdf(target, pdf, nextPdfVersion(Boolean(digital)));
        setUpload({ jobId: uploaded.jobId, fileName: uploaded.fileName ?? pdf.name, jobStatus: uploaded.jobStatus, copyStatus: uploaded.processingStatus });
        setDigital({ fileName: uploaded.fileName ?? pdf.name, status: uploaded.processingStatus });
        setPdf(undefined);
        setMessage("Đã lưu tài liệu. Tệp PDF đang được xử lý, trạng thái cập nhật bên dưới.");
      } else {
        setMessage("Đã lưu tài liệu.");
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

  const processing = digital ? describeProcessing(upload?.jobStatus, digital.status) : undefined;
  const chosenDepartments = departments.filter((unit) => departmentIds.includes(unit.id));
  async function removeSavedCopy() {
    const target = removing;
    if (!target?.id || removeBusy) return;
    setRemoveBusy(true);
    setRemoveError("");
    try {
      await catalogService.deletePhysicalCopy(target.id);
      savedCopies.current.delete(target.key);
      setCopies((rows) => rows.filter((row) => row.key !== target.key));
      setRemoving(undefined);
      setMessage(`Đã xóa bản giấy ${target.barcode}.`);
    } catch (cause) {
      setRemoveError(errorMessage(cause));
    } finally {
      setRemoveBusy(false);
    }
  }

  const checklist = [
    { label: "Thông tin cơ bản", done: Boolean(record.title.trim() && record.authors.trim()) },
    { label: "Khoa/ngành", done: departmentIds.length > 0 },
    { label: "Bản giấy", done: copies.length > 0 && copies.every((copy) => copy.barcode.trim()) },
    { label: "Tài liệu số", done: Boolean(digital || pdf) },
  ];

  // Form "Thêm" sau lần lưu đầu tiên đã có biểu ghi thật, hiển thị như đang sửa
  const saved = edit || Boolean(documentId.current);
  return <div className="record-form-page">
    <div className="record-form-heading">
      <div>
        <Breadcrumb items={[{ label: "Quản lý tài liệu", to: base + search }, saved ? "Chỉnh sửa biểu ghi" : "Thêm tài liệu"]} />
        <p className="eyebrow">BIÊN MỤC TÀI LIỆU</p>
        <h1>{saved ? "Chỉnh sửa biểu ghi thư mục" : "Thêm biểu ghi thư mục"}</h1>
        <p>{edit
          ? `Cập nhật lần cuối ${updatedAt ? new Date(updatedAt).toLocaleString("vi-VN") : "—"}`
          : saved ? "Biểu ghi vừa được tạo. Các lần lưu tiếp theo sẽ cập nhật biểu ghi này." : "Tạo biểu ghi dùng chung cho bản giấy và tài liệu số."}</p>
      </div>
      <Badge tone={saved ? "success" : "warning"}>{saved ? "ĐÃ LƯU" : "BẢN GHI MỚI"}</Badge>
    </div>

    {loading ? <p role="status" className="form-success-summary">Đang tải dữ liệu…</p> : loadError ? (
      <div role="alert" className="form-error-summary">
        <Icon name="error" />
        <div><strong>Không tải được biểu ghi</strong><p>{loadError}</p></div>
        <Button size="sm" onClick={() => setRevision((value) => value + 1)}>Thử lại</Button>
      </div>
    ) : <form onSubmit={(event) => { event.preventDefault(); void save(); }}>
      {error && <div role="alert" className="form-error-summary"><Icon name="error" /><div><strong>Không thể lưu tài liệu</strong><p>{error}</p></div></div>}
      {uncertain && documentId.current && <p className="form-error-summary"><Link to={base + "/edit/" + documentId.current}>Đối soát biểu ghi đã lưu</Link></p>}
      {message && <div role="status" className="form-success-summary"><Icon name="success" /><span>{message}</span></div>}

      <div className="record-form-layout">
        <fieldset className="record-form-main" disabled={saving} style={{ border: 0, padding: 0, margin: 0 }}>
          <section className="record-form-section">
            <header><span>01</span><div><h2>Thông tin thư mục</h2><p>Thông tin mô tả và định danh chính của tài liệu.</p></div><Badge tone="error">BẮT BUỘC</Badge></header>
            <div className="bibliographic-form-grid">
              <Field fieldClassName="span-2" label="Nhan đề *" required value={record.title} onChange={(event) => change("title", event.target.value)} placeholder="Nhập nhan đề chính của tài liệu" />
              <Field fieldClassName="span-2" label="Tác giả" value={record.authors} onChange={(event) => change("authors", event.target.value)} placeholder="Nhiều tác giả phân cách bằng dấu phẩy" />
              <SelectField label="Dạng tài liệu" value={record.docType} onChange={(event) => change("docType", event.target.value)}>
                <option value="">Chọn dạng tài liệu</option>
                {optionsWith(docTypes, record.docType).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </SelectField>
              <Field label="ISBN" value={record.isbn} onChange={(event) => change("isbn", event.target.value)} placeholder="978-604-..." />
              <SelectField label="Ngôn ngữ" value={record.language} onChange={(event) => change("language", event.target.value)}>
                <option value="">Chọn ngôn ngữ</option>
                {optionsWith(languages, record.language).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </SelectField>
              <Field label="Ký hiệu phân loại" value={record.classificationNumber} onChange={(event) => change("classificationNumber", event.target.value)} placeholder="VD: 005.1 NG-T 2024" />
              <Field label="Nhà xuất bản" value={record.publisher} onChange={(event) => change("publisher", event.target.value)} placeholder="VD: NXB Thông tin và Truyền thông" />
              <Field label="Năm xuất bản" type="number" min={1000} max={9999} value={record.year} onChange={(event) => change("year", event.target.value)} placeholder="YYYY" />
              <Field fieldClassName="span-2" label="Nguồn gốc" value={record.origin} onChange={(event) => change("origin", event.target.value)} placeholder="VD: Mua, biếu tặng, lưu chiểu..." />
              <Field fieldClassName="span-2" label="Mô tả vật lý" value={record.physicalDescription} onChange={(event) => change("physicalDescription", event.target.value)} placeholder="Số trang, minh họa, kích thước..." />
              <TextAreaField fieldClassName="span-2" label="Tóm tắt" value={record.abstractText} onChange={(event) => change("abstractText", event.target.value)} rows={7} placeholder="Nhập tóm tắt nội dung tài liệu..." hint={`${record.abstractText.length.toLocaleString("vi-VN")} ký tự`} />
              <div className="cover-field span-2">
                <span className="field-label">Ảnh bìa</span>
                <div className="cover-field-body">
                  {record.coverUrl.trim()
                    ? <img src={record.coverUrl.trim()} alt="Ảnh bìa" />
                    : <span className="cover-placeholder"><Icon name="book" size={28} /></span>}
                  <Field label="Đường dẫn ảnh bìa" type="url" value={record.coverUrl} onChange={(event) => change("coverUrl", event.target.value)} placeholder="https://..." hint="Chưa hỗ trợ tải tệp ảnh lên, hãy dán đường dẫn tới ảnh bìa." />
                </div>
              </div>
            </div>
          </section>

          <section className="record-form-section">
            <header><span>02</span><div><h2>Khoa/ngành</h2><p>Một biểu ghi có thể thuộc nhiều khoa/ngành.</p></div><Badge>{departmentIds.length} ĐÃ CHỌN</Badge></header>
            <div className="program-selector">
              <div className="selected-programs">
                {chosenDepartments.length > 0
                  ? chosenDepartments.map((unit) => <button type="button" key={unit.id} onClick={() => setDepartmentIds((ids) => ids.filter((value) => value !== unit.id))}>{unit.name}<Icon name="close" size={13} /></button>)
                  : <span>Chưa chọn khoa/ngành</span>}
              </div>
              <div className="program-options">
                {departments.filter((unit) => !departmentIds.includes(unit.id)).map((unit) => <button type="button" key={unit.id} onClick={() => setDepartmentIds((ids) => [...ids, unit.id])}><Icon name="plus" size={14} />{unit.name}</button>)}
              </div>
            </div>
          </section>

          <section className="record-form-section">
            <header>
              <span>03</span><div><h2>Bản giấy</h2><p>Quản lý các bản in vật lý thuộc biểu ghi.</p></div>
              <Button type="button" variant="secondary" size="sm" icon="plus" onClick={() => {
                const key = ++nextKey.current;
                setCopies((rows) => [...rows, { key, barcode: "", callNumber: record.classificationNumber, shelfLocation: "", status: "AVAILABLE", condition: "Tốt" }]);
              }}>Thêm bản giấy</Button>
            </header>
            {copies.length === 0 ? <p className="record-form-empty"><Icon name="info" size={16} />Chưa có bản giấy nào. Bấm "Thêm bản giấy" để nhập bản in đầu tiên.</p> : (
              <div className="copy-editor-wrap"><table className="copy-editor">
                <colgroup><col style={{ width: "25%" }} /><col style={{ width: "13%" }} /><col style={{ width: "13%" }} /><col style={{ width: "17%" }} /><col style={{ width: "15%" }} /><col style={{ width: "11%" }} /><col style={{ width: 52 }} /></colgroup>
                <thead><tr><th>Mã vạch *</th><th>Mã xếp giá</th><th>Vị trí kệ</th><th>Tình trạng</th><th>Lưu thông</th><th>Nhập kho</th><th aria-label="Thao tác" /></tr></thead>
                <tbody>{copies.map((copy) => <tr key={copy.key}>
                  <td><input aria-label="Mã vạch" value={copy.barcode} onChange={(event) => updateCopy(copy.key, "barcode", event.target.value)} placeholder="PTIT-YY-XXXXX" /></td>
                  <td><input aria-label="Mã xếp giá" value={copy.callNumber} onChange={(event) => updateCopy(copy.key, "callNumber", event.target.value)} /></td>
                  <td><input aria-label="Vị trí kệ" value={copy.shelfLocation} onChange={(event) => updateCopy(copy.key, "shelfLocation", event.target.value)} placeholder="A2-03" /></td>
                  <td><select aria-label="Tình trạng vật lý" value={copy.condition} onChange={(event) => updateCopy(copy.key, "condition", event.target.value)}>
                    <option value="">Chưa đánh giá</option>
                    {[...new Set([...conditions, copy.condition].filter(Boolean))].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select></td>
                  <td>{circulationLocked.has(savedCopies.current.get(copy.key)?.status ?? "")
                    ? <select aria-label="Trạng thái lưu thông" value={copy.status} disabled title="Trạng thái này do nghiệp vụ mượn trả quản lý">
                        <option value={copy.status}>{copyStatuses[copy.status] ?? copy.status}</option>
                      </select>
                    : <select aria-label="Trạng thái lưu thông" value={copy.status} onChange={(event) => updateCopy(copy.key, "status", event.target.value)}>
                        {optionsWith(editableStatuses, copy.status).map(([code, label]) => <option key={code} value={code}>{copyStatuses[code] ?? label}</option>)}
                      </select>}</td>
                  <td>{formatDate(copy.accessionDate)}</td>
                  <td>{copy.id
                    ? <IconButton label={`Xóa bản giấy ${copy.barcode}`} icon="close" type="button"
                        disabled={circulationLocked.has(savedCopies.current.get(copy.key)?.status ?? "")}
                        onClick={() => { setRemoveError(""); setRemoving(savedCopies.current.get(copy.key) ?? copy); }} />
                    : <IconButton label="Bỏ dòng mới" icon="close" type="button" onClick={() => setCopies((rows) => rows.filter((row) => row.key !== copy.key))} />}</td>
                </tr>)}</tbody>
              </table></div>
            )}
          </section>

          <section className="record-form-section">
            <header><span>04</span><div><h2>Tài liệu số</h2><p>Tải lên tệp PDF để đọc trực tuyến và tìm kiếm toàn văn.</p></div><Badge tone="info">{digital ? "ĐÃ CÓ BẢN SỐ" : "CHƯA CÓ"}</Badge></header>
            {digital && processing && <div className="digital-file-editor">
              <article>
                <span className="file-icon">PDF</span>
                <div><strong>{digital.fileName || upload?.fileName || "Bản số hiện hành"}</strong><small>{digital.pageCount ? `${digital.pageCount} trang` : "Bản hiện hành"}</small></div>
                <div />
                <Status tone={processing.tone}>{processing.label}</Status>
                <span />
              </article>
            </div>}
            {upload?.error && <p className="section-error" style={{ paddingTop: 12 }}><Icon name="error" size={14} />{upload.error}</p>}
            <label className="digital-upload-zone">
              <input type="file" accept=".pdf,application/pdf" onChange={(event) => { void choosePdf(event.target.files?.[0]); event.target.value = ""; }} />
              <span><Icon name="document" size={26} /></span>
              <strong>{digital ? "Chọn tệp PDF mới để thay bản hiện hành" : "Chọn tệp PDF từ máy tính"}</strong>
              <small>PDF · Tối đa {MAX_PDF_SIZE_MB} MB · Tệp được tải lên khi bấm "Lưu tài liệu"</small>
              <b className="btn btn-secondary btn-sm">Chọn tệp</b>
            </label>
            {pdfError && <p className="section-error"><Icon name="error" size={14} />{pdfError}</p>}
            {pdf && <div className="digital-file-editor" style={{ margin: "0 22px 22px" }}>
              <article>
                <span className="file-icon">PDF</span>
                <div><strong>{pdf.name}</strong><small>{formatFileSize(pdf.size)}</small></div>
                <div />
                <Status tone="warning">Chờ lưu</Status>
                <IconButton label="Bỏ tệp" icon="close" type="button" onClick={() => setPdf(undefined)} />
              </article>
            </div>}
          </section>
        </fieldset>

        <aside className="record-form-aside">
          <div>
            <p>TRẠNG THÁI BIỂU GHI</p>
            <Status tone={documentId.current ? "success" : "warning"}>{documentId.current ? "Đã lưu" : "Chưa lưu"}</Status>
            <dl>
              <div><dt>Mã biểu ghi</dt><dd>{documentId.current ? documentId.current.slice(0, 8).toUpperCase() : "Tạo sau khi lưu"}</dd></div>
              <div><dt>Số bản giấy</dt><dd>{copies.length}</dd></div>
              <div><dt>Tài liệu số</dt><dd>{processing ? processing.label : pdf ? "Chờ lưu" : "Chưa có"}</dd></div>
            </dl>
          </div>
          <div className="form-checklist">
            <p>KIỂM TRA NHANH</p>
            {checklist.map((item) => <span key={item.label} className={item.done ? "complete" : ""}><Icon name={item.done ? "success" : "info"} size={14} />{item.label}</span>)}
          </div>
        </aside>
      </div>

      <div className="record-form-actions">
        <div><span><Icon name="info" size={14} />Các trường có dấu * là bắt buộc</span></div>
        <Button type="button" variant="ghost" disabled={saving} onClick={() => navigate(base + search)}>Về danh sách</Button>
        <Button type="submit" loading={saving} disabled={uncertain}>Lưu tài liệu</Button>
      </div>
    </form>}

    <Modal open={Boolean(removing)} onClose={() => { if (!removeBusy) setRemoving(undefined); }} title="Xóa bản giấy">
      <div className="catalog-delete-warning">
        <span><Icon name="error" size={24} /></span>
        <div><strong>Xóa bản giấy {removing?.barcode}?</strong><p>Bản giấy sẽ không còn xuất hiện trong kho và không thể cho mượn.</p></div>
      </div>
      <p className="delete-explanation">Không xóa được bản đang được mượn hoặc đang giữ cho bạn đọc. Mã vạch có thể dùng lại cho bản khác sau khi xóa.</p>
      {removeError && <p role="alert" className="form-error-summary">{removeError}</p>}
      <div className="modal-actions">
        <Button variant="ghost" disabled={removeBusy} onClick={() => setRemoving(undefined)}>Hủy</Button>
        <Button variant="danger" loading={removeBusy} onClick={() => void removeSavedCopy()}>Xóa bản giấy</Button>
      </div>
    </Modal>
  </div>;
}
