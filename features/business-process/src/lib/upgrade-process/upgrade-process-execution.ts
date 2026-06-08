import { UpgradeProcessCreateBranchStage } from "./stage/upgrade-process-create-branch-stage";
import { UpgradeProcessBinaryConversionStage } from "./stage/upgrade-process-binary-conversion-stage";
import { UpgradeProcessExecuteQualityGateStage } from "./stage/upgrade-process-execute-quality-gate-stage";
import { UpgradeProcessTagStage } from "./stage/upgrade-process-tag-stage";
import { UpgradeProcessIntegrateChangesStage } from "./stage/upgrade-process-integrate-changes-stage";
import {
  BusinessProcessExecutionStatus,
  ReferenceEnvironmentDeployment,
} from "@mxflow/features/business-process";

export class UpgradeProcessExecution {
  id: string;
  name: string;
  definitionName: string;
  familyName: string;
  processName: string;
  description?: string;
  startDate: string;
  endDate: string;
  expiryDate: string;
  status: BusinessProcessExecutionStatus;
  projectId: string;
  definitionId: string;
  supportsResourceManagement: boolean;
  notificationsRecipients?: string[];
  errorMessage?: string;
  officiality: string;
  input: UpgradeProcessInput;
  createBranchStage: UpgradeProcessCreateBranchStage;
  binaryConversionStage: UpgradeProcessBinaryConversionStage;
  executeQualityGateStage: UpgradeProcessExecuteQualityGateStage;
  tagStage: UpgradeProcessTagStage;
  integrateChangesStage: UpgradeProcessIntegrateChangesStage;
  referenceEnvironmentDeployment: ReferenceEnvironmentDeployment;
}

export class UpgradeProcessInput {
  factoryProductId: string;
  mxVersion: string;
  mxBuildId: string;
  bipVersion: string;
  bipBuildId: string;
  parentMxArchivalBranch: string;
  upgradeJump: string;
  repositoryId: string;
  configurationBranchName: string;
  configurationParentBranch: string;
  createBranch: boolean;
  qualityGateExecutionInfraGroupId: string;
  binaryConversionInfraGroupId: string;
  testScenarioIds: string[];
  binaryConversionTestScenarioId: string;
  referenceCommitId: string;
  referenceFactoryProductId: string;
  referenceMxVersion: string;
  referenceMxBuildId: string;
  referenceBipVersion: string;
  referenceBipBuildId: string;
  referenceEnvironmentDefinitionId: string;
  referenceEnvironmentInfraGroupId: string;
  businessProcessQualityLevel: string;
}
