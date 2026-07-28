export enum ScenarioExecutionHousekeepingStatus {
  NOT_LAUNCHED = "NOT_LAUNCHED",
  UNDERWAY = "UNDERWAY",
  FAILED = "FAILED",
  PASSED = "PASSED",
  SCHEDULED_FOR_CLEANING = "SCHEDULED_FOR_CLEANING",
}

export const ScenarioExecutionHousekeepingStatusDisplayValue: Record<
  ScenarioExecutionHousekeepingStatus,
  string
> = {
  [ScenarioExecutionHousekeepingStatus.NOT_LAUNCHED]: "Not Launched",
  [ScenarioExecutionHousekeepingStatus.UNDERWAY]: "Underway",
  [ScenarioExecutionHousekeepingStatus.FAILED]: "Failed",
  [ScenarioExecutionHousekeepingStatus.PASSED]: "Passed",
  [ScenarioExecutionHousekeepingStatus.SCHEDULED_FOR_CLEANING]:
    "Scheduled for Cleaning",
};
