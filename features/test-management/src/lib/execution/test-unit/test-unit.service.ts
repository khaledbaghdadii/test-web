import { inject, Injectable } from "@angular/core";
import { FetchTestUnitsRequest } from "./fetch-test-units.request";
import {
  ScenarioExecutionAnalysisObjectsModel,
  ScenarioExecutionEnvironmentModel,
  TestUnitModel,
  TestUnitScenarioExecutionModel,
} from "./test-unit.model";
import { map, Observable } from "rxjs";
import { HttpClient, HttpParams } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import {
  ScenarioExecutionAnalysisObjectsApiModel,
  ScenarioExecutionEnvironmentApiModel,
  TestUnitApiModel,
  TestUnitScenarioExecutionApiModel,
} from "./test-unit.api.model";

@Injectable()
export class TestUnitService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl: string;

  constructor() {
    const config = inject<AppConfig>(APP_CONFIG);
    this.apiUrl = config.gatewayUrl;
  }

  public fetch(request: FetchTestUnitsRequest): Observable<TestUnitModel[]> {
    let params = new HttpParams();
    if (request.contextId) params = params.set("contextId", request.contextId);
    if (request.subContextId)
      params = params.set("subContextId", request.subContextId);
    if (request.scenarioDefinitionId)
      params = params.set("scenarioDefinitionId", request.scenarioDefinitionId);
    if (request.scenarioExecutionIds)
      params = params.set(
        "scenarioExecutionIds",
        request.scenarioExecutionIds.join(",")
      );

    return this.http
      .get<TestUnitApiModel[]>(
        `${this.apiUrl}projects/${request.projectId}/test-execution-manager/test-units`,
        { params: params }
      )
      .pipe(map((apiModels) => this.toTestUnits(apiModels)));
  }

  public fetchById(
    projectId: string,
    testUnitId: string
  ): Observable<TestUnitModel> {
    return this.http
      .get<TestUnitApiModel>(
        `${this.apiUrl}projects/${projectId}/test-execution-manager/test-units/${testUnitId}`
      )
      .pipe(map((apiModel) => this.toTestUnit(apiModel)));
  }

  private toTestUnits(apiModels: TestUnitApiModel[]): TestUnitModel[] {
    return apiModels.map((apiModel: TestUnitApiModel) =>
      this.toTestUnit(apiModel)
    );
  }

  private toTestUnit(apiModel: TestUnitApiModel): TestUnitModel {
    return {
      id: apiModel.id,
      repushable: apiModel.repushable,
      scenarioDefinitionId: apiModel.scenarioDefinitionId,
      scenarioDefinitionName: apiModel.scenarioDefinitionName,
      contextId: apiModel.contextId,
      subContextId: apiModel.subContextId,
      assignee: apiModel.assignee,
      branch: apiModel.branch,
      executionGroupId: apiModel.executionGroupId,
      scenarioExecutions: this.toScenarioExecutions(
        this.sortByStartDate(apiModel.scenarioExecutions)
      ),
      headScenarioExecution: this.toScenarioExecution(
        this.getHeadScenarioExecution(apiModel)
      ),
      disableKeepExecution: apiModel.disableKeepExecution,
      validationScopeEnabled: apiModel.validationScopeEnabled,
      incidentEnabled: apiModel.incidentEnabled,
    };
  }

  private toScenarioExecutions(
    scenarioExecutionApiModels: TestUnitScenarioExecutionApiModel[]
  ): TestUnitScenarioExecutionModel[] {
    return scenarioExecutionApiModels.map((apiModel) =>
      this.toScenarioExecution(apiModel)
    );
  }

  private toScenarioExecution(
    scenarioExecutionApiModel: TestUnitScenarioExecutionApiModel
  ): TestUnitScenarioExecutionModel {
    return {
      id: scenarioExecutionApiModel.scenarioExecutionId,
      analysisStatus: scenarioExecutionApiModel.analysisStatus,
      status: scenarioExecutionApiModel.status,
      startDate: scenarioExecutionApiModel.startDate,
      endDate: scenarioExecutionApiModel.endDate,
      commitId: scenarioExecutionApiModel.commitId,
      mxVersion: scenarioExecutionApiModel.mxVersion,
      mxBuildId: scenarioExecutionApiModel.mxBuildId,
      factoryProductId: scenarioExecutionApiModel.factoryProductId,
      keptExecution: scenarioExecutionApiModel.keptExecution,
      environment: this.toEnvironment(scenarioExecutionApiModel.environment),
      analysisObjects: this.toAnalysisObjects(
        scenarioExecutionApiModel.analysisObjects
      ),
      cleaningStatus: scenarioExecutionApiModel.cleaningStatus,
      isFailed: scenarioExecutionApiModel.failed,
      isFinished: scenarioExecutionApiModel.finished,
    };
  }

  private toEnvironment(
    environmentApiModel: ScenarioExecutionEnvironmentApiModel
  ): ScenarioExecutionEnvironmentModel {
    return {
      id: environmentApiModel.environmentId,
      status: environmentApiModel.status,
    };
  }

  private toAnalysisObjects(
    analysisObjectsApiModel:
      | ScenarioExecutionAnalysisObjectsApiModel
      | undefined
  ): ScenarioExecutionAnalysisObjectsModel {
    return {
      binaryImpacts: analysisObjectsApiModel?.binaryImpacts ?? [],
      binaryRegressions: analysisObjectsApiModel?.binaryRegressions ?? [],
      configurationImpacts: analysisObjectsApiModel?.configurationImpacts ?? [],
      configurationRegressions:
        analysisObjectsApiModel?.configurationRegressions ?? [],
      failureReasons: analysisObjectsApiModel?.failureReasons ?? [],
      incidents: analysisObjectsApiModel?.incidents ?? [],
    };
  }

  private getHeadScenarioExecution(
    testUnit: TestUnitApiModel
  ): TestUnitScenarioExecutionApiModel {
    return testUnit.scenarioExecutions.find(
      (scenarioExecution) =>
        scenarioExecution.scenarioExecutionId ===
        testUnit.headScenarioExecutionId
    ) as TestUnitScenarioExecutionApiModel;
  }

  private sortByStartDate(
    scenarioExecutionApiModels: TestUnitScenarioExecutionApiModel[]
  ): TestUnitScenarioExecutionApiModel[] {
    return scenarioExecutionApiModels.sort(
      (scenarioExecution1, scenarioExecution2) => {
        return (
          new Date(scenarioExecution2.startDate).getTime() -
          new Date(scenarioExecution1.startDate).getTime()
        );
      }
    );
  }
}
