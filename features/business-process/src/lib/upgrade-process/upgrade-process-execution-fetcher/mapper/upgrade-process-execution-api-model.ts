import { UpgradeProcessInput } from "../../upgrade-process-execution";
import { QualityGateValidationResult } from "../../../quality-gate-validation/quality-gate-validation-result";
import { ReferenceEnvironmentDeploymentApiModel } from "../../../reference-environment-deployment/reference-environment-deployment-api-model";

export class UpgradeProcessExecutionApiModel {
  id: string;
  name: string;
  definitionName: string;
  familyName: string;
  processName: string;
  description?: string;
  startDate: string;
  endDate: string;
  expiryDate: string;
  status: string;
  projectId: string;
  definitionId: string;
  supportsResourceManagement: boolean;
  notificationsRecipients?: string[];
  errorMessage?: string;
  officiality: string;
  input: UpgradeProcessInput;
  createBranchStage: {
    name: string;
    status: string;
    startDate?: string;
    endDate?: string;
    errorMessage?: string;
    developmentId: string;
    createBranch: boolean;
    repositoryId: string;
    lastCommitId?: string;
  };
  binaryConversionStage: {
    name: string;
    status: string;
    startDate?: string;
    endDate?: string;
    errorMessage?: string;
    actionRequester: string;
    referenceExecutionId: string;
    decision: string;
  };
  executeQualityGateStage: {
    name: string;
    status: string;
    startDate?: string;
    endDate?: string;
    errorMessage?: string;
    validationResult?: QualityGateValidationResult;
    keptResourcesDecisionMade?: boolean;
  };
  tagUpgradeBranchStage: {
    name: string;
    status: string;
    startDate?: string;
    endDate?: string;
    errorMessage?: string;
    tagName?: string;
    taggedCommitId?: string;
  };
  integrateChangesStage: {
    name: string;
    status: string;
    startDate?: string;
    endDate?: string;
    errorMessage?: string;
    requester: string;
    latestMergeJobId: string;
  };
  referenceEnvironmentDeployment: ReferenceEnvironmentDeploymentApiModel;
}
