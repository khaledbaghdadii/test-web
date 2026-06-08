import { FormControl } from "@angular/forms";
import { WhitespaceValidators } from "./whitespace-validators";

describe("WhitespaceValidators", () => {
  describe("notBlank", () => {
    const validator = WhitespaceValidators.notBlank();

    it("accepts a non-empty string", () => {
      expect(validator(new FormControl("valid text"))).toBeNull();
    });

    it("accepts an empty string", () => {
      expect(validator(new FormControl(""))).toBeNull();
    });

    it("accepts a null value", () => {
      expect(validator(new FormControl(null))).toBeNull();
    });

    it("rejects a string of only spaces", () => {
      expect(validator(new FormControl("   "))).toEqual({ whitespace: true });
    });

    it("rejects a single space", () => {
      expect(validator(new FormControl(" "))).toEqual({ whitespace: true });
    });

    it("rejects tabs and whitespace characters", () => {
      expect(validator(new FormControl("\t\n "))).toEqual({ whitespace: true });
    });

    it("accepts a string with leading and trailing spaces around content", () => {
      expect(validator(new FormControl(" text "))).toBeNull();
    });

    it("accepts an array value", () => {
      expect(validator(new FormControl(["item"]))).toBeNull();
    });
  });

  describe("noWhitespaces", () => {
    const validator = WhitespaceValidators.noWhitespaces();

    it("accepts a string without spaces", () => {
      expect(validator(new FormControl("nospaces"))).toBeNull();
    });

    it("accepts an empty string", () => {
      expect(validator(new FormControl(""))).toBeNull();
    });

    it("accepts a null value", () => {
      expect(validator(new FormControl(null))).toBeNull();
    });

    it("rejects a string containing a space", () => {
      expect(validator(new FormControl("has space"))).toEqual({
        containsWhitespace: true,
      });
    });

    it("rejects a string with leading spaces", () => {
      expect(validator(new FormControl(" leading"))).toEqual({
        containsWhitespace: true,
      });
    });

    it("rejects a string with trailing spaces", () => {
      expect(validator(new FormControl("trailing "))).toEqual({
        containsWhitespace: true,
      });
    });
  });

  describe("arrayElementMaxLength", () => {
    const validator = WhitespaceValidators.arrayElementMaxLength(5);

    it("accepts an empty array", () => {
      expect(validator(new FormControl([]))).toBeNull();
    });

    it("accepts a non-array value", () => {
      expect(validator(new FormControl("not an array"))).toBeNull();
    });

    it("accepts a null value", () => {
      expect(validator(new FormControl(null))).toBeNull();
    });

    it("accepts when all elements are within the max length", () => {
      expect(validator(new FormControl(["ab", "cde"]))).toBeNull();
    });

    it("accepts an element exactly at the max length", () => {
      expect(validator(new FormControl(["abcde"]))).toBeNull();
    });

    it("rejects when an element exceeds the max length", () => {
      expect(validator(new FormControl(["abcdef"]))).toEqual({
        arrayElementMaxLength: {
          maxLength: 5,
          invalidElements: ["abcdef"],
        },
      });
    });

    it("reports all elements that exceed the max length", () => {
      expect(validator(new FormControl(["abcdef", "ok", "ghijkl"]))).toEqual({
        arrayElementMaxLength: {
          maxLength: 5,
          invalidElements: ["abcdef", "ghijkl"],
        },
      });
    });
  });
});
