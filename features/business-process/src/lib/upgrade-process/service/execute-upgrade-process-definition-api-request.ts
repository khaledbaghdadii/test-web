export interface ExecuteUpgradeProcessDefinitionApiRequest {
  name: string;
  definitionId: string;
  official: boolean;
  notificationsRecipients?: string[];
  mxParameters: UpgradeProcessMxParametersApiModel;
  configurationParameters: UpgradeProcessConfigurationParametersApiModel;
  infrastructureParameters: UpgradeProcessInfrastructureParametersApiModel;
  testParameters: UpgradeProcessTestParametersApiModel;
  referenceEnvironmentParameters: UpgradeProcessReferenceEnvironmentParametersApiModel;
}

export interface UpgradeProcessMxParametersApiModel {
  parentMxArchivalBranch: string;
  upgradeJump: string;
  conversionFactoryProduct: FactoryProductRequestApiModel;
}

export interface UpgradeProcessConfigurationParametersApiModel {
  repositoryId: string;
  createBranch: boolean;
  configurationBranchName: string;
  configurationParentBranchName: string;
  businessProcessQualityLevel: string;
}

export interface UpgradeProcessInfrastructureParametersApiModel {
  qualityGateExecutionInfraGroupId: string;
  binaryConversionInfraGroupId: string;
}

export interface UpgradeProcessTestParametersApiModel {
  binaryConversionScenarioDefinitionId: string;
  qualityGateScenarioDefinitionIds: string[];
}

export interface UpgradeProcessReferenceEnvironmentParametersApiModel {
  referenceCommitId: string;
  referenceFactoryProduct: FactoryProductRequestApiModel;
  referenceEnvironmentDefinitionId: string;
  referenceEnvironmentInfraGroupId: string;
}

export interface FactoryProductRequestApiModel {
  id: string;
  mxVersion: string;
  mxBuildId: string;
  bipVersion?: string;
  bipBuildId?: string;
}
