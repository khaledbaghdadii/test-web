import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { Observable } from "rxjs";
import type { TestUnitApiModel } from "./test-unit-api-model";
import type { FetchTestUnitsRequest } from "./fetch-test-units-request";

@Injectable()
export class TestUnitService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl: string;

  constructor() {
    const config = inject<AppConfig>(APP_CONFIG);
    this.apiUrl = config.gatewayUrl;
  }

  fetch(request: FetchTestUnitsRequest): Observable<TestUnitApiModel[]> {
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

    return this.http.get<TestUnitApiModel[]>(
      `${this.apiUrl}projects/${request.projectId}/test-execution-manager/test-units`,
      { params }
    );
  }
}
