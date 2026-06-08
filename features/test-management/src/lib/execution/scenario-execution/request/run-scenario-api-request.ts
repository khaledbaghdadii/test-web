export interface RunScenarioApiRequest {
  scenarioDefinitionId: string;
  subContextId: string;
  branchName: string;
  fullMaintenance: boolean;
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
