import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { UpgradeProcessExecutionMapper } from "./mapper/upgrade-process-execution-mapper.service";
import { catchError, map, Observable, throwError } from "rxjs";
import { UpgradeProcessExecution } from "../upgrade-process-execution";
import { UpgradeProcessExecutionApiModel } from "./mapper/upgrade-process-execution-api-model";

@Injectable({ providedIn: "root" })
export class UpgradeProcessExecutionFetcherService {
  private readonly httpClient = inject(HttpClient);
  private readonly appConfig = inject(APP_CONFIG);
  private readonly mapper = inject(UpgradeProcessExecutionMapper);

  getUpgradeProcessExecution(
    projectId: string,
    processId: string
  ): Observable<UpgradeProcessExecution> {
    return this.httpClient
      .get<UpgradeProcessExecutionApiModel>(
        `${this.getApiUrl(projectId)}/${processId}`
      )
      .pipe(
        map((response) => this.mapper.map(response)),
        catchError((error) => throwError(() => new Error(error.error.message)))
      );
  }

  private getApiUrl(projectId: string) {
    return `${this.appConfig.gatewayUrl}projects/${projectId}/business-process/executions/binary-upgrade`;
  }
}
