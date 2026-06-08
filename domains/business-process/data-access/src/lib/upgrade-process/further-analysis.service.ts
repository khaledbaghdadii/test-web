import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, Observable, throwError } from "rxjs";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import {
  FurtherAnalysisCandidatesResponse,
  MarkResourcesForFurtherAnalysisRequest,
  SelectedFurtherAnalysisResourcesResponse,
} from "./models/further-analysis.model";

@Injectable()
export class FurtherAnalysisService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  getFurtherAnalysisCandidates(
    projectId: string,
    processId: string
  ): Observable<FurtherAnalysisCandidatesResponse> {
    return this.httpClient
      .get<FurtherAnalysisCandidatesResponse>(
        `${this.buildExecutionUrl(
          projectId,
          processId
        )}/further-analysis/candidates`
      )
      .pipe(
        catchError((error) => throwError(() => new Error(error.error.message)))
      );
  }

  markResourcesForFurtherAnalysis(
    projectId: string,
    processId: string,
    request: MarkResourcesForFurtherAnalysisRequest
  ): Observable<void> {
    return this.httpClient
      .put<void>(
        `${this.buildExecutionUrl(
          projectId,
          processId
        )}/further-analysis/resources`,
        request
      )
      .pipe(
        catchError((error) => throwError(() => new Error(error.error.message)))
      );
  }

  getSelectedResources(
    projectId: string,
    processId: string
  ): Observable<SelectedFurtherAnalysisResourcesResponse> {
    return this.httpClient
      .get<SelectedFurtherAnalysisResourcesResponse>(
        `${this.buildExecutionUrl(
          projectId,
          processId
        )}/further-analysis/resources`
      )
      .pipe(
        catchError((error) => throwError(() => new Error(error.error.message)))
      );
  }

  private buildExecutionUrl(projectId: string, executionId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/binary-upgrade/${executionId}`;
  }
}
