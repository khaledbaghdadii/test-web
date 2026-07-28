export interface DeployReferenceResourceRequest {
  readonly commitId: string;
  readonly referenceFactoryProductId: string;
  readonly scenarioDefinitionId: string;
  readonly executionGroupId: string;
  readonly machineGroupId: string;
  readonly qualityLevel: string;
  readonly cleanIfPassed: boolean;
  readonly disableKeepExecution: boolean;
  readonly disableConfigurationEditor: boolean;
  readonly supportReconActivities: boolean;
  readonly stopServices: boolean;
  readonly validationScopeEnabled: boolean;
  readonly incidentEnabled: boolean;
}
