import { DurationUtils } from "./duration-utils";

describe("DurationUtils", () => {
  describe("parseDurationToSeconds", () => {
    it("converts an ISO duration to seconds", () => {
      expect(DurationUtils.parseDurationToSeconds("PT1M30S")).toBe(90);
    });

    it("converts an hour ISO duration to seconds", () => {
      expect(DurationUtils.parseDurationToSeconds("PT1H")).toBe(3600);
    });
  });

  describe("convertSecondsToDurationString", () => {
    it("formats a sub-minute duration", () => {
      expect(DurationUtils.convertSecondsToDurationString(45)).toBe(
        "45 seconds"
      );
    });

    it("formats minutes and seconds", () => {
      expect(DurationUtils.convertSecondsToDurationString(90)).toBe(
        "1 minute, 30 seconds"
      );
    });

    it("returns a zero-seconds fallback for zero", () => {
      expect(DurationUtils.convertSecondsToDurationString(0)).toBe("0 seconds");
    });
  });

  describe("parseDurationToMinutes", () => {
    it("formats an ISO duration as minutes and seconds", () => {
      expect(DurationUtils.parseDurationToMinutes("PT1M30S")).toBe(
        "1 minute, 30 seconds"
      );
    });
  });

  describe("formatDate", () => {
    it("formats a date into a localized string containing the year", () => {
      const formatted = DurationUtils.formatDate(
        new Date("2025-01-08T12:00:00Z")
      );

      expect(formatted).toContain("2025");
    });
  });
});
