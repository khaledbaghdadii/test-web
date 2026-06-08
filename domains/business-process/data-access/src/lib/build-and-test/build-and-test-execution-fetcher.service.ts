import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { BuildAndTestProcessExecution } from "@mxevolve/domains/business-process/util";

@Injectable()
export class BuildAndTestExecutionFetcherService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  fetchExecution(
    projectId: string,
    processId: string
  ): Observable<BuildAndTestProcessExecution> {
    return this.httpClient
      .get<BuildAndTestProcessExecution>(
        `${this.getApiUrl(projectId)}/${processId}`
      )
      .pipe(
        catchError((error) => throwError(() => new Error(error.error.message)))
      );
  }

  private getApiUrl(projectId: string) {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/ci-process`;
  }
}
