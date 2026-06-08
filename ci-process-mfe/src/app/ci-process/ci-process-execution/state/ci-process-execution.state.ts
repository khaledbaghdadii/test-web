import {
  BuildAndTestProcessExecution,
  BuildAndTestProcessStageStatus,
  BuildAndTestSourceType,
  BusinessProcessExecutionStatus,
} from "@mxflow/features/business-process";

export interface CiProcessExecutionState {
  data: {
    ciProcessExecution: BuildAndTestProcessExecution;
    errorMessage?: string;
  };
}

export const initialState: CiProcessExecutionState = {
  data: {
    ciProcessExecution: {
      id: "",
      name: "",
      startDate: "",
      endDate: "",
      expiryDate: "",
      status: BusinessProcessExecutionStatus.NA,
      projectId: "",
      definitionId: "",
      owner: "",
      errorMessage: "",
      hasPredefinedMergeRequestInputs: false,
      supportsResourceManagement: false,
      ciVersion: 1,
      source: {
        type: BuildAndTestSourceType.USER,
        id: "",
      },
      input: {
        configurationParentBranch: "",
        repositoryId: "",
        configurationBranchName: "",
        userStoryIds: [],
        buildAndTestInfraGroup: "",
        buildEnvironmentInfraGroup: "",
        buildEnvironment: {
          skipEnvironmentDeployment: false,
          scenarioDefinitionId: "",
        },
      },
      createBranchStage: {
        name: "",
        startDate: "",
        endDate: "",
        status: BuildAndTestProcessStageStatus.NA,
        errorMessage: "",
        route: "",
        createBranch: false,
        repositoryId: "",
        developmentId: "",
      },
      prepareBuildStage: {
        name: "",
        startDate: "",
        endDate: "",
        status: BuildAndTestProcessStageStatus.NA,
        errorMessage: "",
        route: "",
        requester: "",
        latestScenarioExecutionId: "",
      },
      buildAndTestStage: {
        name: "",
        startDate: "",
        endDate: "",
        status: BuildAndTestProcessStageStatus.NA,
        errorMessage: "",
        route: "",
        requester: "",
        scenarioExecutionGroup: "",
        technicalReseedExecutionGroupId: "",
        readyForBuildAndTest: false,
        cherryPickRunning: false,
        cherryPickFailed: false,
      },
      integrateChangesStage: {
        name: "",
        startDate: "",
        endDate: "",
        status: BuildAndTestProcessStageStatus.NA,
        errorMessage: "",
        route: "",
        latestMergeJobId: "",
        requester: "",
        backportRequested: false,
        willPublishFinalProduct: false,
        finalProductPublishing: {
          publishingStartDate: "",
          publishingEndDate: "",
          id: "",
        },
        backportStopRequester: "",
        canStopBackport: false,
        backportMergeConfigurationIds: [],
        backports: [],
        backportExecutions: [],
        failedBackportDefinitions: [],
      },
    },
  },
};
