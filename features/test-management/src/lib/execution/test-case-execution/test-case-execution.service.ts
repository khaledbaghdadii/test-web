import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient, HttpParams } from "@angular/common/http";
import { catchError, map, Observable, throwError } from "rxjs";
import { TestCaseExecution } from "./test-case-execution";
import { FetchTestCaseExecutionsRequest } from "./fetch-test-case-executions-request";
import { UpdateTestCaseExecutionAnalysisStatusRequest } from "./update-test-case-execution-analysis-status-request";
import { TestCaseExecutionAnalysisStatus } from "./analysis-status/test-case-execution-analysis-status";
import { UpdateTestCaseExecutionAnalysisStatusApiRequest } from "./update-test-case-execution-analysis-status-api-request";
import { TestCaseExecutionsAnalysisStatusEligibility } from "./analysis-status-eligibility/test-case-executions-analyisis-status-eligibility";
import { TestCaseExecutionAnalyzabilityService } from "./test-case-execution-analyzability.service";

@Injectable()
export class TestCaseExecutionService {
  private readonly http = inject(HttpClient);
  private readonly testCaseExecutionAnalyzabilityService = inject(
    TestCaseExecutionAnalyzabilityService
  );

  apiUrl: string;

  constructor() {
    const config = inject<AppConfig>(APP_CONFIG);

    this.apiUrl = config.gatewayUrl;
  }

  fetchAnalyzableTestCaseExecutions(
    request: FetchTestCaseExecutionsRequest
  ): Observable<TestCaseExecution[]> {
    return this.fetch(request).pipe(
      map((testCaseExecutions: TestCaseExecution[]) =>
        testCaseExecutions.filter((testCaseExecution: TestCaseExecution) =>
          this.testCaseExecutionAnalyzabilityService.isAnalyzable(
            testCaseExecution
          )
        )
      )
    );
  }

  fetch(
    request: FetchTestCaseExecutionsRequest
  ): Observable<TestCaseExecution[]> {
    const queryParams = new HttpParams({ fromObject: { ...request.params } });
    return this.http.get<TestCaseExecution[]>(
      this.getBaseUrl(request.projectId),
      { params: queryParams }
    );
  }

  updateAnalysisStatus(
    request: UpdateTestCaseExecutionAnalysisStatusRequest
  ): Observable<void> {
    return this.http
      .patch<void>(
        this.getUpdateAnalysisStatusUrl(
          request.projectId,
          request.testCaseExecutionId
        ),
        this.getUpdateTestCaseExecutionAnalysisStatusApiRequest(
          request.analysisStatus
        )
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  fetchAnalysisStatusEligibility(
    projectId: string,
    testCaseExecutionId: string
  ): Observable<TestCaseExecutionsAnalysisStatusEligibility> {
    return this.http
      .get<TestCaseExecutionsAnalysisStatusEligibility>(
        `${this.getBaseUrl(
          projectId
        )}/${testCaseExecutionId}/analysis-status-eligibility`
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private getBaseUrl(projectId: string) {
    return `${this.apiUrl}projects/${projectId}/test-execution-manager/test-case-executions`;
  }

  private getUpdateAnalysisStatusUrl(
    projectId: string,
    testCaseExecutionId: string
  ) {
    return `${this.getBaseUrl(
      projectId
    )}/${testCaseExecutionId}/analysis-status`;
  }

  private getUpdateTestCaseExecutionAnalysisStatusApiRequest(
    analysisStatus: TestCaseExecutionAnalysisStatus
  ): UpdateTestCaseExecutionAnalysisStatusApiRequest {
    return {
      analysisStatus: analysisStatus,
    };
  }
}
