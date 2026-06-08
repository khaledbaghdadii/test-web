export interface RepushUpgradeProcessDefinitionInputs {
  name: string;
  official: boolean;
  notificationsRecipients?: string[];
  factoryProduct: FactoryProductInput;
  parentMxArchivalBranch: string;
  repositoryId: string;
  businessProcessQualityLevel: string;
  createBranch: boolean;
  configurationBranchName: string;
  configurationParentBranch: string;
  qualityGateExecutionInfraGroupId: string;
  binaryConversionInfraGroupId: string;
  testScenarioIds: string[];
  technicalUpgradeTestScenarioId: string;
  referenceFactoryProduct: FactoryProductInput;
  referenceCommitId: string;
  referenceEnvironmentDefinitionId: string;
  referenceEnvironmentInfraGroupId: string;
  upgradeJump: string;
}

export interface FactoryProductInput {
  id: string;
  mxVersion: string;
  mxBuildId: string;
  bipVersion: string;
  bipBuildId: string;
}
