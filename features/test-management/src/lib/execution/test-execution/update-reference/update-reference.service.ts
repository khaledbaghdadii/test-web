import { Injectable, inject } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient, HttpParams } from "@angular/common/http";
import { catchError, Observable, throwError } from "rxjs";
import { UpdateReference } from "./update-reference";
import { TriggerUpdateReferenceRequest } from "./trigger-update-reference-request";
import { TriggerUpdateReferenceResponse } from "./trigger-update-reference-response";

@Injectable({
  providedIn: "root",
})
export class UpdateReferenceService {
  private http = inject(HttpClient);

  apiUrl: string;

  constructor() {
    const config = inject<AppConfig>(APP_CONFIG);

    this.apiUrl = config.gatewayUrl;
  }

  fetch(
    projectId: string,
    testExecutionId: string
  ): Observable<UpdateReference[]> {
    return this.http
      .get<UpdateReference[]>(this.getFetchUrl(projectId, testExecutionId))
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  trigger(
    request: TriggerUpdateReferenceRequest
  ): Observable<TriggerUpdateReferenceResponse> {
    let queryParams = new HttpParams();

    if (request.testCaseExecutionId) {
      queryParams = queryParams.set(
        "testCaseExecutionId",
        request.testCaseExecutionId
      );
    }

    return this.http.post<TriggerUpdateReferenceResponse>(
      this.getTriggerUrl(
        request.projectId,
        request.scenarioExecutionId,
        request.testExecutionId
      ),
      {
        commitMessage: request.commitMessage,
        binaryImpactIds: request.binaryImpactIds,
        configurationImpactIds: request.configurationImpactIds,
        referenceToUpdate: request.referenceToUpdate,
      },
      {
        params: queryParams,
      }
    );
  }

  private getBaseUrl(projectId: string) {
    return `${this.apiUrl}projects/${projectId}/test-execution-manager`;
  }

  private getFetchUrl(projectId: string, testExecutionId: string) {
    return (
      this.getBaseUrl(projectId) +
      `/test-executions/${testExecutionId}/update-reference`
    );
  }

  private getTriggerUrl(
    projectId: string,
    scenarioExecutionId: string,
    testExecutionId: string
  ) {
    return (
      this.getBaseUrl(projectId) +
      `/scenario-executions/${scenarioExecutionId}/test-executions/${testExecutionId}/update-reference`
    );
  }
}
