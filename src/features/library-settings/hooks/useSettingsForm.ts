import { useEffect, useState, useSyncExternalStore } from "react"
import { createFormModel } from "../model/form-model.ts"
export default function useSettingsForm<D extends object>(initial: D) {
  const [model] = useState(() => createFormModel(initial))
  const state = useSyncExternalStore(model.subscribe, model.getSnapshot)
  useEffect(() => {
    model.activate()
    return () => model.dispose()
  }, [model])
  return { ...state, change: model.change, submit: model.submit }
}
