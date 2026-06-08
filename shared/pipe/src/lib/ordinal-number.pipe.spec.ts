import { OrdinalNumberPipe } from "./ordinal-number.pipe";

describe("OrdinalNumberPipe", () => {
  const pipe = new OrdinalNumberPipe();

  it("appends 'st' to 1", () => {
    expect(pipe.transform(1)).toBe("1st");
  });

  it("appends 'nd' to 2", () => {
    expect(pipe.transform(2)).toBe("2nd");
  });

  it("appends 'rd' to 3", () => {
    expect(pipe.transform(3)).toBe("3rd");
  });

  it("appends 'th' to 4", () => {
    expect(pipe.transform(4)).toBe("4th");
  });

  it("appends 'th' to 11", () => {
    expect(pipe.transform(11)).toBe("11th");
  });

  it("appends 'th' to 12", () => {
    expect(pipe.transform(12)).toBe("12th");
  });

  it("appends 'th' to 13", () => {
    expect(pipe.transform(13)).toBe("13th");
  });

  it("appends 'st' to 21", () => {
    expect(pipe.transform(21)).toBe("21st");
  });

  it("appends 'nd' to 22", () => {
    expect(pipe.transform(22)).toBe("22nd");
  });

  it("appends 'rd' to 23", () => {
    expect(pipe.transform(23)).toBe("23rd");
  });

  it("appends 'th' to 100", () => {
    expect(pipe.transform(100)).toBe("100th");
  });

  it("appends 'st' to 101", () => {
    expect(pipe.transform(101)).toBe("101st");
  });

  it("appends 'th' to 111", () => {
    expect(pipe.transform(111)).toBe("111th");
  });

  it("appends 'th' to 112", () => {
    expect(pipe.transform(112)).toBe("112th");
  });

  it("appends 'th' to 113", () => {
    expect(pipe.transform(113)).toBe("113th");
  });

  it("appends 'st' to 1001", () => {
    expect(pipe.transform(1001)).toBe("1001st");
  });

  it("appends 'th' to 1011", () => {
    expect(pipe.transform(1011)).toBe("1011th");
  });

  it("appends 'th' to 0", () => {
    expect(pipe.transform(0)).toBe("0th");
  });
});
