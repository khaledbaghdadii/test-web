import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import {
  catchError,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  throwError,
} from "rxjs";
import { EnvironmentService } from "@mxevolve/domains/environment/data-access";
import { ReferenceScenario } from "../models/reference-scenario";
import { ReferenceScenarioApiModel } from "../models/reference-scenario-api-model";
import { toReferenceScenarioRow } from "../mapper/reference-scenario-mapper";

@Injectable()
export class ReferenceScenariosService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);
  private readonly environmentService = inject(EnvironmentService);

  fetchReferenceScenarios(
    projectId: string,
    scenarioExecutionGroupId: string
  ): Observable<ReferenceScenario[]> {
    if (!scenarioExecutionGroupId) {
      return of([]);
    }

    const params = new HttpParams().set(
      "executionGroupId",
      scenarioExecutionGroupId
    );

    return this.http
      .get<ReferenceScenarioApiModel[]>(
        `${this.config.gatewayUrl}projects/${projectId}/test-execution-manager/scenario-executions`,
        { params }
      )
      .pipe(
        switchMap((scenarios) =>
          this.toReferenceScenarioRows(projectId, scenarios)
        ),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }

  private toReferenceScenarioRows(
    projectId: string,
    scenarios: ReferenceScenarioApiModel[]
  ): Observable<ReferenceScenario[]> {
    if (scenarios.length === 0) {
      return of([]);
    }

    return forkJoin(
      scenarios.map((scenario) =>
        scenario.envInfo.environmentId
          ? this.environmentService
              .fetchByProjectAndEnvironmentId(
                projectId,
                scenario.envInfo.environmentId
              )
              .pipe(
                map((environment) =>
                  toReferenceScenarioRow(scenario, environment)
                )
              )
          : of(toReferenceScenarioRow(scenario))
      )
    );
  }
}
