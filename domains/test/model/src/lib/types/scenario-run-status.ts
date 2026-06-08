export enum ScenarioRunStatus {
  PASSED = "Passed",
  FAILED = "Failed",
  ABORTING = "Aborting",
  ABORTED = "Aborted",
  FAILED_TO_ABORT = "Failed To Abort",
  UNDERWAY = "Underway",
  READY = "READY",
  NA = "NA",
}

export const SCENARIO_RUN_STATUS_DISPLAY_NAMES: Record<
  ScenarioRunStatus,
  string
> = {
  [ScenarioRunStatus.PASSED]: "Passed",
  [ScenarioRunStatus.FAILED]: "Failed",
  [ScenarioRunStatus.ABORTING]: "Aborting",
  [ScenarioRunStatus.ABORTED]: "Aborted",
  [ScenarioRunStatus.FAILED_TO_ABORT]: "Failed To Abort",
  [ScenarioRunStatus.UNDERWAY]: "Underway",
  [ScenarioRunStatus.READY]: "Ready",
  [ScenarioRunStatus.NA]: "N/A",
};

export function getScenarioRunStatusDisplayName(
  status: ScenarioRunStatus
): string {
  return SCENARIO_RUN_STATUS_DISPLAY_NAMES[status];
}

export const ALL_SCENARIO_RUN_STATUSES = Object.values(ScenarioRunStatus);
