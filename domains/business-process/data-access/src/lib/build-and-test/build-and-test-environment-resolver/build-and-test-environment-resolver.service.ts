import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { ScenarioRunService } from "@mxevolve/domains/test/data-access";

/**
 * Environment info resolved indirectly from a scenario execution.
 *
 * The CI process model does not carry the build/test environment id directly;
 * legacy resolves it from the latest deploy scenario via
 * `GET .../test-execution-manager/scenario-executions/{id}` and reads
 * `envInfo.environmentId`. This service delegates that lookup to
 * `ScenarioRunService.fetchById` so the env status bar, Config Audit and Open
 * Config Editor can render.
 *
 * Note (next PR): `fetchById` will be replaced with a dedicated "get scenario
 * execution by id" endpoint once it is exposed from test/data-access.
 */
export interface BuildAndTestEnvironment {
  readonly environmentId: string;
  readonly environmentStatus: string;
}

@Injectable()
export class BuildAndTestEnvironmentResolverService {
  private readonly scenarioRunService = inject(ScenarioRunService);

  resolveEnvironment(
    projectId: string,
    scenarioExecutionId: string
  ): Observable<BuildAndTestEnvironment> {
    return this.scenarioRunService
      .fetchById(projectId, scenarioExecutionId)
      .pipe(
        map((response) => ({
          environmentId: response.envInfo?.environmentId ?? "",
          environmentStatus: response.envInfo?.status ?? "",
        }))
      );
  }
}
