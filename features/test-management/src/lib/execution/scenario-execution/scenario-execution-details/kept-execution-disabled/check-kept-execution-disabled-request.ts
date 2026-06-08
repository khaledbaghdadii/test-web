export interface CheckKeptExecutionDisabledRequest {
  scenarioExecutionCleaningStatus: string;
  isScenarioExecutionFailed: boolean;
  disableKeepExecution: boolean;
}
