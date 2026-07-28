import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, Observable, throwError } from "rxjs";
import { ExecuteBuildAndTestProcessRequest } from "./execute-build-and-test-process-request";
import { ExecuteBuildAndTestProcessResponse } from "./execute-build-and-test-process-response";

/**
 * New-architecture migration of the legacy
 * `web/libs/features/business-process/.../service/build-and-test-process-executor.service.ts`.
 * Behaviour, endpoint and error mapping are copied verbatim from the legacy
 * service (POST .../executions/ci-process). No contract (pact) test exists for
 * this endpoint on the legacy side, so none is added here (see
 * devo/feature/VAL-27132/open-points.md).
 */
@Injectable()
export class BuildAndTestProcessExecutorService {
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);
  private readonly httpClient = inject(HttpClient);

  executeBuildAndTestProcessDefinition(
    projectId: string,
    request: ExecuteBuildAndTestProcessRequest
  ): Observable<ExecuteBuildAndTestProcessResponse> {
    return this.httpClient
      .post<ExecuteBuildAndTestProcessResponse>(
        this.getApiUrl(projectId),
        request
      )
      .pipe(
        catchError((error: HttpErrorResponse) =>
          throwError(() => new Error(this.toErrorMessage(error)))
        )
      );
  }

  private getApiUrl(projectId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/ci-process`;
  }

  /** Mirrors the legacy `handleError` (web/libs/core/error-handler/.../error-utils.ts). */
  private toErrorMessage(error: HttpErrorResponse): string {
    if (error?.error?.message == null) {
      return error?.error;
    }
    return error.error.message;
  }
}
