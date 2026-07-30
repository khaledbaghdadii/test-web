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

/**
 * Every key is optional: the four dropdowns are filled in one at a time and the
 * request carries whatever has been chosen. Legacy declared `id`, `mxVersion`
 * and `mxBuildId` as required strings but fed them straight from an all-optional
 * form value, so unset keys went over the wire as `undefined` (i.e. omitted).
 * Defaulting them to `""` instead sends an empty string, which is a different
 * request.
 */
export interface FactoryProductRequestApiModel {
  id?: string;
  mxVersion?: string;
  mxBuildId?: string;
  bipVersion?: string;
  bipBuildId?: string;
}
