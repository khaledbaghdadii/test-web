import { inject, Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { ReconReportTransferProgress } from "@mxevolve/domains/test/model";
import type { FetchReconReportsTransferProgressRequest } from "./fetch-recon-reports-transfer-progress-request";
import type { TransferToReconRequest } from "./transfer-to-recon-request";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { APP_CONFIG, AppConfig } from "@mxflow/config";

@Injectable()
export class ReconService {
  private readonly http = inject(HttpClient);
  private readonly config: AppConfig = inject(APP_CONFIG);

  fetch(
    request: FetchReconReportsTransferProgressRequest
  ): Observable<ReconReportTransferProgress[]> {
    const { projectId, scenarioExecutionId, testExecutionId } = request;
    return this.http
      .get<ReconReportTransferProgress[]>(
        `${this.config.gatewayUrl}projects/${projectId}/test-execution-manager/scenario-executions/${scenarioExecutionId}/test-executions/${testExecutionId}/recon-report-transfer-progress`
      )
      .pipe(
        catchError((error: HttpErrorResponse) =>
          throwError(() => new Error(error.error))
        )
      );
  }

  transferToRecon(request: TransferToReconRequest): Observable<void> {
    const {
      projectId,
      scenarioExecutionId,
      testExecutionId,
      cycleId,
      folderPaths,
    } = request;
    return this.http
      .post<void>(
        `${this.config.gatewayUrl}projects/${projectId}/test-execution-manager/scenario-executions/${scenarioExecutionId}/test-executions/${testExecutionId}/transfer-to-recon`,
        { cycleId, folderPaths }
      )
      .pipe(
        catchError((error: HttpErrorResponse) =>
          throwError(() => new Error(error.error))
        )
      );
  }
}
