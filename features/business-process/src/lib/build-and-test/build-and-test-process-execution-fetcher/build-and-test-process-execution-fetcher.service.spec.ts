import { lastValueFrom, of, throwError } from "rxjs";
import { BuildAndTestProcessExecutionFetcherService } from "./build-and-test-process-execution-fetcher.service";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { BuildAndTestProcessExecutionMapperService } from "./mapper/build-and-test-process-execution-mapper.service";
import { TestBed } from "@angular/core/testing";
import { BuildAndTestProcessExecutionApiModel } from "./mapper/build-and-test-process-execution-api-model";
import { FinalProductFailure } from "../../final-product-publishing/model/final-product-publishing";
import { CherryPickStatus } from "../stage/build-and-test-process-integrate-changes-stage";
import {
  BuildAndTestProcessExecution,
  BuildAndTestSourceType,
} from "../build-and-test-process-execution";
import { BuildAndTestProcessStageStatus } from "../stage/build-and-test-process-stage-status";
import { BusinessProcessExecutionStatus } from "../../business-process-execution-status/business-process-execution-status";

describe("Build and Test Process Execution Fetcher Service test", () => {
  const gatewayUrl = "gatewayUrl";
  const projectId = "projectId";
  const processId = "processId";

  let service: BuildAndTestProcessExecutionFetcherService;
  let httpClient: Partial<HttpClient>;
  let appConfig: Partial<AppConfig>;

  beforeEach(() => {
    httpClient = {
      get: jest
        .fn()
        .mockReturnValue(of(getBuildAndTestProcessExecutionApiModel())),
    };

    appConfig = {
      gatewayUrl: gatewayUrl,
    };

    TestBed.configureTestingModule({
      providers: [
        BuildAndTestProcessExecutionFetcherService,
        BuildAndTestProcessExecutionMapperService,
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });

    service = TestBed.inject(BuildAndTestProcessExecutionFetcherService);
  });

  it("should fetch the ci process execution correctly", async () => {
    await expect(
      lastValueFrom(
        service.getBuildAndTestProcessExecution(projectId, processId)
      )
    ).resolves.toEqual(getBuildAndTestProcessExecution());

    expect(httpClient.get).toHaveBeenCalledWith(
      `${gatewayUrl}projects/${projectId}/business-process/executions/ci-process/${processId}`
    );
  });

  it("should display an error message when fetching a ci process that does not exist", async () => {
    jest.spyOn(httpClient, "get").mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            error: {
              message: "ERROR_MESSAGE",
            },
          })
      )
    );

    await expect(
      lastValueFrom(
        service.getBuildAndTestProcessExecution(projectId, processId)
      )
    ).rejects.toThrow("ERROR_MESSAGE");
  });

  function getBuildAndTestProcessExecutionApiModel(): BuildAndTestProcessExecutionApiModel {
    return {
      id: processId,
      name: "processName",
      projectId: projectId,
      definitionId: "definitionId",
      owner: "owner",
      startDate: "startDate",
      endDate: "endDate",
      expiryDate: "expiryDate",
      status: "NA",
      errorMessage: "errorMessage",
      hasPredefinedMergeRequestInputs: false,
      ciVersion: 1,
      source: {
        id: "sourceId",
        type: BuildAndTestSourceType.BUSINESS_PROCESS,
      },
      input: {
        repositoryId: "repositoryId",
        configurationBranchName: "configurationBranchName",
        configurationParentBranch: "configurationParentBranch",
        userStoryIds: ["userStoryId", "anotherUserStoryId"],
        buildAndTestInfraGroup: "buildAndTestInfraGroup",
        buildEnvironmentInfraGroup: "buildEnvironmentInfraGroup",
        buildEnvironment: {
          skipEnvironmentDeployment: false,
          scenarioDefinitionId: "buildEnvironmentDefinition",
        },
      },
      notificationsRecipients: ["test1@example.com", "test2@example.com"],
      supportsResourceManagement: true,
      createBranchStage: {
        createBranch: true,
        repositoryId: "repositoryId",
        name: "stageName1",
        errorMessage: "errorMessage1",
        startDate: "startDate1",
        endDate: "endDate1",
        developmentId: "developmentID",
        status: "PASSED",
      },
      prepareBuildStage: {
        name: "stageName2",
        errorMessage: "errorMessage2",
        startDate: "startDate2",
        endDate: "endDate2",
        status: "RUNNING",
        requester: "requester",
        latestScenarioExecutionId: "latestScenarioExecutionId",
      },
      buildAndTestStage: {
        name: "stageName3",
        errorMessage: "errorMessage3",
        startDate: "startDate3",
        endDate: "endDate3",
        status: "NOT_STARTED",
        requester: "requester",
        scenarioExecutionGroup: "EXECUTION_GROUP_ID",
        technicalReseedExecutionGroupId: "technicalReseedExecutionGroupId",
        readyForBuildAndTest: true,
        cherryPickRunning: true,
        cherryPickFailed: true,
      },
      integrateChangesStage: {
        name: "stageName4",
        errorMessage: "errorMessage4",
        startDate: "startDate4",
        endDate: "endDate4",
        status: "N/A",
        latestMergeJobId: "mergeJobId",
        requester: "requester",
        willPublishFinalProduct: true,
        backportRequested: true,
        finalProductPublishing: {
          publishingStartDate: "startDate",
          publishingEndDate: "endDate",
          id: "finalProductId",
          finalProductFailure: "FAILURE_PRE_PUBLISHING_REQUESTED",
        },
        backportStopRequester: "backportStopRequester",
        canStopBackport: true,
        backportMergeConfigurationIds: [
          "backportDestinationBranchName1",
          "backportDestinationBranchName2",
        ],
        backports: [
          {
            mergeConfigurationId: "mergeConfigurationId",
            startDate: "startDate",
            endDate: "endDate",
            willPublishFinalProduct: true,
            initializeDevelopmentState: {
              startDate: "startDate",
              endDate: "endDate",
              destinationBranchName: "backportDestinationBranchName",
              cherryPickBranchName: "backportCherryPickBranch",
              developmentId: "backportDevelopmentId",
            },
            applyBackportDevelopmentState: {
              startDate: "startDate",
              endDate: "endDate",
              requester: "requester",
              cherryPickStatus:
                CherryPickStatus.AUTOMATIC_CHERRY_PICK_IN_PROGRESS,
            },
            mergeDevelopmentState: {
              startDate: "startDate",
              endDate: "endDate",
              latestMergeJobId: "backportLatestMergeJobId",
              mergeJobIds: ["backportLatestMergeJobId"],
              requester: "requester",
              canRepush: true,
            },
            finalProductPublishing: {
              publishingStartDate: "startDate",
              publishingEndDate: "endDate",
              id: "backportFinalProductId",
              finalProductFailure:
                FinalProductFailure.FAILURE_PRE_PUBLISHING_REQUESTED,
            },
          },
        ],
        backportExecutions: [],
        failedBackportDefinitions: [],
      },
    };
  }

  function getBuildAndTestProcessExecution(): BuildAndTestProcessExecution {
    return {
      id: processId,
      name: "processName",
      projectId: projectId,
      definitionId: "definitionId",
      owner: "owner",
      startDate: "startDate",
      endDate: "endDate",
      expiryDate: "expiryDate",
      status: BusinessProcessExecutionStatus.NA,
      errorMessage: "errorMessage",
      hasPredefinedMergeRequestInputs: false,
      notificationsRecipients: ["test1@example.com", "test2@example.com"],
      ciVersion: 1,
      source: {
        id: "sourceId",
        type: BuildAndTestSourceType.BUSINESS_PROCESS,
      },
      input: {
        repositoryId: "repositoryId",
        configurationBranchName: "configurationBranchName",
        configurationParentBranch: "configurationParentBranch",
        userStoryIds: ["userStoryId", "anotherUserStoryId"],
        buildAndTestInfraGroup: "buildAndTestInfraGroup",
        buildEnvironmentInfraGroup: "buildEnvironmentInfraGroup",
        buildEnvironment: {
          skipEnvironmentDeployment: false,
          scenarioDefinitionId: "buildEnvironmentDefinition",
        },
      },
      supportsResourceManagement: true,
      createBranchStage: {
        createBranch: true,
        repositoryId: "repositoryId",
        name: "stageName1",
        errorMessage: "errorMessage1",
        startDate: "startDate1",
        endDate: "endDate1",
        route: "create-branch",
        developmentId: "developmentID",
        status: BuildAndTestProcessStageStatus.PASSED,
      },
      prepareBuildStage: {
        name: "stageName2",
        errorMessage: "errorMessage2",
        startDate: "startDate2",
        endDate: "endDate2",
        route: "prepare-build",
        status: BuildAndTestProcessStageStatus.RUNNING,
        requester: "requester",
        latestScenarioExecutionId: "latestScenarioExecutionId",
      },
      buildAndTestStage: {
        name: "stageName3",
        errorMessage: "errorMessage3",
        startDate: "startDate3",
        endDate: "endDate3",
        route: "build-and-test",
        status: BuildAndTestProcessStageStatus.NOT_STARTED,
        requester: "requester",
        scenarioExecutionGroup: "EXECUTION_GROUP_ID",
        technicalReseedExecutionGroupId: "technicalReseedExecutionGroupId",
        readyForBuildAndTest: true,
        cherryPickRunning: true,
        cherryPickFailed: true,
      },
      integrateChangesStage: {
        name: "stageName4",
        errorMessage: "errorMessage4",
        startDate: "startDate4",
        endDate: "endDate4",
        route: "integrate-changes",
        status: BuildAndTestProcessStageStatus.NA,
        latestMergeJobId: "mergeJobId",
        requester: "requester",
        backportRequested: true,
        willPublishFinalProduct: true,
        finalProductPublishing: {
          publishingStartDate: "startDate",
          publishingEndDate: "endDate",
          id: "finalProductId",
          finalProductFailure:
            FinalProductFailure.FAILURE_PRE_PUBLISHING_REQUESTED,
        },
        backportStopRequester: "backportStopRequester",
        canStopBackport: true,
        backportMergeConfigurationIds: [
          "backportDestinationBranchName1",
          "backportDestinationBranchName2",
        ],
        backports: [
          {
            mergeConfigurationId: "mergeConfigurationId",
            startDate: "startDate",
            endDate: "endDate",
            willPublishFinalProduct: true,
            initializeDevelopmentState: {
              startDate: "startDate",
              endDate: "endDate",
              destinationBranchName: "backportDestinationBranchName",
              cherryPickBranchName: "backportCherryPickBranch",
              developmentId: "backportDevelopmentId",
            },
            applyBackportDevelopmentState: {
              startDate: "startDate",
              endDate: "endDate",
              requester: "requester",
              cherryPickStatus:
                CherryPickStatus.AUTOMATIC_CHERRY_PICK_IN_PROGRESS,
            },
            mergeDevelopmentState: {
              startDate: "startDate",
              endDate: "endDate",
              latestMergeJobId: "backportLatestMergeJobId",
              mergeJobIds: ["backportLatestMergeJobId"],
              requester: "requester",
              canRepush: true,
            },
            finalProductPublishing: {
              publishingStartDate: "startDate",
              publishingEndDate: "endDate",
              id: "backportFinalProductId",
              finalProductFailure:
                FinalProductFailure.FAILURE_PRE_PUBLISHING_REQUESTED,
            },
          },
        ],
        backportExecutions: [],
        failedBackportDefinitions: [],
      },
    };
  }
});
