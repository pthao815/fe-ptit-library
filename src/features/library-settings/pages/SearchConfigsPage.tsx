import { useState } from "react"
import { Badge, Button, Toast } from "../../../design-system"
import { settingsApi } from "../api"
import useSettingsCollection from "../hooks/useSettingsCollection"
import SettingsPanel from "../components/SettingsPanel"
import ActivateSearchConfigDialog from "../components/ActivateSearchConfigDialog"
export default function SearchConfigsPage() {
  const collection = useSettingsCollection(settingsApi.listSearchConfigs)
  const [activation, setActivation] = useState<number | null>(null)
  const [notice, setNotice] = useState(false)
  return (
    <>
      <p className="configuration-help">
        Kích hoạt chỉ đổi cấu hình mặc định, không tự lập chỉ mục lại.
      </p>
      <SettingsPanel
        title="Danh sách cấu hình tìm kiếm"
        count={collection.data.length}
        status={collection.status}
        error={collection.error}
        reload={collection.reload}
      >
        <table className="configuration-table">
          <thead>
            <tr>
              {[
                "Cấu hình",
                "Chunk size",
                "Overlap",
                "Strategy",
                "Embedding model",
                "Dimensions",
                "Trạng thái",
                "Thao tác",
              ].map((label) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {collection.data.map((config) => (
              <tr
                key={config.id}
                className={config.isActive ? "configuration-active-row" : ""}
              >
                <th scope="row">#{config.id}</th>
                <td>{config.chunkSize}</td>
                <td>{config.overlap}</td>
                <td>{config.strategy}</td>
                <td className="configuration-model">
                  <code>{config.embeddingModel}</code>
                </td>
                <td>{config.vectorDimensions}</td>
                <td>
                  <Badge tone={config.isActive ? "success" : "neutral"}>
                    {config.isActive ? "Đang active" : "Chưa active"}
                  </Badge>
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={config.isActive}
                    aria-label={`Kích hoạt cấu hình ${config.id}`}
                    onClick={() => setActivation(config.id)}
                  >
                    {config.isActive ? "Đang sử dụng" : "Kích hoạt"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SettingsPanel>
      {notice && (
        <div className="configuration-notice">
          <Toast title="Kích hoạt thành công" onClose={() => setNotice(false)}>
            Backend đã xác nhận. Đang tải lại danh sách.
          </Toast>
        </div>
      )}
      {activation !== null && (
        <ActivateSearchConfigDialog
          id={activation}
          onClose={() => setActivation(null)}
          onActivate={async (id, signal) => {
            await settingsApi.activate(id, signal)
            setNotice(true)
            collection.reload()
          }}
        />
      )}
    </>
  )
}
