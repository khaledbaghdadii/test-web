import { DetectionLinksChangedPipe } from "./detection-links-changed.pipe";
import { AnalysisObject } from "@mxflow/features/analysis-objects";

describe("DetectionLinksChangedPipe", () => {
  const initialIds = ["1", "2"];
  const currentDetectionSelection: AnalysisObject[] = [
    { id: "1" },
    { id: "2" },
    { id: "3" },
  ];

  const pipe = new DetectionLinksChangedPipe();

  it("create an instance", () => {
    expect(pipe).toBeTruthy();
  });

  it("should return false if no changes", () => {
    expect(
      pipe.transform(initialIds, currentDetectionSelection.slice(0, 2))
    ).toBeFalsy();
  });

  it("should return true if user selected a new detection", () => {
    expect(pipe.transform(initialIds, currentDetectionSelection)).toBeTruthy();
  });

  it("should return true if a user unselected a detection", () => {
    expect(pipe.transform(initialIds, [currentDetectionSelection[0]])).toBe(
      true
    );
  });

  it("should return true if a user unselected an existing detection and selected a different one", () => {
    expect(
      pipe.transform(initialIds, [
        currentDetectionSelection[0],
        currentDetectionSelection[2],
      ])
    ).toBe(true);
  });

  it("should return false if initial and current selections are empty", () => {
    expect(pipe.transform([], [])).toBeFalsy();
  });

  it("should return true if initial selection is empty and current selection is not", () => {
    expect(pipe.transform([], currentDetectionSelection)).toBeTruthy();
  });

  it("should return true if current selection is empty and initial selection is not", () => {
    expect(pipe.transform(initialIds, [])).toBeTruthy();
  });
});
