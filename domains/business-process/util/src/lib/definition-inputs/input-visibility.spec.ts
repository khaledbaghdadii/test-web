import { isInputEmpty, shouldShowInForm } from "./input-visibility";

describe("input-visibility", () => {
  describe("isInputEmpty", () => {
    it.each([
      ["null", null],
      ["undefined", undefined],
      ["empty string", ""],
      ["empty array", []],
    ])("returns true for %s", (_label, value) => {
      expect(isInputEmpty(value)).toBe(true);
    });

    it.each([
      ["a non-empty string", "value"],
      ["zero", 0],
      ["false", false],
      ["a non-empty array", ["a"]],
      ["an object", { a: 1 }],
    ])("returns false for %s", (_label, value) => {
      expect(isInputEmpty(value)).toBe(false);
    });
  });

  describe("shouldShowInForm", () => {
    it("shows any field when forceShow is true regardless of mode", () => {
      expect(
        shouldShowInForm(
          { invalid: false, value: "filled" },
          "ACCESS_INVALID_INPUTS_ONLY",
          true
        )
      ).toBe(true);
    });

    it("always shows a field in ACCESS_ALL_INPUTS mode", () => {
      expect(
        shouldShowInForm(
          { invalid: false, value: "filled" },
          "ACCESS_ALL_INPUTS"
        )
      ).toBe(true);
    });

    it("shows an ACCESS_INVALID_INPUTS_ONLY field only when the control is invalid", () => {
      expect(
        shouldShowInForm(
          { invalid: true, value: "" },
          "ACCESS_INVALID_INPUTS_ONLY"
        )
      ).toBe(true);
      expect(
        shouldShowInForm(
          { invalid: false, value: "filled" },
          "ACCESS_INVALID_INPUTS_ONLY"
        )
      ).toBe(false);
    });

    it("shows an ACCESS_EMPTY_OPTIONAL_INPUTS field only when the value is empty", () => {
      expect(
        shouldShowInForm(
          { invalid: false, value: "" },
          "ACCESS_EMPTY_OPTIONAL_INPUTS"
        )
      ).toBe(true);
      expect(
        shouldShowInForm(
          { invalid: false, value: [] },
          "ACCESS_EMPTY_OPTIONAL_INPUTS"
        )
      ).toBe(true);
      expect(
        shouldShowInForm(
          { invalid: false, value: "recipient" },
          "ACCESS_EMPTY_OPTIONAL_INPUTS"
        )
      ).toBe(false);
    });
  });
});
