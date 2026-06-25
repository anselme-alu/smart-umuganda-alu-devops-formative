import { add } from "./math";
import { describe, test, expect } from "vitest";

describe("Math", () => {
  describe("Add", () => {
    test("1 + 2 = 3", () => {
      expect(add(1, 2)).toEqual(3);
    });
  });
});
