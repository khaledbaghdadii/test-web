import { DateFormatPipe } from "./date-format.pipe";

describe("DateFormatPipe", () => {
  const pipe = new DateFormatPipe();

  it("formats a valid date string in medium format", () => {
    const result = pipe.transform("2026-01-15T10:30:00Z");
    expect(result).toMatch(/Jan 15, 2026/);
  });

  it("returns a dash when the value is undefined", () => {
    expect(pipe.transform(undefined)).toBe("-");
  });

  it("returns a dash when the value is null", () => {
    expect(pipe.transform(null)).toBe("-");
  });

  it("returns a dash when the value is an empty string", () => {
    expect(pipe.transform("")).toBe("-");
  });
});
