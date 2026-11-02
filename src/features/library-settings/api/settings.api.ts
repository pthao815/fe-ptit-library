import { authSession } from "../../../shared/auth/auth-session.ts"
import { ApiError, type HttpRequest } from "../../../shared/api/http-client.ts"
import type {
  Policy,
  PenaltyType,
  ConfigurationKind,
} from "../model/settings.types.ts"
import {
  parseList,
  parsePolicyResponse,
  parsePenaltyTypeResponse,
  parseSearchConfigResponse,
} from "../model/settings.parsers.ts"
import { SettingsError, settingsError } from "../model/settings.errors.ts"
import { validatePenalty } from "../model/settings.validation.ts"

type Transport = (path: string, options?: HttpRequest) => Promise<unknown>
export function createSettingsApi(request: Transport) {
  async function call(
    resource: ConfigurationKind,
    method: "GET" | "POST" | "PUT",
    suffix = "",
    body?: unknown,
    signal?: AbortSignal,
  ) {
    const { session, identityVersion, version } = authSession.getSnapshot()
    if (!session) throw settingsError(new ApiError("", 401), resource)
    if (
      session.role !== "ADMIN" &&
      (session.role !== "LIBRARIAN" ||
        method !== "GET" ||
        resource === "search-configs")
    ) {
      throw settingsError(new ApiError("", 403), resource)
    }
    try {
      return await request(`/api/admin/${resource}${suffix}`, {
        method,
        body,
        signal,
        context: {
          accessToken: session.accessToken,
          isIdentityCurrent: () =>
            authSession.getSnapshot().identityVersion === identityVersion,
          isCredentialCurrent: () =>
            authSession.getSnapshot().version === version,
          onAuthError: (status) => authSession.reportAuthError(status, version),
        },
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError")
        throw error
      throw settingsError(error, resource)
    }
  }
  const idPath = (id: number) => {
    if (!Number.isSafeInteger(id) || id < 1)
      throw new ApiError("ID không hợp lệ.")
    return `/${id}`
  }
  return {
    async listPolicies(signal?: AbortSignal) {
      return parseList(
        await call("policies", "GET", "", undefined, signal),
        parsePolicyResponse,
      )
    },
    async listPenalties(signal?: AbortSignal) {
      return parseList(
        await call("penalty-types", "GET", "", undefined, signal),
        parsePenaltyTypeResponse,
      )
    },
    async listSearchConfigs(signal?: AbortSignal) {
      return parseList(
        await call("search-configs", "GET", "", undefined, signal),
        parseSearchConfigResponse,
      )
    },
    async updatePolicy(value: Policy, signal?: AbortSignal) {
      const { id, ...body } = parsePolicyResponse(value)
      return parsePolicyResponse(
        await call(
          "policies",
          "PUT",
          idPath(id),
          { ...body, docType: body.docType.trim() },
          signal,
        ),
      )
    },
    async savePenalty(
      value: Omit<PenaltyType, "id"> & { id?: number },
      signal?: AbortSignal,
    ) {
      const errors = validatePenalty({
        code: value.code,
        name: value.name,
        unitName: value.unitName,
        unitPrice: String(value.unitPrice),
      })
      if (Object.keys(errors).length) {
        const error = new SettingsError("Dữ liệu loại phạt không hợp lệ.")
        error.fields = errors
        throw error
      }
      const body = {
        code: value.code.trim(),
        name: value.name.trim(),
        unitName: value.unitName.trim(),
        unitPrice: value.unitPrice,
      }
      if (value.id !== undefined) idPath(value.id)
      return parsePenaltyTypeResponse(
        await call(
          "penalty-types",
          value.id === undefined ? "POST" : "PUT",
          "",
          value.id === undefined ? body : { id: value.id, ...body },
          signal,
        ),
      )
    },
    async activate(id: number, signal?: AbortSignal) {
      return parseSearchConfigResponse(
        await call(
          "search-configs",
          "PUT",
          `${idPath(id)}/active`,
          undefined,
          signal,
        ),
      )
    },
  }
}
