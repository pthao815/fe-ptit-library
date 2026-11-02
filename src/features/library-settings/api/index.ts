import { createHttpClient } from "../../../shared/api/http-client.ts"
import { createSettingsApi } from "./settings.api.ts"
export const settingsApi = createSettingsApi(
  createHttpClient(import.meta.env.VITE_API_BASE_URL ?? ""),
)
