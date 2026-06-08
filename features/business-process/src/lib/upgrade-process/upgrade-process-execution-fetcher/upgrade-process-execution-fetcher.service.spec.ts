import { lastValueFrom, of, throwError } from "rxjs";
import { UpgradeProcessExecutionApiModel } from "./mapper/upgrade-process-execution-api-model";
import { BusinessProcessExecutionStatus } from "../../business-process-execution-status/business-process-execution-status";
import { StageStatus } from "@mxevolve/domains/business-process/util";
import { UpgradeProcessExecutionFetcherService } from "./upgrade-process-execution-fetcher.service";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { UpgradeProcessExecutionMapper } from "./mapper/upgrade-process-execution-mapper.service";
import { TestBed } from "@angular/core/testing";
import { QualityGateValidationDecision } from "../../quality-gate-validation/quality-gate-validation-result";
import { UpgradeProcessExecution } from "../upgrade-process-execution";

describe("Upgrade process execution fetcher service test", () => {
  const projectId = "projectId";
  const executionId = "executionId";

  let httpClient: Partial<HttpClient>;
  let appConfig: Partial<AppConfig>;
  let service: UpgradeProcessExecutionFetcherService;

  beforeEach(() => {
    httpClient = {
      get: jest.fn().mockReturnValue(of(getUpgradeProcessExecutionApiModel())),
    };

    appConfig = {
      gatewayUrl: "gatewayUrl/",
    };

    TestBed.configureTestingModule({
      providers: [
        UpgradeProcessExecutionFetcherService,
        UpgradeProcessExecutionMapper,
        { provide: HttpClient, useValue: httpClient },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    });

    service = TestBed.inject(UpgradeProcessExecutionFetcherService);
  });

  it("should fetch upgrade process execution using the correct url and return it", async () => {
    expect(
      await lastValueFrom(
        service.getUpgradeProcessExecution(projectId, executionId)
      )
    ).toEqual(getUpgradeProcessExecution());

    expect(httpClient.get).toHaveBeenCalledWith(
      `gatewayUrl/projects/${projectId}/business-process/executions/binary-upgrade/${executionId}`
    );
  });

  it("should throw an error with correct message when it fails to fetch execution", async () => {
    const errorMessage = "errorMessage";
    jest.spyOn(httpClient, "get").mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            error: {
              message: errorMessage,
            },
          })
      )
    );

    await expect(
      lastValueFrom(service.getUpgradeProcessExecution(projectId, executionId))
    ).rejects.toThrow(errorMessage);
  });

  function getUpgradeProcessExecutionApiModel(): UpgradeProcessExecutionApiModel {
    return {
      id: executionId,
      startDate: "startDate",
      endDate: "endDate",
      expiryDate: "expiryDate",
      name: "name",
      definitionName: "definitionName",
      familyName: "familyName",
      processName: "processName",
      projectId: projectId,
      definitionId: "definitionId",
      supportsResourceManagement: true,
      status: "PENDING_INPUT",
      notificationsRecipients: ["recipient1", "recipient2"],
      errorMessage: "errorMessage",
      officiality: "OFFICIAL",
      input: {
        factoryProductId: "factoryProductId",
        mxVersion: "mxVersion",
        mxBuildId: "mxBuildId",
        bipVersion: "bipVersion",
        bipBuildId: "bipBuildId",
        parentMxArchivalBranch: "parentMxArchivalBranch",
        upgradeJump: "upgradeJump",
        repositoryId: "repositoryId",
        configurationParentBranch: "configurationParentBranch",
        configurationBranchName: "configurationBranchName",
        createBranch: true,
        qualityGateExecutionInfraGroupId: "qualityGateExecutionInfraGroupId",
        binaryConversionInfraGroupId: "binaryConversionInfraGroupId",
        binaryConversionTestScenarioId: "binaryConversionTestScenarioId",
        testScenarioIds: ["scenarioId1", "scenarioId2"],
        referenceFactoryProductId: "referenceFactoryProductId",
        referenceMxVersion: "referenceMxVersion",
        referenceMxBuildId: "referenceMxBuildId",
        referenceBipVersion: "referenceBipVersion",
        referenceBipBuildId: "referenceBipBuildId",
        referenceCommitId: "referenceCommitId",
        referenceEnvironmentInfraGroupId: "referenceEnvironmentInfraGroupId",
        referenceEnvironmentDefinitionId: "referenceEnvironmentDefinitionId",
        businessProcessQualityLevel: "businessProcessQualityLevel",
      },
      createBranchStage: {
        name: "createBranchStage",
        status: "PASSED",
        startDate: "createBranchStartDate",
        endDate: "createBranchEndDate",
        errorMessage: "createBranchErrorMessage",
        developmentId: "developmentId",
        createBranch: true,
        repositoryId: "repositoryId",
        lastCommitId: "lastCommitId",
      },
      binaryConversionStage: {
        name: "binaryConversionStage",
        status: "RUNNING",
        startDate: "binaryConversionStartDate",
        endDate: "binaryConversionEndDate",
        errorMessage: "binaryConversionErrorMessage",
        actionRequester: "binaryConversionActionRequester",
        referenceExecutionId: "referenceExecutionId",
        decision: "binaryConversionDecision",
      },
      executeQualityGateStage: {
        name: "executeQualityGateStage",
        status: "PENDING_INPUT",
        startDate: "executeQualityGateStartDate",
        endDate: "executeQualityGateEndDate",
        errorMessage: "executeQualityGateErrorMessage",
        validationResult: {
          decision: QualityGateValidationDecision.PASSED,
          comment: "validationResultComment",
          requester: "validationResultRequester",
        },
        keptResourcesDecisionMade: true,
      },
      tagUpgradeBranchStage: {
        name: "tagUpgradeBranchStage",
        status: "NOT_STARTED",
        startDate: "tagUpgradeBranchStartDate",
        endDate: "tagUpgradeBranchEndDate",
        errorMessage: "tagUpgradeBranchErrorMessage",
        tagName: "tagName",
        taggedCommitId: "taggedCommitId",
      },
      integrateChangesStage: {
        name: "integrateChangesStage",
        status: "FAILED",
        startDate: "integrateChangesStartDate",
        endDate: "integrateChangesEndDate",
        errorMessage: "integrateChangesErrorMessage",
        requester: "integrateChangesRequester",
        latestMergeJobId: "latestMergeJobId",
      },
      referenceEnvironmentDeployment: {
        supported: true,
        enabledInCurrentlyActiveStage: true,
        limitReached: true,
        canCleanAndDeploy: true,
        referenceEnvironments: ["environmentId1", "environmentId2"],
        requestIds: ["requestId1", "requestId2"],
      },
    };
  }

  function getUpgradeProcessExecution(): UpgradeProcessExecution {
    return {
      id: executionId,
      startDate: "startDate",
      endDate: "endDate",
      expiryDate: "expiryDate",
      name: "name",
      definitionName: "definitionName",
      familyName: "familyName",
      processName: "processName",
      projectId: projectId,
      description: undefined,
      definitionId: "definitionId",
      status: BusinessProcessExecutionStatus.PENDING_INPUT,
      supportsResourceManagement: true,
      notificationsRecipients: ["recipient1", "recipient2"],
      errorMessage: "errorMessage",
      officiality: "OFFICIAL",
      input: {
        factoryProductId: "factoryProductId",
        mxVersion: "mxVersion",
        mxBuildId: "mxBuildId",
        bipVersion: "bipVersion",
        bipBuildId: "bipBuildId",
        parentMxArchivalBranch: "parentMxArchivalBranch",
        upgradeJump: "upgradeJump",
        repositoryId: "repositoryId",
        configurationParentBranch: "configurationParentBranch",
        configurationBranchName: "configurationBranchName",
        createBranch: true,
        qualityGateExecutionInfraGroupId: "qualityGateExecutionInfraGroupId",
        binaryConversionInfraGroupId: "binaryConversionInfraGroupId",
        binaryConversionTestScenarioId: "binaryConversionTestScenarioId",
        testScenarioIds: ["scenarioId1", "scenarioId2"],
        referenceFactoryProductId: "referenceFactoryProductId",
        referenceMxVersion: "referenceMxVersion",
        referenceMxBuildId: "referenceMxBuildId",
        referenceBipVersion: "referenceBipVersion",
        referenceBipBuildId: "referenceBipBuildId",
        referenceCommitId: "referenceCommitId",
        referenceEnvironmentInfraGroupId: "referenceEnvironmentInfraGroupId",
        referenceEnvironmentDefinitionId: "referenceEnvironmentDefinitionId",
        businessProcessQualityLevel: "businessProcessQualityLevel",
      },
      createBranchStage: {
        route: "create-branch",
        name: "createBranchStage",
        status: StageStatus.PASSED,
        startDate: "createBranchStartDate",
        endDate: "createBranchEndDate",
        errorMessage: "createBranchErrorMessage",
        developmentId: "developmentId",
        createBranch: true,
        repositoryId: "repositoryId",
        lastCommitId: "lastCommitId",
      },
      binaryConversionStage: {
        route: "run-technical-upgrade",
        name: "binaryConversionStage",
        status: StageStatus.RUNNING,
        startDate: "binaryConversionStartDate",
        endDate: "binaryConversionEndDate",
        errorMessage: "binaryConversionErrorMessage",
        actionRequester: "binaryConversionActionRequester",
        referenceExecutionId: "referenceExecutionId",
        decision: "binaryConversionDecision",
      },
      executeQualityGateStage: {
        route: "run-rtp",
        name: "executeQualityGateStage",
        status: StageStatus.PENDING_INPUT,
        startDate: "executeQualityGateStartDate",
        endDate: "executeQualityGateEndDate",
        errorMessage: "executeQualityGateErrorMessage",
        validationResult: {
          decision: QualityGateValidationDecision.PASSED,
          comment: "validationResultComment",
          requester: "validationResultRequester",
        },
        keptResourcesDecisionMade: true,
      },
      tagStage: {
        route: "tag-upgrade-branch",
        name: "tagUpgradeBranchStage",
        status: StageStatus.NOT_STARTED,
        startDate: "tagUpgradeBranchStartDate",
        endDate: "tagUpgradeBranchEndDate",
        errorMessage: "tagUpgradeBranchErrorMessage",
        tagName: "tagName",
        taggedCommitId: "taggedCommitId",
      },
      integrateChangesStage: {
        route: "integrate-fixes",
        name: "integrateChangesStage",
        status: StageStatus.FAILED,
        startDate: "integrateChangesStartDate",
        endDate: "integrateChangesEndDate",
        errorMessage: "integrateChangesErrorMessage",
        requester: "integrateChangesRequester",
        latestMergeJobId: "latestMergeJobId",
      },
      referenceEnvironmentDeployment: {
        projectId: projectId,
        processId: executionId,
        supported: true,
        enabledInCurrentlyActiveStage: true,
        limitReached: true,
        canCleanAndDeploy: true,
        referenceEnvironments: ["environmentId1", "environmentId2"],
        requestIds: ["requestId1", "requestId2"],
      },
    };
  }
});
