import { Button, CustomSelect, Field, IconButton } from "../../../design-system";
import type { DepartmentDto } from "../../../types/api";
import {
  DOC_TYPE_OPTIONS,
  LANGUAGE_OPTIONS,
  SMART_ENGINE_OPTIONS,
  type SearchTabMode,
  type SmartEngineMode,
  type UnifiedSearchFilters,
} from "./search-options";

interface SearchFilterSidebarProps {
  mode: SearchTabMode;
  open: boolean;
  onClose: () => void;
  filters: UnifiedSearchFilters;
  onChange: (updater: (current: UnifiedSearchFilters) => UnifiedSearchFilters) => void;
  departments: DepartmentDto[];
  onApply: () => void;
  onReset: () => void;
}

export default function SearchFilterSidebar({
  mode,
  open,
  onClose,
  filters,
  onChange,
  departments,
  onApply,
  onReset,
}: SearchFilterSidebarProps) {
  const hasCustomDocType =
    Boolean(filters.docType) &&
    !DOC_TYPE_OPTIONS.some((opt) => opt.value.toLowerCase() === filters.docType.toLowerCase());

  const hasCustomLanguage =
    Boolean(filters.language) &&
    !LANGUAGE_OPTIONS.some((opt) => opt.value.toLowerCase() === filters.language.toLowerCase());

  return (
    <aside className={`filter-sidebar ${open ? "open" : ""}`}>
      <div className="filter-head">
        <div>
          <p className="eyebrow">TINH CHỈNH KẾT QUẢ</p>
          <h2>Bộ lọc tìm kiếm</h2>
        </div>
        <button type="button" className="clear-filter" onClick={onReset}>
          Xóa bộ lọc
        </button>
        <IconButton label="Đóng bộ lọc" icon="close" onClick={onClose} />
      </div>

      <form
        className="filter-group"
        onSubmit={(event) => {
          event.preventDefault();
          onApply();
        }}
      >
        <label>
          Dạng tài liệu
          <CustomSelect
            value={filters.docType}
            onChange={(event) =>
              onChange((current) => ({ ...current, docType: event.target.value }))
            }
          >
            {DOC_TYPE_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
            {hasCustomDocType && <option value={filters.docType}>{filters.docType}</option>}
          </CustomSelect>
        </label>

        <label>
          Khoa/ngành
          <CustomSelect
            value={filters.departmentId}
            onChange={(event) =>
              onChange((current) => ({ ...current, departmentId: event.target.value }))
            }
          >
            <option value="">Tất cả khoa/ngành</option>
            {departments.map((unit) => (
              <option key={unit.id} value={String(unit.id)}>
                {unit.name}
              </option>
            ))}
          </CustomSelect>
        </label>

        <Field
          label="Tác giả"
          placeholder="Nhập tên tác giả..."
          value={filters.authorName}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              authorName: event.target.value,
              authorId: "",
            }))
          }
        />

        <Field
          label="Năm xuất bản"
          type="number"
          min={1000}
          max={9999}
          placeholder="Ví dụ: 2024"
          value={filters.publicationYear}
          onChange={(event) =>
            onChange((current) => ({ ...current, publicationYear: event.target.value }))
          }
        />

        <label>
          Ngôn ngữ
          <CustomSelect
            value={filters.language}
            onChange={(event) =>
              onChange((current) => ({ ...current, language: event.target.value }))
            }
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
            {hasCustomLanguage && <option value={filters.language}>{filters.language}</option>}
          </CustomSelect>
        </label>

        {mode === "smart" && (
          <label>
            Chế độ xếp hạng
            <CustomSelect
              value={filters.searchMode}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  searchMode: event.target.value as SmartEngineMode,
                }))
              }
            >
              {SMART_ENGINE_OPTIONS.map((option) => (
                <option key={option.value || "default"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </CustomSelect>
          </label>
        )}

        <Button type="submit">Áp dụng bộ lọc</Button>
      </form>
    </aside>
  );
}
