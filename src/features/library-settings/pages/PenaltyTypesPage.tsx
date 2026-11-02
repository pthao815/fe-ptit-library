import { useState } from "react"
import { Button, Toast } from "../../../design-system"
import { settingsApi } from "../api"
import type { PenaltyType } from "../model/settings.types.ts"
import useSettingsCollection from "../hooks/useSettingsCollection"
import SettingsPanel from "../components/SettingsPanel"
import PenaltyTypeForm from "../components/PenaltyTypeForm"
export default function PenaltyTypesPage({ canWrite }: { canWrite: boolean }) {
  const collection = useSettingsCollection(settingsApi.listPenalties)
  const [editor, setEditor] = useState<{ penalty?: PenaltyType } | null>(null)
  const [notice, setNotice] = useState(false)
  return (
    <>
      <SettingsPanel
        title="Danh sách loại hình phạt"
        count={collection.data.length}
        status={collection.status}
        error={collection.error}
        reload={collection.reload}
        actions={
          canWrite && (
            <Button icon="plus" onClick={() => setEditor({})}>
              Thêm loại phạt
            </Button>
          )
        }
      >
        <table className="configuration-table">
          <thead>
            <tr>
              {[
                "Mã loại phạt",
                "Tên loại phạt",
                "Đơn vị tính",
                "Đơn giá",
                ...(canWrite ? ["Thao tác"] : []),
              ].map((label) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {collection.data.map((penalty) => (
              <tr key={penalty.id}>
                <th scope="row">
                  <code>{penalty.code}</code>
                </th>
                <td>{penalty.name}</td>
                <td>{penalty.unitName}</td>
                <td className="configuration-money">
                  {penalty.unitPrice.toLocaleString("vi-VN")} ₫
                </td>
                {canWrite && (
                  <td>
                    <Button
                      size="sm"
                      variant="secondary"
                      aria-label={`Sửa loại phạt ${penalty.code}`}
                      onClick={() => setEditor({ penalty })}
                    >
                      Chỉnh sửa
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </SettingsPanel>
      {notice && (
        <div className="configuration-notice">
          <Toast title="Cập nhật thành công" onClose={() => setNotice(false)}>
            Backend đã xác nhận lưu thay đổi.
          </Toast>
        </div>
      )}
      {editor && (
        <PenaltyTypeForm
          key={editor.penalty?.id ?? "new"}
          penalty={editor.penalty}
          onClose={() => setEditor(null)}
          onSave={async (value, signal) => {
            const saved = await settingsApi.savePenalty(value, signal)
            collection.setData((items) =>
              value.id === undefined
                ? [...items, saved]
                : items.map((item) => (item.id === saved.id ? saved : item)),
            )
            setNotice(true)
          }}
        />
      )}
    </>
  )
}
