import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { ValidationProcessExecutionMapperService } from "./validation-process-execution-mapper.service";
import { ValidationProcessExecutionFetcherService } from "./validation-process-execution-fetcher.service";
import { lastValueFrom, of, throwError } from "rxjs";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { TestBed } from "@angular/core/testing";
import { ValidationProcessExecution } from "./model/validation-process-execution";
import { ValidationProcessExecutionStageStatus } from "./model/stage/validation-process-execution-stage-status";
import { ValidationProcessExecutionApiModel } from "./model/validation-process-execution-api-model";
import {
  BusinessProcessExecutionStatus,
  BusinessProcessOfficialStatus,
  QualityGateValidationDecision,
  ValidationProcessExecutionsQueryRequest,
} from "@mxflow/features/business-process";

const validationProcessExecution: ValidationProcessExecution = {
  businessProcessQualityLevel: "MQG",
  daysExtended: 0,
  familyId: "familyId",
  familyName: "familyName",
  hidden: false,
  officiality: BusinessProcessOfficialStatus.OFFICIAL,
  projectName: "projectName",
  sourceDefinitionId: "sourceDefinitionId",
  id: "masterValidationExecutionId",
  name: "name",
  status: BusinessProcessExecutionStatus.PASSED,
  notificationsRecipients: ["recipient1", "recipient2"],
  startDate: "startDate",
  endDate: "endDate",
  definitionId: "definitionId",
  definitionName: "definitionName",
  processName: "processName",
  errorMessage: "errorMessage",
  expiryDate: "expiryDate",
  owner: "owner",
  projectId: "projectId",
  tagArchivalBranchStage: {
    name: "tagArchivalStageName",
    status: ValidationProcessExecutionStageStatus.PENDING_INPUT,
    startDate: "startDate",
    endDate: "endDate",
    errorMessage: "errorMessage",
    route: "tag-archival",
    configTagName: "configTagName",
    configCommitId: "configCommitId",
    rtpTagName: "rtpTagName",
    rtpCommitId: "rtpCommitId",
    promotionSuccessful: true,
    promotedFinalProductId: "latestFinalProductId",
    promotionErrorMessage: "promotionErrorMessage",
  },
  createBranchStage: {
    name: "createBranchStage",
    status: ValidationProcessExecutionStageStatus.PASSED,
    startDate: "startDate",
    endDate: "endDate",
    errorMessage: "errorMessage",
    route: "create-branch",
    developmentId: "developmentId",
    createdBranch: true,
    headCommitIdUponExecution: "parentCommitId",
  },
  input: {
    archivalBranchName: "archivalBranchName",
    createBranch: true,
    parentBranch: "parentBranchName",
    repositoryId: "repositoryId",
    scenarioDefinitionIds: ["scenarioDefinitionId"],
    businessProcessQualityLevel: "businessProcessQualityLevel",
    finalProductId: "finalProductId",
    configCommitId: "configCommitId",
    rtpCommitId: "rtpCommitId",
    nightlyRepusherEnabled: true,
    qualityGateExecutionInfraGroupId: "qualityGateExecutionInfraGroupId",
    validationScopeStartCommitId: "validationScopeStartCommitId",
  },
  integrateFixesStage: {
    name: "integrateFixesStage",
    status: ValidationProcessExecutionStageStatus.STOPPED,
    startDate: "startDate",
    endDate: "endDate",
    errorMessage: "errorMessage",
    route: "integrate-fixes",
    latestMergeJobId: "latestMergeJobId",
    stopActionMaker: "requester",
    skipActionMaker: "requester",
    finalProductPublishing: {
      id: "newFinalProductId",
      publishingStartDate: "startDate",
      publishingEndDate: "startDate",
      finalProductFailure: "finalProductFailure",
    },
  },
  executeQualityGatesStage: {
    name: "executeQualityGatesStage",
    status: ValidationProcessExecutionStageStatus.FAILED,
    startDate: "startDate",
    endDate: "endDate",
    errorMessage: "errorMessage",
    validationResult: {
      requester: "requester",
      comment: "comment",
      decision: QualityGateValidationDecision.PASSED,
    },
    route: "execute-quality-gates",
  },
};

