import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, Observable, throwError } from "rxjs";
import { ExecuteBackportProcessRequest } from "./execute-backport-process-request";
import { ExecuteBackportProcessResponse } from "./execute-backport-process-response";

/**
 * New-architecture migration of the legacy
 * `web/libs/features/business-process/.../service/backport-process-executor.service.ts`.
 * Behaviour, endpoint and error mapping are copied verbatim from the legacy
 * service (POST .../executions/ci-process/backport).
 */
@Injectable()
export class BackportProcessExecutorService {
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);
  private readonly httpClient = inject(HttpClient);

  executeBackportProcessDefinition(
    projectId: string,
    request: ExecuteBackportProcessRequest
  ): Observable<ExecuteBackportProcessResponse> {
    return this.httpClient
      .post<ExecuteBackportProcessResponse>(this.getApiUrl(projectId), request)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          throwError(() => new Error(this.toErrorMessage(error)))
        )
      );
  }

  private getApiUrl(projectId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/ci-process/backport`;
  }

  /** Mirrors the legacy `handleError` (web/libs/core/error-handler/.../error-utils.ts). */
  private toErrorMessage(error: HttpErrorResponse): string {
    if (error?.error?.message == null) {
      return error?.error;
    }
    return error.error.message;
  }
}
