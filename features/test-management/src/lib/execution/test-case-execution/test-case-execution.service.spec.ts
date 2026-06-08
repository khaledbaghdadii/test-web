import { TestCaseExecutionService } from "./test-case-execution.service";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";

import { lastValueFrom, of, throwError } from "rxjs";
import {
  projectId,
  testCaseExecution1,
  testCaseExecution2,
  testCaseExecution3,
  testExecutionId,
} from "./test-case-execution-utils";
import { scenarioExecutionId } from "../scenario-execution/scenario-execution-test-utils";
import { FetchTestCaseExecutionsRequest } from "./fetch-test-case-executions-request";
import { TestCaseExecutionAnalysisStatus } from "./analysis-status/test-case-execution-analysis-status";
import { UpdateTestCaseExecutionAnalysisStatusRequest } from "./update-test-case-execution-analysis-status-request";
import { UpdateTestCaseExecutionAnalysisStatusApiRequest } from "./update-test-case-execution-analysis-status-api-request";
import { TestBed } from "@angular/core/testing";
import { TestCaseExecutionAnalysisStatusIneligibilityReason } from "./analysis-status-eligibility/test-case-execution-analysis-status-ineligibility-reason";
import { TestCaseExecutionAnalyzabilityService } from "./test-case-execution-analyzability.service";
import { TestCaseExecution } from "@mxflow/test-management";

