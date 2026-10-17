import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Badge, Breadcrumb, Button, Dropdown, Icon, IconButton, Modal, Pagination, SearchInput } from "../../../design-system";
import BookCover from "../../../components/books/BookCover";
import type { CatalogRecord } from "../../../data/catalog";
import { catalogRecords } from "../../../data/catalog";

export default function MaterialsManagementPage() {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState("Nhan đề");
  const [selected, setSelected] = useState<number[]>([]);
  const [actionMenu, setActionMenu] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogRecord | null>(null);
  const allSelected = selected.length === catalogRecords.length;
  const toggleRow = (id: number) => setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  return (
    <div className="materials-page">
      <div className="materials-page-heading">
        <div><Breadcrumb items={["Không gian nghiệp vụ", "Quản lý tài liệu"]} /><p className="eyebrow">QUẢN LÝ BIỂU GHI</p><h1>Quản lý tài liệu</h1><p>Biên mục, kiểm soát và cập nhật kho tài liệu thư viện.</p></div>
        <div className="materials-top-actions"><Button variant="ghost" icon="document">Xuất dữ liệu</Button><Button variant="secondary" icon="plus">Nhập dữ liệu hàng loạt</Button><Button icon="plus" onClick={() => { navigate("/staff/materials/new"); }}>Thêm tài liệu</Button></div>
      </div>

      <section className="materials-search-panel">
        <div className="catalog-search-types">{["Nhan đề", "Tác giả", "ISBN", "Mã biểu ghi"].map((type) => <button key={type} className={searchType === type ? "active" : ""} onClick={() => setSearchType(type)}>{type}</button>)}</div>
        <div className="catalog-search-row"><SearchInput placeholder={`Tìm theo ${searchType.toLowerCase()}...`} /><Button icon="search">Tìm kiếm</Button></div>
        <div className="catalog-filter-grid">
          <label><span>Dạng tài liệu</span><select defaultValue="all"><option value="all">Tất cả dạng tài liệu</option><option>Sách chuyên khảo</option><option>Giáo trình</option><option>Luận án, luận văn</option></select><Icon name="chevron-down" size={14} /></label>
          <label><span>Ngành đào tạo</span><select defaultValue="all"><option value="all">Tất cả ngành</option><option>Công nghệ thông tin</option><option>Điện tử viễn thông</option><option>Quản trị kinh doanh</option></select><Icon name="chevron-down" size={14} /></label>
          <label><span>Ngôn ngữ</span><select defaultValue="all"><option value="all">Tất cả ngôn ngữ</option><option>Tiếng Việt</option><option>Tiếng Anh</option></select><Icon name="chevron-down" size={14} /></label>
          <label><span>Năm xuất bản</span><select defaultValue="all"><option value="all">Tất cả các năm</option><option>2025</option><option>2024</option><option>2023</option></select><Icon name="chevron-down" size={14} /></label>
          <label><span>Trạng thái</span><select defaultValue="all"><option value="all">Tất cả trạng thái</option><option>Đã xuất bản</option><option>Bản nháp</option><option>Cần bổ sung</option></select><Icon name="chevron-down" size={14} /></label>
          <label className="digital-filter"><input type="checkbox" /><span><strong>Có tài liệu số</strong><small>Chỉ hiện biểu ghi có tệp số</small></span></label>
        </div>
      </section>

      <section className="catalog-table-panel">
        <div className="catalog-table-toolbar">
          <div><h2>Danh sách biểu ghi</h2><p>48.632 biểu ghi · Cập nhật 5 phút trước</p></div>
          {selected.length > 0 ? <div className="bulk-actions"><strong>Đã chọn {selected.length}</strong><Button variant="ghost" size="sm">Đổi trạng thái</Button><Button variant="ghost" size="sm">Xuất dữ liệu</Button><Button variant="danger" size="sm" onClick={() => setSelected([])}>Xóa đã chọn</Button></div> : <Button variant="ghost" size="sm" icon="filter">Tùy chỉnh cột</Button>}
        </div>
        <div className="catalog-table-wrap">
          <table className="catalog-table">
            <thead><tr><th><input type="checkbox" aria-label="Chọn tất cả" checked={allSelected} onChange={() => setSelected(allSelected ? [] : catalogRecords.map((item) => item.id))} /></th><th>Cover</th><th>Nhan đề</th><th>Tác giả</th><th>ISBN</th><th>Dạng tài liệu</th><th>Số bản</th><th>Tài liệu số</th><th>Trạng thái</th><th>Actions</th></tr></thead>
            <tbody>{catalogRecords.map((record) => (
              <tr key={record.id} className={selected.includes(record.id) ? "selected-row" : ""}>
                <td><input type="checkbox" aria-label={`Chọn ${record.title}`} checked={selected.includes(record.id)} onChange={() => toggleRow(record.id)} /></td>
                <td><div className="catalog-cover"><BookCover book={record} /></div></td>
                <td><div className="catalog-title-cell"><strong>{record.title}</strong><small>{record.recordCode} · {record.code}</small></div></td>
                <td>{record.author}</td>
                <td><code>{record.isbn}</code></td>
                <td><Badge>{record.type}</Badge></td>
                <td><button className="copy-count"><strong>{record.copies}</strong><small>Bản cá biệt</small></button></td>
                <td>{record.digitalFiles > 0 ? <button className="digital-count"><Icon name="document" size={15} /><span><strong>{record.digitalFiles} tệp</strong><small>Đã xử lý</small></span></button> : <span className="no-digital">Chưa có</span>}</td>
                <td><Badge tone={record.recordStatus === "Đã xuất bản" ? "success" : record.recordStatus === "Bản nháp" ? "warning" : "error"}>{record.recordStatus}</Badge></td>
                <td><div className="catalog-row-actions"><Button variant="ghost" size="sm">Xem</Button><Button variant="ghost" size="sm" onClick={() => { navigate(`/staff/materials/edit/${record.id}`); }}>Sửa</Button><div className="catalog-more-wrap"><IconButton label="Thêm thao tác" icon="more" onClick={() => setActionMenu(actionMenu === record.id ? null : record.id)} /><Dropdown open={actionMenu === record.id}><button><Icon name="library" />Bản cá biệt</button><button><Icon name="document" />Tài liệu số</button><hr /><button className="danger" onClick={() => { setDeleteTarget(record); setActionMenu(null); }}><Icon name="error" />Xóa biểu ghi</button></Dropdown></div></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="catalog-pagination"><p>Hiển thị 1–6 trong tổng số 48.632 biểu ghi</p><Pagination /></div>
      </section>

      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Xóa biểu ghi thư mục">
        <div className="catalog-delete-warning"><span><Icon name="error" size={24} /></span><div><strong>Bạn có chắc muốn xóa biểu ghi này?</strong><p>{deleteTarget?.title}</p></div></div>
        <p className="delete-explanation">Biểu ghi chỉ có thể xóa khi không còn bản cá biệt đang lưu thông hoặc tài liệu số được liên kết. Thao tác này sẽ được ghi vào nhật ký hệ thống.</p>
        <div className="modal-actions"><Button variant="ghost" onClick={() => setDeleteTarget(null)}>Hủy</Button><Button variant="danger" onClick={() => setDeleteTarget(null)}>Xóa biểu ghi</Button></div>
      </Modal>
    </div>
  );
}
