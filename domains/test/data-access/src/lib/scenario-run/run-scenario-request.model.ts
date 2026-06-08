export interface RunScenarioRequest {
  readonly scenarioDefinitionId: string;
  readonly subContextId: string;
  readonly branchName: string;
  readonly commitId: string | null;
  readonly executionGroupId?: string | null;
  readonly machineGroupId?: string;
  readonly disableKeepExecution?: boolean;
  readonly disableConfigurationEditor?: boolean;
  readonly supportReconActivities?: boolean;
  readonly stopServices?: boolean;
  readonly validationScopeEnabled?: boolean;
  readonly incidentEnabled?: boolean;
  readonly qualityLevel?: string;
}

export interface RunScenarioResponse {
  readonly testExecutionId: string;
}

export interface ScenarioRunPermission {
  readonly actionAllowed: boolean;
  readonly rejectionReasons: string[];
  readonly warnings: string[];
}