const validationProcessExecutionApiModel: ValidationProcessExecutionApiModel = {
  businessProcessQualityLevel: "MQG",
  daysExtended: 0,
  familyId: "familyId",
  familyName: "familyName",
  hidden: false,
  officiality: BusinessProcessOfficialStatus.OFFICIAL,
  projectId: "projectId",
  projectName: "projectName",
  sourceDefinitionId: "sourceDefinitionId",
  id: "masterValidationExecutionId",
  name: "name",
  status: "PASSED",
  notificationsRecipients: ["recipient1", "recipient2"],
  startDate: "startDate",
  endDate: "endDate",
  errorMessage: "errorMessage",
  definitionId: "definitionId",
  definitionName: "definitionName",
  processName: "processName",
  owner: "owner",
  expiryDate: "expiryDate",
  tagArchivalBranchStage: {
    name: "tagArchivalStageName",
    status: "PENDING_INPUT",
    startDate: "startDate",
    endDate: "endDate",
    errorMessage: "errorMessage",
    configTagName: "configTagName",
    configCommitId: "configCommitId",
    rtpTagName: "rtpTagName",
    rtpCommitId: "rtpCommitId",
    promotionSuccessful: true,
    promotedFinalProductId: "latestFinalProductId",
    promotionErrorMessage: "promotionErrorMessage",
  },
  input: {
    archivalBranchName: "archivalBranchName",
    createBranch: true,
    parentBranch: "parentBranchName",
    repositoryId: "repositoryId",
    scenarioDefinitionIds: ["scenarioDefinitionId"],
    businessProcessQualityLevel: "businessProcessQualityLevel",
    finalProductId: "finalProductId",
    configCommitId: "configCommitId",
    rtpCommitId: "rtpCommitId",
    nightlyRepusherEnabled: true,
    qualityGateExecutionInfraGroupId: "qualityGateExecutionInfraGroupId",
    validationScopeStartCommitId: "validationScopeStartCommitId",
  },
  integrateFixesStage: {
    name: "integrateFixesStage",
    status: "STOPPED",
    startDate: "startDate",
    endDate: "endDate",
    errorMessage: "errorMessage",
    latestMergeJobId: "latestMergeJobId",
    stopActionMaker: "requester",
    skipActionMaker: "requester",
    finalProductPublishing: {
      id: "newFinalProductId",
      publishingStartDate: "startDate",
      publishingEndDate: "startDate",
      finalProductFailure: "finalProductFailure",
    },
  },
  executeQualityGatesStage: {
    name: "executeQualityGatesStage",
    status: "FAILED",
    startDate: "startDate",
    endDate: "endDate",
    errorMessage: "errorMessage",
    validationResult: {
      requester: "requester",
      comment: "comment",
      decision: QualityGateValidationDecision.PASSED,
    },
  },
  createBranchStage: {
    name: "createBranchStage",
    status: "PASSED",
    startDate: "startDate",
    endDate: "endDate",
    errorMessage: "errorMessage",
    createdBranch: true,
    developmentId: "developmentId",
    headCommitIdUponExecution: "parentCommitId",
  },
};

