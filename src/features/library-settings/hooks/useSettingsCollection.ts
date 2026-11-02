import { useEffect, useState } from "react"

export default function useSettingsCollection<T>(
  load: (signal: AbortSignal) => Promise<T[]>,
) {
  const [data, setData] = useState<T[]>([])
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [error, setError] = useState("")
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    let current = true
    setStatus("loading")
    setError("")
    load(controller.signal)
      .then((items) => {
        if (current) {
          setData(items)
          setStatus("ready")
        }
      })
      .catch((cause: unknown) => {
        if (current) {
          setStatus("error")
          setError(
            cause instanceof Error ? cause.message : "Không thể tải dữ liệu.",
          )
        }
      })
    return () => {
      current = false
      controller.abort()
    }
  }, [load, revision])
  return {
    data,
    setData,
    status,
    error,
    reload: () => setRevision((value) => value + 1),
  }
}
