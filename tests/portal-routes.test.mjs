import assert from "node:assert/strict";
import { test } from "node:test";
import { routeAccess, safeReturnPath } from "../src/utils/portal-routes.ts";

test("catalog remains public and private portals require their matching role", () => {
  assert.equal(routeAccess("/reader/book-detail"), "public");
  assert.equal(routeAccess("/reader/profile"), "login");
  assert.equal(routeAccess("/reader/my-library/history", "READER"), "allowed");
  assert.equal(routeAccess("/reader/notifications/42", "ADMIN"), "forbidden");
  assert.equal(routeAccess("/staff/materials/edit/uuid", "LIBRARIAN"), "allowed");
  assert.equal(routeAccess("/admin/materials/edit/uuid", "ADMIN"), "allowed");
  assert.equal(routeAccess("/admin/policies", "LIBRARIAN"), "forbidden");
  assert.equal(routeAccess("/staff/search-configs", "LIBRARIAN"), "forbidden");
  assert.equal(routeAccess("/staff/materials/unexpected", "LIBRARIAN"), "missing");
  assert.equal(routeAccess("/unknown"), "missing");
});

test("login only restores known authorized internal destinations", () => {
  const target = "/reader/search?q=an+toan&page=2&sort=title#results";
  assert.equal(safeReturnPath(target, "READER"), target);
  assert.equal(safeReturnPath("/staff/materials/edit/uuid?q=pdf", "LIBRARIAN"), "/staff/materials/edit/uuid?q=pdf");
  for (const value of ["//external.example", "/\external.example", "https://external.example", "/login", "/reader/../login", "/admin/policies", "/unknown"]) {
    assert.equal(safeReturnPath(value, "READER"), undefined, value);
  }
});

test("document reader opens a digital copy for any signed-in role", () => {
  const reader = "/reader/document/0df91979-345f-45b6-9c08-9059edb400e0";
  assert.equal(routeAccess(reader), "login");
  assert.equal(routeAccess(reader, "READER"), "allowed");
  assert.equal(routeAccess(reader, "LIBRARIAN"), "allowed");
  assert.equal(routeAccess(reader, "ADMIN"), "allowed");
  assert.equal(routeAccess("/reader/document/42", "READER"), "missing");
  assert.equal(safeReturnPath(`${reader}?page=2&q=chung+khoan`, "READER"), `${reader}?page=2&q=chung+khoan`);
});
