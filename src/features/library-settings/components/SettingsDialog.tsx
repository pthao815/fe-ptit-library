import { useEffect, useRef, type ReactNode } from "react"
import { Modal } from "../../../design-system"
export default function SettingsDialog({
  title,
  saving,
  onClose,
  children,
}: {
  title: string
  saving: boolean
  onClose: () => void
  children: ReactNode
}) {
  const body = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const root = body.current?.closest('[role="dialog"]')
    const controls = () =>
      Array.from(
        root?.querySelectorAll<HTMLElement>(
          "input:not(:disabled), select:not(:disabled), button:not(:disabled)",
        ) ?? [],
      )
    controls()[0]?.focus()
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return
      const items = controls()
      if (
        event.shiftKey &&
        (document.activeElement === items[0] ||
          !root?.contains(document.activeElement))
      ) {
        event.preventDefault()
        items[items.length - 1]?.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === items[items.length - 1] ||
          !root?.contains(document.activeElement))
      ) {
        event.preventDefault()
        items[0]?.focus()
      }
    }
    document.addEventListener("keydown", trap)
    return () => {
      document.removeEventListener("keydown", trap)
      previous?.focus()
    }
  }, [])
  return (
    <Modal
      open
      onClose={() => {
        if (!saving) onClose()
      }}
      title={title}
      eyebrow="CẬP NHẬT CẤU HÌNH"
      className="configuration-modal"
    >
      <div ref={body}>{children}</div>
    </Modal>
  )
}
