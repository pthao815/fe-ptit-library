import assert from "node:assert/strict";
import test from "node:test";
import {
  isPopupBlockedError,
  isUserCancelledError,
  mapMicrosoftAuthError,
  resolveMicrosoftRedirectUri,
} from "../src/utils/microsoft-auth.ts";

test("resolveMicrosoftRedirectUri uses explicit URI or falls back to origin + /login", () => {
  assert.equal(
    resolveMicrosoftRedirectUri("https://library.ptit.edu.vn/login", "http://localhost:8443"),
    "https://library.ptit.edu.vn/login",
  );
  assert.equal(
    resolveMicrosoftRedirectUri("", "http://localhost:8443/"),
    "http://localhost:8443/login",
  );
  assert.equal(resolveMicrosoftRedirectUri("   ", ""), "/login");
});

test("detects popup blocked and user cancellation errors", () => {
  assert.equal(isPopupBlockedError({ errorCode: "popup_window_error" }), true);
  assert.equal(isPopupBlockedError({ errorCode: "empty_window_error" }), true);
  assert.equal(isPopupBlockedError({ errorCode: "user_cancelled" }), false);

  assert.equal(isUserCancelledError({ errorCode: "user_cancelled" }), true);
  assert.equal(isUserCancelledError({ message: "network_error" }), false);
});

test("maps MSAL and Entra ID errors to clear Vietnamese messages", () => {
  const cancelled = mapMicrosoftAuthError({ errorCode: "user_cancelled" });
  assert.equal(cancelled.tone, "info");
  assert.match(cancelled.text, /hủy/i);

  const inProgress = mapMicrosoftAuthError({ errorCode: "interaction_in_progress" });
  assert.equal(inProgress.tone, "info");
  assert.match(inProgress.text, /đang mở/i);

  const adminApproval = mapMicrosoftAuthError({
    errorMessage: "AADSTS90094: This operation can only be performed by an administrator.",
  });
  assert.equal(adminApproval.tone, "error");
  assert.match(adminApproval.text, /AADSTS90094/);

  const unknown = mapMicrosoftAuthError(new Error("unexpected"));
  assert.equal(unknown.tone, "error");
  assert.match(unknown.text, /Không thể đăng nhập bằng tài khoản Microsoft/);
});
