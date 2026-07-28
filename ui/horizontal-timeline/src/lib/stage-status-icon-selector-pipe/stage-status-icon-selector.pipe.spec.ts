import { StageStatus } from "../status-bar/stage-status";
import { StageStatusIconSelectorPipe } from "./stage-status-icon-selector.pipe";

describe("Pipe: StageStatusIconSelector", () => {
  let statusIconSelectorPipe: StageStatusIconSelectorPipe;
  beforeEach(() => {
    statusIconSelectorPipe = new StageStatusIconSelectorPipe();
  });

  it("transform failed status to close icon correctly ", () => {
    expect(statusIconSelectorPipe.transform(StageStatus.FAILED)).toBe(
      "pi pi-times-circle"
    );
  });
  it("transform failed to start status to close icon correctly ", () => {
    expect(statusIconSelectorPipe.transform(StageStatus.FAILED_TO_START)).toBe(
      "pi pi-times-circle"
    );
  });
  it("transform on hold status to pause icon correctly ", () => {
    expect(statusIconSelectorPipe.transform(StageStatus.ON_HOLD)).toBe(
      "pi pi-pause-circle"
    );
  });
  it("transform PASSED status to check icon correctly ", () => {
    expect(statusIconSelectorPipe.transform(StageStatus.PASSED)).toBe(
      "pi pi-check-circle"
    );
  });
  it("transform RUNNING status loading icon correctly ", () => {
    expect(statusIconSelectorPipe.transform(StageStatus.RUNNING)).toBe(
      "pi pi-spin pi-spinner"
    );
  });
  it("transform NOT_STARTED status to clock icon correctly ", () => {
    expect(statusIconSelectorPipe.transform(StageStatus.NOT_STARTED)).toBe(
      "pi pi-clock"
    );
  });
  it("transform PENDING_INPUT status to clock icon correctly ", () => {
    expect(statusIconSelectorPipe.transform(StageStatus.PENDING_INPUT)).toBe(
      "pi pi-exclamation-triangle"
    );
  });
  it("transform SKIPPED status to forward icon correctly ", () => {
    expect(statusIconSelectorPipe.transform(StageStatus.SKIPPED)).toBe(
      "pi pi-chevron-circle-right"
    );
  });
  it("transform STOPPED status to stop icon correctly ", () => {
    expect(statusIconSelectorPipe.transform(StageStatus.STOPPED)).toBe(
      "pi pi-ban"
    );
  });
  it("transform CANCELED status to stop icon correctly ", () => {
    expect(statusIconSelectorPipe.transform(StageStatus.CANCELED)).toBe(
      "pi pi-minus-circle"
    );
  });
});
