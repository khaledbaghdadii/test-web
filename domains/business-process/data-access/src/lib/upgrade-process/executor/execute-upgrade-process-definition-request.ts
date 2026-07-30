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

/**
 * Every key is optional: the four dropdowns are filled in one at a time and the
 * request carries whatever has been chosen. Legacy declared `id`, `mxVersion`
 * and `mxBuildId` as required strings but fed them straight from an all-optional
 * form value, so unset keys went over the wire as `undefined` (i.e. omitted).
 * Defaulting them to `""` instead sends an empty string, which is a different
 * request.
 */
export interface FactoryProductRequest {
  id?: string;
  mxVersion?: string;
  mxBuildId?: string;
  bipVersion?: string;
  bipBuildId?: string;
}
