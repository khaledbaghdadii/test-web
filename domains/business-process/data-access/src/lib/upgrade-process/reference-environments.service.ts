import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, Observable, throwError } from "rxjs";

@Injectable()
export class ReferenceEnvironmentService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  deployReferenceEnvironment(
    projectId: string,
    executionId: string
  ): Observable<void> {
    return this.httpClient
      .post<void>(
        `${this.buildExecutionUrl(
          projectId,
          executionId
        )}/user-input/deploy-reference-environment`,
        ""
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }

  cleanAndDeployReferenceEnvironment(
    projectId: string,
    executionId: string,
    environmentIdToClean: string
  ): Observable<void> {
    return this.httpClient
      .post<void>(
        `${this.buildExecutionUrl(
          projectId,
          executionId
        )}/user-input/clean-and-deploy-reference-environment`,
        { environmentIdToClean }
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }

  private buildExecutionUrl(projectId: string, executionId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/binary-upgrade/${executionId}`;
  }
}
