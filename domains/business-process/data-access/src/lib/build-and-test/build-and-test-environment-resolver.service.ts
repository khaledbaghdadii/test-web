import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, map, Observable, throwError } from "rxjs";

/**
 * Environment info resolved indirectly from a scenario execution.
 *
 * The CI process model does not carry the build/test environment id directly;
 * legacy resolves it from the latest deploy scenario via
 * `GET .../test-execution-manager/scenario-executions/{id}` and reads
 * `envInfo.environmentId`. This service ports that exact lookup so the env
 * status bar, Config Audit and Open Config Editor can render.
 */
export interface BuildAndTestEnvironment {
  readonly environmentId: string;
  readonly environmentStatus: string;
}

interface ScenarioExecutionEnvApiResponse {
  readonly envInfo?: {
    readonly environmentId?: string;
    readonly status?: string;
  };
}

@Injectable()
export class BuildAndTestEnvironmentResolverService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  resolveEnvironment(
    projectId: string,
    scenarioExecutionId: string
  ): Observable<BuildAndTestEnvironment> {
    return this.http
      .get<ScenarioExecutionEnvApiResponse>(
        `${this.config.gatewayUrl}projects/${projectId}/test-execution-manager/scenario-executions/${scenarioExecutionId}`
      )
      .pipe(
        map((response) => ({
          environmentId: response.envInfo?.environmentId ?? "",
          environmentStatus: response.envInfo?.status ?? "",
        })),
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }
}
