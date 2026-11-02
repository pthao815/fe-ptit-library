import { useState } from "react"
import { Button, Toast } from "../../../design-system"
import { settingsApi } from "../api"
import type { Policy } from "../model/settings.types.ts"
import { userTypeLabels } from "../model/settings.constants.ts"
import useSettingsCollection from "../hooks/useSettingsCollection"
import SettingsPanel from "../components/SettingsPanel"
import PolicyForm from "../components/PolicyForm"
export default function LoanPoliciesPage({ canWrite }: { canWrite: boolean }) {
  const collection = useSettingsCollection(settingsApi.listPolicies)
  const [editing, setEditing] = useState<Policy | null>(null)
  const [notice, setNotice] = useState(false)
  return (
    <>
      <SettingsPanel
        title="Danh sách chính sách mượn trả"
        count={collection.data.length}
        status={collection.status}
        error={collection.error}
        reload={collection.reload}
      >
        <table className="configuration-table">
          <thead>
            <tr>
              {[
                "Loại độc giả",
                "Loại tài liệu",
                "Ngày mượn",
                "Số lượng tối đa",
                "Lần gia hạn",
                "Giữ chờ (ngày)",
                ...(canWrite ? ["Thao tác"] : []),
              ].map((label) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {collection.data.map((policy) => (
              <tr key={policy.id}>
                <th scope="row">
                  {userTypeLabels[policy.userType]}
                  <small>{policy.userType}</small>
                </th>
                <td>
                  <code>{policy.docType}</code>
                </td>
                <td>{policy.loanDays} ngày</td>
                <td>{policy.maxLoans} tài liệu</td>
                <td>{policy.maxRenewals} lần</td>
                <td>{policy.holdExpiryDays} ngày</td>
                {canWrite && (
                  <td>
                    <Button
                      size="sm"
                      variant="secondary"
                      aria-label={`Sửa chính sách ${userTypeLabels[policy.userType]} ${policy.docType}`}
                      onClick={() => setEditing(policy)}
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
      {editing && (
        <PolicyForm
          key={editing.id}
          policy={editing}
          onClose={() => setEditing(null)}
          onSave={async (value, signal) => {
            const saved = await settingsApi.updatePolicy(value, signal)
            collection.setData((items) =>
              items.map((item) => (item.id === saved.id ? saved : item)),
            )
            setNotice(true)
          }}
        />
      )}
    </>
  )
}
