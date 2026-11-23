import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildPaginationRange,
  clampPageNumber,
  parsePageParam,
  parsePageSizeParam,
} from "../src/utils/pagination.ts";

test("buildPaginationRange renders full list when totalPages <= 7", () => {
  assert.deepEqual(buildPaginationRange(1, 1), [1]);
  assert.deepEqual(buildPaginationRange(3, 5), [1, 2, 3, 4, 5]);
  assert.deepEqual(buildPaginationRange(4, 7), [1, 2, 3, 4, 5, 6, 7]);
});

test("buildPaginationRange inserts clean ellipsis near start, middle and end", () => {
  assert.deepEqual(buildPaginationRange(1, 20), [1, 2, 3, 4, "gap", 20]);
  assert.deepEqual(buildPaginationRange(3, 20), [1, 2, 3, 4, "gap", 20]);
  assert.deepEqual(buildPaginationRange(10, 20), [1, "gap", 9, 10, 11, "gap", 20]);
  assert.deepEqual(buildPaginationRange(18, 20), [1, "gap", 17, 18, 19, 20]);
  assert.deepEqual(buildPaginationRange(20, 20), [1, "gap", 17, 18, 19, 20]);
});

test("clampPageNumber and param parsers reject out-of-range and invalid values", () => {
  assert.equal(clampPageNumber(0, 10), 1);
  assert.equal(clampPageNumber(99, 10), 10);
  assert.equal(clampPageNumber(Number.NaN, 10), 1);
  assert.equal(parsePageSizeParam("50", 20), 50);
  assert.equal(parsePageSizeParam("200", 20), 20);
  assert.equal(parsePageSizeParam("-5", 20), 20);
  assert.equal(parsePageParam("3", 0), 3);
  assert.equal(parsePageParam("-1", 0), 0);
});
