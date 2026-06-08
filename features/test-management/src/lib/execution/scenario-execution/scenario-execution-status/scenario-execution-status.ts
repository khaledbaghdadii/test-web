export const ScenarioExecutionStatus = {
  PASSED: "Passed",
  FAILED: "Failed",
  ABORTING: "Aborting",
  ABORTED: "Aborted",
  FAILED_TO_ABORT: "Failed To Abort",
  UNDERWAY: "Underway",
  READY: "READY",
  NA: "NA",
};

export const possibleScenarioExecutionStatuses = [
  ScenarioExecutionStatus.PASSED,
  ScenarioExecutionStatus.FAILED,
  ScenarioExecutionStatus.ABORTING,
  ScenarioExecutionStatus.ABORTED,
  ScenarioExecutionStatus.FAILED_TO_ABORT,
  ScenarioExecutionStatus.UNDERWAY,
  ScenarioExecutionStatus.READY,
  ScenarioExecutionStatus.NA,
] as const;

export type ScenarioExecutionStatus =
  | (typeof possibleScenarioExecutionStatuses)[number]
  | undefined;
