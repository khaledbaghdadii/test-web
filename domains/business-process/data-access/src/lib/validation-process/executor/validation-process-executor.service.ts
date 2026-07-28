import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, Observable, throwError } from "rxjs";
import { ExecuteValidationProcessRequest } from "./execute-validation-process-request";
import { ExecuteValidationProcessResponse } from "./execute-validation-process-response";

/**
 * New-architecture migration of the legacy
 * `web/libs/features/business-process/.../validation-process-definition-executor/validation-process-executor.service.ts`.
 * Behaviour, endpoint and error mapping are copied verbatim from the legacy
 * service (POST .../executions/master-validation/execute). No contract (pact)
 * test exists for this endpoint on the legacy side, so none is added here (see
 * devo/feature/VAL-27132/open-points.md).
 */
@Injectable()
export class ValidationProcessExecutorService {
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);
  private readonly httpClient = inject(HttpClient);

  executeValidationProcessDefinition(
    projectId: string,
    request: ExecuteValidationProcessRequest
  ): Observable<ExecuteValidationProcessResponse> {
    return this.httpClient
      .post<ExecuteValidationProcessResponse>(
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
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/master-validation/execute`;
  }

  /** Mirrors the legacy `handleError` (web/libs/core/error-handler/.../error-utils.ts). */
  private toErrorMessage(error: HttpErrorResponse): string {
    if (error?.error?.message == null) {
      return error?.error;
    }
    return error.error.message;
  }
}
