import { Injectable, inject } from "@angular/core";
import { catchError, map, Observable, throwError } from "rxjs";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import {
  Report,
  ScenarioExecution,
  TestExecution,
  TestExecutionStatus,
} from "./scenario-execution";
import { HttpClient } from "@angular/common/http";
import { BulkRepushRequest } from "./request/bulk-repush-request";
import { UpdateAssigneeRequest } from "./request/update-assignee-request";
import {
  ScenarioExecutionApiModel,
  TestExecutionApiModel,
} from "./model/scenario-execution-api-model";
import { UpdateAnalysisStatusRequest } from "./request/update-analysis-status-request";
import { UpdateAssigneeApiRequest } from "./request/update-assignee-api-request";
import { EnvironmentStatus } from "@mxflow/features/environment";
import { UpdateCommentRequest } from "./request/update-comment-request";
import { RepushScenarioExecutionRequest } from "./request/repush-scenario-execution-request";
import { ExecuteScenarioResponse } from "./request/execute-scenario-response";
import { BulkRepushApiRequest } from "./request/bulk-repush-api-request";
import { BulkRepushApiResponse } from "./request/bulk-repush-api-response";
import { BulkRepushResponse } from "./request/bulk-repush-response";
import { RunScenarioRequest } from "./request/run-scenario-request";
import { RunScenarioResponse } from "./request/run-scenario-response";
import { RunScenarioApiResponse } from "./request/run-scenario-api-response";
import { RunScenarioApiRequest } from "./request/run-scenario-api-request";
import { ScenarioExecutionGroupActionPermissionApiModel } from "./model/scenario-execution-group-action-permission-api-model";
import { RepushScenarioExecutionFromFinalProductRequest } from "./request/repush-scenario-execution-from-final-product-request";
import { RepushScenarioExecutionFromFinalProductApiRequest } from "./request/repush-scenario-execution-from-final-product-api-request";
import { BulkRepushFromFinalProductRequest } from "./request/bulk-repush-from-final-product-request";
import { RunDetails } from "@mxtest/reporting-data-models";
import { UpdateKeptExecutionApiRequest } from "./request/update-kept-execution-api-request";
import { ScenarioAnalysisStatus } from "./scenario-analysis-status/scenario-analysis-status";
import { AnalysisStatusEligibility } from "./scenario-analysis-status/analysis-status-eligibility";

export interface BulkRepushFromFinalProductApiRequest {
  finalProductId: string;
  rtpCommitId?: string;
  testScenarioExecutions: string[];
}
@Injectable()
export class ScenarioExecutionService {
  private readonly http = inject(HttpClient);

  apiUrl: string;
  private readonly abortRequestedMessage =
    "Aborting scenario execution. This might take some time.";

  constructor() {
    const config = inject<AppConfig>(APP_CONFIG);

    this.apiUrl = config.gatewayUrl;
  }

