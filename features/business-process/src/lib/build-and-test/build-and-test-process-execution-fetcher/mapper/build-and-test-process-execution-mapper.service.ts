import { Injectable } from "@angular/core";
import { BuildAndTestProcessExecutionApiModel } from "./build-and-test-process-execution-api-model";
import { BuildAndTestProcessStageStatus } from "../../stage/build-and-test-process-stage-status";
import { BuildAndTestProcessStage } from "../../stage/build-and-test-process-stage";
import { Stage, StageStatus } from "@mxflow/ui/horizontal-timeline";
import { BuildAndTestProcessExecution } from "../../build-and-test-process-execution";
import { BusinessProcessExecutionStatus } from "../../../business-process-execution-status/business-process-execution-status";

@Injectable({ providedIn: "root" })
export class BuildAndTestProcessExecutionMapperService {
  map(
    apiModel: BuildAndTestProcessExecutionApiModel
  ): BuildAndTestProcessExecution {
    return {
      id: apiModel.id,
      name: apiModel.name,
      projectId: apiModel.projectId,
      definitionId: apiModel.definitionId,
      owner: apiModel.owner,
      errorMessage: apiModel.errorMessage,
      startDate: apiModel.startDate,
      endDate: apiModel.endDate,
      expiryDate: apiModel.expiryDate,
      supportsResourceManagement: apiModel.supportsResourceManagement,
      hasPredefinedMergeRequestInputs: apiModel.hasPredefinedMergeRequestInputs,
      status: apiModel.status as BusinessProcessExecutionStatus,
      notificationsRecipients: apiModel.notificationsRecipients,
      ciVersion: apiModel.ciVersion,
      source: apiModel.source,
      input: apiModel.input,
      createBranchStage: {
        name: apiModel.createBranchStage.name,
        startDate: apiModel.createBranchStage.startDate,
        endDate: apiModel.createBranchStage.endDate,
        errorMessage: apiModel.createBranchStage.errorMessage,
        createBranch: apiModel.createBranchStage.createBranch,
        repositoryId: apiModel.createBranchStage.repositoryId
          ? apiModel.createBranchStage.repositoryId
          : "-",
        developmentId: apiModel.createBranchStage.developmentId,
        status: apiModel.createBranchStage
          .status as BuildAndTestProcessStageStatus,
        route: "create-branch",
      },
      prepareBuildStage: {
        name: apiModel.prepareBuildStage.name,
        startDate: apiModel.prepareBuildStage.startDate,
        endDate: apiModel.prepareBuildStage.endDate,
        errorMessage: apiModel.prepareBuildStage.errorMessage,
        requester: apiModel.prepareBuildStage.requester,
        latestScenarioExecutionId:
          apiModel.prepareBuildStage.latestScenarioExecutionId,
        status: apiModel.prepareBuildStage
          .status as BuildAndTestProcessStageStatus,
        route: "prepare-build",
      },
      buildAndTestStage: {
        name: apiModel.buildAndTestStage.name,
        startDate: apiModel.buildAndTestStage.startDate,
        endDate: apiModel.buildAndTestStage.endDate,
        errorMessage: apiModel.buildAndTestStage.errorMessage,
        requester: apiModel.buildAndTestStage.requester,
        scenarioExecutionGroup:
          apiModel.buildAndTestStage.scenarioExecutionGroup,
        technicalReseedExecutionGroupId:
          apiModel.buildAndTestStage.technicalReseedExecutionGroupId,
        status: apiModel.buildAndTestStage
          .status as BuildAndTestProcessStageStatus,
        route: "build-and-test",
        readyForBuildAndTest: apiModel.buildAndTestStage.readyForBuildAndTest,
        cherryPickRunning: apiModel.buildAndTestStage.cherryPickRunning,
        cherryPickFailed: apiModel.buildAndTestStage.cherryPickFailed,
      },
      integrateChangesStage: {
        name: apiModel.integrateChangesStage.name,
        startDate: apiModel.integrateChangesStage.startDate,
        endDate: apiModel.integrateChangesStage.endDate,
        errorMessage: apiModel.integrateChangesStage.errorMessage,
        latestMergeJobId: apiModel.integrateChangesStage.latestMergeJobId,
        requester: apiModel.integrateChangesStage.requester,
        backportRequested: apiModel.integrateChangesStage.backportRequested,
        willPublishFinalProduct:
          apiModel.integrateChangesStage.willPublishFinalProduct,
        backportStopRequester:
          apiModel.integrateChangesStage.backportStopRequester,
        canStopBackport: apiModel.integrateChangesStage.canStopBackport,
        backportExecutions: apiModel.integrateChangesStage.backportExecutions,
        failedBackportDefinitions:
          apiModel.integrateChangesStage.failedBackportDefinitions,
        status: apiModel.integrateChangesStage
          .status as BuildAndTestProcessStageStatus,
        backports: apiModel.integrateChangesStage.backports,
        finalProductPublishing:
          apiModel.integrateChangesStage.finalProductPublishing,
        backportMergeConfigurationIds:
          apiModel.integrateChangesStage.backportMergeConfigurationIds,
        route: "integrate-changes",
      },
    };
  }

  toExecutionStages(ciProcessStages: BuildAndTestProcessStage[]): Stage[] {
    return ciProcessStages.map((ciProcessStage) =>
      this.toStage(ciProcessStage)
    );
  }

  toStage(ciProcessStage: BuildAndTestProcessStage): Stage {
    return {
      name: ciProcessStage.name,
      status: ciProcessStage.status as unknown as StageStatus,
      startDate: ciProcessStage.startDate,
      endDate: ciProcessStage.endDate,
    };
  }
}
