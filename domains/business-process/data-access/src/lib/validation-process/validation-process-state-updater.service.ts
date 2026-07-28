import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { catchError, Observable, Subject, throwError } from "rxjs";

export interface MarkQualityGatePassedRequest {
  projectId: string;
  executionId: string;
  comment: string;
}

export interface MarkQualityGateFailedRequest {
  projectId: string;
  executionId: string;
  comment: string;
  developmentId: string;
  shouldCleanDevelopment: boolean;
}

export interface SendChangesForReviewRequest {
  projectId: string;
  processId: string;
  mergeJobTitle: string;
  mergeConfigurationId: string;
  mergeJobReviewers: string[];
  shouldCleanDevelopment: boolean;
  developmentId: string;
}

export interface SkipIntegrateChangesRequest {
  destinationBranch: string;
  shouldCleanDevelopment: boolean;
  developmentId: string;
}

@Injectable()
export class ValidationProcessStateUpdaterService {
  private readonly httpClient = inject(HttpClient);
  private readonly config = inject<AppConfig>(APP_CONFIG);

  /** Emits after each state-changing action so the view can reload in-place. */
  readonly reloadTrigger$ = new Subject<void>();

  reloadProcessDetails(
    _processId: string,
    _projectId: string,
    delay = 1000
  ): void {
    setTimeout(() => {
      this.reloadTrigger$.next();
    }, delay);
  }

  markQualityGatePassed(
    request: MarkQualityGatePassedRequest
  ): Observable<void> {
    return this.httpClient
      .put<void>(
        `${this.getApiUrl(request.projectId)}/${
          request.executionId
        }/user-input/mark-quality-gate-passed`,
        {
          comment: request.comment,
        }
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }

  markQualityGateFailed(
    request: MarkQualityGateFailedRequest
  ): Observable<void> {
    return this.httpClient
      .put<void>(
        `${this.getApiUrl(request.projectId)}/${
          request.executionId
        }/user-input/mark-quality-gate-failed`,
        {
          comment: request.comment,
          developmentId: request.developmentId,
          shouldCleanDevelopment: request.shouldCleanDevelopment,
        }
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }

  sendChangesForReview(request: SendChangesForReviewRequest): Observable<void> {
    return this.httpClient
      .post<void>(
        `${this.getApiUrl(request.projectId)}/${
          request.processId
        }/user-input/send-changes-for-review`,
        {
          mergeConfigurationId: request.mergeConfigurationId,
          mergeJobTitle: request.mergeJobTitle,
          mergeJobReviewers: request.mergeJobReviewers,
          shouldCleanDevelopment: request.shouldCleanDevelopment,
          developmentId: request.developmentId,
        }
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }

  reopenMergeRequest(projectId: string, processId: string): Observable<void> {
    return this.httpClient
      .post<void>(
        `${this.getApiUrl(
          projectId
        )}/${processId}/user-input/reopen-merge-request`,
        null
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }

  skipIntegrateChanges(
    projectId: string,
    processId: string,
    request: SkipIntegrateChangesRequest
  ): Observable<void> {
    return this.httpClient
      .post<void>(
        `${this.getApiUrl(
          projectId
        )}/${processId}/user-input/skip-integrate-fixes`,
        request
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(error.error?.message ?? error.message))
        )
      );
  }

  private getApiUrl(projectId: string): string {
    return `${this.config.gatewayUrl}projects/${projectId}/business-process/executions/master-validation`;
  }
}
