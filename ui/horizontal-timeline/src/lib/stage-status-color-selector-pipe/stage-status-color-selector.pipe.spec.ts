import { StageStatusColorSelectorPipe } from "./stage-status-color-selector.pipe";
import { StageStatus } from "../status-bar/stage-status";

describe("Pipe: StageStatusColorSelector", () => {
  let statusColorSelectorPipe: StageStatusColorSelectorPipe;
  beforeEach(() => {
    statusColorSelectorPipe = new StageStatusColorSelectorPipe();
  });

  it("transform failed status to color red correctly ", () => {
    expect(statusColorSelectorPipe.transform(StageStatus.FAILED)).toBe(
      "#dc3545"
    );
  });
  it("transform failed to start status to color red correctly ", () => {
    expect(statusColorSelectorPipe.transform(StageStatus.FAILED_TO_START)).toBe(
      "#dc3545"
    );
  });
  it("transform PASSED status to color green correctly ", () => {
    expect(statusColorSelectorPipe.transform(StageStatus.PASSED)).toBe(
      "#28a745"
    );
  });
  it("transform RUNNING status to color blue correctly ", () => {
    expect(statusColorSelectorPipe.transform(StageStatus.RUNNING)).toBe(
      "#007bff"
    );
  });
  it("transform NOT_STARTED status to color gray correctly ", () => {
    expect(statusColorSelectorPipe.transform(StageStatus.NOT_STARTED)).toBe(
      "#9fa5aa"
    );
  });
  it("transform PENDING_INPUT status to color yellow correctly ", () => {
    expect(statusColorSelectorPipe.transform(StageStatus.PENDING_INPUT)).toBe(
      "#ffc107"
    );
  });
  it("transform STOPPED status to color black correctly ", () => {
    expect(statusColorSelectorPipe.transform(StageStatus.STOPPED)).toBe(
      "#000000"
    );
  });

  it("transform SKIPPED status to color blue correctly ", () => {
    expect(statusColorSelectorPipe.transform(StageStatus.SKIPPED)).toBe(
      "#007bff"
    );
  });
});
