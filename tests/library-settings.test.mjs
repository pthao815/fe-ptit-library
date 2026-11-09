import { test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { createHttpClient, ApiError } from "../src/shared/api/http-client.ts"
import {
  authSession,
  sessionFromAccessToken,
} from "../src/shared/auth/auth-session.ts"
import { module2Session } from "../src/integration/module2-session.ts"
import { createSettingsApi } from "../src/features/library-settings/api/settings.api.ts"
import { createFormModel } from "../src/features/library-settings/model/form-model.ts"
import { SettingsError } from "../src/features/library-settings/model/settings.errors.ts"
import {
  validatePolicy,
  validatePenalty,
  policyDraft,
  emptyPenaltyDraft,
} from "../src/features/library-settings/model/settings.validation.ts"

const policy = {
  id: 4,
  userType: "STUDENT",
  docType: "BOOK",
  loanDays: 14,
  maxLoans: 5,
  maxRenewals: 2,
  holdExpiryDays: 3,
}
const penalty = {
  id: 17,
  code: "LATE",
  name: "Trả muộn",
  unitName: "ngày",
  unitPrice: 5000,
}
const config = {
  id: 2,
  chunkSize: 512,
  overlap: 64,
  strategy: "fixed",
  embeddingModel: "test-model",
  vectorDimensions: 768,
  isActive: true,
}
function token(role = "ADMIN", extra = {}) {
  return `header.${Buffer.from(JSON.stringify({ sub: "test-user", role, exp: Math.floor(Date.now() / 1000) + 600, ...extra })).toString("base64url")}.signature`
}
const signIn = (role = "ADMIN", extra = {}) =>
  authSession.setSession(sessionFromAccessToken(token(role, extra)))
function fixture() {
  const calls = []
  let handler = async () => ({ success: true, data: [] })
  const api = createSettingsApi(
    createHttpClient("http://backend.invalid/", async (url, options) => {
      calls.push({ url, ...options })
      const result = await handler(url, options)
      return result instanceof Response
        ? result
        : new Response(JSON.stringify(result))
    }),
  )
  return {
    api,
    calls,
    respond: (fn) => {
      handler = fn
    },
  }
}
beforeEach(() => {
  authSession.setSession(null)
  signIn()
})

test("all seven contracts: method, URL, body, server IDs and headers", async () => {
  const f = fixture()
  const accessToken = authSession.getSnapshot().session.accessToken
  f.respond(async () => ({ success: true, data: [policy] }))
  await f.api.listPolicies()
  f.respond(async () => ({ success: true, data: policy }))
  await f.api.updatePolicy(policy)
  f.respond(async () => ({ success: true, data: [penalty] }))
  await f.api.listPenalties()
  f.respond(async () => ({ success: true, data: penalty }))
  assert.equal((await f.api.savePenalty({ ...penalty, id: undefined })).id, 17)
  await f.api.savePenalty(penalty)
  f.respond(async () => ({ success: true, data: [config] }))
  await f.api.listSearchConfigs()
  f.respond(async () => ({ success: true, data: config }))
  await f.api.activate(2)
  assert.deepEqual(
    f.calls.map((c) => [c.method, c.url]),
    [
      ["GET", "http://backend.invalid/api/admin/policies"],
      ["PUT", "http://backend.invalid/api/admin/policies/4"],
      ["GET", "http://backend.invalid/api/admin/penalty-types"],
      ["POST", "http://backend.invalid/api/admin/penalty-types"],
      ["PUT", "http://backend.invalid/api/admin/penalty-types"],
      ["GET", "http://backend.invalid/api/admin/search-configs"],
      ["PUT", "http://backend.invalid/api/admin/search-configs/2/active"],
    ],
  )
  f.calls.forEach((call) =>
    assert.equal(call.headers.Authorization, `Bearer ${accessToken}`),
  )
  assert.deepEqual(JSON.parse(f.calls[1].body), {
    userType: "STUDENT",
    docType: "BOOK",
    loanDays: 14,
    maxLoans: 5,
    maxRenewals: 2,
    holdExpiryDays: 3,
  })
  assert.equal("id" in JSON.parse(f.calls[3].body), false)
  assert.equal(JSON.parse(f.calls[4].body).id, 17)
  assert.equal(f.calls[6].body, undefined)
})
test("transport is reusable: no settings whitelist, field names or conflict mapping", async () => {
  const request = createHttpClient(
    "",
    async () =>
      new Response(
        JSON.stringify({ success: false, data: { unrelated: "error" } }),
        { status: 409 },
      ),
  )
  await assert.rejects(
    request("/api/another-module"),
    (error) =>
      error instanceof ApiError &&
      error.status === 409 &&
      error.details.unrelated === "error" &&
      !error.message.includes("phạt"),
  )
})
test("Librarian reads two lists but cannot write or fetch search config", async () => {
  signIn("LIBRARIAN")
  const f = fixture()
  await f.api.listPolicies()
  await f.api.listPenalties()
  await assert.rejects(f.api.listSearchConfigs(), /không có quyền/)
  await assert.rejects(f.api.updatePolicy(policy), /không có quyền/)
  await assert.rejects(f.api.savePenalty(penalty), /không có quyền/)
  assert.equal(f.calls.length, 2)
  signIn("READER")
  await assert.rejects(f.api.listPolicies(), /không có quyền/)
  authSession.setSession(null)
  await assert.rejects(f.api.listPolicies(), /Phiên/)
})
test("same-user token rotation preserves editor identity, draft and in-flight success", async () => {
  const form = createFormModel(policyDraft(policy))
  form.change("loanDays", "28")
  const identity = authSession.getSnapshot().identityVersion
  const f = fixture()
  let finish
  f.respond(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const pending = form.submit(validatePolicy, async (draft, signal) => {
    const saved = await f.api.updatePolicy(
      { ...policy, loanDays: Number(draft.loanDays) },
      signal,
    )
    assert.equal(saved.loanDays, 28)
  })
  signIn("ADMIN", { nonce: "rotated" })
  assert.equal(authSession.getSnapshot().identityVersion, identity)
  assert.equal(form.getSnapshot().draft.loanDays, "28")
  assert.equal(form.getSnapshot().saving, true)
  finish({ success: true, data: { ...policy, loanDays: 28 } })
  assert.equal(await pending, true)
  assert.equal(form.getSnapshot().draft.loanDays, "28")
  form.dispose()
})
test("account/role/logout changes editor identity; old request and disposed draft cannot update UI", async () => {
  for (const change of [
    () => signIn("ADMIN", { sub: "other-user" }),
    () => signIn("LIBRARIAN"),
    () => authSession.setSession(null),
  ]) {
    signIn()
    const before = authSession.getSnapshot().identityVersion
    const old = createFormModel({ code: "draft" })
    const f = fixture()
    let finish
    f.respond(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const pending = f.api.listPolicies()
    change()
    old.dispose()
    assert.notEqual(authSession.getSnapshot().identityVersion, before)
    finish({ success: true, data: [policy] })
    await assert.rejects(pending, (error) => error.name === "AbortError")
    const fresh = createFormModel({ code: "" })
    assert.equal(fresh.getSnapshot().draft.code, "")
    assert.equal(
      await old.submit(
        () => ({}),
        async () => {},
      ),
      false,
    )
  }
})
test("old 401 cannot clear rotated token or emit auth callback", async () => {
  const f = fixture()
  let finish
  let errors = 0
  const unsubscribe = authSession.onAuthError(() => {
    errors++
  })
  f.respond(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const pending = f.api.listPolicies()
  signIn("ADMIN", { nonce: "new-token" })
  const newSession = authSession.getSnapshot().session
  finish(new Response("", { status: 401 }))
  await assert.rejects(pending)
  assert.equal(authSession.getSnapshot().session, newSession)
  assert.equal(errors, 0)
  unsubscribe()
})
test("current 401 clears session, 403 preserves session; feature maps 400/404/409/500", async () => {
  const f = fixture()
  for (const status of [400, 403, 404, 409, 500]) {
    f.respond(
      async () =>
        new Response(
          JSON.stringify({ success: false, data: { code: "invalid" } }),
          { status },
        ),
    )
    await assert.rejects(
      f.api.savePenalty(penalty),
      (error) =>
        error instanceof SettingsError &&
        ((status !== 400 && status !== 409) || !!error.fields.code),
    )
    assert.ok(authSession.getSnapshot().session)
  }
  f.respond(async () => new Response("", { status: 401 }))
  await assert.rejects(f.api.listPolicies())
  assert.equal(authSession.getSnapshot().session, null)
})
test("invalid/nullable/unsafe DTOs and non-array responses are rejected", async () => {
  const f = fixture()
  for (const data of [
    null,
    {},
    [{ ...policy, userType: "OTHER" }],
    [{ ...policy, id: Number.MAX_SAFE_INTEGER + 1 }],
  ]) {
    f.respond(async () => ({ success: true, data }))
    await assert.rejects(f.api.listPolicies())
  }
  f.respond(async () => ({
    success: true,
    data: [{ ...penalty, unitPrice: null }],
  }))
  await assert.rejects(f.api.listPenalties())
  f.respond(async () => ({ data: [] }))
  await assert.rejects(f.api.listPolicies())
})
test("validation respects integer bounds, trimming, required fields and max lengths", () => {
  assert.deepEqual(validatePolicy(policyDraft(policy)), {})
  assert.ok(
    validatePolicy({ ...policyDraft(policy), loanDays: "0", maxRenewals: "-1" })
      .loanDays,
  )
  assert.ok(
    validatePolicy({ ...policyDraft(policy), maxLoans: "2147483648" }).maxLoans,
  )
  assert.ok(
    validatePenalty({
      ...emptyPenaltyDraft,
      code: " ",
      name: "x".repeat(256),
      unitPrice: "0.5",
    }).unitPrice,
  )
})
test("failed save keeps draft/field errors; double submission is blocked and POST never retries", async () => {
  const form = createFormModel({
    ...emptyPenaltyDraft,
    code: "LATE",
    name: "Trả muộn",
    unitName: "ngày",
    unitPrice: "5000",
  })
  const f = fixture()
  let finish
  f.respond(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const write = (draft, signal) =>
    f.api
      .savePenalty({ ...draft, unitPrice: Number(draft.unitPrice) }, signal)
      .then(() => {})
  const pending = form.submit(validatePenalty, write)
  assert.equal(await form.submit(validatePenalty, write), false)
  finish(new Response(JSON.stringify({ success: false }), { status: 409 }))
  assert.equal(await pending, false)
  assert.equal(f.calls.length, 1)
  assert.equal(form.getSnapshot().draft.code, "LATE")
  assert.ok(form.getSnapshot().errors.code)
  form.change("code", "NEW")
  f.respond(async () => {
    throw new TypeError("offline")
  })
  assert.equal(await form.submit(validatePenalty, write), false)
  assert.equal(f.calls.length, 2)
  assert.match(form.getSnapshot().message, /có thể đã được lưu/)
  assert.equal(form.getSnapshot().draft.code, "NEW")
})
test("compatibility adapter stays the same singleton and refuses invalid tokens", () => {
  assert.equal(module2Session, authSession)
  assert.throws(() =>
    sessionFromAccessToken(token("ADMIN", { type: "REFRESH" })),
  )
  assert.throws(() => sessionFromAccessToken(token("ADMIN", { exp: 1 })))
  assert.throws(() => sessionFromAccessToken(token("UNKNOWN")))
})

test("login, restoration, token rotation and logout reach the settings session", async () => {
  const { saveAuthSession, restoreAuthSession, clearAuthSession, remembersSession } =
    await import("../src/services/session.ts")
  function storage() {
    const entries = new Map()
    return {
      getItem: (key) => entries.get(key) ?? null,
      setItem: (key, value) => entries.set(key, value),
      removeItem: (key) => entries.delete(key),
    }
  }
  globalThis.window = { sessionStorage: storage(), localStorage: storage() }
  try {
    const user = { role: "LIBRARIAN" }
    authSession.setSession(null)
    saveAuthSession({ accessToken: token("LIBRARIAN"), user }, false)
    assert.equal(authSession.getSnapshot().session?.role, "LIBRARIAN")
    assert.equal(remembersSession(), false)
    const transport = fixture()
    await transport.api.listPolicies()
    assert.match(transport.calls[0].headers.Authorization, /^Bearer /)
    authSession.setSession(null)
    restoreAuthSession()
    assert.equal(authSession.getSnapshot().session.role, "LIBRARIAN")
    const { identityVersion } = authSession.getSnapshot()
    saveAuthSession({ accessToken: token("LIBRARIAN", { jti: "rotation" }), user }, false)
    assert.equal(authSession.getSnapshot().identityVersion, identityVersion)
    clearAuthSession()
    restoreAuthSession()
    assert.equal(authSession.getSnapshot().session, null)
  } finally {
    delete globalThis.window
  }
})
