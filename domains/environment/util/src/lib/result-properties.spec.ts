import {
  allResultProperties,
  getManagementRequestResultProperties,
} from "./result-properties";

describe("getManagementRequestResultProperties", () => {
  it("returns INVALID properties when status is INVALID regardless of result status", () => {
    expect(getManagementRequestResultProperties("INVALID", "SUCCESS")).toBe(
      allResultProperties["INVALID"]
    );
  });

  it("returns UNFINISHED properties when result status is undefined", () => {
    expect(getManagementRequestResultProperties("PENDING")).toBe(
      allResultProperties["UNFINISHED"]
    );
  });

  it("returns UNFINISHED properties when result status is null", () => {
    expect(
      getManagementRequestResultProperties("PENDING", null as unknown as string)
    ).toBe(allResultProperties["UNFINISHED"]);
  });

  it("returns SUCCESS properties for a SUCCESS result status", () => {
    expect(getManagementRequestResultProperties("ENDED", "SUCCESS")).toBe(
      allResultProperties["SUCCESS"]
    );
  });

  it("returns FAILURE properties for a FAILURE result status", () => {
    expect(getManagementRequestResultProperties("ENDED", "FAILURE")).toBe(
      allResultProperties["FAILURE"]
    );
  });

  it("returns TIMEOUT properties for a TIMEOUT result status", () => {
    expect(getManagementRequestResultProperties("ENDED", "TIMEOUT")).toBe(
      allResultProperties["TIMEOUT"]
    );
  });

  it("returns ABORTED properties for an ABORTED result status", () => {
    expect(getManagementRequestResultProperties("ENDED", "ABORTED")).toBe(
      allResultProperties["ABORTED"]
    );
  });

  it("returns undefined for an unknown result status", () => {
    expect(
      getManagementRequestResultProperties("ENDED", "UNKNOWN")
    ).toBeUndefined();
  });
});

describe("allResultProperties", () => {
  it("marks FAILURE as having a popover", () => {
    expect(allResultProperties["FAILURE"].hasPopover).toBe(true);
  });

  it("marks SUCCESS as not having a popover", () => {
    expect(allResultProperties["SUCCESS"].hasPopover).toBe(false);
  });
});
