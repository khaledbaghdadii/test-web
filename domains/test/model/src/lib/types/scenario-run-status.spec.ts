import {
  ALL_SCENARIO_RUN_STATUSES,
  getScenarioRunStatusDisplayName,
  SCENARIO_RUN_STATUS_DISPLAY_NAMES,
  ScenarioRunStatus,
} from "./scenario-run-status";

describe("ScenarioRunStatus", () => {
  it("contains all expected statuses", () => {
    expect(Object.values(ScenarioRunStatus)).toEqual([
      "Passed",
      "Failed",
      "Aborting",
      "Aborted",
      "Failed To Abort",
      "Underway",
      "READY",
      "NA",
    ]);
  });
});

describe("ALL_SCENARIO_RUN_STATUSES", () => {
  it("contains all enum values", () => {
    expect(ALL_SCENARIO_RUN_STATUSES).toEqual(Object.values(ScenarioRunStatus));
  });
});

describe("SCENARIO_RUN_STATUS_DISPLAY_NAMES", () => {
  it("has a display name for every status", () => {
    for (const status of ALL_SCENARIO_RUN_STATUSES) {
      expect(SCENARIO_RUN_STATUS_DISPLAY_NAMES[status]).toBeDefined();
    }
  });
});

describe("getScenarioRunStatusDisplayName", () => {
  it("returns the correct display name for each status", () => {
    expect(getScenarioRunStatusDisplayName(ScenarioRunStatus.PASSED)).toBe(
      "Passed"
    );
    expect(getScenarioRunStatusDisplayName(ScenarioRunStatus.FAILED)).toBe(
      "Failed"
    );
    expect(getScenarioRunStatusDisplayName(ScenarioRunStatus.ABORTING)).toBe(
      "Aborting"
    );
    expect(getScenarioRunStatusDisplayName(ScenarioRunStatus.ABORTED)).toBe(
      "Aborted"
    );
    expect(
      getScenarioRunStatusDisplayName(ScenarioRunStatus.FAILED_TO_ABORT)
    ).toBe("Failed To Abort");
    expect(getScenarioRunStatusDisplayName(ScenarioRunStatus.UNDERWAY)).toBe(
      "Underway"
    );
    expect(getScenarioRunStatusDisplayName(ScenarioRunStatus.READY)).toBe(
      "Ready"
    );
    expect(getScenarioRunStatusDisplayName(ScenarioRunStatus.NA)).toBe("N/A");
  });
});
