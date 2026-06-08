export interface ExecuteUpgradeProcessDefinitionRequest {
  projectId: string;
  name: string;
  definitionId: string;
  official: boolean;
  notificationsRecipients?: string[];
  mxParameters: UpgradeProcessMxParameters;
  configurationParameters: UpgradeProcessConfigurationParameters;
  infrastructureParameters: UpgradeProcessInfrastructureParameters;
  testParameters: UpgradeProcessTestParameters;
  referenceEnvironmentParameters: UpgradeProcessReferenceEnvironmentParameters;
}

export interface UpgradeProcessMxParameters {
  parentMxArchivalBranch: string;
  conversionFactoryProduct: FactoryProductRequest;
  upgradeJump: string;
}

export interface UpgradeProcessConfigurationParameters {
  repositoryId: string;
  createBranch: boolean;
  configurationBranchName: string;
  configurationParentBranchName: string;
  businessProcessQualityLevel: string;
}

export interface UpgradeProcessInfrastructureParameters {
  qualityGateExecutionInfraGroupId: string;
  binaryConversionInfraGroupId: string;
}

export interface UpgradeProcessTestParameters {
  binaryConversionScenarioDefinitionId: string;
  qualityGateScenarioDefinitionIds: string[];
}

export interface UpgradeProcessReferenceEnvironmentParameters {
  referenceCommitId: string;
  referenceFactoryProduct: FactoryProductRequest;
  referenceEnvironmentDefinitionId: string;
  referenceEnvironmentInfraGroupId: string;
}

export interface FactoryProductRequest {
  id: string;
  mxVersion: string;
  mxBuildId: string;
  bipVersion?: string;
  bipBuildId?: string;
}
