import { ExecutionStatus } from "./execution-status";
import { Stage } from "./stage";

export interface UpgradeProcessExecution {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly definitionName: string;
  readonly familyName: string;
  readonly processName: string;
  readonly description?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly expiryDate?: string;
  readonly status: ExecutionStatus;
  readonly definitionId: string;
  readonly supportsResourceManagement: boolean;
  readonly notificationsRecipients: string[];
  readonly errorMessage?: string;
  readonly officiality: string;
  readonly input: UpgradeProcessInput;
  readonly createBranchStage: UpgradeProcessCreateBranchStage;
  readonly binaryConversionStage: UpgradeProcessBinaryConversionStage;
  readonly executeQualityGateStage: UpgradeProcessExecuteQualityGateStage;
  readonly tagUpgradeBranchStage: UpgradeProcessTagStage;
  readonly integrateChangesStage: UpgradeProcessIntegrateChangesStage;
  readonly referenceEnvironmentDeployment: ReferenceEnvironmentDeployment;
}

export interface UpgradeProcessInput {
  readonly factoryProductId: string;
  readonly mxVersion: string;
  readonly mxBuildId: string;
  readonly bipVersion: string;
  readonly bipBuildId: string;
  readonly parentMxArchivalBranch: string;
  readonly upgradeJump: string;
  readonly businessProcessQualityLevel: string;
  readonly repositoryId: string;
  readonly configurationBranchName: string;
  readonly configurationParentBranch: string;
  readonly createBranch: boolean;
  readonly binaryConversionInfraGroupId: string;
  readonly qualityGateExecutionInfraGroupId: string;
  readonly binaryConversionTestScenarioId: string;
}

export interface UpgradeProcessCreateBranchStage extends Stage {
  readonly developmentId?: string;
}

export interface UpgradeProcessBinaryConversionStage extends Stage {
  readonly actionRequester?: string;
  readonly referenceExecutionId?: string;
}

export interface UpgradeProcessExecuteQualityGateStage extends Stage {
  readonly validationResult?: QualityGateValidationResult;
  readonly keptResourcesDecisionMade?: boolean;
}

export interface QualityGateValidationResult {
  readonly decision: QualityGateValidationDecision;
  readonly requester: string;
  readonly comment?: string;
}

export enum QualityGateValidationDecision {
  VALIDATION_PASSED = "VALIDATION_PASSED",
  FAILED_AND_STOP_THE_PROCESS = "FAILED_AND_STOP_THE_PROCESS",
}

export interface UpgradeProcessTagStage extends Stage {
  readonly tagName?: string;
  readonly taggedCommitId?: string;
}

export interface UpgradeProcessIntegrateChangesStage extends Stage {
  readonly latestMergeJobId?: string;
}

export interface ReferenceEnvironmentDeployment extends Stage {
  readonly supported: boolean;
  readonly enabledInCurrentlyActiveStage: boolean;
  readonly limitReached: boolean;
  readonly canCleanAndDeploy: boolean;
  readonly referenceEnvironments: string[];
  readonly requestIds: string[];
}
