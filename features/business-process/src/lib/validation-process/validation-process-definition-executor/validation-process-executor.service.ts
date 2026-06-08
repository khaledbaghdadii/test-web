import { inject, Injectable } from "@angular/core";
import { catchError, Observable, throwError } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { ExecuteValidationProcessRequest } from "./execute-validation-process-request";
import { ExecuteValidationProcessResponse } from "./execute-validation-process-response";
import { handleError } from "../../../../../../core/error-handler/src/lib/error-utils";

@Injectable({ providedIn: "root" })
export class ValidationProcessExecutorService {
  config = inject(APP_CONFIG);
  httpClient = inject(HttpClient);

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
        catchError((error) => throwError(() => new Error(handleError(error))))
      );
  }

  private getApiUrl(projectId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/master-validation/execute`;
  }
}
