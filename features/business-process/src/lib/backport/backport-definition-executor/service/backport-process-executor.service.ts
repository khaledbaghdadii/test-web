import { inject, Injectable } from "@angular/core";
import { APP_CONFIG } from "@mxflow/config";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { ExecuteBackportProcessRequest } from "./execute-backport-process-request";
import { catchError, Observable, throwError } from "rxjs";
import { handleError } from "../../../../../../../core/error-handler/src/lib/error-utils";
import { ExecuteBackportProcessResponse } from "./execute-backport-process-response";

@Injectable({ providedIn: "root" })
export class BackportProcessExecutorService {
  config = inject(APP_CONFIG);
  httpClient = inject(HttpClient);

  executeBackportProcessDefinition(
    projectId: string,
    request: ExecuteBackportProcessRequest
  ): Observable<ExecuteBackportProcessResponse> {
    return this.httpClient
      .post<ExecuteBackportProcessResponse>(this.getApiUrl(projectId), request)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          throwError(() => new Error(handleError(error)))
        )
      );
  }

  private getApiUrl(projectId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/ci-process/backport`;
  }
}
