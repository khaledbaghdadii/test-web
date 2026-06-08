export interface RunScenarioRequest {
  scenarioDefinitionId: string;
  subContextId: string;
  branchName: string;
  commitId: string | null;
  executionGroupId?: string | null;
  machineGroupId?: string;
  disableKeepExecution?: boolean;
  disableConfigurationEditor?: boolean;
  supportReconActivities?: boolean;
  stopServices?: boolean;
  validationScopeEnabled?: boolean;
  incidentEnabled?: boolean;
  qualityLevel?: string;
}
