import { inject, Injectable } from "@angular/core";
import { APP_CONFIG } from "@mxflow/config";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { ExecuteBuildAndTestProcessRequest } from "./execute-build-and-test-process-request";
import { catchError, Observable, throwError } from "rxjs";
import { ExecuteBuildAndTestProcessResponse } from "./execute-build-and-test-process-response";
import { handleError } from "../../../../../../../core/error-handler/src/lib/error-utils";

@Injectable({ providedIn: "root" })
export class BuildAndTestProcessExecutorService {
  config = inject(APP_CONFIG);
  httpClient = inject(HttpClient);

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
          throwError(() => new Error(handleError(error)))
        )
      );
  }

  private getApiUrl(projectId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/ci-process`;
  }
}
