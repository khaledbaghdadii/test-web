import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, map, Observable, throwError } from "rxjs";
import {
  LiteScenarioDefinition,
  ScenarioDefinitionActivityStatus,
  ScenarioDefinitionCreateRequest,
  ScenarioDefinitionUpdateRequest,
  TestDefinition,
} from "@mxevolve/domains/test/model";
import { ScenarioDefinitionApiResponse } from "../api-models/scenario-definition-api-response";
import { TestDefinitionService } from "../test-definition/test-definition.service";

interface ScenarioDefinitionCreateResponse {
  id: string;
}

interface ScenarioDefinitionUpdateResponse {
  id: string;
}

interface FetchLiteScenarioDefinitionRequest {
  ids?: string[];
  scenarioDefinitionNamePhrases?: string[];
}

@Injectable()
export class ScenarioDefinitionService {
  private readonly http = inject(HttpClient);
  private readonly testDefinitionService = inject(TestDefinitionService);
  config = inject<AppConfig>(APP_CONFIG);

  createScenarioDefinition(
    projectId: string,
    testScenarioRequest: ScenarioDefinitionCreateRequest
  ): Observable<string> {
    return this.http
      .post<ScenarioDefinitionCreateResponse>(
        this.getApiUrl(projectId),
        testScenarioRequest
      )
      .pipe(
        map((response: ScenarioDefinitionCreateResponse) => response.id),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  editScenarioDefinition(
    projectId: string,
    editTestScenarioRequest: ScenarioDefinitionUpdateRequest,
    testScenarioId: string
  ): Observable<string> {
    return this.http
      .put<ScenarioDefinitionUpdateResponse>(
        this.getApiUrl(projectId) + `/${testScenarioId}`,
        editTestScenarioRequest
      )
      .pipe(
        map((response: ScenarioDefinitionUpdateResponse) => response.id),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  getTestDefinitions(
    projectId: string,
    testDefinitionIds?: string[]
  ): Observable<TestDefinition[]> {
    return this.testDefinitionService.fetchAll(projectId, testDefinitionIds);
  }

  getScenarioDefinitionById(
    scenarioDefinitionId: string,
    projectId: string
  ): Observable<ScenarioDefinitionApiResponse> {
    return this.http
      .get<ScenarioDefinitionApiResponse>(
        this.getApiUrl(projectId) + `/${scenarioDefinitionId}`
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  getScenarioDefinitions(
    projectId: string,
    activityStatus?: ScenarioDefinitionActivityStatus
  ): Observable<ScenarioDefinitionApiResponse[]> {
    let params = new HttpParams();
    if (activityStatus) params = params.set("status", activityStatus);
    return this.http
      .get<ScenarioDefinitionApiResponse[]>(this.getApiUrl(projectId), {
        params,
      })
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  fetchCrossProjectScenarioDefinition(
    request: FetchLiteScenarioDefinitionRequest
  ): Observable<LiteScenarioDefinition[]> {
    const queryParams = new HttpParams({ fromObject: { ...request } });
    return this.http
      .get<LiteScenarioDefinition[]>(
        `${this.config.gatewayUrl}test-definition/scenario-definitions`,
        {
          params: queryParams,
        }
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  archiveScenarioDefinition(
    projectId: string,
    scenarioDefinitionId: string
  ): Observable<void> {
    return this.http
      .patch<void>(
        `${this.getApiUrl(projectId)}/${scenarioDefinitionId}/archive`,
        {}
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private getApiUrl(projectId: string): string {
    return this.config.gatewayUrl + `projects/${projectId}/test-scenario`;
  }
}
