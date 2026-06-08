import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { GATEWAY_CONFIG, GatewayConfig } from "@mxevolve/shared/core/config";
import { catchError, Observable, throwError } from "rxjs";
import { AbortExecutionRequest } from "./abort-execution-request";
import { AbortExecutionApiRequest } from "./abort-execution-api-request";

@Injectable()
export class ExecutionAbortService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<GatewayConfig>(GATEWAY_CONFIG);

  abort(request: AbortExecutionRequest): Observable<void> {
    return this.httpClient
      .post<void>(
        this.buildAbortUrl(request.projectId, request.processId),
        this.toApiRequest(request)
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }

  private buildAbortUrl(projectId: string, processId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/${processId}/abort`;
  }

  private toApiRequest(
    request: AbortExecutionRequest
  ): AbortExecutionApiRequest {
    return {
      shouldCleanDevelopment: request.shouldCleanDevelopment,
      developmentId: request.developmentId,
    };
  }
}
