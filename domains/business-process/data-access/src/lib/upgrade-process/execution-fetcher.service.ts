import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, throwError } from "rxjs";
import { UpgradeProcessExecution } from "@mxevolve/domains/business-process/util";

@Injectable()
export class ExecutionFetcherService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  fetchExecution(
    projectId: string,
    processId: string
  ): Observable<UpgradeProcessExecution> {
    return this.httpClient
      .get<UpgradeProcessExecution>(`${this.getApiUrl(projectId)}/${processId}`)
      .pipe(
        catchError((error) => throwError(() => new Error(error.error.message)))
      );
  }

  private getApiUrl(projectId: string) {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/binary-upgrade`;
  }
}
