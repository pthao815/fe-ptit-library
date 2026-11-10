import { test } from "node:test"
import assert from "node:assert/strict"
import {
  MAX_PDF_SIZE_MB,
  describeProcessing,
  nextPdfVersion,
  validatePdfFile,
} from "../src/pages/staff/materials/digital-copy.ts"

const pdf = (name = "a.pdf", body = "%PDF-1.7") => new File([body], name)

test("chấp nhận PDF hợp lệ", async () => {
  assert.equal(await validatePdfFile(pdf()), null)
  assert.equal(await validatePdfFile(pdf("A.PDF")), null)
})

test("từ chối đuôi sai, tệp rỗng và nội dung không phải PDF", async () => {
  assert.match(await validatePdfFile(pdf("a.txt")), /\.pdf/)
  assert.match(await validatePdfFile(pdf("a.pdf", "")), /rỗng/)
  assert.match(await validatePdfFile(pdf("a.pdf", "hello")), /không phải PDF/)
})

test("từ chối tệp vượt giới hạn backend nhưng nhận đúng bằng giới hạn", async () => {
  const limit = MAX_PDF_SIZE_MB * 1024 * 1024
  const head = new TextEncoder().encode("%PDF-")
  const sized = (size) => {
    const bytes = new Uint8Array(size)
    bytes.set(head)
    return new File([bytes], "a.pdf")
  }
  assert.equal(await validatePdfFile(sized(limit)), null)
  assert.match(await validatePdfFile(sized(limit + 1)), /100 MB/)
})

test("gộp trạng thái job và digital copy", () => {
  const cases = [
    ["QUEUED", "PENDING", "Đang chờ xử lý", false],
    ["RUNNING", "PROCESSING", "Đang xử lý", false],
    ["COMPLETED", "INDEXED", "Đã xử lý", true],
    ["COMPLETED", "LOW_QUALITY", "Chất lượng thấp", true],
    ["FAILED", "FAILED", "Lỗi xử lý", true],
    ["FAILED", "PENDING", "Lỗi xử lý", true],
    ["CANCELLED", "PENDING", "Đã hủy", true],
    [undefined, "INDEXED", "Đã xử lý", true],
    [undefined, "PENDING", "Đang chờ xử lý", false],
  ]
  for (const [job, copy, label, finished] of cases) {
    const view = describeProcessing(job, copy)
    assert.equal(view.label, label)
    assert.equal(view.finished, finished)
  }
})

test("phiên bản: bản đầu 1.0, bản thay thế dùng mốc thời gian", () => {
  assert.equal(nextPdfVersion(false), "1.0")
  assert.equal(
    nextPdfVersion(true, new Date("2026-11-06T08:05:09Z")),
    "20261106-0805",
  )
})
