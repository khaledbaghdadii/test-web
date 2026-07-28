export interface CheckKeepExecutionDisabledRequest {
  scenarioExecutionCleaningStatus: string;
  isScenarioExecutionFailed: boolean;
  isTestUnitHead: boolean;
  disableKeepExecution: boolean;
}
