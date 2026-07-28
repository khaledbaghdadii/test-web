import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { ValidationProcessExecutionFetcherService } from "./validation-process-execution-fetcher.service";
import { ValidationProcessExecutionMapperService } from "./validation-process-execution-mapper.service";
import { ValidationProcessExecution } from "./models/validation-process-execution";
import { ExecutionStatus } from "@mxevolve/domains/business-process/util";
import { ValidationProcessStageStatus } from "./models/stage/validation-process-stage-status";

const PROJECT_ID = "projectId";
const EXECUTION_ID = "executionId";
const GATEWAY_URL = "https://api.test.com/";

const buildApiResponse = () => ({
  id: EXECUTION_ID,
  name: "MV Execution",
  projectId: PROJECT_ID,
  projectName: "My Project",
  owner: "owner1",
  sourceDefinitionId: "src-def",
  definitionId: "def-id",
  definitionName: "def-name",
  familyId: "fam-id",
  familyName: "master-validation",
  processName: "MV Process",
  errorMessage: "",
  startDate: "2024-01-01",
  endDate: "",
  expiryDate: "2024-06-01",
  status: "RUNNING",
  daysExtended: 0,
  officiality: "OFFICIAL",
  hidden: false,
  businessProcessQualityLevel: "MQG",
  input: {
    repositoryId: "repo-id",
    createBranch: true,
    archivalBranchName: "archival-branch",
    parentBranch: "parent-branch",
    scenarioDefinitionIds: ["scenario-1"],
    businessProcessQualityLevel: "MQG",
    finalProductId: "final-product-id",
    qualityGateExecutionInfraGroupId: "infra-group-id",
    configCommitId: "config-commit-id",
    rtpCommitId: "rtp-commit-id",
    nightlyRepusherEnabled: true,
  },
  createBranchStage: {
    name: "Create Branch",
    status: "PASSED",
    startDate: "2024-01-01",
    endDate: "2024-01-01",
    errorMessage: "",
    developmentId: "dev-id",
    headCommitIdUponExecution: "head-commit",
    createdBranch: true,
  },
  executeQualityGatesStage: {
    name: "Execute Quality Gates",
    status: "RUNNING",
    startDate: "2024-01-01",
    endDate: "",
    errorMessage: "",
    validationResult: null,
  },
  tagArchivalBranchStage: {
    name: "Tag Archival",
    status: "NOT_STARTED",
    startDate: "",
    endDate: "",
    errorMessage: "",
    configTagName: "",
    configCommitId: "",
    rtpTagName: "",
    rtpCommitId: "",
    promotedFinalProductId: "",
    promotionSuccessful: false,
    promotionErrorMessage: "",
  },
  integrateFixesStage: {
    name: "Integrate Fixes",
    status: "NOT_STARTED",
    startDate: "",
    endDate: "",
    errorMessage: "",
    latestMergeJobId: "",
    stopActionMaker: "",
    skipActionMaker: "",
    finalProductPublishing: { id: "fp", publishingStartDate: "2024-01-01" },
  },
});

describe("ValidationProcessExecutionFetcherService", () => {
  let service: ValidationProcessExecutionFetcherService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ValidationProcessExecutionFetcherService,
        ValidationProcessExecutionMapperService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });
    service = TestBed.inject(ValidationProcessExecutionFetcherService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("should call the correct GET endpoint", () => {
    service.fetchExecution(PROJECT_ID, EXECUTION_ID).subscribe();

    const req = httpTestingController.expectOne({
      method: "GET",
      url: `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/executions/master-validation/${EXECUTION_ID}`,
    });

    expect(req.request.method).toBe("GET");
  });

  it("should map the execution status from the response", async () => {
    let result!: ValidationProcessExecution;
    service
      .fetchExecution(PROJECT_ID, EXECUTION_ID)
      .subscribe((r) => (result = r));

    httpTestingController
      .expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/executions/master-validation/${EXECUTION_ID}`
      )
      .flush(buildApiResponse());

    expect(result.status).toBe(ExecutionStatus.RUNNING);
  });

  it("should map createBranchStage route from the response", async () => {
    let result!: ValidationProcessExecution;
    service
      .fetchExecution(PROJECT_ID, EXECUTION_ID)
      .subscribe((r) => (result = r));

    httpTestingController
      .expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/executions/master-validation/${EXECUTION_ID}`
      )
      .flush(buildApiResponse());

    expect(result.createBranchStage.route).toBe("create-branch");
  });

  it("should map createBranchStage status from the response", async () => {
    let result!: ValidationProcessExecution;
    service
      .fetchExecution(PROJECT_ID, EXECUTION_ID)
      .subscribe((r) => (result = r));

    httpTestingController
      .expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/executions/master-validation/${EXECUTION_ID}`
      )
      .flush(buildApiResponse());

    expect(result.createBranchStage.status).toBe(
      ValidationProcessStageStatus.PASSED
    );
  });

  it("should forward the error message on HTTP failure", async () => {
    let errorMessage: string | undefined;

    service.fetchExecution(PROJECT_ID, EXECUTION_ID).subscribe({
      error: (error) => (errorMessage = error.message),
    });

    httpTestingController
      .expectOne(
        `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/executions/master-validation/${EXECUTION_ID}`
      )
      .flush(
        { message: "Execution not found" },
        { status: 404, statusText: "Not Found" }
      );

    expect(errorMessage).toBe("Execution not found");
  });
});