  updateAssignee(request: UpdateAssigneeRequest) {
    return this.http
      .put(
        this.getUpdateAssigneeUri(request),
        this.toUpdateAssigneeRequestBody(request)
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private getUpdateAssigneeUri(request: UpdateAssigneeRequest) {
    return `${this.apiUrl}projects/${request.projectId}/test-execution-manager/scenario-executions/assignee`;
  }

  private getToggleKeptExecutionFlagUri(
    projectId: string,
    scenarioExecutionId: string
  ) {
    return `${this.apiUrl}projects/${projectId}/test-execution-manager/scenario-executions/${scenarioExecutionId}/kept-execution`;
  }

  updateComment(
    projectId: string,
    scenarioExecutionId: string,
    comment: string
  ) {
    return this.http
      .put(
        this.apiUrl +
          `projects/${projectId}/test-execution-manager/scenario-executions/${scenarioExecutionId}/comment`,
        this.toUpdateCommentRequestBody(comment)
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  updateAnalysisStatus(
    projectId: string,
    scenarioExecutionId: string,
    analysisStatus: ScenarioAnalysisStatus
  ) {
    return this.http
      .put(
        this.getScenarioExecutionsBaseUrl(projectId) +
          `/${scenarioExecutionId}/analysis-status`,
        this.toUpdateAnalysisStatusRequest(analysisStatus)
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  checkAnalysisStatusesEligibility(
    projectId: string,
    scenarioExecutionId: string
  ): Observable<AnalysisStatusEligibility> {
    return this.http
      .get<AnalysisStatusEligibility>(
        `${this.apiUrl}projects/${projectId}/test-execution-manager/scenario-executions/${scenarioExecutionId}/analysis-status-eligibility`
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  getScenarioExecution(
    projectId: string,
    scenarioExecutionId: string
  ): Observable<ScenarioExecution> {
    return this.http
      .get<ScenarioExecutionApiModel>(
        this.getScenarioExecutionsBaseUrl(projectId) + `/${scenarioExecutionId}`
      )
      .pipe(
        map((apiModel) => this.toScenarioExecution(apiModel)),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  getScenarioExecutions(
    projectId: string,
    contextId?: string,
    subContextId?: string,
    statuses?: string[],
    scenarioExecutionIds?: string[]
  ): Observable<ScenarioExecution[]> {
    let url = this.getScenarioExecutionsBaseUrl(projectId) + `?`;
    if (contextId) url += `&contextId=${contextId}`;
    if (subContextId) url += `&subContextId=${subContextId}`;
    if (statuses) url += `&statuses=${statuses}`;
    if (scenarioExecutionIds)
      url += `&scenarioExecutionIds=${scenarioExecutionIds}`;

    return this.http.get<ScenarioExecutionApiModel[]>(url).pipe(
      map((apiModels) => this.toScenarioExecutions(apiModels)),
      catchError((error) => throwError(() => new Error(error.message)))
    );
  }

  repushScenarioExecution(
    projectId: string,
    scenarioExecutionId: string,
    request: RepushScenarioExecutionRequest
  ): Observable<ExecuteScenarioResponse> {
    const trimmedRequest = {
      commitId: request.commitId?.trim(),
      factoryProductId: request.factoryProductId.trim(),
      executionGroupId: request.executionGroupId,
      stopServices: request.stopServices,
    } as RepushScenarioExecutionRequest;
    return this.http
      .post<ExecuteScenarioResponse>(
        this.getScenarioExecutionsBaseUrl(projectId) +
          `/${scenarioExecutionId}/repush`,
        this.mapToRepushApiRequest(trimmedRequest)
      )
      .pipe(catchError((error) => throwError(() => new Error(error.message))));
  }

  repushScenarioExecutionFromFinalProduct(
    projectId: string,
    scenarioExecutionId: string,
    request: RepushScenarioExecutionFromFinalProductRequest
  ): Observable<ExecuteScenarioResponse> {
    return this.http
      .post<ExecuteScenarioResponse>(
        this.getScenarioExecutionsBaseUrl(projectId) +
          `/${scenarioExecutionId}/repush-from-final-product`,
        this.mapToRepushFromFinalProductApiRequest(request)
      )
      .pipe(catchError((error) => throwError(() => new Error(error.message))));
  }

  private mapToRepushFromFinalProductApiRequest(
    repushRequest: RepushScenarioExecutionFromFinalProductRequest
  ): RepushScenarioExecutionFromFinalProductApiRequest {
    return {
      finalProductId: repushRequest.finalProductId,
      rtpCommitId: repushRequest.rtpCommitId,
      executionGroupId: repushRequest.executionGroupId,
      stopServices: repushRequest.stopServices,
    };
  }

  private mapToRepushApiRequest(request: RepushScenarioExecutionRequest) {
    return {
      commitId: request.commitId,
      executionGroupId: request.executionGroupId,
      factoryProductId: request.factoryProductId,
      stopServices: request.stopServices,
    };
  }

  bulkRepushScenarioExecutions(
    projectId: string,
    request: BulkRepushRequest
  ): Observable<BulkRepushResponse> {
    const trimmedRequest = {
      commitId: request.commitId?.trim(),
      factoryProductId: request.factoryProductId.trim(),
      scenariosToBeRepushed: request.scenariosToBeRepushed,
    } as BulkRepushRequest;
    return this.http
      .post<BulkRepushApiResponse>(
        this.getScenarioExecutionsBaseUrl(projectId) + `/repush/bulk`,
        this.from(trimmedRequest)
      )
      .pipe(
        map((response) => this.mapBulkRepushResponse(response)),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }

  abortScenarioExecution(
    projectId: string,
    scenarioExecutionId: string
  ): Observable<string> {
    return this.http
      .post<null>(
        `${this.getScenarioExecutionsBaseUrl(
          projectId
        )}/${scenarioExecutionId}/abort`,
        {}
      )
      .pipe(
        map(() => this.abortRequestedMessage),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  runScenario(
    projectId: string,
    request: RunScenarioRequest
  ): Observable<RunScenarioResponse> {
    return this.http
      .post<RunScenarioApiResponse>(
        this.getScenarioExecutionsBaseUrl(projectId) + `/execute`,
        this.mapToRunScenarioApiRequest(request)
      )
      .pipe(
        map((response) => this.mapToRunScenarioResponse(response)),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }

  isExecutionAllowed(
    projectId: string,
    executionGroupId: string
  ): Observable<ScenarioExecutionGroupActionPermissionApiModel> {
    const url =
      this.apiUrl +
      `projects/${projectId}/test-execution-manager/execution-group/${executionGroupId}/scenario-execution/can-push`;

    return this.http
      .get<ScenarioExecutionGroupActionPermissionApiModel>(url)
      .pipe(
        catchError(() =>
          throwError(() => {
            return new Error("Failed to fetch scenario executions allowed");
          })
        )
      );
  }

  isRepushAllowed(
    projectId: string,
    executionGroupId: string,
    scenarioExecutionId: string
  ): Observable<ScenarioExecutionGroupActionPermissionApiModel> {
    const url =
      this.apiUrl +
      `projects/${projectId}/test-execution-manager/execution-group/${executionGroupId}/scenario-execution/${scenarioExecutionId}/can-repush`;

    return this.http
      .get<ScenarioExecutionGroupActionPermissionApiModel>(url)
      .pipe(
        catchError(() =>
          throwError(() => {
            return new Error("Failed to fetch scenario repush eligibility");
          })
        )
      );
  }

  bulkRepushFromFinalProduct(
    projectId: string,
    request: BulkRepushFromFinalProductRequest
  ): Observable<BulkRepushResponse> {
    const trimmedRequest = {
      rtpCommitId: request.rtpCommitId.trim(),
      finalProductId: request.finalProductId.trim(),
      scenariosToBeRepushed: request.scenariosToBeRepushed,
    } as BulkRepushFromFinalProductRequest;
    return this.http
      .post<BulkRepushApiResponse>(
        this.getScenarioExecutionsBaseUrl(projectId) +
          `/bulk-repush-from-final-product`,
        this.toBulkRepushFromFinalProductApiRequest(trimmedRequest)
      )
      .pipe(
        map((response) => this.mapBulkRepushResponse(response)),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  fetchArchivedReport(
    projectId: string,
    scenarioExecutionId: string,
    testExecutionId: string
  ): Observable<RunDetails> {
    return this.http
      .get<RunDetails>(
        `${this.apiUrl}test-execution-service/projects/${projectId}/scenario-executions/${scenarioExecutionId}/test-executions/${testExecutionId}/archived-report`
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  toggleKeptExecutionFlag(
    projectId: string,
    scenarioExecutionId: string,
    keptExecution: boolean
  ): Observable<void> {
    return this.http
      .put<void>(
        this.getToggleKeptExecutionFlagUri(projectId, scenarioExecutionId),
        this.toUpdateKeptExecutionApiRequest(keptExecution)
      )
      .pipe(catchError((error) => throwError(() => new Error(error.message))));
  }

  private toUpdateKeptExecutionApiRequest(keptExecution: boolean) {
    return {
      keptExecution: keptExecution,
    } as UpdateKeptExecutionApiRequest;
  }

  private toBulkRepushFromFinalProductApiRequest(
    request: BulkRepushFromFinalProductRequest
  ) {
    return {
      testScenarioExecutions: request.scenariosToBeRepushed,
      rtpCommitId: request.rtpCommitId,
      finalProductId: request.finalProductId,
    } as BulkRepushFromFinalProductApiRequest;
  }

  private from(request: BulkRepushRequest) {
    return {
      testScenarioExecutions: request.scenariosToBeRepushed,
      commitId: request.commitId,
      factoryProductId: request.factoryProductId,
    } as BulkRepushApiRequest;
  }

  private mapBulkRepushResponse(response: BulkRepushApiResponse) {
    return {
      failedRepushes: response.failedRepushes,
    } as BulkRepushResponse;
  }

  private toUpdateAnalysisStatusRequest(
    analysisStatus: ScenarioAnalysisStatus
  ): UpdateAnalysisStatusRequest {
    if (analysisStatus) {
      return { analysisStatus: analysisStatus.toString() };
    }
    return { analysisStatus: ScenarioAnalysisStatus.NA.toString() };
  }

  private toScenarioExecutions(apiModels: ScenarioExecutionApiModel[]) {
    return apiModels.map((apiModel) => this.toScenarioExecution(apiModel));
  }

  private toScenarioExecution(
    apiModel: ScenarioExecutionApiModel
  ): ScenarioExecution {
    return {
      id: apiModel.id,
      testUnitId: apiModel.testUnitId,
      scenarioDefinitionId: apiModel.scenarioDefinitionId,
      name: apiModel.name,
      status: apiModel.status,
      analysisStatus: apiModel.analysisStatus,
      startDate: apiModel.startDate,
      endDate: apiModel.endDate,
      terminationMessage: apiModel.terminationMessage,
      logFileUrl: apiModel.logFileUrl,
      contextId: apiModel.contextId,
      testExecutions: this.toTestExecutions(apiModel),
      environmentId: apiModel.envInfo.environmentId,
      environmentStatus: apiModel.envInfo.status as EnvironmentStatus,
      assignee: apiModel.assignee,
      commitId: apiModel.commitId,
      mxVersion: apiModel.mxVersion,
      mxBuildId: apiModel.mxBuildId,
      branch: apiModel.branch,
      subContextId: apiModel.subContextId,
      comment: apiModel.comment,
      repushable: apiModel.repushable,
      isFinished: apiModel.finished,
      isFailed: apiModel.failed,
      executionGroupId: apiModel.executionGroupId,
      detections: apiModel.detections,
      linkedIncidents: apiModel.linkedIncidents,
      factoryProductId: apiModel.factoryProductId,
      fullMaintenance: apiModel.fullMaintenance,
      cleaningStatus: apiModel.cleaningStatus,
      validation: apiModel.validation
        ? {
            jumpType: apiModel.validation.jumpType,
            scope: apiModel.validation?.scope
              ? {
                  referenceFactoryProductId:
                    apiModel.validation.scope.referenceFactoryProductId,
                  requestedFactoryProductId:
                    apiModel.validation.scope.requestedFactoryProductId,
                }
              : undefined,
          }
        : undefined,
      rtpCommitId: apiModel.rtpCommitId,
      finalProductId: apiModel.finalProductId,
      keptExecution: apiModel.keptExecution,
      supportReconActivities: apiModel.supportReconActivities,
      qualityLevel: apiModel.qualityLevel,
      businessProcesses: apiModel.businessProcesses,
      project: apiModel.project,
    };
  }

  private toTestExecutions(
    apiModel: ScenarioExecutionApiModel
  ): TestExecution[] {
    return apiModel.testExecutions.map((testExecutionApiModel) => {
      return {
        id: testExecutionApiModel.id,
        testPackageDefinitionName: testExecutionApiModel.testPackageName,
        testSelectionNames: testExecutionApiModel.testSelectionNames,
        testPackageDefinitionId: testExecutionApiModel.testPackageDefinitionId,
        report: this.toReport(testExecutionApiModel),
        testPackageRunLocation: testExecutionApiModel.testPackageRunLocation,
        status: this.getTestExecutionStatus(
          testExecutionApiModel.testExecutionStatus
        ),
        startDate: testExecutionApiModel.startDate,
        endDate: testExecutionApiModel.endDate,
        isExecutionEnded: testExecutionApiModel.executionEnded,
        nameUponExecution: testExecutionApiModel.nameUponExecution,
        executionMode: testExecutionApiModel.executionMode,
      } as TestExecution;
    });
  }

  private toReport(testExecutionApiModel: TestExecutionApiModel): Report {
    return {
      url: testExecutionApiModel.report.url,
      completeReportUrl: testExecutionApiModel.report.completeReportUrl,
      performanceReportUrl: testExecutionApiModel.report.performanceReportUrl,
      hardwareMonitoringReportUrl:
        testExecutionApiModel.report.hardwareMonitoringReportUrl,
      uploading: testExecutionApiModel.report.uploading,
    };
  }

  private getTestExecutionStatus(status: string) {
    if (status === "Queued") {
      return TestExecutionStatus.QUEUED;
    }
    if (status === "Underway") {
      return TestExecutionStatus.UNDERWAY;
    }
    if (status === "Failed") {
      return TestExecutionStatus.FAILED;
    }
    if (status === "Passed") {
      return TestExecutionStatus.PASSED;
    }
    if (status === "NA") {
      return TestExecutionStatus.NA;
    }
    return undefined;
  }

  private toUpdateAssigneeRequestBody(
    request: UpdateAssigneeRequest
  ): UpdateAssigneeApiRequest {
    return {
      assignee: request.assignee,
      contextId: request.contextId,
      subContextId: request.subContextId,
      scenarioDefinitionId: request.scenarioDefinitionId,
    };
  }

  private toUpdateCommentRequestBody(comment: string): UpdateCommentRequest {
    return {
      comment: comment,
    };
  }

  private mapToRunScenarioApiRequest(
    request: RunScenarioRequest
  ): RunScenarioApiRequest {
    return {
      scenarioDefinitionId: request.scenarioDefinitionId,
      subContextId: request.subContextId,
      branchName: request.branchName,
      fullMaintenance: false,
      executionGroupId: request.executionGroupId,
      machineGroupId: request.machineGroupId,
      disableKeepExecution: request.disableKeepExecution,
      disableConfigurationEditor: request.disableConfigurationEditor,
      supportReconActivities: request.supportReconActivities,
      stopServices: request.stopServices,
      validationScopeEnabled: request.validationScopeEnabled,
      incidentEnabled: request.incidentEnabled,
      qualityLevel: request.qualityLevel,
    };
  }

  private mapToRunScenarioResponse(
    response: RunScenarioApiResponse
  ): RunScenarioResponse {
    return {
      testExecutionId: response.testExecutionId,
    };
  }

  private getScenarioExecutionsBaseUrl(projectId: string): string {
    return (
      this.apiUrl +
      `projects/${projectId}/test-execution-manager/scenario-executions`
    );
  }
}
