export interface ExecuteValidationProcessRequest {
  name: string;
  definitionId: string;
  official: boolean;
  notificationsRecipients?: string[];
  configurationParameters: ValidationProcessConfigurationParameters;
  testParameters: ValidationProcessTestParameters;
  infrastructureParameters: ValidationProcessInfrastructureParameters;
  validationScopeParameters: ValidationScopeParameters;
}

export interface ValidationProcessConfigurationParameters {
  repositoryId: string;
  businessProcessQualityLevel: string;
  createBranch: boolean;
  parentBranchName?: string;
  archivalBranchName: string;
  configCommitId: string;
  rtpCommitId: string;
  finalProductId: string;
}

export interface ValidationProcessTestParameters {
  qualityGateScenarioDefinitionIds: string[];
  nightlyRepusherEnabled: boolean;
}

export interface ValidationProcessInfrastructureParameters {
  qualityGateInfraGroupId: string;
}

export interface ValidationScopeParameters {
  startCommitId: string | null;
}
