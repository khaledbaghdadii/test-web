import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { ValidationProcessListingService } from "./validation-process-listing.service";
import { ValidationProcessExecutionMapperService } from "./validation-process-execution-mapper.service";
import { ValidationProcessExecutionsQueryRequest } from "./models/validation-process-executions-query-request";
import { ValidationProcessExecutionsQueryResponse } from "./models/validation-process-executions-query-response";

const PROJECT_ID = "projectId";
const GATEWAY_URL = "https://api.test.com/";
const BASE_URL = `${GATEWAY_URL}projects/${PROJECT_ID}/business-process/executions/master-validation`;

const buildMinimalQueryRequest =
  (): ValidationProcessExecutionsQueryRequest => ({
    page: 1,
    pageSize: 10,
  });

describe("ValidationProcessListingService", () => {
  let service: ValidationProcessListingService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ValidationProcessListingService,
        ValidationProcessExecutionMapperService,
        { provide: APP_CONFIG, useValue: { gatewayUrl: GATEWAY_URL } },
      ],
    });
    service = TestBed.inject(ValidationProcessListingService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("should include page param in the request", () => {
    service
      .getValidationProcessExecutions(PROJECT_ID, buildMinimalQueryRequest())
      .subscribe();

    const req = httpTestingController.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.get("page")).toBe("1");
  });

  it("should include pageSize param in the request", () => {
    service
      .getValidationProcessExecutions(PROJECT_ID, buildMinimalQueryRequest())
      .subscribe();

    const req = httpTestingController.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.get("pageSize")).toBe("10");
  });

  it("should include namePhrase when provided", () => {
    service
      .getValidationProcessExecutions(PROJECT_ID, {
        ...buildMinimalQueryRequest(),
        namePhrase: "my-exec",
      })
      .subscribe();

    const req = httpTestingController.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.get("namePhrase")).toBe("my-exec");
  });

  it("should not include namePhrase when undefined", () => {
    service
      .getValidationProcessExecutions(PROJECT_ID, buildMinimalQueryRequest())
      .subscribe();

    const req = httpTestingController.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.has("namePhrase")).toBe(false);
  });

  it("should include ownerPhrase when provided", () => {
    service
      .getValidationProcessExecutions(PROJECT_ID, {
        ...buildMinimalQueryRequest(),
        ownerPhrase: "alice",
      })
      .subscribe();

    const req = httpTestingController.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.get("ownerPhrase")).toBe("alice");
  });

  it("should not include ownerPhrase when undefined", () => {
    service
      .getValidationProcessExecutions(PROJECT_ID, buildMinimalQueryRequest())
      .subscribe();

    const req = httpTestingController.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.has("ownerPhrase")).toBe(false);
  });

  it("should include sort when provided", () => {
    service
      .getValidationProcessExecutions(PROJECT_ID, {
        ...buildMinimalQueryRequest(),
        sort: "startDate,asc",
      })
      .subscribe();

    const req = httpTestingController.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.get("sort")).toBe("startDate,asc");
  });

  it("should not include sort when undefined", () => {
    service
      .getValidationProcessExecutions(PROJECT_ID, buildMinimalQueryRequest())
      .subscribe();

    const req = httpTestingController.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.has("sort")).toBe(false);
  });

  it("should include hidden param when provided", () => {
    service
      .getValidationProcessExecutions(PROJECT_ID, {
        ...buildMinimalQueryRequest(),
        hidden: true,
      })
      .subscribe();

    const req = httpTestingController.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.get("hidden")).toBe("true");
  });

  it("should append officiality as repeated keys, not a comma-joined value", () => {
    service
      .getValidationProcessExecutions(PROJECT_ID, {
        ...buildMinimalQueryRequest(),
        officiality: ["OFFICIAL", "NA"],
      })
      .subscribe();

    const req = httpTestingController.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.getAll("officiality")).toEqual([
      "OFFICIAL",
      "NA",
    ]);
  });

  it("should append statuses as repeated keys, not a comma-joined value", () => {
    service
      .getValidationProcessExecutions(PROJECT_ID, {
        ...buildMinimalQueryRequest(),
        statuses: ["PASSED", "FAILED", "ABORTED"],
      })
      .subscribe();

    const req = httpTestingController.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.getAll("statuses")).toEqual([
      "PASSED",
      "FAILED",
      "ABORTED",
    ]);
  });

  it("should append businessProcessQualityLevel as repeated keys, not a comma-joined value", () => {
    service
      .getValidationProcessExecutions(PROJECT_ID, {
        ...buildMinimalQueryRequest(),
        businessProcessQualityLevel: ["MQG"],
      })
      .subscribe();

    const req = httpTestingController.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.getAll("businessProcessQualityLevel")).toEqual([
      "MQG",
    ]);
  });

  it("should append definitionIds as repeated keys, not a comma-joined value", () => {
    service
      .getValidationProcessExecutions(PROJECT_ID, {
        ...buildMinimalQueryRequest(),
        definitionIds: ["def-1", "def-2"],
      })
      .subscribe();

    const req = httpTestingController.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.getAll("definitionIds")).toEqual([
      "def-1",
      "def-2",
    ]);
  });

  it("should not include array params when the array is empty or undefined", () => {
    service
      .getValidationProcessExecutions(PROJECT_ID, {
        ...buildMinimalQueryRequest(),
        officiality: [],
      })
      .subscribe();

    const req = httpTestingController.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.has("officiality")).toBe(false);
    expect(req.request.params.has("statuses")).toBe(false);
  });

  it("should use GET method", () => {
    service
      .getValidationProcessExecutions(PROJECT_ID, buildMinimalQueryRequest())
      .subscribe();

    const req = httpTestingController.expectOne((r) => r.url === BASE_URL);
    expect(req.request.method).toBe("GET");
  });

  it("should map response to executions array", async () => {
    let result!: ValidationProcessExecutionsQueryResponse;
    service
      .getValidationProcessExecutions(PROJECT_ID, buildMinimalQueryRequest())
      .subscribe((r) => (result = r));

    httpTestingController
      .expectOne((r) => r.url === BASE_URL)
      .flush({
        content: [
          {
            id: "exec-1",
            name: "exec-1",
            projectId: PROJECT_ID,
            projectName: "proj",
            owner: "owner",
            sourceDefinitionId: "src",
            definitionId: "def",
            definitionName: "def-name",
            familyId: "fam",
            familyName: "fam-name",
            processName: "proc",
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
              repositoryId: "repo",
              createBranch: false,
              archivalBranchName: "arch",
              parentBranch: "parent",
              scenarioDefinitionIds: [],
              businessProcessQualityLevel: "MQG",
              finalProductId: "fp",
              qualityGateExecutionInfraGroupId: "ig",
              configCommitId: "cc",
              rtpCommitId: "rtp",
              nightlyRepusherEnabled: false,
            },
            createBranchStage: {
              name: "cb",
              status: "PASSED",
              startDate: "",
              endDate: "",
              errorMessage: "",
              developmentId: "",
              headCommitIdUponExecution: "",
              createdBranch: true,
            },
            executeQualityGatesStage: {
              name: "qg",
              status: "NOT_STARTED",
              startDate: "",
              endDate: "",
              errorMessage: "",
              validationResult: null,
            },
            tagArchivalBranchStage: {
              name: "ta",
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
              name: "if",
              status: "NOT_STARTED",
              startDate: "",
              endDate: "",
              errorMessage: "",
              latestMergeJobId: "",
              stopActionMaker: "",
              skipActionMaker: "",
              finalProductPublishing: { id: "fp", publishingStartDate: "" },
            },
          },
        ],
        totalElements: 1,
        last: true,
      });

    expect(result.executions).toHaveLength(1);
  });

  it("should map response total from totalElements", async () => {
    let result!: ValidationProcessExecutionsQueryResponse;
    service
      .getValidationProcessExecutions(PROJECT_ID, buildMinimalQueryRequest())
      .subscribe((r) => (result = r));

    httpTestingController
      .expectOne((r) => r.url === BASE_URL)
      .flush({ content: [], totalElements: 42, last: false });

    expect(result.total).toBe(42);
  });

  it("should map response last from last field", async () => {
    let result!: ValidationProcessExecutionsQueryResponse;
    service
      .getValidationProcessExecutions(PROJECT_ID, buildMinimalQueryRequest())
      .subscribe((r) => (result = r));

    httpTestingController
      .expectOne((r) => r.url === BASE_URL)
      .flush({ content: [], totalElements: 0, last: true });

    expect(result.last).toBe(true);
  });
});
