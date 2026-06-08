import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import {
  catchError,
  concatMap,
  forkJoin,
  from,
  map,
  Observable,
  of,
  switchMap,
  throwError,
  toArray,
} from "rxjs";
import { ScenarioDefinitionApiResponse } from "./response/scenario-definition-api-response.model";
import { ScenarioDefinitionMapper } from "./scenario-definition-mapper";
import {
  LiteScenarioDefinition,
  ScenarioDefinition,
  ActivityStatus,
} from "./scenario-definition";
import { StreamsService } from "@mxflow/features/streams";
import { EnvironmentService } from "@mxflow/features/environment";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import { TestDefinition } from "@mxevolve/domains/test/model";

interface FetchLiteScenarioDefinitionRequest {
  ids?: string[];
  scenarioDefinitionNamePhrases?: string[];
  status?: ActivityStatus;
}

@Injectable()
export class ScenarioDefinitionService {
  private readonly http = inject(HttpClient);
  private readonly testDefinitionService = inject(TestDefinitionService);
  private readonly streamService = inject(StreamsService);
  private readonly environmentService = inject(EnvironmentService);

  config = inject<AppConfig>(APP_CONFIG);

  getScenarioDefinitionById(
    scenarioDefinitionId: string,
    projectId: string
  ): Observable<ScenarioDefinition> {
    return this.getScenarioDefinition(scenarioDefinitionId, projectId).pipe(
      switchMap((scenarioDefinition) => {
        return forkJoin([
          of(scenarioDefinition),
          this.getTestDefinitionsOfAScenarioDefinition(
            projectId,
            scenarioDefinition
          ),
          this.streamService.getListOfBpcsByProjectId(projectId),
          this.environmentService.getEnvironmentDefinitionById(
            projectId,
            scenarioDefinition.environmentDefinitionId
          ),
        ]);
      }),
      map(
        ([scenarioDefinition, testDefinitions, bpcs, environmentDefinition]) =>
          ScenarioDefinitionMapper.toScenarioDefinition(
            scenarioDefinition,
            testDefinitions,
            bpcs,
            [environmentDefinition]
          )
      ),
      catchError((error) => throwError(() => new Error(error.error)))
    );
  }

  getScenarioDefinitions(
    projectId: string,
    status: ActivityStatus = ActivityStatus.ACTIVE
  ): Observable<ScenarioDefinition[]> {
    const $scenarioDefinitions = this.getProjectScenarioDefinitions(
      projectId,
      status
    );
    const $testDefinitions = this.testDefinitionService.fetchAll(projectId);
    const $environmentDefinitions =
      this.environmentService.getEnvironmentDefinitions(projectId, true);
    const $businessProcessChains =
      this.streamService.getListOfBpcsByProjectId(projectId);
    return forkJoin([
      $scenarioDefinitions,
      $testDefinitions,
      $businessProcessChains,
      $environmentDefinitions,
    ]).pipe(
      concatMap(
        ([
          scenarioDefinitions,
          testDefinitions,
          businessProcessChains,
          environmentDefinitions,
        ]) =>
          from(scenarioDefinitions).pipe(
            map((scenarioDefinition) =>
              ScenarioDefinitionMapper.toScenarioDefinition(
                scenarioDefinition,
                testDefinitions,
                businessProcessChains,
                environmentDefinitions
              )
            ),
            toArray()
          )
      ),
      catchError((error) => throwError(() => new Error(error.error)))
    );
  }

  getScenarioDefinitionLite(
    scenarioDefinitionId: string,
    projectId: string
  ): Observable<ScenarioDefinitionApiResponse> {
    return this.getScenarioDefinition(scenarioDefinitionId, projectId).pipe(
      catchError((error) => throwError(() => new Error(error.error)))
    );
  }

  fetchCrossProjectScenarioDefinition(
    request: FetchLiteScenarioDefinitionRequest
  ): Observable<LiteScenarioDefinition[]> {
    const queryParams = new HttpParams({
      fromObject: {
        ...request,
        status: request.status ?? ActivityStatus.ACTIVE,
      },
    });
    return this.http
      .get<LiteScenarioDefinition[]>(
        `${this.config.gatewayUrl}test-definition/scenario-definitions`,
        { params: queryParams }
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  private getProjectScenarioDefinitions(
    projectId: string,
    status: ActivityStatus = ActivityStatus.ACTIVE
  ) {
    const params = new HttpParams().set("status", status);
    return this.http.get<ScenarioDefinitionApiResponse[]>(
      this.getApiUrl(projectId),
      { params }
    );
  }

  private getApiUrl(projectId: string): string {
    return this.config.gatewayUrl + `projects/${projectId}/test-scenario`;
  }

  private getScenarioDefinition(
    scenarioDefinitionId: string,
    projectId: string
  ): Observable<ScenarioDefinitionApiResponse> {
    return this.http.get<ScenarioDefinitionApiResponse>(
      this.getApiUrl(projectId) + `/${scenarioDefinitionId}`
    );
  }

  private getTestDefinitionsOfAScenarioDefinition(
    projectId: string,
    scenarioDefinition: ScenarioDefinitionApiResponse
  ): Observable<TestDefinition[]> {
    const testDefinitionIds = scenarioDefinition.tests.map(
      (test) => test.testDefinitionId
    );
    return this.testDefinitionService.fetchAll(projectId, testDefinitionIds);
  }
}
