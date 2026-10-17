import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Badge, Breadcrumb, Button, Field, Icon, IconButton, SelectField, Status, TextAreaField } from "../../../design-system";
import BookCover from "../../../components/books/BookCover";
import { trainingPrograms } from "../../../constants/library-options";
import { detailBook } from "../../../data/books";

type CopyRow = {
  id: number;
  barcode: string;
  shelf: string;
  condition: string;
  circulation: string;
  received: string;
};

type DigitalFileRow = {
  id: number;
  name: string;
  size: string;
  access: string;
  status: string;
};

export default function BibliographicRecordForm({ edit = false }: { edit?: boolean }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: edit ? "Trí tuệ nhân tạo: Nền tảng và ứng dụng" : "",
    subtitle: edit ? "Nguyên lý, thuật toán và các bài toán thực tiễn" : "",
    author: edit ? "Nguyễn Thanh Thủy" : "",
    type: edit ? "Sách chuyên khảo" : "",
    isbn: edit ? "978-604-80-8932-1" : "",
    language: edit ? "Tiếng Việt" : "",
    classification: edit ? "005.1 NG-T 2024" : "",
    publicationPlace: edit ? "Hà Nội" : "",
    year: edit ? "2024" : "",
    physicalDescription: edit ? "386 trang : minh họa ; 24 cm" : "",
    summary: edit ? "Tài liệu trình bày các nền tảng quan trọng của trí tuệ nhân tạo, từ biểu diễn tri thức, tìm kiếm, học máy đến các ứng dụng trong giáo dục, y tế và công nghiệp." : "",
  });
  const [programs, setPrograms] = useState<string[]>(edit ? ["Công nghệ thông tin", "Khoa học máy tính", "An toàn thông tin"] : []);
  const [copies, setCopies] = useState<CopyRow[]>(edit ? [
    { id: 1, barcode: "PTIT-24-01842", shelf: "A2-03", condition: "Tốt", circulation: "Có sẵn", received: "2024-08-12" },
    { id: 2, barcode: "PTIT-24-01843", shelf: "A2-03", condition: "Tốt", circulation: "Đang mượn", received: "2024-08-12" },
  ] : [{ id: 1, barcode: "", shelf: "", condition: "Tốt", circulation: "Có sẵn", received: "2025-06-22" }]);
  const [digitalFiles, setDigitalFiles] = useState<DigitalFileRow[]>(edit ? [
    { id: 1, name: "tri-tue-nhan-tao-nen-tang-va-ung-dung.pdf", size: "24.8 MB", access: "Chỉ xem trực tuyến", status: "Đã xử lý" },
  ] : []);
  const [restricted, setRestricted] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedMessage, setSavedMessage] = useState("");

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };
  const updateCopy = (id: number, key: keyof CopyRow, value: string) => setCopies((items) => items.map((copy) => copy.id === id ? { ...copy, [key]: value } : copy));
  const validate = (draft = false) => {
    if (draft) {
      setSavedMessage("Bản nháp đã được lưu lúc 10:24");
      return;
    }
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = "Vui lòng nhập nhan đề tài liệu.";
    if (!form.author.trim()) nextErrors.author = "Vui lòng nhập ít nhất một tác giả.";
    if (!form.type) nextErrors.type = "Vui lòng chọn dạng tài liệu.";
    if (!form.language) nextErrors.language = "Vui lòng chọn ngôn ngữ.";
    if (!form.year) nextErrors.year = "Vui lòng nhập năm xuất bản.";
    else if (!/^\d{4}$/.test(form.year)) nextErrors.year = "Năm xuất bản phải gồm 4 chữ số.";
    if (programs.length === 0) nextErrors.programs = "Chọn ít nhất một ngành đào tạo phù hợp.";
    if (copies.some((copy) => !copy.barcode.trim())) nextErrors.copies = "Mỗi bản cá biệt cần có mã cá biệt.";
    if (restricted && !restrictionReason) nextErrors.restriction = "Vui lòng chọn lý do không cho phép mượn về.";
    setErrors(nextErrors);
    setSavedMessage(Object.keys(nextErrors).length === 0 ? "Tài liệu đã được lưu thành công." : "");
    if (Object.keys(nextErrors).length > 0) document.querySelector(".record-form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="record-form-page">
      <div className="record-form-heading">
        <div><Breadcrumb items={["Quản lý tài liệu", edit ? "Chỉnh sửa biểu ghi" : "Thêm tài liệu"]} /><p className="eyebrow">BIÊN MỤC TÀI LIỆU</p><h1>{edit ? "Chỉnh sửa biểu ghi thư mục" : "Thêm biểu ghi thư mục"}</h1><p>{edit ? "BIB-0001842 · Cập nhật lần cuối 18/06/2025 bởi Nguyễn Minh Anh" : "Tạo biểu ghi dùng chung cho bản in và tài liệu số."}</p></div>
        <Badge tone={edit ? "success" : "warning"}>{edit ? "ĐÃ XUẤT BẢN" : "BẢN GHI MỚI"}</Badge>
      </div>

      {Object.values(errors).some(Boolean) && <div className="form-error-summary"><Icon name="error" /><div><strong>Không thể lưu tài liệu</strong><p>Vui lòng kiểm tra các trường được đánh dấu bên dưới.</p></div></div>}
      {savedMessage && <div className="form-success-summary"><Icon name="success" /><span>{savedMessage}</span></div>}

      <div className="record-form-layout">
        <main className="record-form-main">
          <section className="record-form-section">
            <header><span>01</span><div><h2>Thông tin thư mục</h2><p>Thông tin mô tả và định danh chính của tài liệu.</p></div><Badge tone="error">BẮT BUỘC</Badge></header>
            <div className="bibliographic-form-grid">
              <Field fieldClassName="span-2" label="Nhan đề *" value={form.title} onChange={(event) => updateForm("title", event.target.value)} error={errors.title} placeholder="Nhập nhan đề chính của tài liệu" />
              <Field fieldClassName="span-2" label="Phụ đề" value={form.subtitle} onChange={(event) => updateForm("subtitle", event.target.value)} placeholder="Nhập phụ đề nếu có" />
              <Field fieldClassName="span-2" label="Tác giả *" value={form.author} onChange={(event) => updateForm("author", event.target.value)} error={errors.author} placeholder="Nhập tên tác giả hoặc cơ quan" />
              <SelectField label="Dạng tài liệu *" value={form.type} onChange={(event) => updateForm("type", event.target.value)} error={errors.type}><option value="">Chọn dạng tài liệu</option><option>Sách chuyên khảo</option><option>Giáo trình</option><option>Sách tham khảo</option><option>Luận án</option><option>Tài liệu hội thảo</option></SelectField>
              <Field label="ISBN" value={form.isbn} onChange={(event) => updateForm("isbn", event.target.value)} placeholder="978-604-..." />
              <SelectField label="Ngôn ngữ *" value={form.language} onChange={(event) => updateForm("language", event.target.value)} error={errors.language}><option value="">Chọn ngôn ngữ</option><option>Tiếng Việt</option><option>Tiếng Anh</option><option>Tiếng Pháp</option></SelectField>
              <Field label="Ký hiệu phân loại" value={form.classification} onChange={(event) => updateForm("classification", event.target.value)} placeholder="VD: 005.1 NG-T 2024" />
              <Field label="Nơi xuất bản" value={form.publicationPlace} onChange={(event) => updateForm("publicationPlace", event.target.value)} placeholder="Hà Nội" />
              <Field label="Năm xuất bản *" value={form.year} onChange={(event) => updateForm("year", event.target.value)} error={errors.year} placeholder="YYYY" />
              <Field fieldClassName="span-2" label="Mô tả vật lý" value={form.physicalDescription} onChange={(event) => updateForm("physicalDescription", event.target.value)} placeholder="Số trang, minh họa, kích thước..." />
              <TextAreaField fieldClassName="span-2" label="Tóm tắt" value={form.summary} onChange={(event) => updateForm("summary", event.target.value)} rows={5} placeholder="Nhập tóm tắt nội dung tài liệu..." hint={`${form.summary.length}/2.000 ký tự`} />
              <div className="cover-upload span-2">
                <span className="field-label">Ảnh bìa</span>
                <div>{edit ? <BookCover book={detailBook} /> : <span className="cover-placeholder"><Icon name="book" size={28} /></span>}<label><Icon name="plus" /><strong>{edit ? "Thay ảnh bìa" : "Tải ảnh bìa lên"}</strong><small>JPG hoặc PNG · Tối đa 5 MB · Tỷ lệ khuyến nghị 2:3</small><input type="file" accept="image/png,image/jpeg" /></label></div>
              </div>
            </div>
          </section>

          <section className="record-form-section">
            <header><span>02</span><div><h2>Ngành đào tạo</h2><p>Một biểu ghi có thể thuộc nhiều ngành đào tạo.</p></div><Badge>{programs.length} ĐÃ CHỌN</Badge></header>
            <div className="program-selector">
              <div className="selected-programs">{programs.length > 0 ? programs.map((program) => <button key={program} onClick={() => setPrograms((items) => items.filter((item) => item !== program))}>{program}<Icon name="close" size={13} /></button>) : <span>Chưa chọn ngành đào tạo</span>}</div>
              <div className="program-options">{trainingPrograms.filter((program) => !programs.includes(program)).map((program) => <button key={program} onClick={() => { setPrograms((items) => [...items, program]); setErrors((current) => ({ ...current, programs: "" })); }}><Icon name="plus" size={14} />{program}</button>)}</div>
              {errors.programs && <p className="section-error"><Icon name="error" size={14} />{errors.programs}</p>}
            </div>
          </section>

          <section className="record-form-section">
            <header><span>03</span><div><h2>Bản cá biệt</h2><p>Quản lý các bản in vật lý thuộc biểu ghi.</p></div><Button variant="secondary" size="sm" icon="plus" onClick={() => setCopies((items) => [...items, { id: Date.now(), barcode: "", shelf: "", condition: "Tốt", circulation: "Có sẵn", received: "2025-06-22" }])}>Thêm bản cá biệt</Button></header>
            <div className="copy-editor-wrap"><table className="copy-editor"><thead><tr><th>Mã cá biệt *</th><th>Vị trí kệ</th><th>Tình trạng vật lý</th><th>Trạng thái lưu thông</th><th>Ngày nhập kho</th><th /></tr></thead><tbody>{copies.map((copy) => <tr key={copy.id}><td><input value={copy.barcode} onChange={(event) => { updateCopy(copy.id, "barcode", event.target.value); setErrors((current) => ({ ...current, copies: "" })); }} placeholder="PTIT-YY-XXXXX" /></td><td><input value={copy.shelf} onChange={(event) => updateCopy(copy.id, "shelf", event.target.value)} placeholder="A2-03" /></td><td><select value={copy.condition} onChange={(event) => updateCopy(copy.id, "condition", event.target.value)}><option>Tốt</option><option>Hư hỏng nhẹ</option><option>Hư hỏng nặng</option></select></td><td><select value={copy.circulation} onChange={(event) => updateCopy(copy.id, "circulation", event.target.value)}><option>Có sẵn</option><option>Đang mượn</option><option>Đang giữ</option><option>Không lưu thông</option></select></td><td><input type="date" value={copy.received} onChange={(event) => updateCopy(copy.id, "received", event.target.value)} /></td><td><IconButton label="Xóa bản" icon="close" disabled={copies.length === 1} onClick={() => setCopies((items) => items.filter((item) => item.id !== copy.id))} /></td></tr>)}</tbody></table></div>
            {errors.copies && <p className="section-error copy-error"><Icon name="error" size={14} />{errors.copies}</p>}
          </section>

          <section className="record-form-section">
            <header><span>04</span><div><h2>Tài liệu số</h2><p>Tải lên và thiết lập quyền truy cập tệp PDF.</p></div><Badge tone="info">{digitalFiles.length} TỆP</Badge></header>
            <label className="digital-upload-zone"><input type="file" accept=".pdf" onChange={(event) => event.target.files?.[0] && setDigitalFiles((items) => [...items, { id: Date.now(), name: event.target.files![0].name, size: `${(event.target.files![0].size / 1024 / 1024).toFixed(1)} MB`, access: "Chỉ xem trực tuyến", status: "Đang xử lý" }])} /><span><Icon name="document" size={26} /></span><strong>Kéo thả tệp PDF hoặc chọn từ máy tính</strong><small>PDF · Tối đa 200 MB mỗi tệp</small><Button variant="secondary" size="sm" type="button">Chọn tệp</Button></label>
            {digitalFiles.length > 0 && <div className="digital-file-editor">{digitalFiles.map((file) => <article key={file.id}><span className="file-icon">PDF</span><div><strong>{file.name}</strong><small>{file.size}</small></div><label><span>Mức truy cập</span><select value={file.access} onChange={(event) => setDigitalFiles((items) => items.map((item) => item.id === file.id ? { ...item, access: event.target.value } : item))}><option>Chỉ xem trực tuyến</option><option>Cho phép tải</option></select></label><Status tone={file.status === "Đã xử lý" ? "success" : "warning"}>{file.status}</Status><IconButton label="Xóa tệp" icon="close" onClick={() => setDigitalFiles((items) => items.filter((item) => item.id !== file.id))} /></article>)}</div>}
          </section>

          <section className="record-form-section">
            <header><span>05</span><div><h2>Giới hạn mượn</h2><p>Thiết lập hạn chế lưu thông cho biểu ghi.</p></div></header>
            <div className="borrowing-restriction">
              <label className="restriction-toggle"><input type="checkbox" checked={restricted} onChange={(event) => { setRestricted(event.target.checked); if (!event.target.checked) setRestrictionReason(""); }} /><span><strong>Không cho phép mượn về</strong><small>Tài liệu chỉ được sử dụng tại phòng đọc hoặc khu vực được chỉ định.</small></span></label>
              {restricted && <div className="restriction-reasons"><p>Lý do hạn chế *</p><div>{["Dấu đỏ", "Sách tra cứu", "Luận án", "Luận văn", "Báo", "Tạp chí"].map((reason) => <label key={reason} className={restrictionReason === reason ? "selected" : ""}><input type="radio" name="restriction" value={reason} checked={restrictionReason === reason} onChange={() => { setRestrictionReason(reason); setErrors((current) => ({ ...current, restriction: "" })); }} />{reason}</label>)}</div>{errors.restriction && <p className="section-error"><Icon name="error" size={14} />{errors.restriction}</p>}</div>}
            </div>
          </section>
        </main>

        <aside className="record-form-aside">
          <div><p>TRẠNG THÁI BIỂU GHI</p><Status tone={edit ? "success" : "warning"}>{edit ? "Đã xuất bản" : "Chưa lưu"}</Status><dl><div><dt>Người tạo</dt><dd>Nguyễn Minh Anh</dd></div><div><dt>Ngày tạo</dt><dd>{edit ? "12/08/2024" : "22/06/2025"}</dd></div><div><dt>Mã biểu ghi</dt><dd>{edit ? "BIB-0001842" : "Tạo sau khi lưu"}</dd></div></dl></div>
          <div className="form-checklist"><p>KIỂM TRA NHANH</p><span className={form.title ? "complete" : ""}><Icon name={form.title ? "success" : "info"} size={14} />Thông tin cơ bản</span><span className={programs.length ? "complete" : ""}><Icon name={programs.length ? "success" : "info"} size={14} />Ngành đào tạo</span><span className={copies.every((copy) => copy.barcode) ? "complete" : ""}><Icon name={copies.every((copy) => copy.barcode) ? "success" : "info"} size={14} />Bản cá biệt</span><span className={digitalFiles.length ? "complete" : ""}><Icon name={digitalFiles.length ? "success" : "info"} size={14} />Tài liệu số</span></div>
        </aside>
      </div>

      <div className="record-form-actions"><div>{savedMessage ? <Status tone="success">{savedMessage}</Status> : <span><Icon name="info" size={14} />Các trường có dấu * là bắt buộc</span>}</div><Button variant="ghost" onClick={() => { navigate("/staff/materials"); }}>Hủy</Button><Button variant="secondary" onClick={() => validate(true)}>Lưu nháp</Button><Button onClick={() => validate(false)}>Lưu tài liệu</Button></div>
    </div>
  );
}