describe("Master Validation Execution Service Test", () => {
  const gateway = "gateway/";

  let httpClient: HttpClient;
  let mapper: ValidationProcessExecutionMapperService;
  let appConfig: AppConfig;

  let service: ValidationProcessExecutionFetcherService;

  beforeEach(() => {
    appConfig = {
      gatewayUrl: gateway,
    } as unknown as AppConfig;

    httpClient = {
      get: jest.fn(() => of()),
    } as unknown as HttpClient;

    mapper = {
      toMasterValidationExecution: jest.fn(() => validationProcessExecution),
    } as unknown as ValidationProcessExecutionMapperService;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: HttpClient,
          useValue: httpClient,
        },
        {
          provide: ValidationProcessExecutionMapperService,
          useValue: mapper,
        },
        {
          provide: APP_CONFIG,
          useValue: appConfig,
        },
        ValidationProcessExecutionFetcherService,
        ValidationProcessExecutionMapperService,
      ],
    });

    service = TestBed.inject(ValidationProcessExecutionFetcherService);
  });

  describe("Fetch validation process execution by ID", () => {
    beforeEach(() => {
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(of(validationProcessExecutionApiModel));
    });

    it("should fetch the master validation execution correctly", async () => {
      await expect(
        lastValueFrom(
          service.getValidationProcessExecution(
            "projectId",
            "masterValidationExecutionId"
          )
        )
      ).resolves.toEqual(validationProcessExecution);
      expect(httpClient.get).toHaveBeenCalledWith(
        `${gateway}projects/projectId/business-process/executions/master-validation/masterValidationExecutionId`
      );
    });

    it("should throw an error with correct message if it fails to fetch master validation", async () => {
      const expectedErrorMessage = "errorMessage";
      jest.spyOn(httpClient, "get").mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 500,
              error: {
                message: expectedErrorMessage,
              },
            })
        )
      );

      await expect(
        lastValueFrom(
          service.getValidationProcessExecution(
            "projectId",
            "masterValidationExecutionId"
          )
        )
      ).rejects.toThrow(expectedErrorMessage);
    });
  });

  describe("Fetch paginated validation process", () => {
    beforeEach(() => {
      jest.spyOn(httpClient, "get").mockReturnValue(
        of({
          content: [validationProcessExecutionApiModel],
          totalElements: 1,
          last: true,
        })
      );
    });

    it("should return the queried master validation executions given the required query params", async () => {
      const result = await lastValueFrom(
        service.getValidationProcessExecutions("projectId", {
          page: 0,
          pageSize: 10,
        })
      );

      expect(result).toEqual({
        executions: [validationProcessExecution],
        total: 1,
        last: true,
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        "gateway/projects/projectId/business-process/executions/master-validation",
        {
          params: new HttpParams().append("page", 0).append("pageSize", 10),
        }
      );
    });

    it("should return the queried master validation executions given all the query params are passed", async () => {
      const queryParams: ValidationProcessExecutionsQueryRequest = {
        page: 0,
        pageSize: 10,
        namePhrase: "namePhrase",
        officiality: [
          BusinessProcessOfficialStatus.OFFICIAL,
          BusinessProcessOfficialStatus.NA,
        ],
        businessProcessQualityLevel: ["DQG", "MQG"],
        ownerPhrase: "ownerPhrase",
        statuses: [
          BusinessProcessExecutionStatus.RUNNING,
          BusinessProcessExecutionStatus.FAILED,
        ],
        definitionIds: ["definition1", "definition2"],
        startDateRangeStart: "startDateRangeStart",
        startDateRangeEnd: "startDateRangeEnd",
        endDateRangeStart: "endDateRangeStart",
        endDateRangeEnd: "endDateRangeEnd",
        expiryDateRangeStart: "expiryDateRangeStart",
        expiryDateRangeEnd: "expiryDateRangeEnd",
        parentBranch: "parentBranch",
        rtpCommitPhrase: "rtpCommitPhrase",
        sort: "sort",
        hidden: false,
      };

      const result = await lastValueFrom(
        service.getValidationProcessExecutions("projectId", queryParams)
      );

      expect(result).toEqual({
        executions: [validationProcessExecution],
        total: 1,
        last: true,
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        "gateway/projects/projectId/business-process/executions/master-validation",
        {
          params: new HttpParams()
            .append("page", 0)
            .append("pageSize", 10)
            .append("namePhrase", "namePhrase")
            .append("ownerPhrase", "ownerPhrase")
            .append("startDateRangeStart", "startDateRangeStart")
            .append("startDateRangeEnd", "startDateRangeEnd")
            .append("endDateRangeStart", "endDateRangeStart")
            .append("endDateRangeEnd", "endDateRangeEnd")
            .append("expiryDateRangeStart", "expiryDateRangeStart")
            .append("expiryDateRangeEnd", "expiryDateRangeEnd")
            .append("sort", "sort")
            .append("parentBranch", "parentBranch")
            .append("rtpCommitPhrase", "rtpCommitPhrase")
            .append("officiality", BusinessProcessOfficialStatus.OFFICIAL)
            .append("officiality", BusinessProcessOfficialStatus.NA)
            .append("businessProcessQualityLevel", "DQG")
            .append("businessProcessQualityLevel", "MQG")
            .append("statuses", BusinessProcessExecutionStatus.RUNNING)
            .append("statuses", BusinessProcessExecutionStatus.FAILED)
            .append("definitionIds", "definition1")
            .append("definitionIds", "definition2")
            .append("hidden", false),
        }
      );
    });

    it("should throw an error with correct message if it fails to fetch execution", async () => {
      const expectedErrorMessage = "errorMessage";
      jest.spyOn(httpClient, "get").mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 500,
              error: expectedErrorMessage,
            })
        )
      );

      await expect(
        lastValueFrom(
          service.getValidationProcessExecutions("projectId", {
            page: 0,
            pageSize: 10,
          })
        )
      ).rejects.toThrow(expectedErrorMessage);
    });
  });
});
