import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, map, Observable, throwError } from "rxjs";
import { ScenarioRunApiResponse } from "../api-models/scenario-run-api-response";
import {
  RepushPermission,
  RerunFromFactoryProductRequest,
  RerunFromFactoryProductResponse,
  UpdateAssigneeRequest,
} from "@mxevolve/domains/test/model";
import { BulkRerunRequest } from "./bulk-rerun-request.model";
import { BulkRerunResponse } from "./bulk-rerun-response.model";

@Injectable()
export class ScenarioRunService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  fetch(
    projectId: string,
    contextId?: string,
    subContextId?: string,
    statuses?: string[],
    scenarioRunIds?: string[]
  ): Observable<ScenarioRunApiResponse[]> {
    const params: Record<string, string> = {};
    if (contextId) params["contextId"] = contextId;
    if (subContextId) params["subContextId"] = subContextId;
    if (statuses?.length) params["statuses"] = statuses.join(",");
    if (scenarioRunIds?.length)
      params["scenarioExecutionIds"] = scenarioRunIds.join(",");
    return this.http
      .get<ScenarioRunApiResponse[]>(`${this.getBaseUrl(projectId)}`, {
        params,
      })
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  abortScenarioRun(projectId: string, scenarioRunId: string): Observable<void> {
    return this.http
      .post<null>(`${this.getBaseUrl(projectId)}/${scenarioRunId}/abort`, {})
      .pipe(
        map(() => undefined),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  rerunScenarioFromFactoryProduct(
    projectId: string,
    scenarioRunId: string,
    request: RerunFromFactoryProductRequest
  ): Observable<RerunFromFactoryProductResponse> {
    const body = {
      factoryProductId: request.factoryProductId.trim(),
      commitId: request.commitId?.trim() || undefined,
      executionGroupId: request.executionGroupId,
      stopServices: request.stopServices,
    };
    return this.http
      .post<RerunFromFactoryProductResponse>(
        `${this.getBaseUrl(projectId)}/${scenarioRunId}/repush`,
        body
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  updateAssignee(
    projectId: string,
    request: UpdateAssigneeRequest
  ): Observable<void> {
    const body = {
      assignee: request.assignee,
      scenarioDefinitionId: request.scenarioDefinitionId,
      contextId: request.contextId,
      subContextId: request.subContextId,
    };
    return this.http
      .put<void>(`${this.getBaseUrl(projectId)}/assignee`, body)
      .pipe(
        map(() => undefined),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  isRepushAllowed(
    projectId: string,
    executionGroupId: string,
    scenarioRunId: string
  ): Observable<RepushPermission> {
    return this.http
      .get<RepushPermission>(
        `${this.config.gatewayUrl}projects/${projectId}/test-execution-manager/execution-group/${executionGroupId}/scenario-execution/${scenarioRunId}/can-repush`
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  bulkRerun(
    projectId: string,
    request: BulkRerunRequest
  ): Observable<BulkRerunResponse> {
    const body = {
      factoryProductId: request.factoryProductId.trim(),
      commitId: request.commitId?.trim() || undefined,
      testScenarioExecutions: request.scenariosToBeRepushed,
    };
    return this.http
      .post<BulkRerunResponse>(
        `${this.getBaseUrl(projectId)}/repush/bulk`,
        body
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private getBaseUrl(projectId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/test-execution-manager/scenario-executions`;
  }
}