const TEST_CASE_EXECUTION_ID = "testCaseExecutionId";
const PROJECT_ID = "PROJECT_ID";
describe("test case execution service", () => {
  let service: TestCaseExecutionService;
  let appConfig: AppConfig;
  let http: HttpClient;
  let testCaseExecutionAnalyzabilityService: TestCaseExecutionAnalyzabilityService;

  beforeEach(() => {
    appConfig = {
      gatewayUrl: "apiUrl",
    } as unknown as AppConfig;
    http = {
      get: jest.fn(() => of([testCaseExecution1, testCaseExecution2])),
      patch: jest.fn(() => of({})),
    } as unknown as HttpClient;
    testCaseExecutionAnalyzabilityService = {
      isAnalyzable: jest.fn(() => true),
    } as unknown as TestCaseExecutionAnalyzabilityService;

    TestBed.configureTestingModule({
      providers: [
        TestCaseExecutionService,
        { provide: APP_CONFIG, useValue: appConfig },
        { provide: HttpClient, useValue: http },
        {
          provide: TestCaseExecutionAnalyzabilityService,
          useValue: testCaseExecutionAnalyzabilityService,
        },
      ],
    });
    service = TestBed.inject(TestCaseExecutionService);
  });

  describe("fetch with filter criteria", () => {
    it("should return an empty list if no test execution are present", (done) => {
      jest.spyOn(http, "get").mockReturnValue(of([]));

      service.fetch(getRequest()).subscribe((testCaseExecutions) => {
        expect(testCaseExecutions).toEqual([]);
        done();
      });
    });

    it("should return the test case executions correctly", (done) => {
      service.fetch(getRequest()).subscribe((testCaseExecutions) => {
        expect(http.get).toHaveBeenCalledWith(
          `${appConfig.gatewayUrl}projects/${projectId}/test-execution-manager/test-case-executions`,
          {
            params: new HttpParams({
              fromObject: { ...getRequest().params },
            }),
          }
        );
        expect(testCaseExecutions).toEqual([
          testCaseExecution1,
          testCaseExecution2,
        ]);
        done();
      });
    });

    it("should return the analysis status for each test case execution", (done) => {
      const firstTestCaseExecution = {
        analysisStatus: TestCaseExecutionAnalysisStatus.PASSED,
      };
      const secondTestCaseExecution = {
        analysisStatus: TestCaseExecutionAnalysisStatus.FAILED,
      };
      jest
        .spyOn(http, "get")
        .mockReturnValue(of([firstTestCaseExecution, secondTestCaseExecution]));
      service.fetch(getRequest()).subscribe((testCaseExecutions) => {
        expect(testCaseExecutions[0].analysisStatus).toEqual(
          firstTestCaseExecution.analysisStatus
        );
        expect(testCaseExecutions[1].analysisStatus).toEqual(
          secondTestCaseExecution.analysisStatus
        );
        done();
      });
    });

    it("should get the test case executions given no params are passed", (done) => {
      service
        .fetch(getRequestWithNoParams())
        .subscribe((testCaseExecutions) => {
          expect(http.get).toHaveBeenCalledWith(
            `${appConfig.gatewayUrl}projects/${projectId}/test-execution-manager/test-case-executions`,
            {
              params: new HttpParams({
                fromObject: {},
              }),
            }
          );
          expect(testCaseExecutions).toEqual([
            testCaseExecution1,
            testCaseExecution2,
          ]);
          done();
        });
    });

    it("should get the test case executions given only scenario execution id is passed", (done) => {
      service
        .fetch({
          projectId: projectId,
          params: {
            scenarioExecutionId: scenarioExecutionId,
          },
        })
        .subscribe((testCaseExecutions) => {
          expect(http.get).toHaveBeenCalledWith(
            `${appConfig.gatewayUrl}projects/${projectId}/test-execution-manager/test-case-executions`,
            {
              params: new HttpParams({
                fromObject: {
                  scenarioExecutionId: scenarioExecutionId,
                },
              }),
            }
          );
          expect(testCaseExecutions).toEqual([
            testCaseExecution1,
            testCaseExecution2,
          ]);
          done();
        });
    });

    it("should get the test case executions given only test execution id is passed", (done) => {
      service
        .fetch({
          projectId: projectId,
          params: {
            testExecutionId: testExecutionId,
          },
        })
        .subscribe((testCaseExecutions) => {
          expect(http.get).toHaveBeenCalledWith(
            `${appConfig.gatewayUrl}projects/${projectId}/test-execution-manager/test-case-executions`,
            {
              params: new HttpParams({
                fromObject: { testExecutionId: testExecutionId },
              }),
            }
          );
          expect(testCaseExecutions).toEqual([
            testCaseExecution1,
            testCaseExecution2,
          ]);
          done();
        });
    });

    it("should return an error if failed to fetch test case executions", (done) => {
      jest.spyOn(http, "get").mockReturnValue(throwError(() => "errorMessage"));
      service.fetch(getRequest()).subscribe({
        error: (err) => {
          expect(err).toEqual("errorMessage");
          done();
        },
      });
    });
  });

  describe("update analysis status", () => {
    it("should update analysis status of a test case execution", (done) => {
      const expectedUrl = `${appConfig.gatewayUrl}projects/${PROJECT_ID}/test-execution-manager/test-case-executions/${TEST_CASE_EXECUTION_ID}/analysis-status`;
      service
        .updateAnalysisStatus(getUpdateTestCaseExecutionAnalysisStatusRequest())
        .subscribe(() => {
          expect(http.patch).toHaveBeenCalledWith(
            expectedUrl,
            getUpdateTestCaseExecutionAnalysisStatusApiRequest()
          );
          done();
        });
    });

    it("should handle error when updating analysis status", (done) => {
      jest.spyOn(http, "patch").mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              error: "errorMessage",
            })
        )
      );
      service
        .updateAnalysisStatus(getUpdateTestCaseExecutionAnalysisStatusRequest())
        .subscribe({
          error: (err) => {
            expect(err.message).toEqual("errorMessage");
            done();
          },
        });
    });
  });

  describe("fetch analysis status eligibility", () => {
    it("should return the eligibility", async () => {
      const httpResponse = {
        nextAnalysisStatusTransitionEligibilities: [
          {
            analysisStatus: TestCaseExecutionAnalysisStatus.INCIDENT_SENT,
            eligible: true,
            ineligibilityReason: null,
          },
          {
            analysisStatus: TestCaseExecutionAnalysisStatus.PASSED,
            eligible: false,
            ineligibilityReason:
              TestCaseExecutionAnalysisStatusIneligibilityReason.NO_IMPACTS_LINKED,
          },
        ],
        eligibleToUpdateTestCaseAnalysisStatus: true,
      };
      jest.spyOn(http, "get").mockReturnValue(of(httpResponse));

      const eligibilityResponse = await lastValueFrom(
        service.fetchAnalysisStatusEligibility(
          projectId,
          TEST_CASE_EXECUTION_ID
        )
      );

      expect(http.get).toHaveBeenCalledWith(
        `${appConfig.gatewayUrl}projects/${projectId}/test-execution-manager/test-case-executions/${TEST_CASE_EXECUTION_ID}/analysis-status-eligibility`
      );
      expect(eligibilityResponse).toEqual(httpResponse);
    });
    it("should handle the error", async () => {
      const message = "failed";
      const errorResponse = new HttpErrorResponse({ error: message });
      jest.spyOn(http, "get").mockReturnValue(throwError(() => errorResponse));
      await expect(
        lastValueFrom(
          service.fetchAnalysisStatusEligibility(
            projectId,
            TEST_CASE_EXECUTION_ID
          )
        )
      ).rejects.toThrow(message);
    });
  });

  describe("fetch analyzable test case executions", () => {
    it("should return an empty list if no test case executions are found", async () => {
      jest.spyOn(service, "fetch").mockReturnValue(of([]));

      await expect(
        lastValueFrom(service.fetchAnalyzableTestCaseExecutions(getRequest()))
      ).resolves.toEqual([]);
    });

    it("should return an empty list if no analyzable test case executions are found", async () => {
      jest
        .spyOn(testCaseExecutionAnalyzabilityService, "isAnalyzable")
        .mockReturnValue(false);
      jest
        .spyOn(service, "fetch")
        .mockReturnValue(of([testCaseExecution1, testCaseExecution2]));

      await expect(
        lastValueFrom(service.fetchAnalyzableTestCaseExecutions(getRequest()))
      ).resolves.toEqual([]);
    });

    it("should return the analyzable test case executions correctly", async () => {
      jest
        .spyOn(service, "fetch")
        .mockReturnValue(
          of([testCaseExecution1, testCaseExecution2, testCaseExecution3])
        );
      jest
        .spyOn(testCaseExecutionAnalyzabilityService, "isAnalyzable")
        .mockImplementation((testCaseExecution: TestCaseExecution) => {
          return testCaseExecution.id !== testCaseExecution3.id;
        });
      await expect(
        lastValueFrom(service.fetchAnalyzableTestCaseExecutions(getRequest()))
      ).resolves.toEqual([testCaseExecution1, testCaseExecution2]);
    });
  });
});

function getRequest(): FetchTestCaseExecutionsRequest {
  return {
    projectId: projectId,
    params: {
      scenarioExecutionId: scenarioExecutionId,
      testExecutionId: testExecutionId,
      testCaseExecutionIds: [TEST_CASE_EXECUTION_ID],
    },
  };
}

function getUpdateTestCaseExecutionAnalysisStatusRequest(): UpdateTestCaseExecutionAnalysisStatusRequest {
  return {
    projectId: PROJECT_ID,
    testCaseExecutionId: TEST_CASE_EXECUTION_ID,
    analysisStatus: TestCaseExecutionAnalysisStatus.PASSED,
  };
}

function getUpdateTestCaseExecutionAnalysisStatusApiRequest(): UpdateTestCaseExecutionAnalysisStatusApiRequest {
  return {
    analysisStatus: TestCaseExecutionAnalysisStatus.PASSED,
  };
}

function getRequestWithNoParams(): FetchTestCaseExecutionsRequest {
  return {
    projectId: projectId,
    params: {},
  };
}
