import { Injectable } from "@angular/core";
import { UpgradeProcessExecutionApiModel } from "./upgrade-process-execution-api-model";
import { UpgradeProcessExecution } from "../../upgrade-process-execution";
import { BusinessProcessExecutionStatus } from "../../../business-process-execution-status/business-process-execution-status";
import { StageStatus } from "@mxevolve/domains/business-process/util";

@Injectable({ providedIn: "root" })
export class UpgradeProcessExecutionMapper {
  map(apiModel: UpgradeProcessExecutionApiModel): UpgradeProcessExecution {
    return {
      id: apiModel.id,
      name: apiModel.name,
      definitionName: apiModel.definitionName,
      familyName: apiModel.familyName,
      processName: apiModel.processName,
      description: apiModel.description,
      startDate: apiModel.startDate,
      endDate: apiModel.endDate,
      expiryDate: apiModel.expiryDate,
      supportsResourceManagement: apiModel.supportsResourceManagement,
      status: apiModel.status as BusinessProcessExecutionStatus,
      projectId: apiModel.projectId,
      definitionId: apiModel.definitionId,
      notificationsRecipients: apiModel.notificationsRecipients,
      errorMessage: apiModel.errorMessage,
      input: { ...apiModel.input },
      officiality: apiModel.officiality,
      createBranchStage: {
        route: "create-branch",
        name: apiModel.createBranchStage.name,
        status: apiModel.createBranchStage.status as StageStatus,
        startDate: apiModel.createBranchStage.startDate,
        endDate: apiModel.createBranchStage.endDate,
        errorMessage: apiModel.createBranchStage.errorMessage,
        createBranch: apiModel.createBranchStage.createBranch,
        repositoryId: apiModel.createBranchStage.repositoryId,
        developmentId: apiModel.createBranchStage.developmentId,
        lastCommitId: apiModel.createBranchStage.lastCommitId,
      },
      binaryConversionStage: {
        route: "run-technical-upgrade",
        name: apiModel.binaryConversionStage.name,
        status: apiModel.binaryConversionStage.status as StageStatus,
        startDate: apiModel.binaryConversionStage.startDate,
        endDate: apiModel.binaryConversionStage.endDate,
        errorMessage: apiModel.binaryConversionStage.errorMessage,
        referenceExecutionId:
          apiModel.binaryConversionStage.referenceExecutionId,
        decision: apiModel.binaryConversionStage.decision,
        actionRequester: apiModel.binaryConversionStage.actionRequester,
      },
      executeQualityGateStage: {
        route: "run-rtp",
        name: apiModel.executeQualityGateStage.name,
        status: apiModel.executeQualityGateStage.status as StageStatus,
        startDate: apiModel.executeQualityGateStage.startDate,
        endDate: apiModel.executeQualityGateStage.endDate,
        errorMessage: apiModel.executeQualityGateStage.errorMessage,
        validationResult: apiModel.executeQualityGateStage.validationResult,
        keptResourcesDecisionMade:
          apiModel.executeQualityGateStage.keptResourcesDecisionMade,
      },
      tagStage: {
        route: "tag-upgrade-branch",
        name: apiModel.tagUpgradeBranchStage.name,
        status: apiModel.tagUpgradeBranchStage.status as StageStatus,
        startDate: apiModel.tagUpgradeBranchStage.startDate,
        endDate: apiModel.tagUpgradeBranchStage.endDate,
        errorMessage: apiModel.tagUpgradeBranchStage.errorMessage,
        tagName: apiModel.tagUpgradeBranchStage.tagName,
        taggedCommitId: apiModel.tagUpgradeBranchStage.taggedCommitId,
      },
      integrateChangesStage: {
        route: "integrate-fixes",
        name: apiModel.integrateChangesStage.name,
        status: apiModel.integrateChangesStage.status as StageStatus,
        startDate: apiModel.integrateChangesStage.startDate,
        endDate: apiModel.integrateChangesStage.endDate,
        errorMessage: apiModel.integrateChangesStage.errorMessage,
        latestMergeJobId: apiModel.integrateChangesStage.latestMergeJobId,
        requester: apiModel.integrateChangesStage.requester,
      },
      referenceEnvironmentDeployment: {
        projectId: apiModel.projectId,
        processId: apiModel.id,
        supported: apiModel.referenceEnvironmentDeployment.supported,
        limitReached: apiModel.referenceEnvironmentDeployment.limitReached,
        canCleanAndDeploy:
          apiModel.referenceEnvironmentDeployment.canCleanAndDeploy,
        enabledInCurrentlyActiveStage:
          apiModel.referenceEnvironmentDeployment.enabledInCurrentlyActiveStage,
        referenceEnvironments:
          apiModel.referenceEnvironmentDeployment.referenceEnvironments,
        requestIds: apiModel.referenceEnvironmentDeployment.requestIds,
      },
    };
  }
}
