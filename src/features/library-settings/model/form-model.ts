import type { FieldErrors } from "./settings.validation.ts"
import { SettingsError } from "./settings.errors.ts"

/** Local form state; no session/token dependency. Recreated only on editor/identity change. */
export function createFormModel<D extends object>(initial: D) {
  let state = {
    draft: initial,
    errors: {} as FieldErrors<D>,
    saving: false,
    message: "",
  }
  let active = true
  let generation = 0
  let controller: AbortController | undefined
  const listeners = new Set<() => void>()
  const publish = () => listeners.forEach((listener) => listener())
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    activate() {
      active = true
    },
    dispose() {
      active = false
      generation++
      controller?.abort()
      state = { ...state, saving: false }
    },
    change<K extends keyof D,>(key: K, value: D[K]) {
      if (state.saving) return
      state = {
        ...state,
        draft: { ...state.draft, [key]: value },
        errors: { ...state.errors, [key]: undefined },
        message: "",
      }
      publish()
    },
    async submit(
      validate: (draft: D) => FieldErrors<D>,
      write: (draft: D, signal: AbortSignal) => Promise<void>,
    ) {
      if (!active || state.saving) return false
      const errors = validate(state.draft)
      state = { ...state, errors, message: "" }
      if (Object.keys(errors).length) {
        publish()
        return false
      }
      const request = ++generation
      controller = new AbortController()
      state = { ...state, saving: true }
      publish()
      try {
        await write(state.draft, controller.signal)
        if (!active || request !== generation) return false
        return true
      } catch (error) {
        if (active && request === generation) {
          const serverErrors: FieldErrors<D> = {}
          if (error instanceof SettingsError) {
            for (const key in state.draft) {
              const message = Reflect.get(error.fields, key)
              if (typeof message === "string") serverErrors[key] = message
            }
          }
          state = {
            ...state,
            errors: serverErrors,
            message:
              error instanceof Error
                ? error.message
                : "Không thể lưu thay đổi.",
          }
        }
        return false
      } finally {
        if (active && request === generation) {
          state = { ...state, saving: false }
          publish()
        }
      }
    },
  }
}
