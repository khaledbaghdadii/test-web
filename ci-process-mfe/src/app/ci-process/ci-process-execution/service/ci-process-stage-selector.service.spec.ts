import {
  BuildAndTestProcessExecution,
  BuildAndTestProcessExecutionInput,
  BuildAndTestProcessStage,
  BuildAndTestProcessStageStatus,
  BuildAndTestSourceType,
  BusinessProcessExecutionStatus,
  CherryPickStatus,
} from "@mxflow/features/business-process";
import { CiProcessStageSelectorService } from "./ci-process-stage-selector.service";

const mergeConfigurationId = "backportMergeConfigurationId";
const backportStopRequester = "backportStopRequester";

describe("ci process stage selector service", () => {
  const requester = "requester";
  const ciProcessId = "user-story-build-and-test__ciProcessId";
  const processName = "processName";
  const projectId = "projectId";
  const owner = "owner";
  const startDate = "2023-03-22T08:10:29.817713Z";
  const endDate = "2023-03-22T08:10:32.918853Z";
  const expiryDate = "expiryDate";
  const errorMessage = "errorMessage";
  const repositoryId = "repositoryId";
  const buildEnvironmentDefinition = "buildEnvironmentDefinition";
  const configurationParentBranch = "configurationParentBranch";
  const configurationBranchName = "configurationBranchName";
  const userStoryId = "userStoryId";
  const anotherUserStoryId = "anotherUserStoryId";
  const createBranchName = "create branch";
  const prepareBuildName = "prepare build";
  const buildAndTestName = "build and test";
  const integrateChangesName = "integrate changes";
  const createBranchRoute = "create-branch";
  const prepareBuildRoute = "prepare-build";
  const buildAndTestRoute = "build-and-test";
  const integrateChangesRoute = "integrate-changes";
  const scenarioExecutionGroup = "scenarioExecutionGroupId";
  const technicalReseedExecutionGroup = "technicalReseedExecutionGroupId";
  const mergeJobId = "mergeJobId";
  const developmentId = "developmentId";
  const buildAndTestInfraGroup = "buildAndTestInfraGroup";
  const backportDestinationBranchName = "backportDestinationBranchName";
  const backportCherryPickBranch = "backportCherryPickBranch";
  const backportLatestMergeJobId = "backportLatestMergeJobId";
  const finalProductId = "finalProductId";
  const finalProductFailureReason = "failureReason";
  const backportFinalProductId = "backportFinalProductId";
  const latestScenarioExecutionId = "latestScenarioExecutionId";

  const userStoryIds: string[] = [userStoryId, anotherUserStoryId];

  const ciProcessExecutionInput: BuildAndTestProcessExecutionInput = {
    repositoryId: repositoryId,
    configurationBranchName: configurationBranchName,
    configurationParentBranch: configurationParentBranch,
    userStoryIds: userStoryIds,
    buildAndTestInfraGroup: buildAndTestInfraGroup,
    buildEnvironmentInfraGroup: "buildEnvironmentInfraGroup",
    buildEnvironment: {
      skipEnvironmentDeployment: false,
      scenarioDefinitionId: buildEnvironmentDefinition,
    },
  };

  const ciProcessStage: BuildAndTestProcessStage = {
    name: "",
    status: BuildAndTestProcessStageStatus.NOT_STARTED,
    startDate: startDate,
    endDate: endDate,
    errorMessage: errorMessage,
    route: "",
  };

  const ciProcessExecution: BuildAndTestProcessExecution = {
    id: ciProcessId,
    name: processName,
    projectId: projectId,
    definitionId: "definitionId",
    owner: owner,
    startDate: startDate,
    endDate: endDate,
    expiryDate: expiryDate,
    status: BusinessProcessExecutionStatus.NA,
    errorMessage: errorMessage,
    hasPredefinedMergeRequestInputs: false,
    input: ciProcessExecutionInput,
    supportsResourceManagement: true,
    ciVersion: 1,
    source: {
      id: "sourceId",
      type: BuildAndTestSourceType.BUSINESS_PROCESS,
    },
    createBranchStage: {
      ...ciProcessStage,
      createBranch: true,
      repositoryId: repositoryId,
      route: createBranchRoute,
      name: createBranchName,
      developmentId: developmentId,
    },
    prepareBuildStage: {
      ...ciProcessStage,
      route: prepareBuildRoute,
      name: prepareBuildName,
      requester: requester,
      latestScenarioExecutionId: latestScenarioExecutionId,
    },
    buildAndTestStage: {
      ...ciProcessStage,
      route: buildAndTestRoute,
      name: buildAndTestName,
      requester: requester,
      scenarioExecutionGroup: scenarioExecutionGroup,
      technicalReseedExecutionGroupId: technicalReseedExecutionGroup,
      readyForBuildAndTest: true,
      cherryPickRunning: true,
      cherryPickFailed: true,
    },
    integrateChangesStage: {
      ...ciProcessStage,
      route: integrateChangesRoute,
      name: integrateChangesName,
      latestMergeJobId: mergeJobId,
      requester: requester,
      backportRequested: true,
      willPublishFinalProduct: true,
      finalProductPublishing: {
        id: finalProductId,
        publishingStartDate: startDate,
        publishingEndDate: endDate,
        finalProductFailure: finalProductFailureReason,
      },
      backportStopRequester: backportStopRequester,
      canStopBackport: true,
      backports: [
        {
          mergeConfigurationId: mergeConfigurationId,
          startDate: startDate,
          endDate: endDate,
          willPublishFinalProduct: true,
          initializeDevelopmentState: {
            startDate: startDate,
            endDate: endDate,
            destinationBranchName: backportDestinationBranchName,
            cherryPickBranchName: backportCherryPickBranch,
            developmentId: developmentId,
          },
          applyBackportDevelopmentState: {
            startDate: startDate,
            endDate: endDate,
            requester: requester,
            cherryPickStatus:
              CherryPickStatus.AUTOMATIC_CHERRY_PICK_IN_PROGRESS,
          },
          mergeDevelopmentState: {
            startDate: startDate,
            endDate: endDate,
            requester: requester,
            latestMergeJobId: backportLatestMergeJobId,
            mergeJobIds: [backportLatestMergeJobId],
            canRepush: true,
          },
          finalProductPublishing: {
            id: backportFinalProductId,
            publishingStartDate: startDate,
            publishingEndDate: endDate,
            finalProductFailure: finalProductFailureReason,
          },
        },
      ],
      backportExecutions: [],
      failedBackportDefinitions: [],
    },
  };

  const stageSelector: CiProcessStageSelectorService =
    new CiProcessStageSelectorService();

  describe("stage specified in the route", () => {
    it("should return the create branch stage if specified in the route", () => {
      expect(
        stageSelector.getWantedStage(
          ciProcessExecution,
          getCiProcessUrlWithStage(createBranchRoute)
        )
      ).toEqual(createBranchName);
    });

    it("should return the prepare build stage if specified in the route", () => {
      expect(
        stageSelector.getWantedStage(
          ciProcessExecution,
          getCiProcessUrlWithStage(prepareBuildRoute)
        )
      ).toEqual(prepareBuildName);
    });

    it("should return the build and test stage if specified in the route", () => {
      expect(
        stageSelector.getWantedStage(
          ciProcessExecution,
          getCiProcessUrlWithStage(buildAndTestRoute)
        )
      ).toEqual(buildAndTestName);
    });

    it("should return the integrate changes stage if specified in the route", () => {
      expect(
        stageSelector.getWantedStage(
          ciProcessExecution,
          getCiProcessUrlWithStage(integrateChangesRoute)
        )
      ).toEqual(integrateChangesName);
    });
  });

  describe("find target stage", () => {
    it("should return running stage if process is running", () => {
      const runningCiProcessExecution: BuildAndTestProcessExecution = {
        ...ciProcessExecution,
        status: BusinessProcessExecutionStatus.RUNNING,
        integrateChangesStage: {
          ...ciProcessExecution.integrateChangesStage,
          status: BuildAndTestProcessStageStatus.RUNNING,
        },
      };
      expect(
        stageSelector.getWantedStage(runningCiProcessExecution, "url")
      ).toEqual(integrateChangesName);
    });

    it("should return the failed stage if process is failed", () => {
      const failedCiProcessExecution: BuildAndTestProcessExecution = {
        ...ciProcessExecution,
        status: BusinessProcessExecutionStatus.FAILED,
        prepareBuildStage: {
          ...ciProcessExecution.prepareBuildStage,
          status: BuildAndTestProcessStageStatus.FAILED,
        },
      };
      expect(
        stageSelector.getWantedStage(failedCiProcessExecution, "url")
      ).toEqual(prepareBuildName);
    });

    it("should return the pending input stage if process is pending input", () => {
      const failedCiProcessExecution: BuildAndTestProcessExecution = {
        ...ciProcessExecution,
        status: BusinessProcessExecutionStatus.PENDING_INPUT,
        buildAndTestStage: {
          ...ciProcessExecution.buildAndTestStage,
          status: BuildAndTestProcessStageStatus.PENDING_INPUT,
        },
      };
      expect(
        stageSelector.getWantedStage(failedCiProcessExecution, "url")
      ).toEqual(buildAndTestName);
    });

    it("should return the stopped stage if process is stopped", () => {
      const failedCiProcessExecution: BuildAndTestProcessExecution = {
        ...ciProcessExecution,
        status: BusinessProcessExecutionStatus.STOPPED,
        buildAndTestStage: {
          ...ciProcessExecution.buildAndTestStage,
          status: BuildAndTestProcessStageStatus.STOPPED,
        },
      };
      expect(
        stageSelector.getWantedStage(failedCiProcessExecution, "url")
      ).toEqual(buildAndTestName);
    });

    it("should return the running stage if process is aborting", () => {
      const failedCiProcessExecution: BuildAndTestProcessExecution = {
        ...ciProcessExecution,
        status: BusinessProcessExecutionStatus.ABORTING,
        prepareBuildStage: {
          ...ciProcessExecution.prepareBuildStage,
          status: BuildAndTestProcessStageStatus.RUNNING,
        },
      };
      expect(
        stageSelector.getWantedStage(failedCiProcessExecution, "url")
      ).toEqual(prepareBuildName);
    });

    it("should return the failed stage if process is aborted", () => {
      const failedCiProcessExecution: BuildAndTestProcessExecution = {
        ...ciProcessExecution,
        status: BusinessProcessExecutionStatus.ABORTED,
        prepareBuildStage: {
          ...ciProcessExecution.prepareBuildStage,
          status: BuildAndTestProcessStageStatus.FAILED,
        },
      };
      expect(
        stageSelector.getWantedStage(failedCiProcessExecution, "url")
      ).toEqual(prepareBuildName);
    });
  });

  describe("target stage not found", () => {
    it("should return the first stage if process is failed and no target stage is found", () => {
      let ciProcess = ciProcessExecution;
      ciProcess.status = BusinessProcessExecutionStatus.FAILED;
      expect(stageSelector.getWantedStage(ciProcess, "url")).toEqual(
        createBranchName
      );
    });

    it("should return the first stage if process is aborted and no target stage is found", () => {
      let ciProcess = ciProcessExecution;
      ciProcess.status = BusinessProcessExecutionStatus.ABORTED;
      expect(stageSelector.getWantedStage(ciProcess, "url")).toEqual(
        createBranchName
      );
    });

    it("should return the first stage if process is stopped and no target stage is found", () => {
      let ciProcess = ciProcessExecution;
      ciProcess.status = BusinessProcessExecutionStatus.STOPPED;
      expect(stageSelector.getWantedStage(ciProcess, "url")).toEqual(
        createBranchName
      );
    });

    it("should return the first stage if process is aborting and no target stage is found", () => {
      let ciProcess = ciProcessExecution;
      ciProcess.status = BusinessProcessExecutionStatus.ABORTING;
      expect(stageSelector.getWantedStage(ciProcess, "url")).toEqual(
        createBranchName
      );
    });

    it("should return the first stage if process is running and no target stage is found", () => {
      let ciProcess = ciProcessExecution;
      ciProcess.status = BusinessProcessExecutionStatus.RUNNING;
      expect(stageSelector.getWantedStage(ciProcess, "url")).toEqual(
        createBranchName
      );
    });

    it("should return the first stage if process is pending input and no target stage is found", () => {
      let ciProcess = ciProcessExecution;
      ciProcess.status = BusinessProcessExecutionStatus.PENDING_INPUT;
      expect(stageSelector.getWantedStage(ciProcess, "url")).toEqual(
        createBranchName
      );
    });
  });

  describe("process passed", () => {
    it("should return create branch stage if process is passed", () => {
      const passedCiProcessExecution: BuildAndTestProcessExecution = {
        ...ciProcessExecution,
        status: BusinessProcessExecutionStatus.PASSED,
      };
      expect(
        stageSelector.getWantedStage(passedCiProcessExecution, "url")
      ).toEqual(createBranchName);
    });
  });

  function getCiProcessUrlWithStage(stageRoute: string): string {
    return `business-process/user-story-build-and-test/execution/${ciProcessId}/${stageRoute}`;
  }
});
